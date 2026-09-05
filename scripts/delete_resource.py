from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path


CATALOG = Path(__file__).resolve().parents[1] / "content" / "catalog.generated.json"


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: delete_resource.py https://site.example 'course/file.pdf'")
    token = os.environ.get("YUZU_UPLOAD_TOKEN")
    if not token:
        raise SystemExit("YUZU_UPLOAD_TOKEN is required")

    base_url = sys.argv[1].rstrip("/")
    relative_path = sys.argv[2]
    resources = json.loads(CATALOG.read_text(encoding="utf-8"))["resources"]
    matches = [item for item in resources if item["sourceRelativePath"] == relative_path]
    if len(matches) != 1:
        raise SystemExit(f"Expected one catalog match, found {len(matches)}")

    key = matches[0]["objectKey"]
    url = (
        f"{base_url}/__resource-upload/{urllib.parse.quote(key, safe='/')}"
        "?action=delete"
    )
    request = urllib.request.Request(
        url,
        method="DELETE",
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0 (compatible; YuzuNotesUploader/1.0)",
        },
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        if response.status != 204:
            raise SystemExit(f"Unexpected status: {response.status}")
    print(f"deleted {relative_path}")


if __name__ == "__main__":
    main()
