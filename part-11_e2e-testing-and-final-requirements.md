# Part 12: E2E Testing & Final Requirements

## Step 12.1: Playwright Configuration

Use the standard configuration provided in Part 1. Ensure `baseURL` points to `http://localhost:3000`.

## Step 12.2: Test Scenarios

**1. Dashboard Smoke Test (`dashboard.spec.ts`)**

- Verify critical widgets are visible: "Календарь", "Операции", "Анализ трат".
- Verify current month is displayed in the header.

**2. Expense Flow (`expenses.spec.ts`)**

- **Clean State:** Use `await page.evaluate(() => localStorage.clear())` before tests.
- **Add Expense:**
  - Fill Description "Milk" and Amount "100".
  - Click "Add".
  - Verify "Milk" appears in the list.
  - _Note:_ Do not strictly test for specific AI categories as the AI response might vary or use fallback. Check if _any_ category is assigned.
- **Delete Expense:**
  - Create expense -> Click Delete -> Verify disappearance.

**3. Layout Persistence (`layout.spec.ts`)**

- Toggle Edit Mode.
- Verify visual cues (borders/grayscale).
- Toggle off and reload page.

## Step 12.3: Final Behavior Rules

**1. AI Fallback Strategy**
Since we use Server Actions, the client does not know if API keys are present.

- **Rule:** Always attempt to categorize on the server.
- **Fallback:** If the Server Action fails (no key/error), return `{ category: "Другое", emoji: "📝" }`.
- **UI:** The user sees the added expense immediately (Optimistic Update or Fast Server Response).

**2. Notes & Constraints**

- **Language:** Russian UI strictly.
- **Currency:** RUB (₽).
- **Theme:** Dark Terminal Mode only.
- **Mobile:** Responsive layout (CSS Grid stacks columns on mobile).

**Action:** Implement E2E tests to verify these flows.
