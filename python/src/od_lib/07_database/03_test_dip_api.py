import json
import os
import urllib.request
import urllib.parse
from pathlib import Path


API_KEY = os.environ.get("DIP_API_KEY", "R2BZaee.DjdCyihKZMf8AOjtScubP2EVydegzjmBIQ")
OUTPUT_PATH = Path(__file__).resolve().parent / "dip_api_test_output.json"


def fetch_plenarprotokoll_texts(limit=5):
    url = "https://search.dip.bundestag.de/api/v1/plenarprotokoll-text"
    params = {
        "f.zuordnung": "BT",
        "f.datum.start": "2021-01-01",
        "apikey": API_KEY,
    }
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params))

    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8")

    payload = json.loads(body)
    documents = payload.get("documents", [])[:limit]

    result = {
        "numFound": payload.get("numFound"),
        "documents": documents,
    }

    OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result


if __name__ == "__main__":
    result = fetch_plenarprotokoll_texts(limit=3)
    print("numFound:", result["numFound"])
    print("saved_to:", OUTPUT_PATH)
    if result["documents"]:
        doc = result["documents"][0]
        print("sample_keys:", sorted(doc.keys())[:20])
        print("sample_title:", doc.get("titel"))
        print("sample_text_length:", len(doc.get("text", "")))
