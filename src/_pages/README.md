# Pages Layer

Contains page-level compositions that combine widgets and features into full page views.

## Slices

- `dashboard/` - Main dashboard page with expense tracking interface

## Architecture Rules

1. Pages import only from widgets, features, and shared layers
2. Pages are responsible for page-level layout and composition
3. Each page must have a public API via `index.ts`
