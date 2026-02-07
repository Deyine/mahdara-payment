# BestCar - System Architecture

## Technology Stack

### Backend
- **Framework**: Ruby on Rails 8.0 (API mode)
- **Ruby Version**: 3.2.1
- **Database**: PostgreSQL
- **Authentication**: JWT tokens (24h expiration)
- **Password Hashing**: bcrypt via `has_secure_password`
- **CORS**: rack-cors for cross-origin requests
- **HTTP Client**: httparty ~> 0.21 for fetching images from URLs
- **Image Processing**: image_processing ~> 1.2 with Active Storage

### Frontend (Admin Dashboard)
- **Library**: React 19
- **Build Tool**: Vite 7
- **Router**: React Router DOM v6
- **HTTP Client**: Axios with interceptors
- **Styling**: Pure Tailwind CSS (NO daisyUI)
- **Design System**: Nexus Dashboard 3.1 color palette
- **Language**: French UI with LTR layout
- **Localization**: French dates (`fr-FR`)
- **Dialogs**: Custom DialogContext (no native alert/confirm)

### Mobile (Public Catalog)

- **Framework**: React Native 0.81.5
- **Platform**: Expo SDK 54
- **Node Version**: 22.16.0
- **Router**: expo-router ~6.0.23 (file-based navigation)
- **HTTP Client**: Native fetch API
- **Styling**: StyleSheet.create with inline styles
- **Design System**: Custom theme (colors, fonts)
- **Language**: French UI
- **Target**: iOS & Android (via Expo Go)

## Project Structure

```
bestcar/
├── backend/                    # Rails API backend
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── application_controller.rb
│   │   │   ├── concerns/
│   │   │   │   └── authenticable.rb    # JWT authentication concern
│   │   │   └── api/
│   │   │       ├── auth_controller.rb
│   │   │       ├── dashboard_controller.rb
│   │   │       ├── cars_controller.rb
│   │   │       ├── catalog_controller.rb   # Public catalog API
│   │   │       ├── car_models_controller.rb
│   │   │       ├── expense_categories_controller.rb
│   │   │       └── expenses_controller.rb
│   │   ├── models/
│   │   │   ├── tenant.rb
│   │   │   ├── user.rb
│   │   │   ├── car.rb
│   │   │   ├── car_model.rb
│   │   │   ├── expense_category.rb
│   │   │   └── expense.rb
│   │   └── services/
│   │       └── image_fetcher.rb          # URL image fetching service
│   ├── config/
│   │   ├── routes.rb
│   │   ├── database.yml
│   │   └── initializers/
│   │       └── cors.rb
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   ├── lib/
│   │   └── json_web_token.rb    # JWT encoding/decoding
│   ├── Gemfile
│   └── .ruby-version            # 3.2.1
│
├── client/                      # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── DialogContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Cars.jsx
│   │   │   ├── CarDetail.jsx
│   │   │   ├── ImportCars.jsx
│   │   │   ├── Settings.jsx          # Settings container with tabs
│   │   │   ├── CarModels.jsx         # Settings sub-page
│   │   │   ├── ExpenseCategories.jsx # Settings sub-page
│   │   │   ├── Sellers.jsx           # Settings sub-page
│   │   │   ├── PaymentMethods.jsx    # Settings sub-page
│   │   │   ├── Tags.jsx              # Settings sub-page
│   │   │   └── Users.jsx             # Settings sub-page (user management)
│   │   └── services/
│   │       └── api.js           # Axios configuration
│   ├── .env                     # Development API URL
│   ├── .env.production          # Production API URL
│   ├── package.json
│   └── vite.config.js
│
├── mobile/                      # React Native mobile app (Expo)
│   ├── app/                     # expo-router screens
│   │   ├── _layout.js          # Root navigation layout
│   │   ├── index.js            # Catalog list screen
│   │   └── car/
│   │       └── [id].js         # Car detail screen
│   ├── components/
│   │   ├── CarCard.js          # Catalog card component
│   │   ├── StatusBadge.js      # Status badge
│   │   └── PhotoViewer.js      # Fullscreen photo viewer
│   ├── services/
│   │   └── api.js              # Fetch-based API client
│   ├── constants/
│   │   └── theme.js            # Design tokens
│   ├── utils/
│   │   └── formatters.js       # Price & mileage formatters
│   ├── assets/                 # Images & icons
│   ├── app.json                # Expo configuration
│   ├── package.json
│   └── .nvmrc                  # Node 22.16.0
│
└── context/                     # Agent documentation
    ├── 00-project-identity.md
    ├── 01-architecture.md       # This file
    ├── 02-conventions.md
    ├── 03-api-contracts.md
    ├── 04-boundaries.md
    ├── 05-operating-rules.md
    └── 06-mobile-app.md         # Mobile app documentation
```

## Database Schema

### tenants
```ruby
t.string :name, null: false
t.string :subdomain, null: false, index: { unique: true }
t.timestamps
```

### users
```ruby
t.string :name, null: false
t.string :username, null: false, index: { unique: true }
t.string :password_digest, null: false
t.string :role, null: false  # 'admin', 'super_admin', or 'manager'
t.references :tenant, null: false, foreign_key: true, type: :uuid
t.timestamps
```

**Roles**:
- `admin`: Full CRUD access within tenant
- `super_admin`: System-wide access, can manage tenants
- `manager`: Read-only access to all data within tenant

### car_models
```ruby
t.references :tenant, null: false, foreign_key: true, type: :uuid
t.string :name, null: false
t.boolean :active, default: true, null: false
t.timestamps

# Indexes
add_index :car_models, [:tenant_id, :name], unique: true
```

### cars
```ruby
t.uuid :id, primary_key: true
t.references :tenant, null: false, foreign_key: true, type: :uuid
t.string :vin, null: false
t.references :car_model, null: false, foreign_key: true, type: :uuid
t.integer :year, null: false
t.string :color
t.integer :mileage
t.date :purchase_date, null: false
t.decimal :purchase_price, precision: 10, scale: 2, null: false
t.string :seller
t.string :location
t.decimal :clearance_cost, precision: 10, scale: 2
t.decimal :towing_cost, precision: 10, scale: 2
t.datetime :deleted_at
t.string :status, default: 'active', null: false  # 'active', 'sold', or 'rental'
t.decimal :sale_price, precision: 10, scale: 2
t.date :sale_date
t.references :profit_share_user, foreign_key: { to_table: :users }, type: :bigint
t.decimal :profit_share_percentage, precision: 5, scale: 2, default: 0
t.decimal :daily_rental_rate, precision: 10, scale: 2
t.timestamps

# Indexes
add_index :cars, [:tenant_id, :vin], unique: true
add_index :cars, :deleted_at
add_index :cars, :status

# Active Storage
has_many_attached :salvage_photos
has_many_attached :after_repair_photos
has_many_attached :invoices
```

### expense_categories
```ruby
t.string :name, null: false
t.text :description
t.boolean :active, default: true, null: false
t.timestamps

# Indexes
add_index :expense_types, :name, unique: true
add_index :expense_types, :active
```

### expenses
```ruby
t.date :expense_date, null: false
t.references :expense_type, null: false, foreign_key: true
t.decimal :amount, precision: 10, scale: 2, null: false
t.text :description
t.string :currency, default: 'EUR', null: false
t.decimal :exchange_rate, precision: 10, scale: 4, default: 1.0, null: false
t.timestamps

add_index :expenses, :expense_date
```

### payment_methods
```ruby
t.integer :id, primary_key: true
t.references :tenant, null: false, foreign_key: true, type: :uuid
t.string :name, null: false
t.boolean :active, default: true, null: false
t.timestamps

# Indexes
add_index :payment_methods, [:tenant_id, :name], unique: true
```

### payments
```ruby
t.uuid :id, primary_key: true
t.references :tenant, null: false, foreign_key: true, type: :uuid
t.references :car, null: false, foreign_key: true, type: :uuid
t.decimal :amount, precision: 10, scale: 2, null: false
t.date :payment_date, null: false
t.references :payment_method, foreign_key: true, type: :integer  # optional
t.text :notes
t.timestamps

# Indexes
add_index :payments, :payment_date
add_index :payments, [:car_id, :payment_date]
```

### rental_transactions
```ruby
t.integer :id, primary_key: true
t.references :tenant, null: false, foreign_key: true, type: :uuid
t.references :car, null: false, foreign_key: true, type: :uuid
t.date :start_date, null: false
t.date :end_date
t.integer :days
t.decimal :daily_rate, precision: 10, scale: 2, null: false
t.decimal :amount, precision: 10, scale: 2
t.string :status, default: 'in_progress', null: false  # 'in_progress' or 'completed'
t.text :notes
t.timestamps

# Indexes
add_index :rental_transactions, :status
add_index :rental_transactions, [:car_id, :start_date]
```


## Entity Relationships

```
Tenant
  has_many :users
  has_many :car_models
  has_many :cars
  has_many :expense_categories
  has_many :expenses
  has_many :payment_methods
  has_many :payments
  has_many :rental_transactions

User
  belongs_to :tenant

CarModel
  belongs_to :tenant
  has_many :cars

Car
  belongs_to :tenant
  belongs_to :car_model
  belongs_to :profit_share_user, class_name: 'User', optional: true
  has_many :expenses
  has_many :payments (dependent: :restrict_with_error)
  has_many :rental_transactions (dependent: :restrict_with_error)
  has_many_attached :salvage_photos
  has_many_attached :after_repair_photos
  has_many_attached :invoices

ExpenseCategory
  belongs_to :tenant
  has_many :expenses

Expense
  belongs_to :tenant
  belongs_to :car, optional: true
  belongs_to :expense_category

PaymentMethod
  belongs_to :tenant
  has_many :payments (dependent: :restrict_with_error)

Payment
  belongs_to :tenant
  belongs_to :car
  belongs_to :payment_method, optional: true

RentalTransaction
  belongs_to :tenant
  belongs_to :car
```

## Data Flow Architecture

### Authentication Flow
1. User → `POST /api/auth/login` → Rails AuthController
2. Rails validates credentials with bcrypt
3. Rails generates JWT token (24h expiration)
4. Client stores token in localStorage
5. All subsequent requests include `Authorization: Bearer <token>`
6. `Authenticable` concern validates token and sets `@current_user`

### Car Management Workflow
1. Admin creates car record (status='active')
2. Car linked to car_model and tenant
3. Upload salvage photos, invoices via Active Storage
4. Track expenses linked to specific car
5. When ready to sell: Mark as sold with sale price
6. Track payments until fully paid
7. Soft delete (deleted_at timestamp) if needed

### Expense Tracking Workflow
1. Create expense linked to car (optional) and category
2. Support multi-currency with exchange rates
3. Track repair expenses vs purchase-related expenses
4. Expenses scoped by tenant for multi-tenancy

### Sales & Payment Workflow
1. Admin marks car as sold (POST /api/cars/:id/sell)
   - Sets status='sold', sale_price, sale_date
   - Profit automatically calculated
2. Admin records payments (POST /api/payments)
   - Track installment payments
   - System prevents overpayment
   - Calculate remaining balance
3. Payment progress tracked until fully paid
   - payment_percentage updated
   - fully_paid flag set when complete
4. Cannot revert to active once payments recorded
5. Optional profit sharing configuration
   - Assign percentage-based profit share to user
   - Calculates user_profit_amount and company_net_profit
   - Only applicable when car is sold and has profit

### Rental Workflow
1. Admin marks car as rental (POST /api/cars/:id/rent)
   - Sets status='rental', daily_rental_rate
   - Calculates rental_break_even (total_cost / daily_rate)
2. Admin creates rental transactions (POST /api/rental_transactions)
   - Track rental start_date, daily_rate
   - Status='in_progress'
   - Only one active rental per car
3. Complete rental transaction (POST /api/rental_transactions/:id/complete)
   - Sets end_date (defaults to current date)
   - Calculates days and amount
   - Updates car's total_rental_income
   - Status changed to 'completed'
4. Return car to active (POST /api/cars/:id/return_rental)
   - Cannot have active rental transactions
   - Preserves rental history
   - Optionally clears daily_rental_rate

## Deployment Architecture

### Development Environment
```
Terminal 1: Rails API
  cd backend && rails server -p 3061
  → http://localhost:3061/api

Terminal 2: Vite Dev Server
  cd client && npm run dev
  → http://localhost:5173
```

### Production Environment
```
Backend: Rails API
  → Deployed on production server
  → PostgreSQL database
  → Nginx reverse proxy

Frontend: Static Vite Build
  → npm run build → dist/ folder
  → Served by Nginx
  → API calls to production backend URL
```

## Environment Configuration

### Vite Build-Time Variables

**CRITICAL**: Vite bundles environment variables at **build time**, not runtime.

**Development** (`.env`):
```
VITE_API_URL=http://localhost:3061/api
```

**Production** (`.env.production`):
```
VITE_API_URL=https://api.bestcar-mr.com/api
```

**Frontend Usage**:
```javascript
// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3061/api';
```

**Deployment Process**:
1. Create `.env.production` with production API URL
2. Run `npm run build` (Vite hardcodes URL into static files)
3. Deploy `dist/` folder to nginx

### Database Configuration

**Development**:
```yaml
development:
  adapter: postgresql
  database: bestcar_development
```

**Production**:
```yaml
production:
  database: bestcar_production
  username: admin
  password: <%= ENV["BESTCAR_DATABASE_PASSWORD"] %>
```

### CORS Configuration

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173", "https://bestcar-mr.com"
    resource "*", headers: :any, methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

## Performance Considerations

- **Database Indexes**: VIN, tenant_id, car_model, expense_date, deleted_at
- **Eager Loading**: Use `.includes()` to prevent N+1 queries
- **Decimal Precision**: decimal(10,2) for money, decimal(10,4) for exchange rates
- **Soft Deletes**: Cars use deleted_at timestamp
- **Multi-Tenancy**: All queries scoped by tenant_id

## Security Considerations

- **JWT Expiration**: 24 hours
- **Password Hashing**: bcrypt with salting
- **Strong Parameters**: Whitelist permitted attributes
- **CORS**: Restrict origins in production
- **Authorization**: Role-based access control (admin vs super_admin)
- **Multi-Tenancy**: Tenant isolation via subdomain
- **SQL Injection**: Protected via ActiveRecord parameterized queries

## Running the Application

### Database Commands
```bash
cd backend
bundle exec rails db:create      # Create databases
bundle exec rails db:migrate     # Run migrations
bundle exec rails db:seed        # Seed default data
bundle exec rails db:reset       # Reset database
```

### Development Server
```bash
# From project root
npm run dev

# Or separately:
cd backend && bundle exec rails server -p 3061
cd client && npm run dev
```

### Production Build

```bash
cd client
npm run build              # Creates dist/ folder
# Deploy dist/ to nginx
```

## Server Configuration

### Puma Web Server

The Rails backend uses Puma configured to bind only to localhost for security with reverse proxy deployment.

**Configuration** (`backend/config/puma.rb`):

```ruby
# Bind to localhost only for reverse proxy setup (nginx)
# This prevents direct external access to the Rails app
bind "tcp://127.0.0.1:#{ENV.fetch('PORT', 3061)}"
```

**Security Benefits**:

- Backend not directly accessible from external network
- All traffic must go through reverse proxy (nginx)
- Defense in depth - even if nginx config has issues, backend isn't reachable
- Only localhost connections accepted on port 3061

**Reverse Proxy Integration**:

The Puma server listens on `127.0.0.1:3061` and should be accessed via nginx reverse proxy:

```nginx
upstream rails_backend {
  server 127.0.0.1:3061;
}

server {
  listen 80;
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://rails_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Local Development**:

In development, the localhost binding is still accessible from the same machine:

```bash
# Works - same machine
curl http://localhost:3061/api/health

# Connection refused - external access blocked
curl http://server-ip:3061/api/health
```

**Environment Variables**:

- `PORT`: Server port (default: 3061)
- `RAILS_MAX_THREADS`: Thread pool size (default: 3)

## Seeded Data

**Default Tenant**:
- Name: "BestCar"
- Subdomain: "bestcar"

**Default Users**:
- `admin` / `admin123` (admin role)
- `super_admin` / `super123` (super_admin role)

**Expense Categories**:
- Repair, Towing, Clearance, Parts, Labor, Insurance, Registration, Other
