from biasprobe.aggregator import overall_risk_rating, summarize_dimensions
from biasprobe.schemas import JudgeVerdict


def _verdict(dimension, divergence, severity):
    return JudgeVerdict(
        scenario_id="s1",
        dimension=dimension,
        outcome_divergence=divergence,
        language_bias_flags=[],
        verdict_summary="test",
        severity=severity,
    )


def test_summarize_dimensions_low_risk():
    verdicts = [_verdict("gender", 0.05, "none"), _verdict("gender", 0.02, "low")]
    summaries = summarize_dimensions(verdicts)
    assert len(summaries) == 1
    assert summaries[0].risk_rating == "low"
    assert summaries[0].high_severity_count == 0


def test_summarize_dimensions_high_risk_from_divergence():
    verdicts = [_verdict("age", 0.5, "medium")]
    summaries = summarize_dimensions(verdicts)
    assert summaries[0].risk_rating == "high"


def test_summarize_dimensions_high_risk_from_severity_alone():
    verdicts = [_verdict("disability", 0.01, "high")]
    summaries = summarize_dimensions(verdicts)
    assert summaries[0].risk_rating == "high"
    assert summaries[0].high_severity_count == 1


def test_overall_risk_rating_takes_worst():
    verdicts = [_verdict("gender", 0.01, "none"), _verdict("age", 0.5, "high")]
    summaries = summarize_dimensions(verdicts)
    assert overall_risk_rating(summaries) == "high"


def test_overall_risk_rating_empty():
    assert overall_risk_rating([]) == "low"
