# Mahdara - API Contracts

All endpoints are under `/api`. Protected endpoints require `Authorization: Bearer <token>`.

---

## Auth

### POST /api/auth/login
```json
Request:  { "username": "admin", "password": "password123" }
Response: {
  "token": "eyJ...",
  "user": { "id": "uuid", "name": "Admin", "username": "admin", "role": "admin", "permissions": {} }
}
```

---

## Dashboard

### GET /api/dashboard/statistics
```json
{
  "employees": { "total": 50, "active": 48 },
  "payment_batches": { "total": 12, "draft": 2, "confirmed": 10 },
  "employee_types": 4
}
```

---

## Employee Types

### GET /api/employee_types
```json
[{ "id": "uuid", "name": "Titulaire", "active": true, "created_at": "..." }]
```

### POST /api/employee_types
```json
Request: { "employee_type": { "name": "Contractuel", "active": true } }
```

### PATCH /api/employee_types/:id
```json
Request: { "employee_type": { "name": "Nouveau Nom", "active": false } }
```

### DELETE /api/employee_types/:id
Returns `{ "message": "Type supprimé" }`. Blocked if employees exist.

---

## Employees

### GET /api/employees
```json
[{
  "id": "uuid", "nni": "1234567890",
  "first_name": "Ahmed", "last_name": "Ould Mohamed", "full_name": "Ahmed Ould Mohamed",
  "birth_date": "1985-04-12", "phone": "22000000", "active": true,
  "employee_type": { "id": "uuid", "name": "Titulaire" },
  "wilaya": { "id": "uuid", "name": "Nouakchott Nord" },
  "moughataa": { "id": "uuid", "name": "Tevragh Zeina" },
  "commune": { "id": "uuid", "name": "..." },
  "village": { "id": "uuid", "name": "..." },
  "active_contract": { "id": "uuid", "contract_type": "CDI", "amount": 50000.0, "start_date": "2024-01-01", "duration_months": null, "active": true }
}]
```

### GET /api/employees/:id
Same as above plus `"contracts": [...]` (full contract history).

### POST /api/employees
```json
Request: {
  "employee": {
    "nni": "1234567890", "first_name": "Ahmed", "last_name": "Ould Mohamed",
    "birth_date": "1985-04-12", "phone": "22000000",
    "employee_type_id": "uuid", "wilaya_id": "uuid",
    "moughataa_id": "uuid", "commune_id": "uuid", "village_id": "uuid"
  }
}
```

### PATCH /api/employees/:id — same params
### DELETE /api/employees/:id — blocked if payment batch entries exist

### GET /api/employees/lookup_nni?nni=1234567890
Calls Mauritanian Gov API (Huwiyeti). Returns:
```json
{
  "nni": "1234567890",
  "first_name": "Ahmed", "last_name": "Ould Mohamed",
  "birth_date": "1985-04-12",
  "first_name_ar": "أحمد", "last_name_ar": "ولد محمد",
  "gender": "M", "birth_place": "Nouakchott",
  "photo": "base64...",
  "source": "gov_api"
}
```
Returns `404 { "error": "NNI introuvable" }` if not found.

---

## Contracts

### POST /api/contracts
```json
Request: {
  "contract": {
    "employee_id": "uuid",
    "contract_type": "CDI",
    "amount": "50000.00",
    "start_date": "2024-01-01",
    "duration_months": null,
    "active": true
  }
}
```
For CDD: `"contract_type": "CDD"`, `"duration_months": 12`.

### PATCH /api/contracts/:id — same fields
### DELETE /api/contracts/:id

---

## Wilayas

### GET /api/wilayas
```json
[{ "id": "uuid", "name": "Nouakchott Nord", "code": "NKN" }]
```

### POST /api/wilayas
```json
Request: { "wilaya": { "name": "Nouakchott Nord", "code": "NKN" } }
```

### PATCH /api/wilayas/:id
### DELETE /api/wilayas/:id — blocked if moughataa exist

### POST /api/wilayas/import
Multipart `file` upload (CSV). Returns `{ "imported": N, "skipped": N, "errors": [...] }`.
CSV format: headers `name`, `code` (optional).

---

## Moughataa

### GET /api/moughataa?wilaya_id=uuid (filter optional)
```json
[{ "id": "uuid", "name": "Tevragh Zeina", "wilaya_id": "uuid", "wilaya": { "id": "uuid", "name": "Nouakchott Nord" } }]
```

### POST /api/moughataa
```json
Request: { "moughataa": { "name": "Tevragh Zeina", "wilaya_id": "uuid" } }
```

### PATCH /api/moughataa/:id
### DELETE /api/moughataa/:id — blocked if communes exist
### POST /api/moughataa/import
CSV format: headers `name`, `wilaya` (looked up by name).

---

## Communes

### GET /api/communes?moughataa_id=uuid (filter optional)
```json
[{ "id": "uuid", "name": "...", "moughataa_id": "uuid", "moughataa": { "id": "uuid", "name": "..." } }]
```

### POST /api/communes
```json
Request: { "commune": { "name": "...", "moughataa_id": "uuid" } }
```

### PATCH /api/communes/:id
### DELETE /api/communes/:id — blocked if villages exist
### POST /api/communes/import
CSV format: headers `name`, `moughataa`.

---

## Villages

### GET /api/villages?commune_id=uuid (filter optional)
```json
[{ "id": "uuid", "name": "...", "commune_id": "uuid", "commune": { "id": "uuid", "name": "..." } }]
```

### POST /api/villages
```json
Request: { "village": { "name": "...", "commune_id": "uuid" } }
```

### PATCH /api/villages/:id
### DELETE /api/villages/:id
### POST /api/villages/import
CSV format: headers `name`, `commune`.

---

## Payment Batches

### GET /api/payment_batches
```json
[{
  "id": "uuid", "payment_date": "2026-03-01", "status": "draft",
  "notes": "Salaires mars", "total": 2500000.0, "employees_count": 12,
  "created_by": { "id": "uuid", "name": "Admin" }, "created_at": "..."
}]
```

### GET /api/payment_batches/:id
Same plus:
```json
"employees": [
  { "id": "uuid", "employee_id": "uuid", "employee_name": "Ahmed Ould Mohamed", "months_count": 1, "amount": 50000.0 }
]
```

### POST /api/payment_batches
```json
Request: {
  "payment_batch": { "payment_date": "2026-03-01", "notes": "..." },
  "employees": [
    { "employee_id": "uuid", "months_count": 1, "amount": 50000.0 },
    { "employee_id": "uuid", "months_count": 2, "amount": 45000.0 }
  ]
}
```
`total` is computed server-side as `sum(amount * months_count)`.

### DELETE /api/payment_batches/:id — only if status is `draft`

---

## Users

### GET /api/users
```json
[{ "id": "uuid", "name": "Admin", "username": "admin", "role": "admin", "active": true, "permissions": {}, "created_at": "...", "updated_at": "..." }]
```

### POST /api/users
```json
Request: { "user": { "name": "...", "username": "...", "password": "...", "role": "user", "active": true, "permissions": {} } }
```
Admin cannot create super_admin. User cannot change own role.

### PATCH /api/users/:id — same fields (omit password to keep unchanged)
### DELETE /api/users/:id — cannot delete own account

---

## Standard Error Responses

```json
422: { "errors": ["Name can't be blank"] }
401: { "error": "Unauthorized" }
403: { "error": "Admin access required" }
404: { "error": "..." }
400: { "error": "..." }
```
