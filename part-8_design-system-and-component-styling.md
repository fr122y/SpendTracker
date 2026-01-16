# Part 8: Design System & Component Styling

**Guideline:** Implement the "Terminal" aesthetic using **Tailwind CSS v4** utility classes directly in `src/shared/ui` components.

## Step 8.1: Global Theme Rules

1.  **Palette:**
    - Background: `bg-zinc-950` (Deep dark).
    - Surface: `bg-zinc-900/30` (Glassy).
    - Borders: `border-zinc-800`.
    - Text: `text-zinc-200` (Primary), `text-zinc-400` (Secondary).
    - Accents: `blue-500` (Main), `emerald-500` (Income), `amber-500` (Events), `red-500` (Expense/Danger).
2.  **Typography:**
    - UI Text: `font-sans` (Inter).
    - Numbers/Data: `font-mono` (JetBrains Mono).
    - Headers: `uppercase tracking-wider font-bold`.

## Step 8.2: Apply Styles to Shared UI

Refactor components in `src/shared/ui/` with these specific patterns:

1.  **TerminalPanel (Card):**

    - `border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm shadow-lg rounded-md`.
    - Header: Flex row, `border-b border-zinc-800/50 p-3`.
    - Content: `p-4`.

2.  **Form Elements (Input/Select):**

    - `bg-zinc-900 border border-zinc-700 rounded`.
    - Focus: `ring-1 ring-blue-500 outline-none`.
    - Placeholder: `text-zinc-600`.

3.  **Button:**

    - Base: `font-bold uppercase text-xs tracking-wider px-4 py-2 rounded transition-all`.
    - Primary: `bg-blue-600 hover:bg-blue-500 text-white`.
    - Ghost: `bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white`.
    - Danger: `text-red-400 hover:bg-red-500/10`.

4.  **ProgressBar:**
    - Track: `h-2 bg-zinc-800 rounded-full overflow-hidden`.
    - Fill: `h-full transition-all duration-500 ease-out`.
    - Logic: Use `blue-500` normally, turn `red-500` if `value > max`.

## Step 8.3: Edit Mode UX

Implement visual feedback when `isEditMode` (from Layout Store) is active:

1.  **Dashboard Grid:** Apply `grayscale` filter to widget content to de-emphasize data.
2.  **Widget Container:** Add `border-2 border-blue-500/50 border-dashed animate-pulse` to indicate drop zones.
3.  **Handles:** Show "Drag" and "Resize" handles that are otherwise hidden.

**Action:** Style the application components to match this design system.
