# Part 11: Technical Constraints (Next.js)

**1. Prevent Hydration Errors (Critical)**
Since the app relies heavily on `localStorage` (via Zustand), the initial server render will differ from the client render.

- **Rule:** Wrap the main `Dashboard` component (or widgets) using `next/dynamic` with `{ ssr: false }`.
- **Do not** write manual hydration fix hooks; use the dynamic import strategy instead.

**2. Charting Library**

- **Rule:** Always import **Recharts** components dynamically. They are not SSR-compatible and will break the build otherwise.

**3. Security**

- **Rule:** Never use `NEXT_PUBLIC_` for sensitive keys. Access them only in Server Actions.
