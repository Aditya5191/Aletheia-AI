"""
Mini Claude Sandbox — Docker-based execution environment.

Provides 7 tools inspired by Claude Code / OpenClaude for token-efficient
file I/O inside Docker containers:

  bash       — Run shell commands (output capped at 10K chars)
  write_file — Create/overwrite files via Docker put_archive (no shell escaping)
  read_file  — Read files with optional offset/limit for partial reads
  edit_file  — Surgical find-and-replace (uses put_archive for write-back)
  grep       — Search files for patterns
  list_files — List workspace contents
  quit_sandbox — Stop and remove a container
"""

import base64
import io
import mimetypes
import os
import tarfile
import json
import time
from typing import Optional

import docker

REPL_DAEMON_CODE = """
import sys
import io
import json
import traceback
from http.server import BaseHTTPRequestHandler, HTTPServer

global_env = {}

class KernelHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        code = self.rfile.read(content_length).decode('utf-8')
        
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        redirected_output = io.StringIO()
        sys.stdout = redirected_output
        sys.stderr = redirected_output
        
        error = ""
        try:
            exec(code, global_env)
        except Exception:
            error = traceback.format_exc()
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr
            
        output = redirected_output.getvalue()
        
        res = json.dumps({"output": output, "error": error})
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(res.encode('utf-8'))

    def log_message(self, format, *args):
        pass # Suppress logging

if __name__ == '__main__':
    server_address = ('127.0.0.1', 9999)
    httpd = HTTPServer(server_address, KernelHandler)
    httpd.serve_forever()
"""

class SandboxManager:
    """Executes commands and manages files in Docker containers."""

    MAX_OUTPUT_CHARS = 10_000  # Truncation cap for bash output
    DEFAULT_TIMEOUT = 120      # Seconds before bash commands are killed

    def __init__(self, docker_client: Optional[docker.DockerClient] = None):
        self.docker_client = None
        self._docker_error = "Docker client not initialized."

        if docker_client is not None:
            self.docker_client = docker_client
            self._docker_error = ""
            return

        try:
            client = docker.from_env()
            client.ping()
            self.docker_client = client
            self._docker_error = ""
        except Exception as exc:
            self._docker_error = (
                "Docker is not available. Ensure Docker Desktop/Engine is running "
                f"and accessible from this process. Details: {exc}"
            )

    # ── Internal helpers ──────────────────────────────────────────────────

    def _ensure_docker(self) -> Optional[str]:
        if self.docker_client is None:
            return f"Error: {self._docker_error}"
        return None

    def _get_container(self, container_id: str):
        err = self._ensure_docker()
        if err:
            return None
        try:
            return self.docker_client.containers.get(container_id)
        except docker.errors.NotFound:
            return None
        except Exception:
            return None

    def _read_file_raw(self, container, file_path: str) -> bytes:
        """Read raw bytes from a file in the container via Docker get_archive."""
        archive_stream, _ = container.get_archive(file_path)
        tar_bytes = b"".join(chunk for chunk in archive_stream)
        with tarfile.open(fileobj=io.BytesIO(tar_bytes)) as tar:
            members = [m for m in tar.getmembers() if m.isfile()]
            if not members:
                raise FileNotFoundError(f"File not found: {file_path}")
            file_obj = tar.extractfile(members[0])
            if not file_obj:
                raise FileNotFoundError(f"File not found: {file_path}")
            return file_obj.read()

    def _write_file_to_container(self, container, file_path: str, content: str) -> None:
        """Write content to a file in the container using Docker's put_archive API.
        
        This is binary-safe — no shell escaping, no heredoc issues.
        Handles $, backticks, EOF markers, and any special characters.
        """
        dir_path = os.path.dirname(file_path)
        file_name = os.path.basename(file_path)

        # Ensure parent directory exists
        container.exec_run(
            cmd=["bash", "-c", f"mkdir -p {dir_path}"],
            workdir="/workspace",
        )

        # Build a tar archive in memory
        tar_stream = io.BytesIO()
        data = content.encode("utf-8")
        with tarfile.open(fileobj=tar_stream, mode="w") as tar:
            info = tarfile.TarInfo(name=file_name)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))

        tar_stream.seek(0)
        container.put_archive(dir_path, tar_stream)

    def _truncate_output(self, output: str) -> str:
        """Truncate output to MAX_OUTPUT_CHARS, keeping the tail (most useful part)."""
        if len(output) <= self.MAX_OUTPUT_CHARS:
            return output
        truncated = output[-self.MAX_OUTPUT_CHARS:]
        return f"[OUTPUT TRUNCATED — showing last {self.MAX_OUTPUT_CHARS} chars of {len(output)}]\n{truncated}"

    def _ensure_repl_daemon(self, container):
        """Check if daemon is running, if not, start it."""
        check_cmd = "python3 -c 'import urllib.request; urllib.request.urlopen(\"http://127.0.0.1:9999\", timeout=1)'"
        res = container.exec_run(cmd=["bash", "-c", check_cmd])
        if res.exit_code != 0:
            self._write_file_to_container(container, "/workspace/.repl_daemon.py", REPL_DAEMON_CODE)
            container.exec_run(cmd=["bash", "-c", "nohup python3 /workspace/.repl_daemon.py >/dev/null 2>&1 &"])
            time.sleep(1) # wait for boot

    # ── Tool 1: bash ──────────────────────────────────────────────────────

    def bash(self, container_id: str, command: str, timeout: int = DEFAULT_TIMEOUT) -> str:
        """Run a bash command. Output is truncated to MAX_OUTPUT_CHARS."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        try:
            result = container.exec_run(
                cmd=["bash", "-c", command],
                stdout=True,
                stderr=True,
                workdir="/workspace",
            )
        except Exception as exc:
            return f"Error: failed to execute command: {exc}"

        output = result.output.decode("utf-8", errors="replace")
        if result.exit_code != 0:
            output += f"\n[exit code {result.exit_code}]"
        output = output or "(no output)"

        return self._truncate_output(output)

    # ── Tool 2: write_file ────────────────────────────────────────────────

    def write_file(self, container_id: str, file_path: str, content: str) -> str:
        """Create or overwrite a file. Uses Docker put_archive (no shell escaping)."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        try:
            self._write_file_to_container(container, file_path, content)
        except Exception as exc:
            return f"Error: failed to write file: {exc}"

        line_count = content.count("\n") + (1 if content and not content.endswith("\n") else 0)
        return f"OK: wrote {line_count} lines to {file_path}"

    # ── Tool 3: read_file ─────────────────────────────────────────────────

    def read_file(self, container_id: str, file_path: str,
                  offset: int = 1, limit: Optional[int] = None) -> str:
        """Read a file with optional offset/limit for partial reads.
        
        Args:
            offset: Starting line number (1-indexed, default 1)
            limit:  Number of lines to return (default: all)
        
        Returns line-numbered content with metadata header.
        """
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        try:
            raw = self._read_file_raw(container, file_path)
        except FileNotFoundError:
            return f"Error: file not found: {file_path}"
        except docker.errors.APIError:
            return f"Error: file not found: {file_path}"
        except Exception as exc:
            return f"Error: failed to read file: {exc}"

        # Binary file detection
        mime, _ = mimetypes.guess_type(file_path)
        mime = mime or "application/octet-stream"
        if not (mime.startswith("text/") or mime in ("application/json", "application/x-python",
                "application/javascript", "application/xml", "application/yaml")):
            # Check if it looks like text anyway
            try:
                raw.decode("utf-8")
            except UnicodeDecodeError:
                b64 = base64.b64encode(raw).decode("ascii")
                return f"data:{mime};base64,{b64}"

        text = raw.decode("utf-8", errors="replace")
        all_lines = text.splitlines()
        total_lines = len(all_lines)

        # Apply offset/limit (offset is 1-indexed)
        start_idx = max(0, offset - 1)
        if limit is not None:
            end_idx = min(start_idx + limit, total_lines)
        else:
            end_idx = total_lines

        selected_lines = all_lines[start_idx:end_idx]
        actual_start = start_idx + 1
        actual_end = start_idx + len(selected_lines)

        # Format with line numbers
        numbered_lines = []
        for i, line in enumerate(selected_lines, start=actual_start):
            numbered_lines.append(f"{i}: {line}")

        content_str = "\n".join(numbered_lines)
        byte_size = len(content_str.encode("utf-8"))
        
        if byte_size > 1024:
            size_str = f"{byte_size / 1024:.1f}KB"
        else:
            size_str = f"{byte_size}B"

        header = f"[FILE: {file_path} | Lines {actual_start}-{actual_end} of {total_lines} | {size_str}]"
        
        return f"{header}\n{content_str}"

    # ── Tool 4: edit_file ─────────────────────────────────────────────────

    def edit_file(self, container_id: str, file_path: str,
                  old_text: str, new_text: str) -> str:
        """Surgical find-and-replace in a file. Uses put_archive for write-back."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        # Read current content
        try:
            raw = self._read_file_raw(container, file_path)
        except FileNotFoundError:
            return f"Error: file not found: {file_path}"
        except docker.errors.APIError:
            return f"Error: file not found: {file_path}"
        except Exception as exc:
            return f"Error: failed to read file: {exc}"

        current_content = raw.decode("utf-8", errors="replace")

        # Validate old_text exists
        if old_text not in current_content:
            return (
                f"Error: old_text not found in {file_path}. "
                "Make sure it matches exactly (including whitespace and indentation)."
            )

        # Validate uniqueness
        count = current_content.count(old_text)
        if count > 1:
            return (
                f"Error: old_text found {count} times in {file_path}. "
                "Make old_text more specific so it matches exactly once."
            )

        # Find which lines are affected (for the confirmation message)
        lines_before = current_content[:current_content.index(old_text)].count("\n") + 1
        old_line_count = old_text.count("\n") + 1
        new_line_count = new_text.count("\n") + 1

        # Replace
        new_content = current_content.replace(old_text, new_text, 1)

        # Write back via put_archive (binary-safe)
        try:
            self._write_file_to_container(container, file_path, new_content)
        except Exception as exc:
            return f"Error: failed to write file: {exc}"

        return (
            f"OK: edited {file_path} — "
            f"replaced {old_line_count} line(s) with {new_line_count} line(s) "
            f"starting at line {lines_before}"
        )

    # ── Tool 5: grep ──────────────────────────────────────────────────────

    def grep(self, container_id: str, pattern: str,
             path: str = "/workspace", include: Optional[str] = None) -> str:
        """Search for a pattern in files. Returns matching lines with file:line format."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        # Build grep command
        cmd = f"grep -rn --color=never"
        if include:
            cmd += f" --include='{include}'"
        # Escape the pattern for shell
        escaped_pattern = pattern.replace("'", "'\\''")
        cmd += f" '{escaped_pattern}' {path}"

        try:
            result = container.exec_run(
                cmd=["bash", "-c", cmd],
                stdout=True,
                stderr=True,
                workdir="/workspace",
            )
        except Exception as exc:
            return f"Error: failed to run grep: {exc}"

        output = result.output.decode("utf-8", errors="replace").strip()

        if result.exit_code == 1:
            return "No matches found."
        if result.exit_code != 0:
            return f"Error: grep failed.\n{output}\n[exit code {result.exit_code}]"

        # Truncate if too many matches
        return self._truncate_output(output) if output else "No matches found."

    # ── Tool 6: list_files ────────────────────────────────────────────────

    def list_files(self, container_id: str, path: str = "/workspace") -> str:
        """List all files under a path recursively."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        try:
            result = container.exec_run(
                cmd=["bash", "-c", f"cd {path} && find . -type f | sed 's#^./##' | sort"],
                stdout=True,
                stderr=True,
                workdir="/workspace",
            )
        except Exception as exc:
            return f"Error: failed to list files: {exc}"

        output = result.output.decode("utf-8", errors="replace").strip()
        if result.exit_code != 0:
            return f"Error: failed to list files.\n{output}\n[exit code {result.exit_code}]"
        return output or "(no files)"

    # ── Tool 7: lint_code ─────────────────────────────────────────────────

    def lint_code(self, container_id: str, file_path: str) -> str:
        """Run python -m py_compile to check syntax."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        try:
            result = container.exec_run(
                cmd=["python3", "-m", "py_compile", file_path],
                stdout=True,
                stderr=True,
                workdir="/workspace",
            )
        except Exception as exc:
            return f"Error: failed to lint file: {exc}"

        output = result.output.decode("utf-8", errors="replace").strip()
        if result.exit_code != 0:
            return f"Syntax Error in {file_path}:\n{output}\n[exit code {result.exit_code}]"
        return f"Syntax OK: {file_path} contains no syntax errors."

        # ── Tool 8: execute_cell ──────────────────────────────────────────────

    def execute_cell(self, container_id: str, code: str) -> str:
        """Run python code in the persistent REPL."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        self._ensure_repl_daemon(container)

        self._write_file_to_container(container, "/workspace/.cell_code.py", code)
        
        post_cmd = "python3 -c \"import urllib.request; req = urllib.request.Request('http://127.0.0.1:9999', data=open('/workspace/.cell_code.py', 'rb').read()); print(urllib.request.urlopen(req).read().decode('utf-8'))\""
        res = container.exec_run(cmd=["bash", "-c", post_cmd])

        if res.exit_code != 0:
            return f"Error connecting to REPL daemon: {res.output.decode('utf-8', errors='replace')}"

        try:
            data = json.loads(res.output.decode('utf-8'))
            out = data.get("output", "")
            err_trace = data.get("error", "")
            final = out
            if err_trace:
                final += f"\n--- ERROR ---\n{err_trace}"
            return self._truncate_output(final.strip()) if final.strip() else "(Code executed successfully, no output)"
        except Exception as e:
            return f"Error parsing REPL response: {e}\nRaw output: {res.output.decode('utf-8', errors='replace')}"

    # ── Tool 9: quit_sandbox ──────────────────────────────────────────────

    def quit_sandbox(self, container_id: str) -> str:
        """Stop and remove a sandbox container."""
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"No active sandbox for container {container_id}."

        try:
            container.stop(timeout=5)
        except Exception:
            pass

        try:
            container.remove(force=True)
        except Exception:
            pass

        return f"Sandbox container {container_id} destroyed."
