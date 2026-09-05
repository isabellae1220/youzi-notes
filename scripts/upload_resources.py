from __future__ import annotations

import json
import math
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
SOURCE = Path(os.environ.get("YUZU_RESOURCE_SOURCE", str(Path.home() / "开源资料_处理后待确认")))
CATALOG = PROJECT / "content" / "catalog.generated.json"
PART_SIZE = 16 * 1024 * 1024


def request(url: str, token: str, method: str, body: bytes | None = None, content_type: str | None = None):
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "Mozilla/5.0 (compatible; YuzuNotesUploader/1.0)",
    }
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=300) as response:
        data = response.read()
        return response.status, response.headers, json.loads(data) if data else None


def public_url(base_url: str, key: str) -> str:
    return f"{base_url}/files/{urllib.parse.quote(key, safe='/')}"


def upload_url(base_url: str, key: str, **params: object) -> str:
    query = urllib.parse.urlencode(params)
    return f"{base_url}/__resource-upload/{urllib.parse.quote(key, safe='/')}?{query}"


def already_uploaded(base_url: str, item: dict[str, object]) -> bool:
    req = urllib.request.Request(
        public_url(base_url, str(item["objectKey"])),
        method="HEAD",
        headers={"User-Agent": "Mozilla/5.0 (compatible; YuzuNotesUploader/1.0)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.headers.get("x-content-sha256") == item["sha256"]
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return False
        raise


def upload_one(base_url: str, token: str, item: dict[str, object]) -> str:
    relative = Path(str(item["sourceRelativePath"]))
    path = SOURCE / relative
    key = str(item["objectKey"])
    if already_uploaded(base_url, item):
        return f"skipped {relative}"

    create_body = json.dumps({"fileName": item["fileName"], "sha256": item["sha256"]}).encode()
    _, _, created = request(
        upload_url(base_url, key, action="create"), token, "POST", create_body, "application/json"
    )
    upload_id = created["uploadId"]
    parts = []
    try:
        with path.open("rb") as stream:
            for part_number in range(1, math.ceil(path.stat().st_size / PART_SIZE) + 1):
                chunk = stream.read(PART_SIZE)
                _, _, part = request(
                    upload_url(base_url, key, action="part", uploadId=upload_id, partNumber=part_number),
                    token,
                    "PUT",
                    chunk,
                    "application/octet-stream",
                )
                parts.append(part)
        complete_body = json.dumps({"parts": parts}).encode()
        request(
            upload_url(base_url, key, action="complete", uploadId=upload_id),
            token,
            "POST",
            complete_body,
            "application/json",
        )
    except Exception:
        try:
            request(upload_url(base_url, key, action="abort", uploadId=upload_id), token, "DELETE")
        except Exception:
            pass
        raise
    return f"uploaded {relative}"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: upload_resources.py https://site.example")
    token = os.environ.get("YUZU_UPLOAD_TOKEN")
    if not token:
        raise SystemExit("YUZU_UPLOAD_TOKEN is required")
    base_url = sys.argv[1].rstrip("/")
    items = json.loads(CATALOG.read_text(encoding="utf-8"))["resources"]
    completed = 0
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(upload_one, base_url, token, item): item for item in items}
        for future in as_completed(futures):
            print(future.result(), flush=True)
            completed += 1
            print(f"progress {completed}/{len(items)}", flush=True)


if __name__ == "__main__":
    main()
