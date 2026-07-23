import os
import json
import urllib.request
import urllib.parse
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine


API_KEY = os.environ.get("DIP_API_KEY", "R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ")
DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/next")
OUTPUT_PATH = Path(__file__).resolve().parent / "dip_import_preview.json"


engine = create_engine(DB_URL)


def ensure_reference_rows():
    existing = pd.read_sql("SELECT id FROM open_discourse.politicians", engine)
    if existing.empty:
        pd.DataFrame([{"id": 1, "first_name": "Unbekannt", "last_name": "", "birth_place": None, "birth_country": None, "birth_date": None, "death_date": None, "gender": None, "profession": None, "aristocracy": None, "academic_title": None}]).to_sql("politicians", engine, schema="open_discourse", if_exists="append", index=False)

    existing_factions = pd.read_sql("SELECT id FROM open_discourse.factions", engine)
    if existing_factions.empty:
        pd.DataFrame([{"id": 1, "abbreviation": "UNK", "full_name": "Unbekannt"}]).to_sql("factions", engine, schema="open_discourse", if_exists="append", index=False)

    existing_terms = pd.read_sql("SELECT id FROM open_discourse.electoral_terms", engine)
    if existing_terms.empty:
        pd.DataFrame([{"id": 1, "start_date": 2021, "end_date": 2025}]).to_sql("electoral_terms", engine, schema="open_discourse", if_exists="append", index=False)


def fetch_plenarprotokoll_texts(limit=10):
    url = "https://search.dip.bundestag.de/api/v1/plenarprotokoll-text"
    params = {
        "f.zuordnung": "BT",
        "f.datum.start": "2021-01-01",
        "apikey": API_KEY,
    }
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params))

    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8")

    payload = json.loads(body)
    documents = payload.get("documents", [])[:limit]
    OUTPUT_PATH.write_text(json.dumps({"numFound": payload.get("numFound"), "documents": documents}, ensure_ascii=False, indent=2), encoding="utf-8")
    return documents


def load_reference_data():
    politicians = pd.read_sql("SELECT id, first_name, last_name FROM open_discourse.politicians", engine)
    factions = pd.read_sql("SELECT id, abbreviation FROM open_discourse.factions", engine)
    electoral_terms = pd.read_sql("SELECT id, start_date, end_date FROM open_discourse.electoral_terms", engine)
    return politicians, factions, electoral_terms


def build_rows(documents, politicians, factions, electoral_terms):
    rows = []
    for idx, doc in enumerate(documents, start=1):
        doc_id = int(doc.get("id", idx))
        title = doc.get("titel") or ""
        text = doc.get("text") or ""
        date = doc.get("datum")
        electoral_term = None
        if date:
            try:
                year = int(date[:4])
            except Exception:
                year = None
            if year is not None:
                for _, term in electoral_terms.iterrows():
                    start_date = int(term["start_date"])
                    end_date = int(term["end_date"]) if pd.notna(term["end_date"]) else None
                    if start_date <= year and (end_date is None or year <= end_date):
                        electoral_term = int(term["id"])
                        break

        politician_id = None
        first_name = None
        last_name = None

        if not politicians.empty:
            politician_id = int(politicians.iloc[0]["id"])
            first_name = politicians.iloc[0]["first_name"]
            last_name = politicians.iloc[0]["last_name"]

        faction_id = int(factions.iloc[0]["id"]) if not factions.empty else 1

        row = {
            "id": doc_id,
            "session": doc_id,
            "electoral_term": electoral_term or 1,
            "first_name": first_name,
            "last_name": last_name,
            "politician_id": politician_id if politician_id is not None else 1,
            "speech_content": text[:200000],
            "faction_id": faction_id,
            "document_url": doc.get("fundstelle", {}).get("pdf_url") or "",
            "position_short": "Mitglied des Bundestages",
            "position_long": "Mitglied des Bundestages",
            "date": date,
        }
        rows.append(row)
    return rows


def import_rows(rows):
    df = pd.DataFrame(rows)
    df.to_sql("speeches", engine, schema="open_discourse", if_exists="append", index=False)


if __name__ == "__main__":
    ensure_reference_rows()
    documents = fetch_plenarprotokoll_texts(limit=3)
    politicians, factions, electoral_terms = load_reference_data()
    rows = build_rows(documents, politicians, factions, electoral_terms)
    print("rows_to_import", len(rows))
    import_rows(rows)
    print("imported")
