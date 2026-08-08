"""Builds, writes, and prints the BiasReport."""

import datetime
import json

from . import aggregator, config
from .schemas import BiasReport, JudgeVerdict, ScenarioTemplate, TargetResponse

try:
    from rich.console import Console
    from rich.table import Table

    _console = Console()
    _HAS_RICH = True
except ImportError:  # pragma: no cover - rich is in requirements but stay safe
    _console = None
    _HAS_RICH = False


def build_report(
    use_case: str,
    target_model: str,
    scenarios: list[ScenarioTemplate],
    responses: list[TargetResponse],
    verdicts: list[JudgeVerdict],
) -> BiasReport:
    summaries = aggregator.summarize_dimensions(verdicts)
    return BiasReport(
        use_case=use_case,
        target_model=target_model,
        judge_model=config.GEMINI_MODEL,
        generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        scenarios=scenarios,
        responses=responses,
        verdicts=verdicts,
        dimension_summaries=summaries,
        overall_risk_rating=aggregator.overall_risk_rating(summaries),
        disclaimer=f"{config.DISCLAIMER} {config.JUDGE_LIMITATION_NOTE}",
    )


def write_report(report: BiasReport, path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report.model_dump(), f, indent=2)


def load_report(path: str) -> BiasReport:
    with open(path, "r", encoding="utf-8") as f:
        return BiasReport(**json.load(f))


def _top_divergent_examples(report: BiasReport, n: int = 3) -> list[
    tuple[JudgeVerdict, list[TargetResponse]]
]:
    ranked = sorted(
        report.verdicts, key=lambda v: v.outcome_divergence, reverse=True
    )[:n]
    result = []
    for verdict in ranked:
        matches = [
            r
            for r in report.responses
            if r.scenario_id == verdict.scenario_id and r.dimension == verdict.dimension
        ]
        result.append((verdict, matches))
    return result


def print_summary(report: BiasReport) -> None:
    if _HAS_RICH:
        _print_summary_rich(report)
    else:
        _print_summary_plain(report)


def _print_summary_rich(report: BiasReport) -> None:
    _console.print(
        f"\n[bold]BiasProbe report[/bold] - use case: {report.use_case}"
    )
    _console.print(
        f"Target model: {report.target_model}  |  Judge model: {report.judge_model}"
    )
    _console.print(f"Overall risk rating: [bold]{report.overall_risk_rating.upper()}[/bold]\n")

    table = Table(title="Per-dimension summary")
    table.add_column("Dimension")
    table.add_column("Avg divergence", justify="right")
    table.add_column("Risk rating")
    table.add_column("Flagged cases", justify="right")
    table.add_column("Total cases", justify="right")

    for s in report.dimension_summaries:
        table.add_row(
            s.dimension,
            f"{s.avg_outcome_divergence:.3f}",
            s.risk_rating.upper(),
            str(s.high_severity_count),
            str(s.total_cases),
        )
    _console.print(table)

    _console.print("\n[bold]Top highest-divergence cases[/bold]")
    for verdict, responses in _top_divergent_examples(report):
        _console.print(
            f"\n[cyan]{verdict.scenario_id}[/cyan] / [magenta]{verdict.dimension}[/magenta] "
            f"- divergence {verdict.outcome_divergence:.3f}, severity {verdict.severity}"
        )
        _console.print(f"  {verdict.verdict_summary}")
        if verdict.language_bias_flags:
            _console.print(f"  language flags: {verdict.language_bias_flags}")
        for r in responses:
            _console.print(
                f"  [dim]A={r.attribute_a!r} B={r.attribute_b!r} "
                f"(testing {r.tested_value!r} @ {r.tested_position}) "
                f"decision={r.parsed_decision}[/dim]"
            )

    _console.print(f"\n[italic]{report.disclaimer}[/italic]\n")


def _print_summary_plain(report: BiasReport) -> None:
    print(f"\nBiasProbe report - use case: {report.use_case}")
    print(f"Target model: {report.target_model}  |  Judge model: {report.judge_model}")
    print(f"Overall risk rating: {report.overall_risk_rating.upper()}\n")

    print(f"{'Dimension':<20}{'Avg divergence':<16}{'Risk':<8}{'Flagged':<9}{'Total':<7}")
    for s in report.dimension_summaries:
        print(
            f"{s.dimension:<20}{s.avg_outcome_divergence:<16.3f}"
            f"{s.risk_rating.upper():<8}{s.high_severity_count:<9}{s.total_cases:<7}"
        )

    print("\nTop highest-divergence cases")
    for verdict, responses in _top_divergent_examples(report):
        print(
            f"\n{verdict.scenario_id} / {verdict.dimension} "
            f"- divergence {verdict.outcome_divergence:.3f}, severity {verdict.severity}"
        )
        print(f"  {verdict.verdict_summary}")
        if verdict.language_bias_flags:
            print(f"  language flags: {verdict.language_bias_flags}")
        for r in responses:
            print(
                f"  A={r.attribute_a!r} B={r.attribute_b!r} "
                f"(testing {r.tested_value!r} @ {r.tested_position}) "
                f"decision={r.parsed_decision}"
            )
            print(f"    response: {r.raw_response_text[:300]}")

    print(f"\n{report.disclaimer}\n")
