# Glamova - System Architecture

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

### Frontend
- **Library**: React 19
- **Build Tool**: Vite 7
- **Router**: React Router DOM v6
- **HTTP Client**: Axios with interceptors
- **Styling**: Pure Tailwind CSS (NO daisyUI)
- **Design System**: Nexus Dashboard 3.1 color palette
- **Language**: French UI with LTR layout
- **Localization**: French dates (`fr-FR`)
- **Dialogs**: Custom DialogContext (no native alert/confirm)

## Project Structure

```
glamova/
├── backend/                    # Rails API backend
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── application_controller.rb
│   │   │   ├── concerns/
│   │   │   │   └── authenticable.rb    # JWT authentication concern
│   │   │   └── api/
│   │   │       ├── auth_controller.rb
│   │   │       ├── dashboard_controller.rb
│   │   │       ├── products_controller.rb
│   │   │       ├── purchases_controller.rb
│   │   │       ├── brands_controller.rb
│   │   │       ├── expense_types_controller.rb
│   │   │       ├── expenses_controller.rb
│   │   │       ├── clients_controller.rb
│   │   │       └── sales_controller.rb
│   │   ├── models/
│   │   │   ├── user.rb
│   │   │   ├── brand.rb
│   │   │   ├── product.rb
│   │   │   ├── purchase.rb
│   │   │   ├── purchase_item.rb
│   │   │   ├── expense_type.rb
│   │   │   ├── expense.rb
│   │   │   ├── client.rb
│   │   │   ├── sale.rb
│   │   │   └── sale_item.rb
│   │   └── services/
│   │       ├── image_fetcher.rb          # URL image fetching service
│   │       └── sale_invoice_generator.rb # PDF invoice generation
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
│   │   │   ├── Products.jsx
│   │   │   ├── Purchases.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Brands.jsx
│   │   │   ├── ExpenseTypes.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── POS.jsx
│   │   │   └── Sales.jsx
│   │   └── services/
│   │       └── api.js           # Axios configuration
│   ├── .env                     # Development API URL
│   ├── .env.production          # Production API URL
│   ├── package.json
│   └── vite.config.js
│
└── context/                     # Agent documentation
    ├── 00-project-identity.md
    ├── 01-architecture.md       # This file
    ├── 02-conventions.md
    ├── 03-api-contracts.md
    ├── 04-boundaries.md
    └── 05-operating-rules.md
```

## Database Schema

### users
```ruby
t.string :name, null: false
t.string :username, null: false, index: { unique: true }
t.string :password_digest, null: false
t.string :role, null: false  # 'admin' or 'operator'
t.timestamps
```

**Note**: `filiere_id` removed from original system

### brands
```ruby
t.string :name, null: false
t.timestamps

# Indexes
add_index :brands, :name, unique: true
```

### products
```ruby
t.string :name, null: false
t.text :description
t.string :sku, null: false
t.references :brand, null: true, foreign_key: true
t.integer :current_stock, default: 0, null: false
t.integer :reorder_level, default: 0, null: false
t.decimal :sale_price, precision: 10, scale: 2  # Default selling price
t.timestamps

# Indexes
add_index :products, :sku, unique: true
add_index :products, :name

# Active Storage
has_one_attached :image  # Managed via Active Storage tables
```

**Image Variants**:

- `thumbnail` - 200x200 (legacy, not used)
- `medium_image` - 800x800 (used for product list display)

### purchases
```ruby
t.date :purchase_date, null: false
t.string :supplier, null: false
t.decimal :delivery_cost, precision: 10, scale: 2, default: 0.0, null: false
t.decimal :discount, precision: 10, scale: 2, default: 0.0, null: false
t.decimal :total_product_cost, precision: 10, scale: 2, default: 0.0, null: false
t.text :notes
t.string :status, default: 'pending', null: false
t.string :currency, default: 'EUR', null: false
t.decimal :exchange_rate, precision: 10, scale: 4, default: 1.0, null: false
t.timestamps

# Indexes
add_index :purchases, :purchase_date
add_index :purchases, :status
```

**Status**: 'pending' | 'completed' | 'cancelled'
**Currency**: 'EUR' | 'USD' | 'MRU'

### purchase_items
```ruby
t.references :purchase, null: false, foreign_key: true
t.references :product, null: false, foreign_key: true
t.integer :quantity, null: false
t.decimal :unit_cost, precision: 10, scale: 2, null: false
t.timestamps

# Composite unique constraint
add_index :purchase_items, [:purchase_id, :product_id], unique: true
```

### expense_types
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

### clients
```ruby
t.string :name, null: false
t.string :phone, null: false
t.string :email
t.text :address
t.timestamps

# Indexes
add_index :clients, :phone, unique: true
add_index :clients, :name
```

### sales
```ruby
t.date :sale_date, null: false
t.references :client, null: false, foreign_key: true
t.decimal :discount, precision: 10, scale: 2, default: 0.0, null: false
t.decimal :total_product_cost, precision: 10, scale: 2, default: 0.0, null: false
t.decimal :payment_amount, precision: 10, scale: 2, null: false
t.string :status, default: 'pending', null: false
t.text :notes
t.timestamps

# Indexes
add_index :sales, :sale_date
add_index :sales, :status

# Active Storage
has_one_attached :invoice_pdf  # Auto-generated on completion
```

**Status**: 'pending' | 'completed' | 'cancelled'
**Currency**: Always MRU (no multi-currency for sales)

### sale_items
```ruby
t.references :sale, null: false, foreign_key: true
t.references :product, null: false, foreign_key: true
t.integer :quantity, null: false
t.decimal :unit_price, precision: 10, scale: 2, null: false
t.timestamps

# Composite unique constraint
add_index :sale_items, [:sale_id, :product_id], unique: true
```

## Entity Relationships

```
User
  (no associations - standalone)

Brand
  has_many :products, dependent: :restrict_with_error

Product
  belongs_to :brand, optional: true
  has_many :purchase_items, dependent: :restrict_with_error
  has_many :purchases, through: :purchase_items
  has_many :sale_items, dependent: :restrict_with_error
  has_many :sales, through: :sale_items

Purchase
  has_many :purchase_items, dependent: :destroy
  has_many :products, through: :purchase_items
  accepts_nested_attributes_for :purchase_items

PurchaseItem (Join Table)
  belongs_to :purchase
  belongs_to :product

Client
  has_many :sales, dependent: :restrict_with_error

Sale
  belongs_to :client
  has_many :sale_items, dependent: :destroy
  has_many :products, through: :sale_items
  accepts_nested_attributes_for :sale_items

SaleItem (Join Table)
  belongs_to :sale
  belongs_to :product

ExpenseType
  has_many :expenses, dependent: :restrict_with_error

Expense
  belongs_to :expense_type
```

## Data Flow Architecture

### Authentication Flow
1. User → `POST /api/auth/login` → Rails AuthController
2. Rails validates credentials with bcrypt
3. Rails generates JWT token (24h expiration)
4. Client stores token in localStorage
5. All subsequent requests include `Authorization: Bearer <token>`
6. `Authenticable` concern validates token and sets `@current_user`

### Purchase Workflow
1. Admin creates purchase (pending status)
2. Purchase has multiple purchase_items (line items)
3. Admin completes purchase → stock automatically updated (incremented)
4. Completed purchases locked from editing
5. Admin can uncomplete → reverts stock, status → pending

### Sales Workflow (POS)
1. User creates sale (pending status)
2. Sale has multiple sale_items (line items)
3. User completes sale → stock automatically decremented, PDF invoice generated
4. Completed sales can be viewed (read-only)
5. Admin can cancel sale → reverts stock, status → cancelled

### Stock Calculation
```
Product.current_stock is NEVER manually edited
  ↓
Only updated via:
  - Purchase.complete_purchase! (increments stock)
  - Sale.complete_sale! (decrements stock)
  ↓
Purchases add stock, Sales remove stock
  ↓
Uncompleting/cancelling reverses stock changes
```

## Deployment Architecture

### Development Environment
```
Terminal 1: Rails API
  cd backend && rails server -p 3000
  → http://localhost:3000/api

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
VITE_API_URL=http://localhost:3000/api
```

**Production** (`.env.production`):
```
VITE_API_URL=https://tajweed.next-version.com/api
```

**Frontend Usage**:
```javascript
// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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
  database: glamova_development
```

**Production**:
```yaml
production:
  database: glamova_production
  username: glamova
  password: <%= ENV["GLAMOVA_DATABASE_PASSWORD"] %>
```

### CORS Configuration

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173", "http://localhost:3001"
    resource "*", headers: :any, methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

## Performance Considerations

- **Database Indexes**: sku, purchase_date, status, expense_date
- **Eager Loading**: Use `.includes()` to prevent N+1 queries
- **Decimal Precision**: decimal(10,2) for money, decimal(10,4) for exchange rates
- **Default Scopes**: Expenses ordered by date desc
- **Transaction Safety**: Multi-step operations wrapped in transactions

## Security Considerations

- **JWT Expiration**: 24 hours
- **Password Hashing**: bcrypt with salting
- **Strong Parameters**: Whitelist permitted attributes
- **CORS**: Restrict origins in production
- **Authorization**: Role-based access control (admin vs operator)
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
cd backend && bundle exec rails server -p 3000
cd client && npm run dev
```

### Production Build
```bash
cd client
npm run build              # Creates dist/ folder
# Deploy dist/ to nginx
```

## Seeded Data

**Default Users**:
- `admin` / `admin123` (Administrator)
- `operator` / `operator123` (Operator)

**Expense Types** (10 categories):
Rent, Salary, Utilities, Transportation, Marketing, Equipment, Maintenance, Insurance, Taxes, Other

**Sample Products** (development only):
3 demo products with SKUs
