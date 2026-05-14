# Scaffolding Generators

Use `scripts/generate.py` for approved task-tracking scaffolds.

```bash
python3 scripts/generate.py --help
python3 scripts/generate.py task-run T-001 --slug integrate-task-tracking --dry-run
python3 scripts/generate.py task-draft T-999 --title "Example task" --slug example --dry-run
```

The generator creates process artifacts only. It reads task state when needed
but does not update the task ledger.
