# Shared UI

Reusable "dumb" UI components without business logic.

## Public API (`index.ts`)

- `Button`: Styled button with variants (primary, ghost, danger)
- `Input`: Form input with label and error support
- `Select`: Dropdown select with options
- `TerminalPanel`: Container for widgets with header and edit mode
- `ProgressBar`: Visual indicator with over-budget detection

## Design System - "Terminal" Aesthetic

### Palette

- **Background:** `bg-zinc-950` (Deep dark)
- **Surface:** `bg-zinc-900/30` (Glassy)
- **Borders:** `border-zinc-800`
- **Text Primary:** `text-zinc-200`
- **Text Secondary:** `text-zinc-400`
- **Accents:**
  - `blue-500` (Main/Primary)
  - `emerald-500` (Income)
  - `amber-500` (Events)
  - `red-500` (Expense/Danger)

### Typography

- **UI Text:** `font-sans` (Inter)
- **Numbers/Data:** `font-mono` (JetBrains Mono)
- **Headers:** `uppercase tracking-wider font-bold`

## Components

### Button

```tsx
<Button variant="primary" onClick={handleClick}>
  Добавить
</Button>

<Button variant="ghost">Отмена</Button>

<Button variant="danger" isLoading>
  Удалить...
</Button>
```

**Props:**

- `variant`: "primary" | "ghost" | "danger"
- `isLoading`: Shows spinner and disables button

**Styling:**

- Base: `font-bold uppercase text-xs tracking-wider px-4 py-2 rounded`
- Primary: `bg-blue-600 hover:bg-blue-500 text-white`
- Ghost: `bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white`
- Danger: `text-red-400 hover:bg-red-500/10`

### Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="Введите email..."
  error={errors.email}
/>
```

**Props:**

- `label`: Optional label text
- `error`: Error message to display

**Styling:**

- `bg-zinc-900 border border-zinc-700 rounded`
- Focus: `ring-1 ring-blue-500 outline-none`
- Placeholder: `text-zinc-600`

### Select

```tsx
<Select
  label="Категория"
  options={[
    { value: 'food', label: 'Еда' },
    { value: 'transport', label: 'Транспорт' },
  ]}
  placeholder="Выберите категорию"
  error={errors.category}
/>
```

**Props:**

- `label`: Optional label text
- `options`: Array of `{ value, label }` objects
- `placeholder`: Placeholder text
- `error`: Error message to display

**Styling:**

- Same as Input with custom chevron indicator

### TerminalPanel

```tsx
<TerminalPanel
  title="Расходы"
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
- `isEditMode`: Shows delete button, dashed border, grayscale content
- `onDelete`: Delete handler

**Styling:**

- Container: `border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm shadow-lg rounded-md`
- Header: `border-b border-zinc-800/50 p-3`
- Content: `p-4`
- Edit Mode: `border-2 border-blue-500/50 border-dashed` + content `grayscale`

### ProgressBar

```tsx
<ProgressBar
  value={spent}
  max={budget}
  label="Недельный бюджет"
  showPercentage
/>
```

**Props:**

- `value`: Current value
- `max`: Maximum value
- `label`: Optional label
- `showPercentage`: Show percentage text

**Color Logic:**

- Normal: `bg-blue-500`
- Over budget (value > max): `bg-red-500`

**Styling:**

- Track: `h-2 bg-zinc-800 rounded-full overflow-hidden`
- Fill: `h-full transition-all duration-500 ease-out`

## Dependencies

- Uses: `@/shared/lib` (cn utility)
- External: `lucide-react` (icons)
