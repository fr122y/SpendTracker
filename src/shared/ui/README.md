# Shared UI

Reusable "dumb" UI components without business logic.

## Public API (`index.ts`)

- `Button`: Styled button with variants (primary, ghost, danger)
- `Input`: Form input with label and error support
- `TerminalPanel`: Container for widgets with header and edit mode
- `ProgressBar`: Visual indicator with color transitions

## Components

### Button

```tsx
<Button variant="primary" onClick={handleClick}>
  Primary Button
</Button>

<Button variant="ghost">Ghost Button</Button>

<Button variant="danger" isLoading>
  Loading...
</Button>
```

**Props:**

- `variant`: "primary" | "ghost" | "danger"
- `isLoading`: Shows spinner and disables button

### Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter email..."
  error={errors.email}
/>
```

**Props:**

- `label`: Optional label text
- `error`: Error message to display

### TerminalPanel

```tsx
<TerminalPanel
  title="Expenses"
  icon={<WalletIcon />}
  isEditMode={editing}
  onDelete={handleDelete}
>
  Content here
</TerminalPanel>
```

**Props:**

- `title`: Panel title (required)
- `icon`: Optional icon element
- `isEditMode`: Shows delete button when true
- `onDelete`: Delete handler

### ProgressBar

```tsx
<ProgressBar value={spent} max={budget} label="Weekly Budget" showPercentage />
```

**Props:**

- `value`: Current value
- `max`: Maximum value
- `label`: Optional label
- `showPercentage`: Show percentage text

**Color Transitions:**

- Green (0-50%): Under budget
- Yellow (50-80%): Warning
- Red (80-100%): Over budget

## Design System

- Tailwind CSS v4 styling
- Dark theme ("Terminal" aesthetic)
- Glassmorphism effects on panels
- Emerald accent color
- All components support ref forwarding
