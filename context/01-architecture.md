# Mahdara - System Architecture

## Technology Stack

### Backend
- **Framework**: Ruby on Rails 8.0 (API mode)
- **Database**: PostgreSQL with UUID primary keys (`pgcrypto`)
- **Authentication**: JWT tokens (24h expiration), bcrypt passwords
- **HTTP Client**: HTTParty (for Gov API calls)
- **CORS**: rack-cors

### Frontend
- **Library**: React 19
- **Build Tool**: Vite 7
- **Router**: React Router DOM v6
- **HTTP Client**: Axios with interceptors
- **Styling**: Pure Tailwind CSS (NO daisyUI)
- **Design System**: Nexus Dashboard 3.1 color palette
- **Language**: Arabic UI, RTL layout (`dir="rtl"` on `<html lang="ar">`)
- **Dialogs**: Custom DialogContext (no native alert/confirm)

## Client Route Structure

- `/` — Landing (redirects to `/admin/login`)
- `/admin/login` — Login page
- `/admin` — Dashboard
- `/admin/employees` — Employee list
- `/admin/employees/:id` — Employee detail + contracts
- `/admin/payments` — Payment batches list
- `/admin/payments/new` — Create payment batch
- `/admin/settings/employee-types` — Employee types CRUD
- `/admin/settings/wilayas` — Wilayas CRUD + CSV import
- `/admin/settings/moughataa` — Moughataa CRUD + CSV import
- `/admin/settings/communes` — Communes CRUD + CSV import
- `/admin/settings/villages` — Villages CRUD + CSV import
- `/admin/settings/users` — Users management

## Project Structure

```
mahdara-payment/
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── application_controller.rb
│   │   │   ├── concerns/
│   │   │   │   └── authenticable.rb      # JWT auth (authorize_request, require_admin)
│   │   │   └── api/
│   │   │       ├── auth_controller.rb
│   │   │       ├── dashboard_controller.rb
│   │   │       ├── users_controller.rb
│   │   │       ├── employee_types_controller.rb
│   │   │       ├── employees_controller.rb
│   │   │       ├── contracts_controller.rb
│   │   │       ├── wilayas_controller.rb
│   │   │       ├── moughataa_controller.rb
│   │   │       ├── communes_controller.rb
│   │   │       ├── villages_controller.rb
│   │   │       └── payment_batches_controller.rb
│   │   ├── models/
│   │   │   ├── user.rb
│   │   │   ├── employee_type.rb
│   │   │   ├── employee.rb
│   │   │   ├── contract.rb
│   │   │   ├── wilaya.rb
│   │   │   ├── moughataa.rb
│   │   │   ├── commune.rb
│   │   │   ├── village.rb
│   │   │   ├── payment_batch.rb
│   │   │   └── payment_batch_employee.rb
│   │   └── services/
│   │       └── huwiyeti_service.rb       # Gov API NNI lookup
│   ├── config/
│   │   ├── routes.rb
│   │   └── initializers/
│   │       ├── cors.rb
│   │       └── inflections.rb            # moughataa is uncountable
│   ├── db/
│   │   ├── migrate/
│   │   ├── schema.rb
│   │   └── seeds.rb                      # superadmin + admin users
│   └── lib/
│       └── json_web_token.rb
│
└── client/
    └── src/
        ├── App.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── DialogContext.jsx
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Employees.jsx
        │   ├── EmployeeDetail.jsx
        │   ├── PaymentBatches.jsx
        │   ├── NewPaymentBatch.jsx
        │   ├── Settings.jsx
        │   ├── EmployeeTypes.jsx
        │   ├── Wilayas.jsx
        │   ├── Moughataa.jsx
        │   ├── Communes.jsx
        │   ├── Villages.jsx
        │   └── Users.jsx
        ├── components/
        │   └── Layout.jsx
        └── services/
            └── api.js
```

## Database Schema

### users
```ruby
t.string :name, null: false
t.string :username, null: false, index: { unique: true }
t.string :password_digest, null: false
t.string :role, null: false        # 'super_admin', 'admin', 'user'
t.boolean :active, default: true
t.jsonb :permissions, default: {}
t.timestamps
```

### employee_types
```ruby
t.string :name, null: false, index: { unique: true }
t.boolean :active, default: true
t.timestamps
```

### wilayas
```ruby
t.string :name, null: false, index: { unique: true }
t.string :code
t.timestamps
```

### moughataa (table name is exactly "moughataa" — uncountable inflection)
```ruby
t.references :wilaya, null: false, foreign_key: true, type: :uuid
t.string :name, null: false
t.timestamps
# unique index on [:wilaya_id, :name]
```

### communes
```ruby
t.references :moughataa, null: false, foreign_key: { to_table: "moughataa" }, type: :uuid
t.string :name, null: false
t.timestamps
# unique index on [:moughataa_id, :name]
```

### villages
```ruby
t.references :commune, null: false, foreign_key: true, type: :uuid
t.string :name, null: false
t.timestamps
# unique index on [:commune_id, :name]
```

### employees
```ruby
t.string :nni, null: false, index: { unique: true }
t.string :first_name, null: false
t.string :last_name, null: false
t.date :birth_date
t.string :phone
t.boolean :active, default: true
t.references :employee_type, null: false, foreign_key: true, type: :uuid
t.references :wilaya, foreign_key: true, type: :uuid         # optional
t.references :moughataa, foreign_key: { to_table: :moughataa }, type: :uuid  # optional
t.references :commune, foreign_key: true, type: :uuid        # optional
t.references :village, foreign_key: true, type: :uuid        # optional
t.timestamps
```

### contracts
```ruby
t.references :employee, null: false, foreign_key: true, type: :uuid
t.string :contract_type, null: false   # 'CDI' or 'CDD'
t.decimal :amount, precision: 15, scale: 2, null: false
t.date :start_date, null: false
t.integer :duration_months             # null for CDI, required for CDD
t.boolean :active, default: true
t.timestamps
```

### payment_batches
```ruby
t.date :payment_date, null: false
t.string :status, default: 'draft'    # 'draft' or 'confirmed'
t.text :notes
t.references :created_by, foreign_key: { to_table: :users }, type: :uuid
t.timestamps
```

### payment_batch_employees
```ruby
t.references :payment_batch, null: false, foreign_key: true, type: :uuid
t.references :employee, null: false, foreign_key: true, type: :uuid
t.integer :months_count, null: false
t.decimal :amount, precision: 15, scale: 2, null: false
t.timestamps
# unique index on [:payment_batch_id, :employee_id]
```

## Entity Relationships

```
User (standalone, no tenant)

EmployeeType
  has_many :employees

Wilaya
  has_many :moughataa

Moughataa
  belongs_to :wilaya
  has_many :communes

Commune
  belongs_to :moughataa
  has_many :villages

Village
  belongs_to :commune

Employee
  belongs_to :employee_type
  belongs_to :wilaya (optional)
  belongs_to :moughataa (optional)
  belongs_to :commune (optional)
  belongs_to :village (optional)
  has_many :contracts
  has_many :payment_batch_employees

Contract
  belongs_to :employee

PaymentBatch
  belongs_to :created_by (User)
  has_many :payment_batch_employees
  has_many :employees, through: :payment_batch_employees

PaymentBatchEmployee
  belongs_to :payment_batch
  belongs_to :employee
```

## Authentication Flow

1. POST `/api/auth/login` with `{ username, password }`
2. Rails validates with bcrypt, generates JWT (24h)
3. Response: `{ token, user: { id, name, username, role, permissions } }`
4. Client stores in `localStorage`, sets `AuthContext`
5. All requests include `Authorization: Bearer <token>`
6. `Authenticable` concern validates and sets `@current_user`

## Seeded Data

Two default users (no tenant):
- `superadmin` / `password123` (super_admin role)
- `admin` / `password123` (admin role)

## Deployment

- **Domain**: `mahdara.next-version.com` (single domain, frontend + API)
- **Port**: Rails runs on `3062` (configured in `backend/.env` and `puma.rb`)
- **Nginx**: serves React SPA from `/var/www/mahdara-payment/client/dist`, proxies `/api/` to port 3062
- **Systemd service**: `mahdara` (`mahdara.service`)
- **Config files**: `mahdara.conf` (nginx), `mahdara.service` (systemd)
- **CORS allowed origins**: `http://localhost:5173`, `https://mahdara.next-version.com`

## Development

```bash
# Backend
cd backend && rails server -p 3062
# → http://localhost:3062/api

# Frontend
cd client && npm run dev
# → http://localhost:5173 (proxies /api → 3062)
```
