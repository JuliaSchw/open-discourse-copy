import importlib.util
from pathlib import Path

import pandas as pd

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
    xml_payload = b"""
    <dbtplenarprotokoll>
      <sitzungsverlauf>
        <tagesordnungspunkt>
          <rede>
            <p klasse=\"redner\"><redner id=\"9001\"><name><vorname>Max</vorname><nachname>Mustermann</nachname><fraktion>SPD</fraktion></name></redner>Max Mustermann (SPD):</p>
            <p>Erster Satz.</p>
            <p>Zweiter Satz.</p>
          </rede>
        </tagesordnungspunkt>
      </sitzungsverlauf>
    </dbtplenarprotokoll>
    """

    class DummyResponse:
        def __init__(self, payload):
            self.payload = payload

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            return self.payload

    def fake_urlopen(_req, timeout=60):
        return DummyResponse(xml_payload)

    module.urllib.request.urlopen = fake_urlopen

    documents = [
        {
            "id": "10",
            "fundstelle": {
                "datum": "2021-01-01",
                "pdf_url": "u1",
                "xml_url": "https://example.test/1.xml",
                "plpr_nummer": "20/10",
            },
            "wahlperiode": 20,
        },
        {
            "id": "10",
            "fundstelle": {
                "datum": "2021-01-01",
                "pdf_url": "u1",
                "xml_url": "https://example.test/1.xml",
                "plpr_nummer": "20/10",
            },
            "wahlperiode": 20,
        },
        {
            "id": "11",
            "fundstelle": {
                "datum": "2021-02-01",
                "pdf_url": "u3",
                "xml_url": "https://example.test/2.xml",
                "plpr_nummer": "20/11",
            },
            "wahlperiode": 20,
        },
    ]

    politicians = pd.DataFrame([{"id": 1, "first_name": "Unbekannt", "last_name": ""}])
    factions = pd.DataFrame([{"id": 1, "abbreviation": "UNK"}])
    electoral_terms = pd.DataFrame([{"id": 20, "start_date": 2021, "end_date": 2025}])

    rows, new_politicians, new_factions = module.build_rows(documents, politicians, factions, electoral_terms)

    assert len(rows) == 2
    assert rows[0]["id"] == 100001
    assert rows[1]["id"] == 110001
    assert rows[0]["first_name"] == "Max"
    assert rows[0]["last_name"] == "Mustermann"
    assert rows[0]["session"] == 10
    assert rows[1]["session"] == 11
    assert len(new_politicians) == 1
    assert len(new_factions) == 1
