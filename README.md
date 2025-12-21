# Glamova - Stock Management System

A comprehensive web application for managing inventory, purchases, and expenses. Built for importers who buy products from international suppliers and need to track costs, stock levels, and business expenses.

## 🎯 Features

### For Admin
- **Product Management**: Create, update, and delete products with SKU, stock levels, and reorder points
- **Purchase Management**: Record purchases from suppliers with multiple line items
- **Purchase Completion**: Complete purchases to automatically update product stock levels
- **Expense Tracking**: Track business expenses by category (Rent, Salary, Utilities, etc.)
- **Expense Type Management**: Configure expense categories
- **Dashboard**: Real-time statistics showing inventory levels, purchase values, and expense summaries
- **Low Stock Alerts**: Visual indicators for products that need reordering

### For Operator
- View all products and their stock levels
- Access purchase and expense records
- View dashboard statistics
- Future: POS (Point of Sale) interface for sales transactions

## 🛠️ Technology Stack

### Backend
- **Ruby on Rails 8.0** (API mode)
- **Ruby 3.2.1**
- **PostgreSQL** database
- JWT authentication with bcrypt
- Active Record ORM
- Rack CORS for cross-origin requests

### Frontend
- React 19 + Vite
- React Router for navigation
- Axios for HTTP requests
- Tailwind CSS for styling (LTR - Left-to-Right)
- Nexus Dashboard 3.1 color palette
- Responsive card-based product display

## 📦 Installation & Setup

### Prerequisites
- Ruby 3.2.1
- PostgreSQL
- Node.js (v18 or newer) for frontend
- npm or yarn

### Installation Steps

1. **Clone or download the project**

2. **Install backend dependencies:**
```bash
cd backend
bundle install
cd ..
```

3. **Install frontend dependencies:**
```bash
cd client
npm install
cd ..
```

4. **Setup database:**
```bash
cd backend
bundle exec rails db:create db:migrate db:seed
cd ..
```

This will create:
- Admin user (username: `admin`, password: `admin123`)
- Operator user (username: `operator`, password: `operator123`)
- 10 default expense types (Rent, Salary, Utilities, etc.)
- 3 sample products (development only)

5. **Run the application:**

**For Development:**
```bash
# From project root - runs both Rails and React
npm run dev
```

This will start:
- Rails API Server on: http://localhost:3000
- React Client on: http://localhost:5173

**Or run separately:**
```bash
# Terminal 1: Rails backend
cd backend && bundle exec rails server -p 3000

# Terminal 2: React frontend
cd client && npm run dev
```

**For Production:**
```bash
# Build the client
cd client && npm run build

# Start Rails in production mode
cd backend && RAILS_ENV=production rails server
```

## 👤 Default Login Credentials

### Admin
- **Username:** admin
- **Password:** admin123
- **Role:** Administrator (full access)

### Operator
- **Username:** operator
- **Password:** operator123
- **Role:** Operator (view access, future POS access)

**⚠️ Warning:** Please change the default passwords after first login!

## 📊 How to Use

### 1. Product Management

**Add Products:**
- Click "+ Add Product"
- Enter product name, SKU, description
- Set current stock and reorder level
- Optionally add product image URL
- Save

**View Stock Levels:**
- Products displayed in card grid
- Color-coded stock status:
  - Green: In Stock
  - Yellow: Low Stock (at or below reorder level)
  - Red: Out of Stock

**Edit/Delete Products:**
- Click Edit or Delete buttons on product cards (Admin only)
- Update product information as needed

### 2. Purchase Management

**Create Purchase:**
- Click "+ New Purchase"
- Enter purchase date and supplier name
- Add line items:
  - Select product
  - Enter quantity and unit cost
- Enter delivery cost
- System calculates total automatically
- Save as "pending"

**Complete Purchase:**
- Click "✓" button on pending purchase
- Confirms purchase and updates product stock levels automatically
- Changes status to "completed"

### 3. Expense Tracking

**Add Expense:**
- Click "+ Add Expense"
- Select expense date and type (Rent, Salary, etc.)
- Enter amount
- Add optional description
- Save

**Manage Expense Types (Admin Only):**
- Go to "Expense Types"
- Add, edit, or deactivate expense categories
- Configure which types are available for expense entry

### 4. Dashboard Overview

View key metrics:
- Total products count
- Low stock and out of stock counts
- Total purchases and their value
- Total expenses (all time and this month)
- Recent purchases and expenses
- Quick navigation to detailed views

## 📁 Project Structure

```
glamova/
├── backend/                     # Rails API Backend
│   ├── app/
│   │   ├── controllers/
│   │   │   └── api/
│   │   │       ├── auth_controller.rb
│   │   │       ├── products_controller.rb
│   │   │       ├── purchases_controller.rb
│   │   │       ├── expense_types_controller.rb
│   │   │       ├── expenses_controller.rb
│   │   │       └── dashboard_controller.rb
│   │   └── models/
│   │       ├── user.rb
│   │       ├── product.rb
│   │       ├── purchase.rb
│   │       ├── purchase_item.rb
│   │       ├── expense_type.rb
│   │       └── expense.rb
│   ├── config/
│   │   ├── routes.rb
│   │   └── database.yml
│   ├── db/
│   │   ├── migrate/
│   │   └── seeds.rb
│   └── Gemfile
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Purchases.jsx
│   │   │   ├── Expenses.jsx
│   │   │   └── ExpenseTypes.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   └── package.json
├── ai/                          # Agent contexts
└── README.md
```

## 🔒 Security

- All passwords encrypted with bcrypt
- JWT token authentication
- Route protection based on roles (admin/operator)
- Admin-only endpoints for create/update/delete operations

## 🐛 Troubleshooting

### Cannot connect to server
- Make sure Rails server is running on port 3000
- Check PostgreSQL is running: `pg_isready`
- Verify database.yml configuration

### Database connection issues
- Ensure PostgreSQL is installed and running
- Check database credentials in config/database.yml
- Run `rails db:create` if database doesn't exist

### Rails server won't start
- Run `bundle install` to ensure all gems are installed
- Check log files in `backend/log/development.log`
- Ensure port 3000 is not already in use

## 📄 License

MIT License

---

**Glamova Stock Management System** - Built with Rails 8 & React 19
