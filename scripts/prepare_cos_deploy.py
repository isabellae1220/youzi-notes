from __future__ import annotations

import hashlib
import json
import os
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "content" / "catalog.generated.json"
SITE_OUTPUT = ROOT / "out"
DESTINATION = ROOT / "cos-deploy"
SOURCE = Path(os.environ.get("YUZU_RESOURCE_SOURCE", str(Path.home() / "开源资料_处理后待确认")))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    if not (SITE_OUTPUT / "index.html").is_file() or not (SITE_OUTPUT / "404.html").is_file():
        raise SystemExit("Static export is missing. Run npm run build:cos first.")

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    resources = catalog["resources"]
    seen_keys: set[str] = set()

    if DESTINATION.exists():
        shutil.rmtree(DESTINATION)
    shutil.copytree(SITE_OUTPUT, DESTINATION)

    manifest = []
    for resource in resources:
        key = resource["objectKey"]
        if key in seen_keys:
            raise SystemExit(f"Duplicate object key: {key}")
        seen_keys.add(key)

        source = SOURCE / resource["sourceRelativePath"]
        if not source.is_file():
            raise SystemExit(f"Missing source PDF: {source}")
        if source.stat().st_size != resource["size"]:
            raise SystemExit(f"Size mismatch: {source}")
        if sha256(source) != resource["sha256"]:
            raise SystemExit(f"SHA-256 mismatch: {source}")

        target = DESTINATION / "files" / key
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        manifest.append({
            "key": f"files/{key}",
            "size": resource["size"],
            "sha256": resource["sha256"],
            "contentType": "application/pdf",
        })

    manifest_path = ROOT / "work" / "cos-resource-manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps({"resourceCount": len(manifest), "resources": manifest}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    copied = list((DESTINATION / "files" / "resources").rglob("*.pdf"))
    if len(copied) != len(resources):
        raise SystemExit(f"Expected {len(resources)} PDFs, found {len(copied)}")

    total = sum(item["size"] for item in manifest)
    print(f"site={DESTINATION}")
    print(f"resources={len(manifest)} bytes={total}")


if __name__ == "__main__":
    main()
