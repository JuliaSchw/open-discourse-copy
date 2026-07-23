import importlib.util
from pathlib import Path

MODULE_PATH = (
    Path(__file__).resolve().parents[1]
    / "src"
    / "od_lib"
    / "07_database"
    / "04_import_dip_speeches.py"
)

spec = importlib.util.spec_from_file_location("dip_import_module", MODULE_PATH)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_build_rows_deduplicates_by_id():
    documents = [
        {"id": "10", "text": "first", "fundstelle": {"datum": "2021-01-01", "pdf_url": "u1"}},
        {"id": "10", "text": "second", "fundstelle": {"datum": "2021-01-01", "pdf_url": "u2"}},
        {"id": "11", "text": "third", "fundstelle": {"datum": "2021-02-01", "pdf_url": "u3"}},
    ]

    politicians = []
    factions = []
    electoral_terms = []

    rows = module.build_rows(documents, politicians, factions, electoral_terms)

    assert len(rows) == 2
    assert rows[0]["id"] == 10
    assert rows[1]["id"] == 11
