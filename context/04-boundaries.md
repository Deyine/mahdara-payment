# Mahdara - Frontend ↔ Backend Integration

## API Client (`client/src/services/api.js`)

Axios instance with base URL from `VITE_API_URL` env var (default `http://localhost:3061/api`).

**Interceptors:**
- Request: attach `Authorization: Bearer <token>` from localStorage
- Response: on 401, clear token + redirect to `/admin/login`

**Exported API objects:**
```javascript
authAPI        → login(username, password)
dashboardAPI   → getStatistics()
employeeTypesAPI → getAll(), create(data), update(id, data), delete(id)
employeesAPI   → getAll(), getById(id), create(data), update(id, data), delete(id), lookupNni(nni)
contractsAPI   → create(data), update(id, data), delete(id)
wilayasAPI     → getAll(), create(data), update(id, data), delete(id), import(file)
moughataaAPI   → getAll(params?), create(data), update(id, data), delete(id), import(file)
communesAPI    → getAll(params?), create(data), update(id, data), delete(id), import(file)
villagesAPI    → getAll(params?), create(data), update(id, data), delete(id), import(file)
paymentBatchesAPI → getAll(), getById(id), create(batchData, employees[]), delete(id)
usersAPI       → getAll(), create(data), update(id, data), delete(id)
```

**Import helper (shared pattern):**
```javascript
const buildImportFn = (path) => (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(path, fd);
};
```

---

## Authentication Flow

1. Login form → `authAPI.login(username, password)`
2. On success: `localStorage.setItem('token', ...)` + `localStorage.setItem('user', ...)`
3. `AuthContext` restores session from localStorage on mount
4. On logout: clear both localStorage keys, set user to null

**AuthContext exports:**
```javascript
{ user, login, logout, loading, isAdmin, isSuperAdmin, canWrite, canRead, hasPermission }
// canWrite = admin || super_admin
// canRead = any logged-in user
```

---

## NNI Lookup Flow

1. User enters NNI in the new employee form
2. Clicks "Rechercher" → `employeesAPI.lookupNni(nni)`
3. Backend calls `HuwiyetiService#get_person_by_nni` → Gov API
4. Gov API: `POST https://api-houwiyeti.anrpts.gov.mr/houwiyetiapi/v1/partners/getPersonne`
   with `{ nni }` and header `entity-api-key: <key>`
5. Response auto-fills: `first_name`, `last_name`, `birth_date`
6. On error: show alert, user fills manually

---

## Payment Batch Creation Flow

1. Page loads active employees with active contracts
2. User checks/unchecks employees (checkbox per row)
3. Each selected employee shows a `months_count` input (default 1)
4. Live total block = `sum(amount * months_count)` for all selected — computed client-side with `useMemo`
5. User sets `payment_date` and optional `notes`
6. Submit → `paymentBatchesAPI.create(batchData, employeesArray)`
7. Backend wraps in transaction, creates `PaymentBatch` + `PaymentBatchEmployee` records

---

## Location Cascade Pattern

Used in employee create/edit forms and in Settings sub-pages (Communes, Villages):

```
Wilaya selected → fetch moughataa for wilaya_id
Moughataa selected → fetch communes for moughataa_id
Commune selected → fetch villages for commune_id
Each level resets children when parent changes
```

Implementation uses separate `useEffect` hooks per level, each resetting child state when parent ID changes.

---

## CSV Import Pattern

```javascript
// Triggered by hidden file input + ref
const fileRef = useRef();
<button onClick={() => fileRef.current.click()}>Importer CSV</button>
<input ref={fileRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />

const handleImport = async (e) => {
  const file = e.target.files[0];
  const res = await wilayasAPI.import(file);
  const { imported, skipped, errors } = res.data;
  await showAlert(`Importé: ${imported}, Ignoré: ${skipped}`, 'success');
  e.target.value = ''; // reset so same file can be re-imported
};
```

---

## UI Patterns

### Page Layout (top-level pages)
```jsx
<div className="min-h-screen" style={{ backgroundColor: '#fafbfc' }}>
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* header row: title + action button */}
    {/* table or content */}
  </div>
</div>
```

### Settings Sub-Pages (rendered inside Settings layout)
```jsx
<div className="bg-white rounded-lg shadow-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
  {/* header + button */}
  {/* table */}
</div>
```

### Modal (inline overlay)
```jsx
<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '450px', width: '100%' }}>
    {/* form */}
  </div>
</div>
```

### Error Handling
```javascript
try {
  await someAPI.create(data);
  await showAlert('Succès', 'success');
  fetchList();
} catch (err) {
  await showAlert(err.response?.data?.errors?.[0] || err.response?.data?.error || 'Erreur', 'error');
}
```

---

## Routing Conventions

- All auth-required routes use the `/admin` prefix
- Settings uses nested routes — `Settings.jsx` renders `<Outlet />`
- `PrivateRoute` wraps protected pages; `requireAdmin` prop restricts to admin/super_admin
- Navigation uses React Router `useNavigate()` — no direct `window.location` changes
