# BestCar - System Architecture

## Technology Stack

### Backend
- **Framework**: Ruby on Rails 8.0 (API mode)
- **Ruby Version**: 3.2.1+
- **Database**: PostgreSQL with pgcrypto extension (UUID support)
- **Authentication**: JWT tokens via JsonWebToken
- **Password Hashing**: bcrypt via `has_secure_password`
- **CORS**: rack-cors for cross-origin requests

### Frontend
- **Library**: React 19
- **Build Tool**: Vite 7
- **Router**: React Router DOM v6
- **HTTP Client**: Axios with interceptors
- **Styling**: Tailwind CSS (NO daisyUI)
- **Design System**: Nexus Dashboard 3.1 color palette
- **Language**: French UI with LTR layout
- **Dialogs**: Custom DialogContext (no native alert/confirm)

## Database Schema

### Multi-Tenant Tables

**tenants** (UUID primary key)
```ruby
t.uuid :id, primary_key: true
t.string :name, null: false
t.string :subdomain, index: { unique: true }
t.boolean :active, default: true, null: false
t.timestamps
```

**users** (integer primary key)
```ruby
t.string :name, null: false
t.string :username, null: false, index: { unique: true }
t.string :password_digest, null: false
t.string :role, null: false  # 'admin' or 'super_admin'
t.references :tenant, type: :uuid, null: false, foreign_key: true
t.timestamps

# Indexes
add_index :users, [:tenant_id, :role]
```

**car_models** (UUID primary key)
```ruby
t.uuid :id, primary_key: true
t.string :name, null: false
t.boolean :active, default: true, null: false
t.references :tenant, type: :uuid, null: false, foreign_key: true
t.timestamps

# Indexes
add_index :car_models, [:tenant_id, :name], unique: true
add_index :car_models, :active
```

**cars** (UUID primary key)
```ruby
t.uuid :id, primary_key: true
t.string :vin, null: false
t.references :car_model, type: :uuid, null: false, foreign_key: true
t.integer :year, null: false
t.string :color
t.integer :mileage
t.date :purchase_date, null: false
t.decimal :purchase_price, precision: 10, scale: 2, null: false
t.string :seller
t.string :location
t.decimal :clearance_cost, precision: 10, scale: 2
t.decimal :towing_cost, precision: 10, scale: 2
t.references :tenant, type: :uuid, null: false, foreign_key: true
t.timestamps

# Indexes
add_index :cars, [:tenant_id, :vin], unique: true
add_index :cars, :purchase_date

# Methods
def total_cost
  purchase_price + (clearance_cost || 0) + (towing_cost || 0) + expenses.sum(:amount)
end
```

**expense_categories** (UUID primary key)
```ruby
t.uuid :id, primary_key: true
t.string :name, null: false
t.string :expense_type, null: false  # 'reparation' or 'purchase'
t.boolean :active, default: true, null: false
t.references :tenant, type: :uuid, null: false, foreign_key: true
t.timestamps

# Indexes
add_index :expense_categories, [:tenant_id, :name], unique: true
add_index :expense_categories, :expense_type
add_index :expense_categories, :active
```

**expenses** (UUID primary key)
```ruby
t.uuid :id, primary_key: true
t.references :car, type: :uuid, null: false, foreign_key: true
t.references :expense_category, type: :uuid, null: false, foreign_key: true
t.decimal :amount, precision: 10, scale: 2, null: false
t.text :description
t.date :expense_date, null: false
t.references :tenant, type: :uuid, null: false, foreign_key: true
t.timestamps

# Indexes
add_index :expenses, [:tenant_id, :car_id]
add_index :expenses, :expense_date
```

## Multi-Tenant Architecture

### Tenant Isolation Strategy
- All entity tables include `tenant_id` UUID foreign key
- VIN uniqueness enforced per tenant (not globally)
- Controllers use `MultiTenantable` concern for automatic scoping
- Queries automatically filter by `current_user.tenant_id`

### Tenant Scoping Pattern
```ruby
# app/controllers/concerns/multi_tenantable.rb
module MultiTenantable
  def set_tenant
    @current_tenant = current_user&.tenant
  end
  
  def tenant_scope(model_class)
    model_class.for_tenant(current_tenant.id)
  end
end

# Usage in controllers
def index
  @cars = tenant_scope(Car).includes(:car_model, :expenses)
end
```

### Model Scoping
```ruby
# All models include:
scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
```

## Project Structure

### Backend (`/backend`)
```
app/
├── controllers/
│   ├── application_controller.rb
│   ├── concerns/
│   │   ├── authenticable.rb (JWT auth + role checks)
│   │   └── multi_tenantable.rb (tenant scoping)
│   └── api/
│       ├── auth_controller.rb
│       ├── dashboard_controller.rb
│       ├── tenants_controller.rb (super_admin only)
│       ├── cars_controller.rb
│       ├── car_models_controller.rb
│       ├── expense_categories_controller.rb
│       └── expenses_controller.rb
├── models/
│   ├── application_record.rb
│   ├── tenant.rb
│   ├── user.rb
│   ├── car_model.rb
│   ├── car.rb
│   ├── expense_category.rb
│   └── expense.rb
└── lib/
    └── json_web_token.rb (JWT encode/decode)
```

### Frontend (`/client/src`)
```
src/
├── App.jsx (routes configuration)
├── main.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Cars.jsx (list, create, edit, view)
│   ├── Settings.jsx (nested routes wrapper)
│   ├── CarModels.jsx
│   └── ExpenseCategories.jsx
├── components/
│   ├── Layout.jsx (header, nav, main)
│   └── SearchableSelect.jsx
├── context/
│   ├── AuthContext.jsx (login, logout, user state)
│   └── DialogContext.jsx (alert, confirm)
└── services/
    └── api.js (axios instance + API methods)
```

## API Architecture

### Base URL
**Development**: `http://localhost:3000/api`
**Production**: Set via `VITE_API_URL` environment variable

### Authentication Flow
1. POST `/api/auth/login` with username/password
2. Backend validates credentials with bcrypt
3. Backend generates JWT token (user_id encoded)
4. Response includes token + user object (with tenant_id)
5. Client stores token in localStorage
6. All requests include `Authorization: Bearer <token>`
7. `Authenticable` concern validates token, sets `@current_user`
8. `MultiTenantable` concern sets `@current_tenant` from user

### API Endpoints Structure
```
POST /api/auth/login

GET  /api/dashboard/statistics
     → Returns car count, expenses, recent activity

# Super Admin Only
GET    /api/tenants
POST   /api/tenants
PUT    /api/tenants/:id
DELETE /api/tenants/:id

# Tenant-scoped (auto-filtered by tenant_id)
GET    /api/cars
POST   /api/cars
GET    /api/cars/:id
PUT    /api/cars/:id
DELETE /api/cars/:id

GET    /api/car_models
GET    /api/car_models/active
POST   /api/car_models
PUT    /api/car_models/:id
DELETE /api/car_models/:id

GET    /api/expense_categories
GET    /api/expense_categories/active
POST   /api/expense_categories
PUT    /api/expense_categories/:id
DELETE /api/expense_categories/:id

GET    /api/expenses?car_id=xyz
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

## Entity Relationships

```
Tenant
  has_many :users
  has_many :car_models
  has_many :cars
  has_many :expense_categories
  has_many :expenses

User
  belongs_to :tenant
  # Roles: 'admin', 'super_admin'

CarModel
  belongs_to :tenant
  has_many :cars

Car
  belongs_to :tenant
  belongs_to :car_model
  has_many :expenses
  # Methods: total_cost, total_expenses

ExpenseCategory
  belongs_to :tenant
  has_many :expenses
  # Types: 'reparation', 'purchase'

Expense
  belongs_to :tenant
  belongs_to :car
  belongs_to :expense_category
```

## Data Flow Patterns

### Car Creation Flow
1. User fills form → POST /api/cars
2. Backend validates VIN uniqueness within tenant
3. Backend creates car with tenant_id from current_user
4. Frontend refreshes car list

### Cost Calculation Flow
1. Car model includes `total_cost` method
2. Method sums: purchase_price + clearance_cost + towing_cost + expenses.sum(:amount)
3. Dashboard displays aggregated costs
4. Car detail view shows itemized breakdown

### Expense Tracking Flow
1. User selects car → views expenses for that car
2. User adds expense with category and amount
3. Backend validates and creates expense with tenant_id
4. Car's total_cost automatically updates (calculated field)

## Environment Configuration

### Development
```bash
# Backend
DATABASE: bestcar_development
PORT: 3000

# Frontend
VITE_API_URL=http://localhost:3000/api
PORT: 5173 (Vite default)
```

### Production
```yaml
# backend/config/database.yml
production:
  database: bestcar_production
  username: bestcar
  password: <%= ENV["BESTCAR_DATABASE_PASSWORD"] %>

# client/.env.production
VITE_API_URL=https://your-domain.com/api
```

## Running the Application

### Setup Commands
```bash
# Backend
cd backend
bundle install
bundle exec rails db:create
bundle exec rails db:migrate
bundle exec rails db:seed

# Frontend
cd client
npm install
```

### Development
```bash
# From root directory
npm run dev
# Runs Rails (port 3000) and Vite (port 5173) concurrently

# Or separately:
cd backend && bundle exec rails server -p 3000
cd client && npm run dev
```

### Production Build
```bash
cd client
npm run build  # Creates dist/ folder
# Deploy dist/ to nginx or static hosting
```

## Seeded Data

**Tenants**:
- Demo Salvage Cars (subdomain: demo)

**Users**:
- `superadmin` / `superadmin123` (Super Admin)
- `admin` / `admin123` (Admin - Demo tenant)

**Car Models** (10 models):
Toyota Camry, Honda Accord, Ford F-150, Chevrolet Silverado, BMW 3 Series, Mercedes-Benz C-Class, Audi A4, Tesla Model 3, Nissan Altima, Hyundai Sonata

**Expense Categories** (14 categories):
- Reparation: Engine Repair, Body Work, Paint Job, Interior Repair, Tire Replacement, Transmission Repair, Electrical Work
- Purchase: Auction Fees, Shipping Costs, Customs Clearance, Towing Service, Insurance, Storage Fees, Other

**Sample Cars** (development only):
- 2020 Toyota Camry (VIN: 1HGCM82633A123456)
- 2019 Honda Accord (VIN: 1HGCM82633A789012)

## Security Considerations

- **JWT Tokens**: Stored in localStorage, sent via Authorization header
- **Password Hashing**: bcrypt with automatic salting
- **Tenant Isolation**: Automatic filtering by tenant_id
- **Role-Based Access**: Admin vs Super Admin permissions
- **CORS**: Configured for allowed origins only
- **SQL Injection**: Protected via ActiveRecord parameterized queries
- **Cross-Tenant Access**: Prevented by automatic tenant scoping
