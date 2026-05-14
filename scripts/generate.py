#!/usr/bin/env python3
"""Generate approved project scaffolding artifacts.

The generator intentionally creates only approved process artifacts. It reads
the task ledger when needed, but never updates project state.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TASKS_PATH = ROOT / "docs/planning/tasks.yml"
TASK_RUNS_DIR = ROOT / "docs/planning/task-runs"
TASK_DRAFTS_DIR = ROOT / "docs/planning/task-drafts"

TASK_ID_RE = re.compile(r"^T-\d{3}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def load_tasks() -> dict[str, dict[str, Any]]:
    try:
        data = json.loads(read_text(TASKS_PATH))
    except Exception as exc:  # noqa: BLE001 - produce CLI-friendly error
        raise SystemExit(f"Cannot parse {TASKS_PATH.relative_to(ROOT)}: {exc}") from exc

    tasks = data.get("tasks", [])
    if not isinstance(tasks, list):
        raise SystemExit("Task ledger is missing a tasks list.")

    result: dict[str, dict[str, Any]] = {}
    for task in tasks:
        if not isinstance(task, dict):
            continue
        task_id = task.get("id")
        if isinstance(task_id, str):
            result[task_id] = task
    return result


def validate_task_id(task_id: str) -> None:
    if not TASK_ID_RE.fullmatch(task_id):
        raise SystemExit(f"Invalid task ID {task_id!r}. Expected format: T-000.")


def validate_slug(slug: str) -> None:
    if not SLUG_RE.fullmatch(slug):
        raise SystemExit(
            f"Invalid slug {slug!r}. Use lowercase letters, numbers, and hyphens."
        )


def validate_date(value: str) -> None:
    if not DATE_RE.fullmatch(value):
        raise SystemExit(f"Invalid date {value!r}. Expected format: YYYY-MM-DD.")
    try:
        date.fromisoformat(value)
    except ValueError as exc:
        raise SystemExit(f"Invalid date {value!r}.") from exc


def write_or_print(path: Path, content: str, dry_run: bool) -> None:
    relative = path.relative_to(ROOT)

    if path.exists():
        action = "Would refuse to overwrite" if dry_run else "Refusing to overwrite"
        raise SystemExit(f"{action} existing file: {relative}")

    if dry_run:
        print(f"Would create: {relative}")
        print()
        print(content, end="")
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"Created: {relative}")


def issue_text(value: Any) -> str:
    if value is None:
        return "#TBD"
    return f"#{value}"


def render_task_run(args: argparse.Namespace, task: dict[str, Any]) -> tuple[Path, str]:
    report_date = args.date or date.today().isoformat()
    validate_date(report_date)

    title = args.title or task.get("title") or "TBD"
    branch = args.branch or task.get("branch") or "TBD"
    issue = args.issue if args.issue is not None else task.get("github_issue")

    path = TASK_RUNS_DIR / f"{args.task_id}-{report_date}-{args.slug}.md"
    content = f"""# Task Run: {args.task_id} {title}

Date: {report_date}

Branch: `{branch}`

Issue: {issue_text(issue)}

PR: TBD

## Summary

TBD

## Scope

- Planned:
- Out of scope:
- Write scope:

## Changes

- TBD

## Files Touched

- TBD

## Verification

- Checks run:
- Result:
- Not run:

## Review Checkpoint

- Scope checked:
- Acceptance criteria checked:
- Regression risk checked:
- Tracker consistency checked:
- Docs checked:
- CI or PR status:

## Follow-Ups

- TBD

## Open Questions

- TBD

## Registry Update Requested

- TBD
"""
    return path, content


def render_task_draft(args: argparse.Namespace) -> tuple[Path, str]:
    path = TASK_DRAFTS_DIR / f"{args.task_id}-{args.slug}.md"
    content = f"""# Task Draft: {args.task_id} {args.title}

## Goal

TBD

## Context

TBD

## Related Docs

- TBD

## Requirements

- TBD

## Out Of Scope

- TBD

## Acceptance Criteria

- TBD

## Ledger Fields To Decide

- Status:
- Phase:
- Type:
- Priority:
- GitHub issue:
- Depends on:
- Blocks:
- Parallel:
- Owner mode:
- Human gate:
- Write scope:
- Required context:
- Next action:

## Open Questions

- TBD

## Promotion Checklist

- [ ] Human owner approved the scope.
- [ ] Task is added to `docs/planning/tasks.yml`.
- [ ] Human-readable entry is added to `docs/planning/tasks.md`.
- [ ] GitHub issue is created or intentionally skipped.
- [ ] Sprint/status docs are updated if the task affects current focus.
- [ ] Tracker validation passes after promotion.
"""
    return path, content


def generate_task_run(args: argparse.Namespace) -> int:
    validate_task_id(args.task_id)
    validate_slug(args.slug)

    tasks = load_tasks()
    task = tasks.get(args.task_id)
    if task is None:
        raise SystemExit(f"{args.task_id} is not registered in docs/planning/tasks.yml.")

    path, content = render_task_run(args, task)
    write_or_print(path, content, args.dry_run)
    return 0


def generate_task_draft(args: argparse.Namespace) -> int:
    validate_task_id(args.task_id)
    validate_slug(args.slug)

    tasks = load_tasks()
    if args.task_id in tasks:
        raise SystemExit(
            f"{args.task_id} already exists in docs/planning/tasks.yml. "
            "Use the task-tracking workflow to edit registered tasks."
        )

    path, content = render_task_draft(args)
    write_or_print(path, content, args.dry_run)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate approved project task-tracking scaffolds."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    task_run = subparsers.add_parser(
        "task-run", help="Create a task-run report for an existing task."
    )
    task_run.add_argument("task_id", help="Existing task ID, such as T-001.")
    task_run.add_argument("--slug", required=True, help="Filename slug.")
    task_run.add_argument("--date", help="Report date in YYYY-MM-DD format.")
    task_run.add_argument("--title", help="Override title from the task ledger.")
    task_run.add_argument("--branch", help="Override branch from the task ledger.")
    task_run.add_argument("--issue", type=int, help="Override GitHub issue number.")
    task_run.add_argument(
        "--dry-run", action="store_true", help="Print output without writing a file."
    )
    task_run.set_defaults(func=generate_task_run)

    task_draft = subparsers.add_parser(
        "task-draft", help="Create a pre-ledger task draft."
    )
    task_draft.add_argument("task_id", help="Unregistered task ID, such as T-999.")
    task_draft.add_argument("--title", required=True, help="Draft task title.")
    task_draft.add_argument("--slug", required=True, help="Filename slug.")
    task_draft.add_argument(
        "--dry-run", action="store_true", help="Print output without writing a file."
    )
    task_draft.set_defaults(func=generate_task_draft)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
