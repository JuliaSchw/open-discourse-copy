import argparse
import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text


API_KEY = os.environ.get("DIP_API_KEY", "R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ")
DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/next")
OUTPUT_PATH = Path(__file__).resolve().parent / "dip_import_preview.json"


engine = create_engine(DB_URL)


def parse_args():
    parser = argparse.ArgumentParser(description="Import Bundestag plenary protocol texts from the DIP API")
    parser.add_argument("--start-date", default="2021-01-01")
    parser.add_argument("--end-date", default="2026-12-31")
    parser.add_argument("--page-size", type=int, default=20)
    parser.add_argument("--max-documents", type=int, default=50)
    parser.add_argument("--sleep-seconds", type=float, default=0.5)
    parser.add_argument("--reset", action="store_true", help="Delete existing speeches rows before importing")
    return parser.parse_args()


def ensure_reference_rows(documents=None):
    if pd.read_sql("SELECT id FROM open_discourse.politicians", engine).empty:
        pd.DataFrame([
            {
                "id": 1,
                "first_name": "Unbekannt",
                "last_name": "",
                "birth_place": None,
                "birth_country": None,
                "birth_date": None,
                "death_date": None,
                "gender": None,
                "profession": None,
                "aristocracy": None,
                "academic_title": None,
            }
        ]).to_sql("politicians", engine, schema="open_discourse", if_exists="append", index=False)

    if pd.read_sql("SELECT id FROM open_discourse.factions", engine).empty:
        pd.DataFrame([{"id": 1, "abbreviation": "UNK", "full_name": "Unbekannt"}]).to_sql(
            "factions", engine, schema="open_discourse", if_exists="append", index=False
        )

    existing_terms = pd.read_sql("SELECT id FROM open_discourse.electoral_terms", engine)
    if existing_terms.empty:
        pd.DataFrame([{"id": 1, "start_date": 2021, "end_date": 2025}]).to_sql(
            "electoral_terms", engine, schema="open_discourse", if_exists="append", index=False
        )

    if documents:
        for doc in documents:
            term_id = doc.get("wahlperiode")
            if term_id is None:
                continue
            try:
                term_id = int(term_id)
            except (TypeError, ValueError):
                continue
            if pd.read_sql(f"SELECT id FROM open_discourse.electoral_terms WHERE id = {term_id}", engine).empty:
                pd.DataFrame([{"id": term_id, "start_date": term_id, "end_date": None}]).to_sql(
                    "electoral_terms", engine, schema="open_discourse", if_exists="append", index=False
                )


def fetch_plenarprotokoll_texts(start_date, end_date, page_size, max_documents, sleep_seconds):
    url = "https://search.dip.bundestag.de/api/v1/plenarprotokoll-text"
    params = {
        "f.zuordnung": "BT",
        "f.datum.start": start_date,
        "f.datum.end": end_date,
        "apikey": API_KEY,
        "per_page": page_size,
    }

    all_documents = []
    cursor = None
    payload = {"numFound": 0, "documents": []}
    while len(all_documents) < max_documents:
        current_params = dict(params)
        if cursor:
            current_params["cursor"] = cursor
        req = urllib.request.Request(url + "?" + urllib.parse.urlencode(current_params))

        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")

        payload = json.loads(body)
        documents = payload.get("documents", []) or []
        if not documents:
            break

        all_documents.extend(documents)
        if len(all_documents) >= max_documents:
            break

        next_cursor = payload.get("cursor")
        if not next_cursor or next_cursor == cursor:
            break

        cursor = next_cursor
        if sleep_seconds > 0:
            time.sleep(sleep_seconds)

    documents = all_documents[:max_documents]
    OUTPUT_PATH.write_text(
        json.dumps({"numFound": payload.get("numFound"), "documents": documents}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return documents


def load_reference_data():
    politicians = pd.read_sql("SELECT id, first_name, last_name FROM open_discourse.politicians", engine)
    factions = pd.read_sql("SELECT id, abbreviation FROM open_discourse.factions", engine)
    electoral_terms = pd.read_sql("SELECT id, start_date, end_date FROM open_discourse.electoral_terms", engine)
    return politicians, factions, electoral_terms


def build_rows(documents, politicians, factions, electoral_terms):
    rows = []
    seen_ids = set()
    for idx, doc in enumerate(documents, start=1):
        doc_id = int(doc.get("id", idx))
        if doc_id in seen_ids:
            continue
        seen_ids.add(doc_id)

        text = doc.get("text") or ""
        date = (doc.get("fundstelle", {}) or {}).get("datum") or doc.get("datum") or None
        electoral_term = None

        raw_term = doc.get("wahlperiode")
        if raw_term is not None:
            try:
                electoral_term = int(raw_term)
            except (TypeError, ValueError):
                electoral_term = None

        if electoral_term is None and date and hasattr(electoral_terms, "iterrows"):
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

        politician_row = politicians.iloc[0] if hasattr(politicians, "iloc") and not politicians.empty else None
        faction_row = factions.iloc[0] if hasattr(factions, "iloc") and not factions.empty else None

        row = {
            "id": doc_id,
            "session": doc_id,
            "electoral_term": electoral_term or 1,
            "first_name": politician_row["first_name"] if politician_row is not None else "Unbekannt",
            "last_name": politician_row["last_name"] if politician_row is not None else "",
            "politician_id": int(politician_row["id"]) if politician_row is not None else 1,
            "speech_content": text[:200000],
            "faction_id": int(faction_row["id"]) if faction_row is not None else 1,
            "document_url": (doc.get("fundstelle", {}) or {}).get("pdf_url") or "",
            "position_short": "Mitglied des Bundestages",
            "position_long": "Mitglied des Bundestages",
            "date": date,
        }
        rows.append(row)
    return rows


def import_rows(rows, reset=False):
    if not rows:
        return 0

    with engine.begin() as conn:
        if reset:
            conn.execute(text("DELETE FROM open_discourse.speeches"))

        for row in rows:
            conn.execute(
                text(
                    """
                    INSERT INTO open_discourse.speeches (
                        id, session, electoral_term, first_name, last_name, politician_id,
                        speech_content, faction_id, document_url, position_short, position_long, date
                    )
                    VALUES (
                        :id, :session, :electoral_term, :first_name, :last_name, :politician_id,
                        :speech_content, :faction_id, :document_url, :position_short, :position_long, :date
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                row,
            )

    count = int(pd.read_sql("SELECT COUNT(*) AS speeches_count FROM open_discourse.speeches", engine).iloc[0, 0])
    return count


if __name__ == "__main__":
    args = parse_args()
    documents = fetch_plenarprotokoll_texts(
        start_date=args.start_date,
        end_date=args.end_date,
        page_size=args.page_size,
        max_documents=args.max_documents,
        sleep_seconds=args.sleep_seconds,
    )
    ensure_reference_rows(documents=documents)
    politicians, factions, electoral_terms = load_reference_data()
    rows = build_rows(documents, politicians, factions, electoral_terms)
    imported = import_rows(rows, reset=args.reset)
    print("rows_to_import", len(rows))
    print("imported", imported)
