import argparse
import json
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text


API_KEY = os.environ.get("DIP_API_KEY", "R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ")
DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/next")
OUTPUT_PATH = Path(__file__).resolve().parent / "dip_import_preview.json"

UNKNOWN_FIRST_NAME = "Unbekannt"
UNKNOWN_LAST_NAME = ""
UNKNOWN_FACTION = "UNK"

SPEAKER_LINE_RE = re.compile(r"([A-ZÄÖÜa-zäöüß .\-]+?)\s*\(([^)]+)\):")
LEADING_ROLE_RE = re.compile(
    r"^(?:Präsidentin|Präsident|Vizepräsidentin|Vizepräsident|Bundeskanzler(?:in)?|Bundesminister(?:in)?)\s+"
)


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
    with engine.begin() as conn:
        unknown_politician = conn.execute(
            text(
                """
                SELECT id
                FROM open_discourse.politicians
                WHERE first_name = :first_name AND COALESCE(last_name, '') = :last_name
                ORDER BY id
                LIMIT 1
                """
            ),
            {"first_name": UNKNOWN_FIRST_NAME, "last_name": UNKNOWN_LAST_NAME},
        ).fetchone()

        if unknown_politician is None:
            next_id = conn.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM open_discourse.politicians")).scalar_one()
            conn.execute(
                text(
                    """
                    INSERT INTO open_discourse.politicians (
                        id, first_name, last_name, birth_place, birth_country,
                        birth_date, death_date, gender, profession, aristocracy, academic_title
                    ) VALUES (
                        :id, :first_name, :last_name, NULL, NULL,
                        NULL, NULL, NULL, NULL, NULL, NULL
                    )
                    """
                ),
                {"id": int(next_id), "first_name": UNKNOWN_FIRST_NAME, "last_name": UNKNOWN_LAST_NAME},
            )

        unknown_faction = conn.execute(
            text(
                """
                SELECT id
                FROM open_discourse.factions
                WHERE LOWER(abbreviation) = LOWER(:abbr)
                ORDER BY id
                LIMIT 1
                """
            ),
            {"abbr": UNKNOWN_FACTION},
        ).fetchone()
        if unknown_faction is None:
            next_id = conn.execute(text("SELECT COALESCE(MAX(id), 0) + 1 FROM open_discourse.factions")).scalar_one()
            conn.execute(
                text(
                    """
                    INSERT INTO open_discourse.factions (id, abbreviation, full_name)
                    VALUES (:id, :abbr, :full_name)
                    """
                ),
                {"id": int(next_id), "abbr": UNKNOWN_FACTION, "full_name": "Unbekannt"},
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
    page_counter = 0
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
        page_counter += 1
        if page_counter % 25 == 0:
            print(f"fetched_documents={len(all_documents)}")
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


def _collapse_whitespace(value):
    if value is None:
        return ""
    value = value.replace("\xa0", " ")
    return " ".join(value.split())


def _tag_name(node):
    return node.tag.split("}")[-1]


def _get_text(node):
    return _collapse_whitespace("".join(node.itertext()))


def _normalize_person_key(first_name, last_name):
    return (_collapse_whitespace(first_name).lower(), _collapse_whitespace(last_name).lower())


def _split_person_name(raw_name):
    cleaned = _collapse_whitespace(raw_name)
    cleaned = cleaned.rstrip(":")
    cleaned = LEADING_ROLE_RE.sub("", cleaned)
    tokens = cleaned.split()
    if not tokens:
        return "", ""
    if len(tokens) == 1:
        return "", tokens[0]
    return " ".join(tokens[:-1]), tokens[-1]


def _extract_speaker_from_header(text_value):
    matches = list(SPEAKER_LINE_RE.finditer(text_value))
    if not matches:
        return None
    match = matches[-1]
    raw_name = _collapse_whitespace(match.group(1))
    first_name, last_name = _split_person_name(raw_name)
    faction = _collapse_whitespace(match.group(2))
    return {
        "first_name": first_name,
        "last_name": last_name,
        "faction": faction,
        "speaker_external_id": None,
        "position_short": faction,
        "position_long": faction,
    }


def _extract_speaker_from_p(redner_paragraph):
    speaker = redner_paragraph.find("redner")
    if speaker is None:
        parsed = _extract_speaker_from_header(_get_text(redner_paragraph))
        return parsed

    name = speaker.find("name")
    if name is None:
        parsed = _extract_speaker_from_header(_get_text(redner_paragraph))
        if parsed is not None:
            parsed["speaker_external_id"] = speaker.get("id")
        return parsed

    first_name = _collapse_whitespace(name.findtext("vorname", default=""))
    last_name = _collapse_whitespace(name.findtext("nachname", default=""))
    faction = _collapse_whitespace(name.findtext("fraktion", default=""))

    role = name.find("rolle")
    role_long = ""
    if role is not None:
        role_long = _collapse_whitespace(role.findtext("rolle_lang", default=""))

    position_short = faction or role_long or "Mitglied des Bundestages"
    position_long = role_long or faction or "Mitglied des Bundestages"

    if not first_name and not last_name:
        parsed = _extract_speaker_from_header(_get_text(redner_paragraph))
        if parsed is not None:
            parsed["speaker_external_id"] = speaker.get("id")
            if not parsed["position_short"]:
                parsed["position_short"] = position_short
            if not parsed["position_long"]:
                parsed["position_long"] = position_long
            return parsed

    return {
        "first_name": first_name,
        "last_name": last_name,
        "faction": faction,
        "speaker_external_id": speaker.get("id"),
        "position_short": position_short,
        "position_long": position_long,
    }


def _parse_speeches_from_xml(xml_content):
    root = ET.fromstring(xml_content)
    speeches = []

    for rede in root.iter():
        if _tag_name(rede) != "rede":
            continue

        speaker_info = None
        paragraphs = []

        for child in rede:
            tag = _tag_name(child)
            if tag != "p":
                continue

            paragraph_text = _get_text(child)
            if not paragraph_text:
                continue

            if child.get("klasse") == "redner":
                parsed = _extract_speaker_from_p(child)
                if parsed is not None:
                    speaker_info = parsed
                continue

            paragraphs.append(paragraph_text)

        if not paragraphs:
            continue

        if speaker_info is None:
            speaker_info = {
                "first_name": "",
                "last_name": "",
                "faction": "",
                "speaker_external_id": None,
                "position_short": "Mitglied des Bundestages",
                "position_long": "Mitglied des Bundestages",
            }

        speeches.append(
            {
                "speaker": speaker_info,
                "speech_content": "\n\n".join(paragraphs),
            }
        )

    return speeches


def _build_reference_state(politicians, factions):
    person_by_key = {}
    person_by_external_id = {}
    faction_by_abbr = {}

    for _, row in politicians.iterrows() if hasattr(politicians, "iterrows") else []:
        pid = int(row["id"])
        key = _normalize_person_key(row.get("first_name", ""), row.get("last_name", ""))
        person_by_key.setdefault(key, pid)

    for _, row in factions.iterrows() if hasattr(factions, "iterrows") else []:
        abbr = _collapse_whitespace(row.get("abbreviation", ""))
        if abbr:
            faction_by_abbr.setdefault(abbr.lower(), int(row["id"]))

    next_politician_id = (
        int(politicians["id"].max()) + 1 if hasattr(politicians, "empty") and not politicians.empty else 1
    )
    next_faction_id = int(factions["id"].max()) + 1 if hasattr(factions, "empty") and not factions.empty else 1

    unknown_person_id = person_by_key.get(_normalize_person_key(UNKNOWN_FIRST_NAME, UNKNOWN_LAST_NAME))
    if unknown_person_id is None:
        unknown_person_id = next_politician_id
        next_politician_id += 1
        person_by_key[_normalize_person_key(UNKNOWN_FIRST_NAME, UNKNOWN_LAST_NAME)] = unknown_person_id

    unknown_faction_id = faction_by_abbr.get(UNKNOWN_FACTION.lower())
    if unknown_faction_id is None:
        unknown_faction_id = next_faction_id
        next_faction_id += 1
        faction_by_abbr[UNKNOWN_FACTION.lower()] = unknown_faction_id

    return {
        "person_by_key": person_by_key,
        "person_by_external_id": person_by_external_id,
        "faction_by_abbr": faction_by_abbr,
        "next_politician_id": next_politician_id,
        "next_faction_id": next_faction_id,
        "unknown_person_id": unknown_person_id,
        "unknown_faction_id": unknown_faction_id,
        "new_politicians": [],
        "new_factions": [],
    }


def _resolve_politician_id(speaker, ref_state):
    external_id = speaker.get("speaker_external_id")
    if external_id is not None:
        key = str(external_id)
        if key in ref_state["person_by_external_id"]:
            return ref_state["person_by_external_id"][key]

    first_name = _collapse_whitespace(speaker.get("first_name", ""))
    last_name = _collapse_whitespace(speaker.get("last_name", ""))

    if not first_name and not last_name:
        return ref_state["unknown_person_id"]

    person_key = _normalize_person_key(first_name, last_name)
    if person_key in ref_state["person_by_key"]:
        person_id = ref_state["person_by_key"][person_key]
    else:
        person_id = ref_state["next_politician_id"]
        ref_state["next_politician_id"] += 1
        ref_state["person_by_key"][person_key] = person_id
        ref_state["new_politicians"].append(
            {
                "id": person_id,
                "first_name": first_name,
                "last_name": last_name,
                "birth_place": None,
                "birth_country": None,
                "birth_date": None,
                "death_date": None,
                "gender": None,
                "profession": None,
                "aristocracy": None,
                "academic_title": None,
            }
        )

    if external_id is not None:
        ref_state["person_by_external_id"][str(external_id)] = person_id

    return person_id


def _clean_faction_abbreviation(raw_faction):
    faction = _collapse_whitespace(raw_faction)
    if not faction:
        return ""
    if faction.lower().startswith("fraktion "):
        faction = faction[9:].strip()
    return faction


def _resolve_faction_id(speaker, ref_state):
    faction = _clean_faction_abbreviation(speaker.get("faction", ""))
    if not faction:
        return ref_state["unknown_faction_id"]

    faction_key = faction.lower()
    if faction_key in ref_state["faction_by_abbr"]:
        return ref_state["faction_by_abbr"][faction_key]

    faction_id = ref_state["next_faction_id"]
    ref_state["next_faction_id"] += 1
    ref_state["faction_by_abbr"][faction_key] = faction_id
    ref_state["new_factions"].append({"id": faction_id, "abbreviation": faction, "full_name": faction})
    return faction_id


def _resolve_electoral_term(doc, date, electoral_terms):
    raw_term = doc.get("wahlperiode")
    if raw_term is not None:
        try:
            return int(raw_term)
        except (TypeError, ValueError):
            pass

    if date and hasattr(electoral_terms, "iterrows"):
        try:
            year = int(date[:4])
        except Exception:
            year = None
        if year is not None:
            for _, term in electoral_terms.iterrows():
                start_date = int(term["start_date"])
                end_date = int(term["end_date"]) if pd.notna(term["end_date"]) else None
                if start_date <= year and (end_date is None or year <= end_date):
                    return int(term["id"])
    return 1


def _resolve_session(doc, doc_id):
    protocol_number = _collapse_whitespace((doc.get("fundstelle", {}) or {}).get("plpr_nummer", ""))
    if protocol_number and "/" in protocol_number:
        maybe_session = protocol_number.split("/")[-1]
        try:
            return int(maybe_session)
        except ValueError:
            pass
    return doc_id


def build_rows(documents, politicians, factions, electoral_terms):
    rows = []
    seen_ids = set()
    xml_cache = {}
    ref_state = _build_reference_state(politicians, factions)

    for idx, doc in enumerate(documents, start=1):
        doc_id = int(doc.get("id", idx))
        if doc_id in seen_ids:
            continue
        seen_ids.add(doc_id)

        date = (doc.get("fundstelle", {}) or {}).get("datum") or doc.get("datum") or None
        electoral_term = _resolve_electoral_term(doc, date, electoral_terms)
        session_number = _resolve_session(doc, doc_id)
        xml_url = (doc.get("fundstelle", {}) or {}).get("xml_url")

        if not xml_url:
            continue

        if xml_url not in xml_cache:
            try:
                with urllib.request.urlopen(xml_url, timeout=60) as resp:
                    xml_cache[xml_url] = _parse_speeches_from_xml(resp.read())
            except Exception:
                xml_cache[xml_url] = []

        for speech_index, speech in enumerate(xml_cache[xml_url], start=1):
            speaker = speech["speaker"]
            politician_id = _resolve_politician_id(speaker, ref_state)
            faction_id = _resolve_faction_id(speaker, ref_state)

            first_name = _collapse_whitespace(speaker.get("first_name", ""))
            last_name = _collapse_whitespace(speaker.get("last_name", ""))
            if not first_name and not last_name:
                first_name = UNKNOWN_FIRST_NAME
                last_name = UNKNOWN_LAST_NAME

            speech_id = doc_id * 10000 + speech_index
            rows.append(
                {
                    "id": speech_id,
                    "session": session_number,
                    "electoral_term": electoral_term,
                    "first_name": first_name,
                    "last_name": last_name,
                    "politician_id": politician_id,
                    "speech_content": speech["speech_content"][:200000],
                    "faction_id": faction_id,
                    "document_url": (doc.get("fundstelle", {}) or {}).get("pdf_url") or "",
                    "position_short": _collapse_whitespace(speaker.get("position_short", "Mitglied des Bundestages"))
                    or "Mitglied des Bundestages",
                    "position_long": _collapse_whitespace(speaker.get("position_long", "Mitglied des Bundestages"))
                    or "Mitglied des Bundestages",
                    "date": date,
                }
            )

        if idx % 25 == 0:
            print(f"processed_protocols={idx} produced_speeches={len(rows)}")

    return rows, ref_state["new_politicians"], ref_state["new_factions"]


def import_rows(rows, new_politicians, new_factions, reset=False):
    if not rows:
        return 0

    with engine.begin() as conn:
        if reset:
            conn.execute(text("DELETE FROM open_discourse.speeches"))

        for faction in new_factions:
            conn.execute(
                text(
                    """
                    INSERT INTO open_discourse.factions (id, abbreviation, full_name)
                    VALUES (:id, :abbreviation, :full_name)
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                faction,
            )

        for politician in new_politicians:
            conn.execute(
                text(
                    """
                    INSERT INTO open_discourse.politicians (
                        id, first_name, last_name, birth_place, birth_country,
                        birth_date, death_date, gender, profession, aristocracy, academic_title
                    ) VALUES (
                        :id, :first_name, :last_name, :birth_place, :birth_country,
                        :birth_date, :death_date, :gender, :profession, :aristocracy, :academic_title
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                politician,
            )

        for idx, row in enumerate(rows, start=1):
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
            if idx % 250 == 0:
                print(f"inserted_rows={idx}")

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
    rows, new_politicians, new_factions = build_rows(documents, politicians, factions, electoral_terms)
    imported = import_rows(rows, new_politicians, new_factions, reset=args.reset)
    print("rows_to_import", len(rows))
    print("new_politicians", len(new_politicians))
    print("new_factions", len(new_factions))
    print("imported", imported)
