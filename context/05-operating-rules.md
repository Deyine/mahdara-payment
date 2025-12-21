# BestCar - Operating Rules & Business Logic

This document defines the business rules, workflows, and constraints that govern the BestCar salvage car management system.

## Multi-Tenant Isolation

### Rule 1: All Data is Tenant-Scoped

**CRITICAL**: Every query automatically filters by the current user's tenant.

**Implementation**:
- All entity tables include `tenant_id` UUID foreign key
- Controllers include `MultiTenantable` concern
- Queries use `tenant_scope(Model)` instead of direct `Model` access
- User's tenant is resolved from JWT token → current_user → current_user.tenant

**Code Example** (`app/controllers/api/cars_controller.rb`):
```ruby
def index
  @cars = tenant_scope(Car).includes(:car_model, :expenses).recent
  # This automatically filters: WHERE tenant_id = current_user.tenant_id
end
```

**Model Scoping** (all models include):
```ruby
scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
```

**Why This Matters**:
- Complete data isolation between tenants
- Cross-tenant access attempts return 404 (not 403, to avoid data leakage)
- Automatic enforcement prevents security bugs
- Supports multi-business operations

---

### Rule 2: VIN Uniqueness is Per-Tenant

**CRITICAL**: VINs must be unique WITHIN a tenant, but same VIN can exist across different tenants.

**Implementation**:
```ruby
# Database constraint
add_index :cars, [:tenant_id, :vin], unique: true

# Model validation
validates :vin, presence: true, uniqueness: { scope: :tenant_id }
```

**Example**:
```
Tenant A creates car with VIN "1HGCM82633A123456" ✅
Tenant B creates car with VIN "1HGCM82633A123456" ✅ (allowed)
Tenant A tries to create another car with same VIN ❌ (rejected)
```

**Backend Error Response** (422):
```json
{
  "errors": ["VIN has already been taken"]
}
```

**Frontend Error Handling**:
```jsx
catch (error) {
  if (error.response?.status === 422) {
    await showAlert(
      error.response.data.errors[0] || 'Erreur de validation',
      'error'
    );
  }
}
```

**Why This Matters**:
- Different salvage businesses may work with same vehicles
- Maintains data integrity within each tenant
- Prevents duplicate entries within single business

---

### Rule 3: Car Models and Expense Categories are Tenant-Specific

**CRITICAL**: Each tenant has their own set of car models and expense categories.

**Implementation**:
```ruby
# Car models unique per tenant
add_index :car_models, [:tenant_id, :name], unique: true

# Expense categories unique per tenant
add_index :expense_categories, [:tenant_id, :name], unique: true
```

**Example**:
```
Tenant A: "Toyota Camry" car model ✅
Tenant B: "Toyota Camry" car model ✅ (separate record)
Tenant A: Another "Toyota Camry" ❌ (duplicate)
```

**Why This Matters**:
- Tenants can customize their category lists
- One tenant's changes don't affect others
- Supports different business workflows

---

## Car Management

### Rule 4: Car Cost Calculation

**CRITICAL**: Total car cost includes purchase price, clearance, towing, AND all associated expenses.

**Formula**:
```
total_cost = purchase_price + clearance_cost + towing_cost + SUM(expenses.amount)
```

**Backend Implementation** (`app/models/car.rb`):
```ruby
def total_cost
  base = purchase_price.to_f
  base += clearance_cost.to_f if clearance_cost
  base += towing_cost.to_f if towing_cost
  base += expenses.sum(:amount).to_f
  base
end

def total_expenses
  expenses.sum(:amount).to_f
end
```

**API Response**:
```json
{
  "id": "uuid",
  "vin": "1HGCM82633A123456",
  "purchase_price": "8500.00",
  "clearance_cost": "450.00",
  "towing_cost": "200.00",
  "total_expenses": "1050.00",
  "total_cost": "10200.00"
}
```

**Example**:
```
Initial Purchase:
  purchase_price: 8,500 MRU
  clearance_cost: 450 MRU
  towing_cost: 200 MRU
  total_cost: 9,150 MRU

After Adding Expense (Engine Repair: 1,250 MRU):
  total_cost: 10,400 MRU (9,150 + 1,250)
```

**Why This Matters**:
- Accurate profitability tracking
- Includes all acquisition and repair costs
- Supports pricing decisions based on true investment

---

### Rule 5: Car Soft Deletion

**CRITICAL**: Cars are ALWAYS soft-deleted (never permanently removed from database).

**Rationale**: Preserve complete history, enable restoration, maintain data integrity

**Backend Implementation** (`app/models/car.rb`):
```ruby
# Soft deletion scopes
scope :active, -> { where(deleted_at: nil) }
scope :deleted, -> { where.not(deleted_at: nil) }

def soft_delete!
  update(deleted_at: Time.current)
end

def restore!
  update(deleted_at: nil)
end

def deleted?
  deleted_at.present?
end
```

**Database Schema**:
```ruby
t.datetime :deleted_at
add_index :cars, :deleted_at
```

**Backend Controller** (`app/controllers/api/cars_controller.rb`):
```ruby
def index
  cars_scope = tenant_scope(Car)

  # Apply appropriate scope based on query parameters
  if params[:only_deleted] == 'true'
    cars_scope = cars_scope.deleted
  else
    cars_scope = cars_scope.active  # Default: show only active cars
  end

  @cars = cars_scope.includes(:car_model, :expenses).recent
end

def destroy
  # Soft delete - always use soft deletion regardless of expenses
  if @car.soft_delete!
    render json: { message: 'Car deleted successfully' }
  else
    render json: { error: 'Error deleting car' }, status: :unprocessable_entity
  end
end

def restore
  if @car.restore!
    render json: { message: 'Car restored successfully', car: @car }
  else
    render json: { error: 'Error restoring car' }, status: :unprocessable_entity
  end
end

private

def set_car
  @car = tenant_scope(Car).active.find(params[:id])
end

def set_car_with_deleted
  @car = tenant_scope(Car).find(params[:id])  # Finds even deleted cars
end
```

**Frontend UI** (`Cars.jsx`):
```jsx
// Toggle between active and deleted cars
const [showDeleted, setShowDeleted] = useState(false);

<button onClick={() => setShowDeleted(!showDeleted)}>
  {showDeleted ? '🗑️ Véhicules supprimés' : '📋 Véhicules actifs'}
</button>

// Conditional button display
{car.deleted ? (
  <button onClick={() => handleRestore(car.id)}>
    ↶ Restaurer
  </button>
) : (
  <button onClick={() => handleDelete(car.id)}>
    🗑️
  </button>
)}
```

**Why This Matters**:
- Complete audit trail - nothing is permanently lost
- Accidental deletions can be reversed
- Historical data preserved for reporting
- No restrictions - cars with expenses can be deleted
- Deleted cars excluded from default queries (performance)

---

### Rule 6: Required Car Fields

**CRITICAL**: Minimum required information to create a car.

**Required Fields**:
- `vin` - Vehicle Identification Number (string, unique per tenant)
- `car_model_id` - Reference to car model (UUID)
- `year` - Manufacturing year (integer, 1900-current_year+1)
- `purchase_date` - Date of purchase (date)
- `purchase_price` - Purchase cost (decimal >= 0)

**Optional Fields**:
- `color` - Vehicle color (string)
- `mileage` - Odometer reading (integer >= 0)
- `seller` - Seller name (string, e.g., "Copart Auto Auction")
- `location` - Purchase location (string, e.g., "Dallas, TX")
- `clearance_cost` - Customs/clearance fees (decimal >= 0)
- `towing_cost` - Towing/transport fees (decimal >= 0)

**Backend Validation** (`app/models/car.rb`):
```ruby
validates :vin, presence: true, uniqueness: { scope: :tenant_id }
validates :car_model_id, presence: true
validates :year, presence: true,
          numericality: {
            only_integer: true,
            greater_than_or_equal_to: 1900,
            less_than_or_equal_to: Date.current.year + 1
          }
validates :purchase_date, presence: true
validates :purchase_price, presence: true,
          numericality: { greater_than_or_equal_to: 0 }
validates :mileage, numericality: {
  only_integer: true,
  greater_than_or_equal_to: 0
}, allow_nil: true
validates :clearance_cost, :towing_cost,
          numericality: { greater_than_or_equal_to: 0 },
          allow_nil: true
```

**Frontend Validation**:
```jsx
<input type="text" required />  {/* HTML5 required */}
<input type="number" min="0" required />
<input type="date" required />
```

---

## Expense Management

### Rule 7: Expense Types (Categories)

**CRITICAL**: Expenses are categorized as either "reparation" or "purchase".

**Expense Types**:

**Reparation** (repair costs):
- Engine Repair
- Body Work
- Paint Job
- Interior Repair
- Tire Replacement
- Transmission Repair
- Electrical Work

**Purchase** (acquisition costs):
- Auction Fees
- Shipping Costs
- Customs Clearance
- Towing Service
- Insurance
- Storage Fees
- Other

**Database Schema**:
```ruby
t.string :expense_type, null: false  # 'reparation' or 'purchase'
```

**Backend Validation**:
```ruby
validates :expense_type, presence: true,
          inclusion: { in: %w[reparation purchase] }
```

**Frontend Display**:
```jsx
const getExpenseTypeBadge = (type) => {
  if (type === 'reparation') {
    return { label: 'Réparation', color: '#f59e0b' };  // Orange
  } else {
    return { label: 'Achat', color: '#3b82f6' };  // Blue
  }
};
```

**Why This Matters**:
- Separates repair costs from acquisition costs
- Supports cost analysis by category type
- Helps identify repair-heavy vs clean vehicles

---

### Rule 8: Expense Category Deletion Protection

**CRITICAL**: Expense categories with associated expenses CANNOT be deleted.

**Rationale**: Preserve expense categorization history

**Backend Validation** (`app/models/expense_category.rb`):
```ruby
class ExpenseCategory < ApplicationRecord
  has_many :expenses, dependent: :restrict_with_error

  before_destroy :check_for_expenses

  private

  def check_for_expenses
    if expenses.any?
      errors.add(:base, "Cannot delete expense category with associated expenses")
      throw(:abort)
    end
  end
end
```

**Alternative**: Deactivate instead of delete
```ruby
# Set active = false instead of deleting
expense_category.update(active: false)
```

**Frontend Usage**:
```jsx
// Only show active expense categories in dropdown
const response = await expenseCategoriesAPI.getActive();
setActiveCategories(response.data);
```

---

### Rule 9: Required Expense Fields

**Required Fields**:
- `car_id` - Associated car (UUID)
- `expense_category_id` - Category reference (UUID)
- `amount` - Cost amount (decimal > 0)
- `expense_date` - Date of expense (date)

**Optional Fields**:
- `description` - Detailed notes (text)

**Backend Validation** (`app/models/expense.rb`):
```ruby
validates :car_id, presence: true
validates :expense_category_id, presence: true
validates :amount, presence: true,
          numericality: { greater_than: 0 }
validates :expense_date, presence: true
```

**Example**:
```json
{
  "expense": {
    "car_id": "uuid",
    "expense_category_id": "uuid",
    "amount": "1250.00",
    "description": "Replace timing belt and water pump",
    "expense_date": "2025-12-15"
  }
}
```

---

## Car Model Management

### Rule 10: Car Model Deletion Protection

**CRITICAL**: Car models with associated cars CANNOT be deleted.

**Rationale**: Preserve vehicle inventory data integrity

**Backend Validation** (`app/controllers/api/car_models_controller.rb`):
```ruby
def destroy
  if @car_model.cars.exists?
    render json: { error: 'Cannot delete car model with existing cars' },
           status: :unprocessable_entity
  else
    @car_model.destroy
    render json: { message: 'Car model deleted successfully' }
  end
end
```

**Frontend Error Handling**:
```jsx
catch (error) {
  if (error.response?.status === 422) {
    await showAlert(
      'Impossible de supprimer un modèle avec des véhicules existants',
      'error'
    );
  }
}
```

**Alternative**: Deactivate instead of delete
```ruby
car_model.update(active: false)
```

---

### Rule 11: Active/Inactive Status

**Purpose**: Allow disabling models/categories without deleting them

**Implementation**:
```ruby
# All have active boolean field (default: true)
scope :active, -> { where(active: true) }
```

**API Endpoints**:
- `GET /api/car_models` - Returns ALL models
- `GET /api/car_models/active` - Returns only active models
- `GET /api/expense_categories` - Returns ALL categories
- `GET /api/expense_categories/active` - Returns only active categories

**Frontend Usage**:
```jsx
// For dropdowns (create/edit forms)
const response = await carModelsAPI.getActive();
setCarModels(response.data);

// For settings management page (show all)
const response = await carModelsAPI.getAll();
setAllCarModels(response.data);
```

**Why This Matters**:
- Retired models stay out of dropdowns
- Historical data remains intact
- Can be reactivated if needed

---

## Authorization & Access Control

### Rule 12: Role-Based Permissions

**Roles**:
- **Super Admin**: System-wide access, can manage all tenants
- **Admin**: Full CRUD access within their tenant

**Endpoint Access Matrix**:

| Endpoint | Admin | Super Admin |
|----------|-------|-------------|
| GET /cars | ✅ | ✅* |
| POST/PUT/DELETE /cars | ✅ | ✅* |
| GET /car_models | ✅ | ✅* |
| POST/PUT/DELETE /car_models | ✅ | ✅* |
| GET /expense_categories | ✅ | ✅* |
| POST/PUT/DELETE /expense_categories | ✅ | ✅* |
| GET /expenses | ✅ | ✅* |
| POST/PUT/DELETE /expenses | ✅ | ✅* |
| GET /dashboard/statistics | ✅ | ✅* |
| GET /tenants | ❌ | ✅ |
| POST/PUT/DELETE /tenants | ❌ | ✅ |

*Super Admin sees their own tenant's data (not cross-tenant)

**Backend Implementation** (`app/controllers/concerns/authenticable.rb`):
```ruby
def require_admin
  unless current_user&.admin? || current_user&.super_admin?
    render json: { error: 'Forbidden' }, status: :forbidden
  end
end

def require_super_admin
  unless current_user&.super_admin?
    render json: { error: 'Forbidden' }, status: :forbidden
  end
end

# Usage in controllers
before_action :require_admin, except: [:index, :show]
before_action :require_super_admin  # TenantsController only
```

**User Model Roles**:
```ruby
def admin?
  role == 'admin'
end

def super_admin?
  role == 'super_admin'
end
```

**Frontend Authorization**:
```jsx
const { user } = useAuth();

// Hide UI elements for non-admins
{user?.role === 'admin' && (
  <button onClick={handleDelete}>Supprimer</button>
)}

// Completely restrict routes
<Route
  path="/settings"
  element={<PrivateRoute requireAdmin><Settings /></PrivateRoute>}
/>
```

**Why This Matters**:
- Prevents accidental data modification
- Backend enforces security (frontend only for UX)
- Super admins can manage system infrastructure

---

## Currency & Monetary Values

### Rule 13: All Amounts in MRU (Mauritanian Ouguiya)

**CRITICAL**: Unlike multi-currency systems, BestCar uses single currency (MRU).

**Implementation**:
- No `currency` field in cars or expenses tables
- No `exchange_rate` field
- All monetary amounts stored as decimal(10,2)
- All calculations and displays in MRU

**Decimal Precision**:
```ruby
t.decimal :purchase_price, precision: 10, scale: 2, null: false
t.decimal :clearance_cost, precision: 10, scale: 2
t.decimal :towing_cost, precision: 10, scale: 2
t.decimal :amount, precision: 10, scale: 2, null: false
```

**Frontend Formatting**:
```jsx
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MRU'
  }).format(amount);
};

// Output: "8 500,00 MRU"
```

**Why Single Currency**:
- Simplifies calculations
- Business operates in Mauritania
- No exchange rate complexity
- Consistent financial reporting

---

## Dashboard Statistics

### Rule 14: Dashboard Aggregates Tenant Data

**CRITICAL**: Dashboard shows statistics for current user's tenant only.

**Backend Implementation** (`app/controllers/api/dashboard_controller.rb`):
```ruby
def statistics
  # Car statistics
  total_cars = tenant_scope(Car).count
  recent_cars = tenant_scope(Car).includes(:car_model).recent.limit(5)

  # Expense statistics
  total_expenses = tenant_scope(Expense).count
  total_expense_amount = tenant_scope(Expense).sum(:amount)
  this_month_expenses = tenant_scope(Expense)
    .where('expense_date >= ?', Date.current.beginning_of_month)
    .sum(:amount)
  recent_expenses = tenant_scope(Expense)
    .includes(:car, :expense_category)
    .recent.limit(5)

  # Financial summary
  total_cars_value = tenant_scope(Car).sum(:purchase_price)
  total_investment = total_cars_value + total_expense_amount

  {
    cars: {
      total: total_cars,
      recent: recent_cars.as_json(include: :car_model)
    },
    expenses: {
      total: total_expenses,
      total_amount: total_expense_amount.to_f,
      this_month: this_month_expenses.to_f,
      recent: recent_expenses.as_json(include: [:car, :expense_category])
    },
    summary: {
      total_cars_value: total_cars_value.to_f,
      total_expenses: total_expense_amount.to_f,
      total_investment: total_investment.to_f
    }
  }
end
```

**Frontend Display**:
```jsx
<div className="stats-grid">
  <StatCard
    title="Véhicules"
    value={stats.cars.total}
    icon="🚗"
  />
  <StatCard
    title="Valeur Totale"
    value={formatCurrency(stats.summary.total_cars_value)}
    icon="💰"
  />
  <StatCard
    title="Dépenses Totales"
    value={formatCurrency(stats.summary.total_expenses)}
    icon="📊"
  />
  <StatCard
    title="Investissement Total"
    value={formatCurrency(stats.summary.total_investment)}
    icon="💼"
  />
</div>
```

**Calculated Fields**:
- `total_cars_value` - Sum of all purchase_prices
- `total_expenses` - Sum of all expense amounts
- `total_investment` - total_cars_value + total_expenses

---

## Data Integrity & Constraints

### Rule 15: Unique Constraints Summary

**Database Level Uniqueness**:

```ruby
# Tenants
add_index :tenants, :subdomain, unique: true

# Users
add_index :users, :username, unique: true

# Car Models (per tenant)
add_index :car_models, [:tenant_id, :name], unique: true

# Cars (per tenant)
add_index :cars, [:tenant_id, :vin], unique: true

# Expense Categories (per tenant)
add_index :expense_categories, [:tenant_id, :name], unique: true
```

**Model Level Validations**:
```ruby
# Tenant
validates :subdomain, uniqueness: true

# User
validates :username, uniqueness: true

# CarModel
validates :name, uniqueness: { scope: :tenant_id }

# Car
validates :vin, uniqueness: { scope: :tenant_id }

# ExpenseCategory
validates :name, uniqueness: { scope: :tenant_id }
```

**Purpose**:
- Prevent duplicate VINs within tenant
- Prevent duplicate model/category names within tenant
- Prevent duplicate usernames globally
- Prevent duplicate tenant subdomains

---

### Rule 16: Numeric Validation Constraints

**Non-Negative Values**:
```ruby
validates :purchase_price, numericality: { greater_than_or_equal_to: 0 }
validates :clearance_cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
validates :towing_cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
validates :mileage, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
```

**Positive Values**:
```ruby
validates :amount, numericality: { greater_than: 0 }  # Expenses must be > 0
```

**Range Validations**:
```ruby
validates :year, numericality: {
  only_integer: true,
  greater_than_or_equal_to: 1900,
  less_than_or_equal_to: Date.current.year + 1
}
```

**Why This Matters**:
- Prevents nonsensical data (negative prices, future years)
- Maintains financial accuracy
- Supports reliable cost calculations

---

## Business Workflows

### Complete Car Lifecycle

```
1. Admin purchases car at auction
   ↓
2. Admin creates car record:
   - VIN, model, year, color, mileage
   - Purchase details (date, price, seller, location)
   - Initial costs (clearance, towing)
   - total_cost = purchase_price + clearance_cost + towing_cost
   ↓
3. Car arrives at facility
   ↓
4. Repairs begin - Admin tracks expenses:
   - Engine repair: 1,250 MRU (Reparation)
   - Body work: 800 MRU (Reparation)
   - Paint job: 500 MRU (Reparation)
   - total_cost now includes all repair expenses
   ↓
5. Car ready for resale
   - Admin views total_cost (all-in investment)
   - Sets selling price based on total_cost + desired margin
   ↓
6. Car sold (tracked outside BestCar)
   - Historical record remains in system
   - Expenses provide cost breakdown for profitability analysis
```

### Expense Tracking Workflow

```
1. Admin views car details
   ↓
2. Admin clicks "Add Expense" (Vue détails mode)
   ↓
3. Admin fills expense form:
   - Category: "Engine Repair" (reparation type)
   - Amount: 1,250 MRU
   - Date: 2025-12-15
   - Description: "Replace timing belt and water pump"
   ↓
4. Frontend validates:
   - Category selected
   - Amount > 0
   - Date provided
   ↓
5. Frontend calls POST /api/expenses
   ↓
6. Backend validates:
   - User is admin
   - Car belongs to user's tenant
   - Category belongs to user's tenant
   - Amount is positive
   ↓
7. Backend creates expense with tenant_id
   ↓
8. Backend returns expense with associations
   ↓
9. Frontend refetches car data
   ↓
10. UI updates: Car's total_cost increased by 1,250 MRU
```

### Car Model/Category Management Workflow

```
Admin Settings Management:

1. Admin navigates to /settings/car-models
   ↓
2. Admin views list of all car models (active + inactive)
   ↓
3. Admin creates new model:
   - Name: "Ford F-150"
   - Active: true (default)
   ↓
4. Model appears in dropdown for car creation
   ↓
5. Admin decides to retire old model:
   - Option 1: Set active = false (if no cars exist)
   - Option 2: Keep active = true (if cars exist)
   ↓
6. Inactive models don't appear in dropdowns
   ↓
7. Historical cars still show retired model name
```

---

## Error Handling Rules

### Rule 17: Tenant Isolation Errors

**Cross-Tenant Access Attempt**:
```
User from Tenant A tries: GET /api/cars/tenant-b-car-uuid

Backend Query:
  Car.for_tenant(tenant_a_uuid).find(tenant-b-car-uuid)

Result: ActiveRecord::RecordNotFound

Response: 404 Not Found (NOT 403)
```

**Why 404 instead of 403**:
- Avoids confirming resource exists in different tenant (data leakage)
- Consistent with "resource doesn't exist" for this user

### Rule 18: Validation Error Response Format

**Backend Error Format**:
```ruby
render json: { errors: @car.errors.full_messages },
       status: :unprocessable_entity
```

**Response**:
```json
{
  "errors": [
    "VIN has already been taken",
    "Year must be greater than or equal to 1900"
  ]
}
```

**Frontend Error Handling**:
```jsx
try {
  await carsAPI.create(formData);
  await showAlert('Véhicule créé avec succès', 'success');
} catch (error) {
  const errorMessage = error.response?.data?.errors?.[0]
    || error.response?.data?.error
    || 'Erreur lors de l\'enregistrement';
  await showAlert(errorMessage, 'error');
}
```

---

## Summary of Critical Rules

### Multi-Tenant System
1. ✅ All data automatically scoped by tenant_id
2. ✅ VIN uniqueness enforced per tenant (not globally)
3. ✅ Car models and expense categories are tenant-specific
4. ✅ Cross-tenant access returns 404 (prevents data leakage)
5. ✅ Super admin manages tenants, admin manages tenant data

### Car Management
1. ✅ Total cost = purchase_price + clearance + towing + expenses
2. ✅ Cars with expenses CANNOT be deleted
3. ✅ Required fields: VIN, model, year, purchase_date, purchase_price
4. ✅ Year must be 1900 to current_year+1
5. ✅ All monetary values >= 0 (except expenses which must be > 0)

### Expense Management
1. ✅ Expenses categorized as "reparation" or "purchase"
2. ✅ Required fields: car_id, category_id, amount, expense_date
3. ✅ Amount must be > 0 (positive)
4. ✅ Expense categories with expenses CANNOT be deleted

### Car Models & Categories
1. ✅ Names unique per tenant
2. ✅ Active/inactive status for soft deletion
3. ✅ Active items appear in dropdowns
4. ✅ Cannot delete models with associated cars
5. ✅ Cannot delete categories with associated expenses

### Authorization
1. ✅ Admin role required for: create, update, delete operations
2. ✅ Super admin role required for: tenant management
3. ✅ Read access available to all authenticated users
4. ✅ Frontend hides UI, backend enforces security

### Data Integrity
1. ✅ All tenant-scoped queries use tenant_scope(Model)
2. ✅ All monetary amounts in MRU (single currency)
3. ✅ Database transactions ensure atomic operations
4. ✅ Unique constraints prevent duplicate VINs/names per tenant
5. ✅ Foreign key constraints maintain referential integrity
6. ✅ Validation on both client-side (UX) and server-side (security)
