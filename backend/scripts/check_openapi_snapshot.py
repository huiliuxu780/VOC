from __future__ import annotations

import argparse
import difflib
import json
import sys
from pathlib import Path


def resolve_repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_app_openapi() -> dict:
    try:
        from app.main import app
    except ModuleNotFoundError:
        backend_root = resolve_repo_root() / "backend"
        sys.path.insert(0, str(backend_root))
        from app.main import app
    return app.openapi()


def normalize_json_text(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def read_normalized_json(path: Path) -> str:
    data = json.loads(path.read_text(encoding="utf-8"))
    return normalize_json_text(data)


def main() -> int:
    repo_root = resolve_repo_root()
    default_baseline = repo_root / "backend" / "contracts" / "openapi.snapshot.json"
    default_current = repo_root / "backend" / "contracts" / "openapi.current.json"

    parser = argparse.ArgumentParser(description="Check FastAPI OpenAPI snapshot drift.")
    parser.add_argument("--baseline", type=Path, default=default_baseline, help="Path to OpenAPI baseline snapshot JSON.")
    parser.add_argument(
        "--current-out",
        type=Path,
        default=default_current,
        help="Path to write current normalized OpenAPI JSON for inspection/artifact.",
    )
    parser.add_argument("--update", action="store_true", help="Overwrite baseline with current schema.")
    args = parser.parse_args()

    baseline_path: Path = args.baseline if args.baseline.is_absolute() else (repo_root / args.baseline)
    current_out_path: Path = args.current_out if args.current_out.is_absolute() else (repo_root / args.current_out)

    current_text = normalize_json_text(load_app_openapi())
    current_out_path.parent.mkdir(parents=True, exist_ok=True)
    current_out_path.write_text(current_text, encoding="utf-8")

    if args.update:
        baseline_path.parent.mkdir(parents=True, exist_ok=True)
        baseline_path.write_text(current_text, encoding="utf-8")
        print(f"[OPENAPI] baseline updated: {baseline_path}")
        return 0

    if not baseline_path.exists():
        print(f"[OPENAPI] baseline not found: {baseline_path}")
        print("[OPENAPI] run with --update to create baseline snapshot.")
        return 2

    baseline_text = read_normalized_json(baseline_path)
    if baseline_text == current_text:
        print("[OPENAPI] snapshot check passed (no schema drift).")
        print(f"[OPENAPI] baseline: {baseline_path}")
        print(f"[OPENAPI] current : {current_out_path}")
        return 0

    diff_lines = list(
        difflib.unified_diff(
            baseline_text.splitlines(),
            current_text.splitlines(),
            fromfile=str(baseline_path),
            tofile=str(current_out_path),
            lineterm="",
        )
    )
    print("[OPENAPI] schema drift detected. Diff:")
    for line in diff_lines:
        print(line)
    print("")
    print("[OPENAPI] if this drift is intentional, run:")
    print(f"python backend/scripts/check_openapi_snapshot.py --update --baseline {baseline_path}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
