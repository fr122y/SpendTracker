#!/usr/bin/env python3
"""Validate the local task tracking ledger.

`docs/planning/tasks.yml` intentionally uses JSON-compatible YAML so this
script can run with the Python standard library in local shells and CI.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TASKS_PATH = ROOT / "docs/planning/tasks.yml"
STATUS_PATH = ROOT / "docs/planning/STATUS.md"
TASKS_MD_PATH = ROOT / "docs/planning/tasks.md"
CURRENT_SPRINT_PATH = ROOT / "docs/planning/current-sprint.md"
BACKLOG_PATH = ROOT / "docs/planning/backlog.md"
TASK_RUNS_DIR = ROOT / "docs/planning/task-runs"

TASK_ID_RE = re.compile(r"\bT-\d{3}\b")
STATUS_VALUES = {
    "captured",
    "backlog",
    "ready",
    "in_progress",
    "review",
    "done",
    "blocked",
    "parked",
    "superseded",
}
REQUIRED_TASK_FIELDS = {
    "id",
    "title",
    "status",
    "phase",
    "type",
    "priority",
    "github_issue",
    "branch",
    "detail",
    "depends_on",
    "blocks",
    "parallel",
    "owner_mode",
    "human_gate",
    "write_scope",
    "required_context",
    "acceptance",
    "next_action",
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def load_ledger() -> dict[str, Any]:
    try:
        data = json.loads(read_text(TASKS_PATH))
    except Exception as exc:  # noqa: BLE001 - report readable validation errors
        raise ValueError(f"Cannot parse {TASKS_PATH}: {exc}") from exc

    if not isinstance(data, dict):
        raise ValueError("Task ledger must be a JSON/YAML object.")
    if "tasks" not in data or not isinstance(data["tasks"], list):
        raise ValueError("Task ledger must contain a tasks list.")
    return data


def collect_task_refs(path: Path) -> set[str]:
    if not path.exists():
        return set()
    return set(TASK_ID_RE.findall(read_text(path)))


def path_exists_or_glob(scope: str) -> bool:
    if scope.startswith("GitHub issue"):
        return True
    if "*" in scope:
        base = scope.split("*", 1)[0].rstrip("/")
        return not base or (ROOT / base).exists()
    return (ROOT / scope).exists()


def validate_ledger(data: dict[str, Any], errors: list[str]) -> dict[str, dict[str, Any]]:
    tasks_by_id: dict[str, dict[str, Any]] = {}

    for index, task in enumerate(data["tasks"]):
        if not isinstance(task, dict):
            errors.append(f"Task at index {index} is not an object.")
            continue

        missing = REQUIRED_TASK_FIELDS - set(task)
        if missing:
            errors.append(f"{task.get('id', f'index {index}')} missing fields: {sorted(missing)}")

        task_id = task.get("id")
        if not isinstance(task_id, str) or not TASK_ID_RE.fullmatch(task_id):
            errors.append(f"Task at index {index} has invalid id: {task_id!r}")
            continue
        if task_id in tasks_by_id:
            errors.append(f"Duplicate task id: {task_id}")
        tasks_by_id[task_id] = task

        status = task.get("status")
        if status not in STATUS_VALUES:
            errors.append(f"{task_id} has invalid status: {status!r}")

        for list_field in ("depends_on", "blocks", "write_scope", "required_context", "acceptance"):
            if not isinstance(task.get(list_field), list):
                errors.append(f"{task_id}.{list_field} must be a list.")

        if status in {"ready", "in_progress", "review"}:
            if not task.get("acceptance"):
                errors.append(f"{task_id} is {status} but has no acceptance criteria.")
            if not task.get("required_context"):
                errors.append(f"{task_id} is {status} but has no required context.")
            if not task.get("write_scope"):
                errors.append(f"{task_id} is {status} but has no write scope.")

        if status == "in_progress" and not task.get("branch"):
            errors.append(f"{task_id} is in_progress but has no branch.")

        if status == "superseded" and not task.get("superseded_by"):
            errors.append(f"{task_id} is superseded but has no superseded_by target.")

        for context_path in task.get("required_context", []):
            if not isinstance(context_path, str) or not (ROOT / context_path).exists():
                errors.append(f"{task_id} required_context does not exist: {context_path!r}")

        for scope in task.get("write_scope", []):
            if not isinstance(scope, str) or not path_exists_or_glob(scope):
                errors.append(f"{task_id} write_scope base does not exist: {scope!r}")

    for task_id, task in tasks_by_id.items():
        for field in ("depends_on", "blocks"):
            for ref in task.get(field, []):
                if ref not in tasks_by_id:
                    errors.append(f"{task_id}.{field} references unknown task {ref}")
        if task.get("status") == "ready":
            for ref in task.get("depends_on", []):
                dependency = tasks_by_id.get(ref)
                if dependency and dependency.get("status") != "done":
                    errors.append(
                        f"{task_id} is ready but depends on {ref}, "
                        f"which is {dependency.get('status')!r}."
                    )
        superseded_by = task.get("superseded_by")
        if superseded_by and superseded_by not in tasks_by_id:
            errors.append(f"{task_id}.superseded_by references unknown task {superseded_by}")

    return tasks_by_id


def validate_markdown_refs(tasks_by_id: dict[str, dict[str, Any]], errors: list[str]) -> None:
    known_ids = set(tasks_by_id)
    for path in (STATUS_PATH, TASKS_MD_PATH, CURRENT_SPRINT_PATH, BACKLOG_PATH):
        if not path.exists():
            errors.append(f"Missing planning file: {path.relative_to(ROOT)}")
            continue
        unknown = collect_task_refs(path) - known_ids
        for ref in sorted(unknown):
            errors.append(f"{path.relative_to(ROOT)} references unknown task {ref}")

    backlog = read_text(BACKLOG_PATH)
    for line_number, line in enumerate(backlog.splitlines(), start=1):
        if line.startswith("### ") and not TASK_ID_RE.search(line):
            errors.append(
                f"Structured backlog heading must include a task ID at "
                f"{BACKLOG_PATH.relative_to(ROOT)}:{line_number}: {line}"
            )


def validate_task_runs(tasks_by_id: dict[str, dict[str, Any]], errors: list[str]) -> None:
    if not TASK_RUNS_DIR.exists():
        errors.append("Missing task-runs directory.")
        return

    for path in sorted(TASK_RUNS_DIR.glob("T-*.md")):
        refs = TASK_ID_RE.findall(path.name)
        if not refs:
            errors.append(f"Task-run filename has no task ID: {path.name}")
            continue
        task_id = refs[0]
        if task_id not in tasks_by_id:
            errors.append(f"Task-run filename references unknown task {task_id}: {path.name}")
        content_refs = collect_task_refs(path)
        if task_id not in content_refs:
            errors.append(f"Task-run report does not mention its task ID {task_id}: {path.name}")


def main() -> int:
    errors: list[str] = []

    try:
        data = load_ledger()
    except ValueError as exc:
        print(f"Task tracker validation failed:\n- {exc}", file=sys.stderr)
        return 1

    declared_statuses = set(data.get("status_values", []))
    if declared_statuses and declared_statuses != STATUS_VALUES:
        errors.append("status_values in tasks.yml does not match validator status set.")

    tasks_by_id = validate_ledger(data, errors)
    validate_markdown_refs(tasks_by_id, errors)
    validate_task_runs(tasks_by_id, errors)

    if errors:
        print("Task tracker validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Task tracker validation passed: {len(tasks_by_id)} tasks.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
