import base64
import io
import mimetypes
import tarfile
from typing import Optional

import docker


class SandboxManager:
    """Executes commands and reads files from existing Docker containers."""

    def __init__(
        self, docker_client: Optional[docker.DockerClient] = None
    ):
        self.docker_client = None
        self._docker_error = "Docker client not initialized."

        if docker_client is not None:
            self.docker_client = docker_client
            self._docker_error = ""
            return

        try:
            client = docker.from_env()
            # Force an early connectivity check so failures are captured here.
            client.ping()
            self.docker_client = client
            self._docker_error = ""
        except Exception as exc:
            self._docker_error = (
                "Docker is not available. Ensure Docker Desktop/Engine is running "
                f"and accessible from this process. Details: {exc}"
            )

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

    def bash(self, container_id: str, command: str) -> str:
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
        return output or "(no output)"

    def read_file(self, container_id: str, file_path: str) -> str:
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        try:
            archive_stream, _ = container.get_archive(file_path)
            tar_bytes = b"".join(chunk for chunk in archive_stream)
        except docker.errors.APIError:
            return f"Error: file not found: {file_path}"
        except Exception as exc:
            return f"Error: failed to read file: {exc}"

        try:
            with tarfile.open(fileobj=io.BytesIO(tar_bytes)) as tar:
                members = [m for m in tar.getmembers() if m.isfile()]
                if not members:
                    return f"Error: file not found: {file_path}"
                file_obj = tar.extractfile(members[0])
                if not file_obj:
                    return f"Error: file not found: {file_path}"
                raw = file_obj.read()
        except Exception as exc:
            return f"Error: failed to unpack file: {exc}"

        mime, _ = mimetypes.guess_type(file_path)
        mime = mime or "application/octet-stream"

        if mime.startswith("text/") or mime in ("application/json",):
            return raw.decode("utf-8", errors="replace")

        b64 = base64.b64encode(raw).decode("ascii")
        return f"data:{mime};base64,{b64}"

    def list_files(self, container_id: str) -> str:
        err = self._ensure_docker()
        if err:
            return err

        container = self._get_container(container_id)
        if not container:
            return f"Error: container not found: {container_id}"

        try:
            result = container.exec_run(
                cmd=["bash", "-c", "cd /workspace && find . -type f | sed 's#^./##'"],
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

    def quit_sandbox(self, container_id: str) -> str:
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
