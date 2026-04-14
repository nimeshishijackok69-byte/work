# FormFlow — Component Architecture

> **On-Demand Context**: Read this file before working on UI components, layouts, or the design system.

---

## Design System

### Colors (CSS Custom Properties)

```css
/* Light Mode */
--color-primary: #6366F1;          /* Indigo-500 — primary brand */
--color-primary-hover: #4F46E5;    /* Indigo-600 */
--color-primary-light: #EEF2FF;    /* Indigo-50 */
--color-secondary: #8B5CF6;        /* Violet-500 */
--color-success: #10B981;          /* Emerald-500 */
--color-warning: #F59E0B;          /* Amber-500 */
--color-danger: #EF4444;           /* Red-500 */
--color-info: #3B82F6;             /* Blue-500 */

--color-bg: #FFFFFF;
--color-bg-secondary: #F9FAFB;
--color-bg-tertiary: #F3F4F6;
--color-text: #111827;
--color-text-secondary: #6B7280;
--color-text-muted: #9CA3AF;
--color-border: #E5E7EB;
--color-border-focus: #6366F1;

/* Dark Mode */
--color-bg-dark: #0F172A;
--color-bg-secondary-dark: #1E293B;
--color-text-dark: #F1F5F9;
```

### Typography
- **Font Family**: Inter (Google Fonts) — `font-family: 'Inter', sans-serif;`
- **Headings**: Semibold (600)
- **Body**: Regular (400)
- **Scale**: 12px, 14px, 16px (base), 18px, 20px, 24px, 30px, 36px

### Spacing Scale
- 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

### Border Radius
- **sm**: 6px, **md**: 8px, **lg**: 12px, **xl**: 16px, **full**: 9999px

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
```

---

## Component Hierarchy

### Layout Components

```
src/components/
├── layout/
│   ├── AppShell.tsx              # Main layout wrapper
│   ├── Sidebar.tsx               # Sidebar navigation (admin/reviewer)
│   ├── Header.tsx                # Top header with notifications + user menu
│   ├── PageHeader.tsx            # Page title + breadcrumbs + actions
│   └── Container.tsx             # Max-width content wrapper
```

### UI Components (shadcn/ui based)

```
src/components/ui/
├── button.tsx                    # Primary, secondary, ghost, destructive
├── input.tsx                     # Text input
├── textarea.tsx                  # Multi-line input
├── select.tsx                    # Dropdown select
├── checkbox.tsx                  # Single checkbox
├── radio-group.tsx               # Radio button group
├── switch.tsx                    # Toggle switch
├── badge.tsx                     # Status badges
├── card.tsx                      # Content card
├── dialog.tsx                    # Modal dialog
├── dropdown-menu.tsx             # Dropdown menu
├── table.tsx                     # Data table
├── tabs.tsx                      # Tab navigation
├── toast.tsx                     # Toast notifications
├── tooltip.tsx                   # Tooltips
├── avatar.tsx                    # User avatar
├── separator.tsx                 # Visual divider
├── skeleton.tsx                  # Loading placeholder
├── progress.tsx                  # Progress bar
├── calendar.tsx                  # Date picker calendar
├── popover.tsx                   # Popover container
├── command.tsx                   # Command palette / search
├── scroll-area.tsx               # Custom scroll area
└── alert.tsx                     # Alert/banner messages
```

### Form Builder Components

```
src/components/form-builder/
├── FormBuilder.tsx               # Main form builder container
├── FieldPalette.tsx              # Left panel: field type buttons to drag
├── FieldCanvas.tsx               # Center panel: sortable field list (dnd-kit)
├── FieldConfigPanel.tsx          # Right panel: edit selected field properties
├── FieldPreview.tsx              # Preview of a single field in the canvas
├── FormPreview.tsx               # Full form preview modal
├── fields/
│   ├── ShortAnswerConfig.tsx     # Config panel for short answer
│   ├── ParagraphConfig.tsx
│   ├── MultipleChoiceConfig.tsx
│   ├── CheckboxConfig.tsx
│   ├── DropdownConfig.tsx
│   ├── FileUploadConfig.tsx
│   ├── LinearScaleConfig.tsx
│   ├── MCGridConfig.tsx          # Multiple choice grid
│   ├── CheckboxGridConfig.tsx
│   ├── DateConfig.tsx
│   ├── TimeConfig.tsx
│   └── SectionHeaderConfig.tsx
└── DragHandle.tsx                # Drag handle icon for reordering
```

### Form Renderer Components (Teacher-facing)

```
src/components/form-renderer/
├── FormRenderer.tsx              # Main form rendering container
├── FormProgress.tsx              # Completion progress bar
├── FormField.tsx                 # Routes to correct field renderer
├── fields/
│   ├── ShortAnswerField.tsx
│   ├── ParagraphField.tsx
│   ├── MultipleChoiceField.tsx
│   ├── CheckboxField.tsx
│   ├── DropdownField.tsx
│   ├── FileUploadField.tsx       # With drag-and-drop, progress, 20MB limit
│   ├── LinearScaleField.tsx
│   ├── MCGridField.tsx
│   ├── CheckboxGridField.tsx
│   ├── DateField.tsx
│   ├── TimeField.tsx
│   └── SectionHeaderField.tsx
├── TeacherInfoForm.tsx           # Name, email, school, phone fields
├── FormSubmitButton.tsx          # Submit with loading state
├── FormExpiredBanner.tsx         # "This form is closed" message
└── DraftSaveBanner.tsx           # "Your progress has been saved" indicator
```

### Review Components

```
src/components/review/
├── ReviewDashboard.tsx           # Reviewer's main dashboard
├── AssignmentCard.tsx            # Single assignment card in list
├── AssignmentList.tsx            # List of assignments with filters
├── ReviewInterface.tsx           # Full review/evaluation UI
├── SubmissionViewer.tsx          # Read-only view of submission data
├── ScoreInput.tsx                # Numeric score (slider + input)
├── GradeSelector.tsx             # Grade selection (radio/dropdown)
├── ReviewNotes.tsx               # Notes textarea
├── PreviousReviewBanner.tsx      # Shows reviewer's previous layer scores
├── ReviewSubmitButton.tsx        # Submit review with confirmation
└── FilePreview.tsx               # Preview/download attached files
```

### Dashboard Components (Admin)

```
src/components/dashboard/
├── AdminDashboard.tsx            # Admin home page
├── EventCard.tsx                 # Event summary card
├── EventList.tsx                 # List of events with filters
├── EventDetail.tsx               # Event detail page tabs
├── SubmissionTable.tsx           # Paginated submission data table
├── ReviewerTable.tsx             # Reviewer list with workload
├── AssignmentMatrix.tsx          # Assign submissions to reviewers
├── LayerAdvancement.tsx          # Advance/eliminate submissions UI
├── analytics/
│   ├── SubmissionRateChart.tsx   # Line chart: submissions over time
│   ├── ReviewCompletionChart.tsx # Bar chart: completion by layer
│   ├── TopRatedTable.tsx         # Leaderboard table
│   ├── AvgScoreChart.tsx         # Bar chart: avg score by layer
│   ├── StatCard.tsx              # Single metric card with icon
│   └── AnalyticsFilters.tsx      # Date range, layer, reviewer filters
└── NotificationCenter.tsx        # Bell icon + dropdown list
```

---

## Page Routes

| Route                          | Component              | Auth     | Description                    |
| ------------------------------ | ---------------------- | -------- | ------------------------------ |
| `/`                            | `LandingPage`          | Public   | Redirect to login or dashboard |
| `/login`                       | `LoginPage`            | Public   | Email/password login           |
| `/admin`                       | `AdminDashboard`       | Admin    | Admin home with event list     |
| `/admin/events/new`            | `EventCreator`         | Admin    | Create event + form builder    |
| `/admin/events/[id]`           | `EventDetail`          | Admin    | Event detail + tabs            |
| `/admin/events/[id]/builder`   | `FormBuilder`          | Admin    | Form builder                   |
| `/admin/events/[id]/submissions` | `SubmissionTable`    | Admin    | View submissions               |
| `/admin/events/[id]/reviews`   | `ReviewManagement`     | Admin    | Assign + manage reviews        |
| `/admin/events/[id]/analytics` | `AnalyticsDashboard`   | Admin    | Event analytics                |
| `/admin/reviewers`             | `ReviewerManagement`   | Admin    | CRUD reviewers                 |
| `/reviewer`                    | `ReviewDashboard`      | Reviewer | Reviewer home with assignments |
| `/reviewer/review/[assignmentId]` | `ReviewInterface`   | Reviewer | Evaluate a submission          |
| `/form/[slug]`                 | `FormRenderer`         | Public   | Teacher fills form             |
| `/form/draft/[token]`          | `FormRenderer`         | Public   | Resume draft                   |
| `/form/success`                | `SubmissionSuccess`    | Public   | "Thank you" page               |

---

## State Management (Zustand)

### `useFormBuilderStore`
Manages form builder state (field list, selected field, drag state).
```typescript
interface FormBuilderStore {
  fields: FormField[]
  selectedFieldId: string | null
  isDirty: boolean
  
  addField: (type: FieldType) => void
  removeField: (id: string) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  duplicateField: (id: string) => void
  reorderFields: (activeId: string, overId: string) => void
  selectField: (id: string | null) => void
  setFields: (fields: FormField[]) => void
  resetDirty: () => void
}
```

### `useFormResponseStore`
Manages teacher's form response state (for auto-save and submission).
```typescript
interface FormResponseStore {
  responses: Record<string, any>      // field_id -> value
  teacherInfo: Partial<TeacherInfo>
  fileAttachments: FileAttachment[]
  draftToken: string | null
  lastSavedAt: Date | null
  
  setResponse: (fieldId: string, value: any) => void
  setTeacherInfo: (info: Partial<TeacherInfo>) => void
  addFileAttachment: (attachment: FileAttachment) => void
  removeFileAttachment: (fieldId: string, index: number) => void
  setDraftToken: (token: string) => void
  reset: () => void
}
```

---

## Key UX Patterns

### 1. Form Builder
- Left panel: Scrollable palette of field types (icon + label)
- Center: Sortable field list with drag handles, in-place editing
- Right panel: Config for selected field (slides in/out)
- Top bar: Form title, save button, preview button, publish button
- Auto-save draft every debounced change

### 2. Teacher Form
- Single-page form (not multi-page for V1)
- Sticky progress bar at top
- Floating "Save Draft" button
- Auto-save indicator ("Saved just now" / "Saving...")
- File upload: drag-and-drop zone with progress bar
- Validation errors shown inline next to each field
- Submit button at bottom with loading spinner

### 3. Reviewer Interface
- Left: Scrollable submission viewer (full form responses)
- Right: Scoring panel (fixed position)
  - Previous review scores (if continuity applies) shown as read-only card at top
  - Score input (numeric slider OR grade selector)
  - Notes textarea
  - Submit review button

### 4. Admin Assignment
- Table of submissions for the event
- Checkbox selection for bulk operations
- Dropdown to select reviewer
- "Assign" button for selected submissions
- Visual indicators for how many reviews each submission has at current layer
