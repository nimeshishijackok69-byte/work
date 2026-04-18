# Frontend QA Fix: Form Builder & Event Creation

Senior dev review of the Codex-generated frontend. Found 12 bugs and rough edges.

## Bugs Found

### 🔴 Critical: TextListEditor (MCQ / Dropdown / Checkboxes) is Broken

The `TextListEditor` in `helpers.tsx` (line 115) calls `onChange` on **every keystroke**, which triggers `parseLines()` which **filters out empty lines**. This means:

1. **You cannot press Enter to add a new line** — the empty new line is immediately stripped by `.filter(Boolean)`, and the cursor jumps back up.
2. **You cannot delete the last character on a line** — the now-empty line is stripped, collapsing the textarea.
3. All three configs (MultipleChoiceConfig, DropdownConfig, CheckboxConfig) are affected since they all use `TextListEditor`.

**Root cause**: `parseLines()` strips empty lines, but the textarea needs to preserve them during editing. The filtering should only happen on **blur**, not on every change.

**Fix**: Use local state in `TextListEditor` so the raw textarea value is editable freely, and only call `onChange(parseLines(value))` on blur.

---

### 🟡 Medium: `updateField` merges but doesn't preserve `config`

In `useFormBuilderStore.ts` line 72-84, `updateField` does a shallow spread `{ ...field, ...updates }`. When `FieldConfigPanel` calls `onUpdateField({ ...selectedField, label: event.target.value })`, this works. But the **field-specific config components** call `onChange(fullField)` which **replaces the entire field object through the store's `updateField`** — this seems okay at first, but:

In `FormBuilder.tsx` line 329:
```tsx
onUpdateField={(field) => updateField(field.id, field)}
```

This passes the **entire field** as `updates`, which includes `id`. The store then does `{ ...field, ...updates }` which works, but it's passing the whole field redundantly. This is technically fine but wasteful — not a bug, just code smell.

---

### 🟡 Medium: Expiration date input loses timezone precision

In `event-create-form.tsx` line 138, the `datetime-local` input produces a string like `2026-12-31T23:59` without timezone info. The validation in `normalizeOptionalDate` (events.ts line 93-103) then converts this to UTC via `parsed.toISOString()`, which uses the **server's timezone** during SSR, not the user's browser timezone. This means:

- If a user in IST (UTC+5:30) picks `2026-12-31T23:59`, the server converts it to `2026-12-31T18:29:00.000Z` — which could be wrong since the server might be in a different timezone during SSR.
- The `datetime-local` input doesn't include timezone, so there's ambiguity.

**Fix**: Append the browser's timezone offset before sending to the server. Add a hidden field with the timezone offset or use JavaScript to append it.

---

### 🟡 Medium: `datetime-local` step precision is missing

The `datetime-local` input in `event-create-form.tsx` line 138 doesn't have a `step` attribute, defaulting to 60 seconds. The `min` attribute is also not set, so users can pick dates in the past (validation catches it server-side, but UX could prevent it).

**Fix**: Add `min` attribute set to current datetime, and `step="60"` for minute precision.

---

### 🟢 Low: Native `<select>` not styled consistently

In `event-create-form.tsx` lines 119-127 and `event-edit-form.tsx` lines 267-283, the `<select>` element uses inline className styling that roughly matches `<Input>`, but:
- It won't match disabled/ring states exactly
- No custom caret/chevron icon — relies on browser native dropdown arrow
- Missing `aria-label` for accessibility

**Fix**: Create a lightweight `Select` UI component that wraps `<select>` with consistent styling, or at least extract the shared class string.

---

### 🟢 Low: Checkbox styling is browser-default

All native `<input type="checkbox">` elements (teacher fields section in both create and edit forms) use bare `className="mt-1 size-4"` with browser-default appearance. This looks inconsistent with the polished card-based design.

**Fix**: Style the checkboxes properly with accent-color or use a custom checkbox component.

---

### 🟢 Low: FieldConfigPanel scrolling

The right-side `FieldConfigPanel` doesn't have `overflow-y-auto` or `max-height`, so when editing a field with many config options (e.g., LinearScale with 4 fields), the panel overflows the viewport and becomes hard to use.

**Fix**: Add sticky positioning and scrollable container.

---

### 🟢 Low: Missing `key` stability for options using value as key

In `FieldPreview.tsx` lines 48-52 and `FormPreview.tsx` lines 109-113, the `key={option}` uses the option text as key. If two options have the same text (e.g., "Other" duplicated), React will warn about duplicate keys and may render incorrectly.

**Fix**: Use index-based keys for option previews since these are display-only.

---

### 🟢 Low: `FormPreview` modal missing `aria` attributes

The preview modal in `FormPreview.tsx` is a custom modal but lacks:
- `role="dialog"` and `aria-modal="true"`
- `aria-labelledby` pointing to the title
- Focus trap

**Fix**: Add proper ARIA attributes for accessibility.

---

### 🟢 Polish: Select element inconsistency

The native `<select>` elements would benefit from a chevron icon and consistent disabled state with the design system.

---

### 🟢 Polish: `ToggleRow` uses bare checkbox

The `ToggleRow` helper uses a plain `<input type="checkbox">` that looks like a generic browser checkbox. This should be styled to match the design system.

---

## Proposed Changes

### Core Fix: TextListEditor (Fixes MCQ, Dropdown, Checkboxes)

#### [MODIFY] [helpers.tsx](file:///c:/Users/NIMESH/Downloads/work/src/components/form-builder/fields/helpers.tsx)

Rewrite `TextListEditor` to use internal state so the textarea is editable freely. Parse + filter only on **blur**. This fixes the Enter key and backspace issues in MCQ, Dropdown, and Checkbox config panels.

---

### Fix: Expiration Date Precision

#### [MODIFY] [event-create-form.tsx](file:///c:/Users/NIMESH/Downloads/work/src/app/%28dashboard%29/admin/events/event-create-form.tsx)

- Add `min` attribute to datetime-local set to "now" so users can't pick past dates
- Add a hidden `timezone_offset` field to capture the browser timezone  
- OR: Use client-side JS to append timezone offset before form submission

#### [MODIFY] [event-edit-form.tsx](file:///c:/Users/NIMESH/Downloads/work/src/app/%28dashboard%29/admin/events/%5Bid%5D/event-edit-form.tsx)

Same datetime-local improvements.

---

### Polish: Select Element & Checkbox Styling

#### [MODIFY] [event-create-form.tsx](file:///c:/Users/NIMESH/Downloads/work/src/app/%28dashboard%29/admin/events/event-create-form.tsx)

- Style checkboxes with `accent-color` and improved visual treatment
- Extract select styling to a shared constant

#### [MODIFY] [event-edit-form.tsx](file:///c:/Users/NIMESH/Downloads/work/src/app/%28dashboard%29/admin/events/%5Bid%5D/event-edit-form.tsx)

Same improvements.

---

### Polish: FieldConfigPanel Scrollable

#### [MODIFY] [FormBuilder.tsx](file:///c:/Users/NIMESH/Downloads/work/src/components/form-builder/FormBuilder.tsx)

Wrap FieldConfigPanel in a sticky scrollable container.

---

### Polish: Preview Option Keys & Modal A11y

#### [MODIFY] [FieldPreview.tsx](file:///c:/Users/NIMESH/Downloads/work/src/components/form-builder/FieldPreview.tsx)

Use index-based keys for option list previews to prevent duplicate key warnings.

#### [MODIFY] [FormPreview.tsx](file:///c:/Users/NIMESH/Downloads/work/src/components/form-builder/FormPreview.tsx)

- Add `role="dialog"` and `aria-modal="true"`
- Use index-based keys for option list previews
- Add `aria-labelledby` for accessibility

---

### Polish: ToggleRow Checkbox Styling

#### [MODIFY] [helpers.tsx](file:///c:/Users/NIMESH/Downloads/work/src/components/form-builder/fields/helpers.tsx)

Style the ToggleRow checkbox with accent-color to match the primary color.

---

## Verification Plan

### Build Check
- Run `npx next build` to verify no TypeScript errors

### Manual Testing
- Add MCQ field, verify typing options with Enter key works
- Add Dropdown field, verify same
- Add Checkboxes field, verify same
- Create an event with expiration date, verify timezone handling
- Check all visual fixes render correctly

