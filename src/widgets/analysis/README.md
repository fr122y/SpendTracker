# Analysis Widget

Provides spending analysis with category breakdown for the current view month
and visible-expense scope switching.

## Public API (`index.ts`)

- `AnalysisDashboard`: Visual grid of category boxes showing spending distribution

## State & Data

- `useSessionStore`: selectedDate as the source month for analysis
- `useExpenseStore`: visible expenses list for aggregation
- Local scope state: all visible, personal, or shared expenses

## Features

- Header with month name and total spent
- Local `Все` / `Личные` / `Общие` expense scope filter
- Visual category boxes with size/opacity scaling
- Hover tooltip showing exact personal, shared, project, and total amounts
- Activating a category opens a read-only dialog for the same month and scope
- Dialog rows preserve source descriptions and amounts and are grouped by date, newest first
- Description variants are grouped for local name chips; multiple selections use OR and update count/sum
- Empty state when no data

Category details reuse the loaded expense list and existing month/scope selector.
Project-linked expenses remain included in `Личные`; transfers and project
movements remain excluded. Description groups are computed for the current
category/month/scope only; they do not change stored expense records.

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/shared/lib`
