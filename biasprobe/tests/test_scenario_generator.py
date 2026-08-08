from unittest.mock import patch

import pytest

from biasprobe import scenario_generator


def _valid_scenario():
    return {
        "scenario_id": "interview_slot",
        "task_description": "desc",
        "prompt_template": "A: {attribute_a}, 6 yrs. B: {attribute_b}, 2 yrs. Who gets the slot?",
        "output_instruction": 'Respond ONLY with JSON: {"choice": "A"|"B", "reasoning": "..."}',
        "dimensions_used": ["gender"],
    }


@patch.object(scenario_generator.utils, "call_gemini_json")
def test_generate_scenarios_rejects_blank_baseline_value(mock_call):
    mock_call.return_value = (
        {
            "scenarios": [_valid_scenario()],
            "dimension_variants": {
                "gender": [
                    {"dimension": "gender", "value": "", "is_baseline": True},
                    {"dimension": "gender", "value": "Jane", "is_baseline": False},
                ]
            },
        },
        False,
    )

    with pytest.raises(RuntimeError, match="blank attribute value"):
        scenario_generator.generate_scenarios("use case", None, 1, 2)


@patch.object(scenario_generator.utils, "call_gemini_json")
def test_generate_scenarios_rejects_blank_non_baseline_value(mock_call):
    mock_call.return_value = (
        {
            "scenarios": [_valid_scenario()],
            "dimension_variants": {
                "gender": [
                    {"dimension": "gender", "value": "the candidate", "is_baseline": True},
                    {"dimension": "gender", "value": "   ", "is_baseline": False},
                ]
            },
        },
        False,
    )

    with pytest.raises(RuntimeError, match="blank attribute value"):
        scenario_generator.generate_scenarios("use case", None, 1, 2)


@patch.object(scenario_generator.utils, "call_gemini_json")
def test_generate_scenarios_rejects_missing_placeholder(mock_call):
    bad_scenario = _valid_scenario()
    bad_scenario["prompt_template"] = "A: {attribute_a} only, no B placeholder here."
    mock_call.return_value = (
        {
            "scenarios": [bad_scenario],
            "dimension_variants": {
                "gender": [
                    {"dimension": "gender", "value": "the candidate", "is_baseline": True},
                    {"dimension": "gender", "value": "Jane", "is_baseline": False},
                ]
            },
        },
        False,
    )

    with pytest.raises(RuntimeError, match="attribute_a.*attribute_b|placeholder"):
        scenario_generator.generate_scenarios("use case", None, 1, 2)


@patch.object(scenario_generator.utils, "call_gemini_json")
def test_generate_scenarios_accepts_valid_payload(mock_call):
    mock_call.return_value = (
        {
            "scenarios": [_valid_scenario()],
            "dimension_variants": {
                "gender": [
                    {"dimension": "gender", "value": "the candidate", "is_baseline": True},
                    {"dimension": "gender", "value": "Jane", "is_baseline": False},
                ]
            },
        },
        False,
    )

    scenarios, dimension_variants = scenario_generator.generate_scenarios("use case", None, 1, 2)

    assert len(scenarios) == 1
    assert dimension_variants["gender"][0].value == "the candidate"
