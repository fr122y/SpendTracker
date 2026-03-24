# Shared UI

Reusable "dumb" UI components without business logic.

## Public API (`index.ts`)

- `Button`: Styled button with variants (primary, ghost, danger)
- `Input`: Form input with label and error support
- `MathInput`: Input that evaluates math expressions (e.g., "500+50" → "550")
- `Select`: Dropdown select with options
- `TerminalPanel`: Container for widgets with header and edit mode
- `ProgressBar`: Visual indicator with over-budget detection
- `Skeleton`: Loading placeholder primitives (`SkeletonText`, `SkeletonCircle`, `SkeletonRect`)

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

### MathInput

Input component that evaluates mathematical expressions on blur or Enter key.

```tsx
const [amount, setAmount] = useState('')

<MathInput
  value={amount}
  onValueChange={(value, evaluated) => {
    // While typing: evaluated is null
    // On blur/Enter: evaluated contains the result (or null if invalid)
    setAmount(evaluated !== null ? String(evaluated) : value)
  }}
  placeholder="Сумма (можно ввести выражение, напр. 500+50)"
  min={0}
  max={100000}
/>
```

**Props:**

- `value`: Current string value (can be number or expression like "500+50")
- `onValueChange(value, evaluated)`: Called on change
  - While typing: `evaluated` is `null`, `value` is raw input
  - On blur/Enter with valid expression: `evaluated` contains result
- `min`: Optional minimum value (clamped after evaluation)
- `max`: Optional maximum value (clamped after evaluation)
- All standard Input props except `type` and `onChange`

**Behavior:**

1. User types `500+50` in input
2. On Tab/Enter, expression evaluates to `550`
3. Input value updates to show `550`
4. `onValueChange` called with `("550", 550)`

**Supported Expressions:**

- Basic: `5+3`, `10-3`, `4*5`, `100/4`
- Precedence: `2+3*4` → `14`
- Parentheses: `(2+3)*4` → `20`
- Decimals: `10.5+0.5` or `10,5+0,5` → `11`

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

### Skeleton

Reusable loading placeholders for async widget states.

```tsx
<Skeleton className="h-10 w-full" />
<SkeletonText widthClassName="w-32" />
<SkeletonCircle className="h-8 w-8" />
<SkeletonRect className="h-24 w-full" />
```

**Variants:**

- `Skeleton`: Base pulse block (`animate-pulse`, `bg-zinc-800/80`)
- `SkeletonText`: Text line (`h-4` + configurable width)
- `SkeletonCircle`: Circular placeholder (`rounded-full`)
- `SkeletonRect`: Rectangular placeholder (`rounded-lg`)

## Dependencies

- Uses: `@/shared/lib` (cn utility)
- External: `lucide-react` (icons)
