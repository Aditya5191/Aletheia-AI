from biasprobe.utils import extract_json


def test_extract_json_plain():
    assert extract_json('{"a": 1}') == {"a": 1}


def test_extract_json_fenced():
    text = '```json\n{"a": 1, "b": [1, 2]}\n```'
    assert extract_json(text) == {"a": 1, "b": [1, 2]}


def test_extract_json_with_surrounding_prose():
    text = 'Sure, here you go:\n{"score": 7, "recommend": "yes"}\nHope that helps!'
    assert extract_json(text) == {"score": 7, "recommend": "yes"}


def test_extract_json_returns_none_when_absent():
    assert extract_json("no json here at all") is None


def test_extract_json_empty_string():
    assert extract_json("") is None
