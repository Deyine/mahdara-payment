# Mahdara - Code Conventions & Patterns

## Development Workflow

### Git
- Stage only specific files related to the current task — never `git add .`
- Never push without asking the user first

### Planning
- Always present an implementation plan and wait for user approval before starting
- Exception: git-related tasks don't need planning approval

### Documentation
- Comment to explain **why**, not what
- Document complex business logic and non-obvious patterns; avoid verbosity

---

## Design System — Nexus Dashboard 3.1

### Colors
- **Primary Blue**: `#167bff` / Hover: `#0d5dd6`
- **Page BG**: `#fafbfc` | **Card BG**: `#ffffff` | **Hover BG**: `#f1f5f9`
- **Primary Text**: `#1e293b` | **Secondary**: `#475569` | **Muted**: `#64748b`
- **Border**: `#e2e8f0` | **Divider**: `#cbd5e1`
- **Success**: `#10b981` / BG: `#f0fdf4`
- **Error**: `#ef4444` / BG: `#fef2f2`
- **Warning**: `#f59e0b`
- **Info BG**: `#eff6ff`

---

## UI Component Patterns

### Modals
- All add/edit forms use modals (not inline forms)
- Modals close only via explicit buttons (Cancel, X, Submit) — no overlay click to close
- Backdrop: `rgba(0, 0, 0, 0.5)`, z-index 50
- Standard width: `max-w-2xl`; complex forms: `max-w-4xl`

### Searchable Select
- Use `SearchableSelect.jsx` (react-select) for dropdowns with many options
- Props: `options`, `value`, `onChange`, `placeholder`, `isClearable`, `isRequired`

### Buttons
- **Primary** (Save/Submit): `#167bff` bg, white text, hover `#0d5dd6`
- **Secondary** (Cancel): `#fafbfc` bg, `#e2e8f0` border, `#475569` text
- **Edit icon**: `#167bff`, hover `#0d5dd6`
- **Delete icon**: `#64748b`, hover `#ef4444`

### Inputs
- Standard: `border: 1px solid #e2e8f0`, focus border `#167bff`
- Amount inputs: centered, `text-2xl font-bold`

### Loading Spinner
- `animate-spin rounded-full border-b-2` with `borderColor: '#167bff'`

### Dialog System
- Never use native `alert()` or `confirm()`
- Always use `useDialog()` from `DialogContext` — `showAlert(msg, type)` and `showConfirm(msg, title)`
- Promise-based, Arabic labels, types: `'error'`, `'success'`, `'warning'`

### Alert Boxes
- Success: BG `#f0fdf4`, border `#10b981`, text `#166534`
- Error: BG `#fef2f2`, border `#ef4444`, text `#991b1b`
- Info: BG `#eff6ff`, border `#93c5fd`, text `#1e40af`

### Stat Cards
- White card with colored left border (4px), `shadow-sm`
- Border colors: primary `#167bff`, success `#10b981`, warning `#f59e0b`, error `#ef4444`

### View-Only Modal
- Same modal for create/edit/view — controlled by `viewMode` state
- In view mode: all inputs disabled with `#f1f5f9` bg, action buttons hidden, single "Fermer" button

### Auto-Open Modal via URL
- After create/edit, navigate with `?view=<id>` query param
- Target page detects param, opens modal, then cleans the URL

### Edit Mode Reuses Creation Interface
- Navigate to creation page with `?edit=<id>` param
- Page loads in edit mode with pre-populated data; saves then navigates back with `?view=<id>`

### Debounced Search
- 300ms debounce on search inputs to reduce API calls
- Show "create new" option when no results found

### Status-Based Action Buttons
- Modal footer buttons adapt based on resource status
- Complete: green `#10b981`, Edit: blue `#167bff`, Cancel: red `#ef4444`, Uncomplete: orange `#f59e0b`

### Conditional Access by Status
- Show invoice/download links only for completed resources
- Backend must also enforce status-based restrictions

---

## Routing

- All authenticated routes use `/admin` prefix (e.g., `/admin/employees/:id`)
- All `navigate()` and `<Link to>` calls must include `/admin/`

---

## Naming Conventions

### Backend (Rails)
- Models: Singular PascalCase (`Employee`, `PaymentBatch`)
- Tables: Plural snake_case (`employees`, `payment_batches`)
- Controllers: Plural PascalCase + Controller (`EmployeesController`)
- Methods/files: snake_case

### Frontend (React)
- Components: PascalCase (`EmployeeDetail.jsx`)
- Utilities/functions/variables: camelCase

---

## Styling

- **No DaisyUI** — project has removed all DaisyUI classes (`btn`, `card`, `alert`, `badge`, `stats`, etc.)
- Use pure Tailwind utility classes + inline styles for colors

---

## Arabic RTL Layout

- All UI text in Arabic (`lang="ar" dir="rtl"` on `<html>`)
- Table content columns: `textAlign: 'right'`
- Table action columns: `textAlign: 'left'`, action button groups: `justifyContent: 'flex-start'`
- Nav icons: `className="ml-2"` (not `mr-2`) due to RTL
- Mobile drawer slides from right (`right-0`, `translateX(100%)` animation)
- Currency: MRU (أوقية)
- Buttons: "إنشاء", "تعديل", "إلغاء", "حذف", "حفظ"
- Read-only identity fields (from Huwiyeti): gray bg `#f1f5f9`, `cursor: 'default'`, `readOnly`

---

## Rails Conventions

### RESTful Actions
`index`, `show`, `create`, `update`, `destroy`

### Associations
- `belongs_to :employee_type` expects `employee_type_id` column
- Use `dependent: :destroy` or `dependent: :restrict_with_error` appropriately

### Password Hashing
- Use `has_secure_password` and permit `:password` — never manually set `:password_digest`

### ActiveRecord
- Use scopes for reusable queries
- Always eager-load associations to avoid N+1 (`includes(...)`)
- Use `validates` and transactions for multi-step operations

---

## Serialization

- Use **private helper methods in controllers** for JSON serialization — not separate serializer classes, not `as_json` overrides in models
- Pattern: `employee_json(e, full: false)` / `contract_json(c)`
- Keep computed values in model methods, reference them in controller helpers

---

## CSV Import

- Auto-detect separator: count `,` vs `;` in first line
- Clean amounts: strip Unicode whitespace, replace comma decimals, remove non-numeric chars
- Always log import progress with `Rails.logger` at debug/info/warn/error levels

---

## Performance

- Backend: eager-load with `includes(...)` to avoid N+1
- Frontend: convert to `Number()` before sorting to avoid string comparison bugs

---

## Database

- Ruby version: **3.2.1**
- Monetary values: `decimal(10, 2)` | Exchange rates: `decimal(10, 4)`
- Unique constraints: `users.username`, `employees.nni`, `employee_types.name`, `wilayas.name`, composite unique on `moughataa`, `communes`, `villages`

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `toFixed is not a function` | Rails returns decimals as strings | `Number(value).toFixed(2)` |
| Double API calls in dev | React StrictMode | Intentional, no fix needed |
| BCrypt invalid hash | Password stored as plain text | Use `has_secure_password` with `:password` |
| Modal won't close on overlay click | By design | Do NOT add overlay click handler |
| Production calls localhost API | Built without `.env.production` | Rebuild after updating env file |
