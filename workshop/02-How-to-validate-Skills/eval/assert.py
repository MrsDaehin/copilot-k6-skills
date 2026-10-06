#!/usr/bin/env python3
"""Structural assertions for the k6-test-suite skill eval.

Python equivalent of assert.ps1 (dirs, files, executor, tags, Prometheus RW).
Exits with the number of failed assertions.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

CYAN = "\033[36m"
GREEN = "\033[32m"
RED = "\033[31m"
RESET = "\033[0m"

_COLOR = sys.stdout.isatty()

REQUIRED_PATHS = (
    "configs",
    "constants",
    "shared",
    "tests",
    "workloads",
    "Makefile",
    "configs/smoke.json",
    "configs/load.json",
    "workloads/smoke.js",
    "workloads/load.js",
)

failures = 0


def info(message: str) -> None:
    print(f"{CYAN}{message}{RESET}" if _COLOR else message)


def ok(message: str) -> None:
    print(f"{GREEN}  OK: {message}{RESET}" if _COLOR else f"  OK: {message}")


def fail(message: str) -> None:
    """Report a failed assertion on stderr, mirroring Write-Error."""
    global failures
    failures += 1
    text = f"{RED}{message}{RESET}" if _COLOR else message
    print(text, file=sys.stderr)


def check_required_paths(root: Path) -> None:
    info(f"Checking required paths in {root}")
    for name in REQUIRED_PATHS:
        if (root / name).exists():
            ok(name)
        else:
            fail(f"MISSING: {name}")


def check_load_json(root: Path) -> None:
    load_json = root / "configs" / "load.json"
    if not load_json.is_file():
        return
    try:
        data = json.loads(load_json.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        fail(f"Failed to parse configs/load.json: {exc}")
        return
    scenarios = data.get("scenarios") or {}
    if any(
        scenario.get("executor") == "ramping-arrival-rate"
        for scenario in scenarios.values()
        if isinstance(scenario, dict)
    ):
        ok("load.json uses ramping-arrival-rate")
    else:
        fail("configs/load.json missing executor 'ramping-arrival-rate'")


def check_workload_tags(root: Path) -> None:
    workloads_dir = root / "workloads"
    if not workloads_dir.is_dir():
        return
    js_files = sorted(workloads_dir.glob("*.js"))
    untagged = []
    for js_file in js_files:
        try:
            content = js_file.read_text(encoding="utf-8")
        except OSError:
            content = ""
        if not re.search("operation", content, re.IGNORECASE):
            untagged.append(js_file.name)
    if not js_files or untagged:
        fail("Missing 'operation' tag in workloads/*.js")
    else:
        ok("workloads contain 'operation' tags")


def check_makefile(root: Path) -> None:
    makefile = root / "Makefile"
    if not makefile.is_file():
        return
    try:
        content = makefile.read_text(encoding="utf-8")
    except OSError as exc:
        fail(f"Failed to read Makefile: {exc}")
        return
    if re.search("experimental-prometheus-rw", content, re.IGNORECASE):
        ok("Makefile includes experimental-prometheus-rw")
    else:
        fail("Makefile missing 'experimental-prometheus-rw'")
    if re.search(re.escape("http://localhost:9090/api/v1/write"), content, re.IGNORECASE):
        ok("Makefile includes Prometheus RW URL")
    else:
        fail("Makefile missing Prometheus RW URL")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Structural assertions for the k6-test-suite skill output."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Generated project directory to check (default: current directory)",
    )
    args = parser.parse_args(argv)

    # Keep stdout and stderr interleaved in the same order as assert.ps1 when piped.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)

    root = Path(args.path).expanduser().resolve()
    check_required_paths(root)
    check_load_json(root)
    check_workload_tags(root)
    check_makefile(root)

    if failures == 0:
        print(f"\n{GREEN}All assertions PASSED{RESET}" if _COLOR else "\nAll assertions PASSED")
    else:
        print(
            f"\n{RED}{failures} assertion(s) FAILED{RESET}" if _COLOR else f"\n{failures} assertion(s) FAILED"
        )
    return failures


if __name__ == "__main__":
    sys.exit(main())
