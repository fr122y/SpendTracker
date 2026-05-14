# 0001. Record Project Decisions

Date: 2026-05-14

## Status

Accepted

## Context

SmartSpend Tracker needs durable records for project decisions that affect
architecture, workflow, data model, testing strategy, or long-term maintenance.

## Decision

Use lightweight ADRs in `docs/decisions/`. Each meaningful accepted decision
gets its own numbered Markdown file with context, decision, and consequences.

## Consequences

- Important decisions are discoverable without scanning chat history.
- Follow-up work can reference decision files from the task ledger.
- Small implementation details do not need ADRs.
