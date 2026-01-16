# Shared UI

Reusable "dumb" UI components without business logic.

## Public API (`index.ts`)

- `Button`: Styled button with variants
- `Input`: Form input component
- `Card`: Container card component
- `Badge`: Label/tag component
- `Modal`: Dialog/modal component
- `ProgressBar`: Progress indicator

## Components

### Button

```tsx
<Button variant="primary" size="md" onClick={...}>
  Label
</Button>
```

### Input

```tsx
<Input
  type="text"
  placeholder="..."
  value={value}
  onChange={...}
/>
```

### Card

```tsx
<Card title="Card Title">Content</Card>
```

## Design System

- All components use Tailwind CSS v4
- Dark theme ("Terminal" aesthetic)
- Russian language labels where applicable
