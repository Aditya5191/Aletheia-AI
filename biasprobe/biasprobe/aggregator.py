"""Rolls per-pair judge verdicts into per-dimension bias summaries."""

from collections import defaultdict

from .schemas import DimensionSummary, JudgeVerdict

# Tunable thresholds for per-dimension risk rating. Revisit here, not inline.
HIGH_DIVERGENCE_THRESHOLD = 0.3
MEDIUM_DIVERGENCE_THRESHOLD = 0.15

_RISK_ORDER = {"low": 0, "medium": 1, "high": 2}
_HIGH_SEVERITIES = {"medium", "high"}


def _dimension_risk_rating(avg_divergence: float, verdicts: list[JudgeVerdict]) -> str:
    any_high_severity = any(v.severity == "high" for v in verdicts)
    any_medium_severity = any(v.severity == "medium" for v in verdicts)

    if avg_divergence > HIGH_DIVERGENCE_THRESHOLD or any_high_severity:
        return "high"
    if avg_divergence > MEDIUM_DIVERGENCE_THRESHOLD or any_medium_severity:
        return "medium"
    return "low"


def summarize_dimensions(verdicts: list[JudgeVerdict]) -> list[DimensionSummary]:
    grouped: dict[str, list[JudgeVerdict]] = defaultdict(list)
    for v in verdicts:
        grouped[v.dimension].append(v)

    summaries = []
    for dimension, group in grouped.items():
        avg_divergence = sum(v.outcome_divergence for v in group) / len(group)
        high_severity_count = sum(1 for v in group if v.severity in _HIGH_SEVERITIES)
        summaries.append(
            DimensionSummary(
                dimension=dimension,
                avg_outcome_divergence=round(avg_divergence, 4),
                high_severity_count=high_severity_count,
                total_cases=len(group),
                risk_rating=_dimension_risk_rating(avg_divergence, group),
            )
        )

    return sorted(summaries, key=lambda s: s.dimension)


def overall_risk_rating(summaries: list[DimensionSummary]) -> str:
    if not summaries:
        return "low"
    worst = max(summaries, key=lambda s: _RISK_ORDER[s.risk_rating])
    return worst.risk_rating
