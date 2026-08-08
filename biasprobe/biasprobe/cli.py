"""BiasProbe CLI entry point."""

import sys

import click
import requests

from . import config, counterfactual_builder, judge, report as report_mod
from . import scenario_generator, target_runner, utils
from .connectors import OllamaConnector


def _echo(msg: str) -> None:
    click.echo(msg, err=True)


@click.group()
def cli() -> None:
    """BiasProbe: adversarial bias testing for LLMs via an LLM judge."""


@cli.command()
@click.option("--use-case", required=True, help="Free-text deployment context.")
@click.option(
    "--target-model",
    default=config.OLLAMA_TARGET_MODEL_DEFAULT,
    show_default=True,
    help="Ollama model to probe.",
)
@click.option(
    "--dimensions",
    default=None,
    help="Comma list of bias dimensions to constrain testing to (default: generator decides).",
)
@click.option(
    "--num-scenarios",
    default=config.DEFAULT_NUM_SCENARIOS,
    show_default=True,
    type=int,
)
@click.option(
    "--variants-per-dimension",
    default=config.DEFAULT_VARIANTS_PER_DIMENSION,
    show_default=True,
    type=int,
)
@click.option("--output", default=None, help="Report file path (default: report_<timestamp>.json).")
def run(use_case, target_model, dimensions, num_scenarios, variants_per_dimension, output):
    """Run a full bias audit against a target model."""
    import datetime

    dims = [d.strip() for d in dimensions.split(",")] if dimensions else None
    out_path = output or f"report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    try:
        _echo("Generating scenarios and attribute variants with Gemini...")
        scenarios, dimension_variants = scenario_generator.generate_scenarios(
            use_case, dims, num_scenarios, variants_per_dimension
        )

        _echo(f"Generated {len(scenarios)} scenarios across dimensions: "
              f"{', '.join(dimension_variants.keys())}")

        counterfactuals = counterfactual_builder.build_counterfactuals(
            scenarios, dimension_variants
        )
        _echo(f"Built {len(counterfactuals)} counterfactual prompts.")

        _echo(f"Running counterfactuals against target model '{target_model}' (Ollama)...")
        connector = OllamaConnector(config.OLLAMA_HOST, target_model)
        responses = target_runner.run_all_targets(connector, counterfactuals)
        failed = sum(1 for r in responses if r.parse_failed)
        if failed:
            _echo(f"Warning: {failed} target responses could not be parsed as JSON "
                  f"even after a retry; judge will rely on raw text for those.")

        _echo("Judging counterfactual sets with Gemini...")
        verdicts = judge.judge_all(scenarios, responses)
        judge_failed = sum(1 for v in verdicts if v.judge_parse_failed)
        if judge_failed:
            _echo(f"Warning: {judge_failed} judge calls did not return parseable JSON "
                  f"even after a retry; those cases have no verdict.")

        report = report_mod.build_report(use_case, target_model, scenarios, responses, verdicts)
        report_mod.write_report(report, out_path)
        _echo(f"Report written to {out_path}")

        report_mod.print_summary(report)
    except Exception as e:
        click.echo(f"biasprobe run failed: {e}", err=True)
        sys.exit(1)


@cli.command(name="report")
@click.argument("report_path")
def report_cmd(report_path):
    """Re-print a human-readable summary from a saved report."""
    try:
        rep = report_mod.load_report(report_path)
    except Exception as e:
        click.echo(f"Could not load report '{report_path}': {e}", err=True)
        sys.exit(1)
    report_mod.print_summary(rep)


@cli.command()
@click.option(
    "--target-model",
    default=config.OLLAMA_TARGET_MODEL_DEFAULT,
    show_default=True,
)
def doctor(target_model):
    """Sanity-check connectivity before a real run."""
    checks: list[tuple[str, bool, str]] = []

    try:
        resp = requests.get(f"{config.OLLAMA_HOST}/api/tags", timeout=5)
        resp.raise_for_status()
        checks.append(("Ollama reachable", True, config.OLLAMA_HOST))
        models = [m.get("name", "") for m in resp.json().get("models", [])]
        present = any(
            m == target_model or m.startswith(f"{target_model}:") for m in models
        )
        checks.append((
            f"Target model '{target_model}' pulled",
            present,
            f"available models: {', '.join(models) or '(none)'}",
        ))
    except Exception as e:
        checks.append(("Ollama reachable", False, str(e)))
        checks.append((f"Target model '{target_model}' pulled", False, "skipped - Ollama unreachable"))

    try:
        import google.auth

        google.auth.default()
        checks.append(("Vertex AI auth valid", True, "credentials resolved via ADC"))
    except Exception as e:
        checks.append(("Vertex AI auth valid", False, str(e)))

    try:
        model = utils.get_gemini_model()
        model.generate_content("Reply with the single word: pong")
        checks.append((f"Gemini model '{config.GEMINI_MODEL}' reachable", True, ""))
    except Exception as e:
        checks.append((f"Gemini model '{config.GEMINI_MODEL}' reachable", False, str(e)))

    all_ok = True
    for name, ok, detail in checks:
        status = "OK" if ok else "FAIL"
        line = f"[{status}] {name}"
        if detail:
            line += f" - {detail}"
        click.echo(line)
        all_ok = all_ok and ok

    sys.exit(0 if all_ok else 1)


def main() -> None:
    cli()


if __name__ == "__main__":
    main()
