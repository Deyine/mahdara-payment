# BestCar - Integration Boundaries

## Frontend ↔ Backend Integration

### Authentication Flow

**Login Sequence**:
```
1. User submits credentials (Login.jsx)
   ↓
2. Frontend → POST /api/auth/login
   ↓
3. Backend validates with bcrypt
   ↓
4. Backend generates JWT token
   ↓
5. Backend returns { token, user: { id, name, username, role, tenant_id } }
   ↓
6. Frontend stores token in localStorage
   ↓
7. AuthContext updates user state
   ↓
8. Navigate to Dashboard
```

**Authenticated Request Sequence**:
```
1. Frontend makes API call
   ↓
2. Axios interceptor adds Authorization: Bearer <token>
   ↓
3. Backend Authenticable concern validates token
   ↓
4. Backend loads current_user from JWT
   ↓
5. MultiTenantable concern sets current_tenant
   ↓
6. Controller queries scoped by tenant_id
   ↓
7. Backend returns filtered data
```

**Token Expiration Handling**:
```
1. Backend returns 401 Unauthorized
   ↓
2. Axios interceptor catches 401
   ↓
3. Frontend clears localStorage
   ↓
4. Redirect to /login
```

### Data Flow Patterns

#### Car Creation Flow
```
Frontend (Cars.jsx)
  ↓ User fills form
  ↓ handleSubmit()
  ↓ carsAPI.create(formData)
  ↓
API Service (api.js)
  ↓ POST /api/cars with { car: formData }
  ↓ Authorization header included
  ↓
Backend (CarsController)
  ↓ authenticate_user!
  ↓ require_admin
  ↓ tenant_scope(Car).new(car_params)
  ↓ car.tenant = current_tenant
  ↓ car.save
  ↓ render json: @car
  ↓
Response Flow
  ↓ Frontend receives { id, vin, car_model, ... }
  ↓ showAlert('Véhicule ajouté avec succès', 'success')
  ↓ fetchCars() - refresh list
  ↓ resetForm() - close modal
```

#### Dashboard Statistics Flow
```
Frontend (Dashboard.jsx)
  ↓ useEffect on mount
  ↓ dashboardAPI.getStatistics()
  ↓
Backend (DashboardController#statistics)
  ↓ authenticate_user!
  ↓ tenant_scope(Car).count
  ↓ tenant_scope(Expense).sum(:amount)
  ↓ Calculate totals and aggregates
  ↓ Load recent cars with .includes(:car_model)
  ↓ Load recent expenses with .includes(:car, :expense_category)
  ↓ render json: stats
  ↓
Frontend
  ↓ setStats(response.data)
  ↓ Render cards with totals
  ↓ Display recent activity lists
```

#### Expense Tracking Flow
```
Frontend (Cars.jsx - View Mode)
  ↓ User clicks "View" on a car
  ↓ handleView(car)
  ↓ Display car details with expenses list
  ↓ Show "Add Expense" button
  ↓
User adds expense
  ↓ expensesAPI.create({
      car_id: car.id,
      expense_category_id: selected_category,
      amount: 1250.00,
      expense_date: '2025-12-15',
      description: 'Engine repair'
    })
  ↓
Backend (ExpensesController#create)
  ↓ authenticate_user!
  ↓ require_admin
  ↓ tenant_scope(Expense).new(expense_params)
  ↓ expense.tenant = current_tenant
  ↓ expense.save
  ↓ render json: @expense
  ↓
Frontend
  ↓ Expense added successfully
  ↓ fetchCars() to refresh car with updated total_cost
  ↓ Car's total_cost now includes new expense
```

### Multi-Tenant Boundaries

**Tenant Resolution**:
```
User Login
  ↓
JWT contains user_id (not tenant_id)
  ↓
Backend decodes JWT → finds User
  ↓
User belongs_to :tenant
  ↓
current_user.tenant → current_tenant
  ↓
All queries: Model.for_tenant(current_tenant.id)
```

**Cross-Tenant Protection**:
```
Scenario: User A (Tenant 1) tries to access Car from Tenant 2

Request: GET /api/cars/tenant-2-car-uuid
  ↓
Backend: tenant_scope(Car).find(params[:id])
  ↓
Query: SELECT * FROM cars WHERE tenant_id = 'tenant-1-uuid' AND id = 'tenant-2-car-uuid'
  ↓
Result: ActiveRecord::RecordNotFound
  ↓
Response: 404 Not Found (not 403 - avoids data leakage)
```

**VIN Uniqueness Per Tenant**:
```
Scenario: Two tenants use same VIN

Tenant 1: Creates car with VIN "1HGCM82633A123456" ✅
  ↓
Tenant 2: Creates car with VIN "1HGCM82633A123456" ✅ (allowed)
  ↓
Tenant 1: Tries to create another car with same VIN ❌
  ↓
Validation: VIN unique within scope [:tenant_id, :vin]
  ↓
Error: "VIN has already been taken"
```

## State Management

### AuthContext (Global State)

**Responsibilities**:
- Store current user and authentication status
- Provide login/logout methods
- Persist token in localStorage
- Handle authentication errors

**State**:
```javascript
{
  user: {
    id: 1,
    name: "Demo Administrator",
    username: "admin",
    role: "admin",
    tenant_id: "uuid"
  },
  loading: false
}
```

**Methods**:
- `login(username, password)` → Returns { success, error }
- `logout()` → Clears token and user
- `checkAuth()` → Validates stored token on app load

### DialogContext (Global State)

**Responsibilities**:
- Provide alert() and confirm() methods
- Display custom dialogs (no native browser alerts)
- Handle user confirmations for delete operations

**Methods**:
- `showAlert(message, type)` → Promise (user acknowledges)
- `showConfirm(message, title)` → Promise<boolean> (user confirms/cancels)

### Component-Level State

**Cars.jsx**:
```javascript
{
  cars: [],              // List of all cars for tenant
  carModels: [],         // Active car models for dropdowns
  loading: true,         // Loading state
  showForm: false,       // Modal visibility
  editingCar: null,      // Car being edited (null for create)
  viewMode: false,       // Read-only view
  searchTerm: '',        // Search filter
  formData: {            // Form state
    vin: '',
    car_model_id: '',
    year: new Date().getFullYear(),
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: '',
    // ...
  }
}
```

## API Service Layer

### Organization
```javascript
// services/api.js

// Base axios instance
const api = axios.create({
  baseURL: API_URL
});

// Request interceptor (add token)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor (handle 401)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API method groups
export const carsAPI = { getAll, getOne, create, update, delete };
export const carModelsAPI = { getAll, getActive, create, update, delete };
export const expenseCategoriesAPI = { /* ... */ };
export const expensesAPI = { /* ... */ };
```

### Request/Response Transformation

**Create Car Request**:
```javascript
// Frontend sends
await carsAPI.create({
  vin: '1HGCM82633A123456',
  car_model_id: 'uuid',
  year: 2020,
  purchase_price: '8500'
});

// Transformed to
POST /api/cars
{
  "car": {
    "vin": "1HGCM82633A123456",
    "car_model_id": "uuid",
    "year": 2020,
    "purchase_price": "8500"
  }
}

// Backend expects
params.require(:car).permit(:vin, :car_model_id, :year, ...)
```

**Response Handling**:
```javascript
// Backend returns
{
  "id": "uuid",
  "vin": "1HGCM82633A123456",
  "car_model": {
    "id": "uuid",
    "name": "Toyota Camry"
  },
  "expenses": [...]
}

// Frontend receives
response.data → car object
car.car_model.name → "Toyota Camry"
car.total_cost → "9550.00" (calculated by backend)
```

## Validation Boundaries

### Frontend Validation
- Required field checks (HTML5 `required` attribute)
- Basic format validation (number, date, email types)
- Client-side UX improvements (instant feedback)
- **NOT authoritative** - backend always validates

### Backend Validation
- **Authoritative** validation source
- Database constraints (uniqueness, presence, foreign keys)
- Business rule enforcement (year range, positive amounts)
- Tenant-scoped uniqueness (VIN per tenant)
- Returns detailed error messages

**Example Error Flow**:
```
Frontend: User tries to create car with duplicate VIN
  ↓ Validation passes (no client-side VIN check)
  ↓ POST /api/cars
  ↓
Backend: validates uniqueness: { scope: :tenant_id }
  ↓ Car.where(tenant_id: X, vin: Y).exists? → true
  ↓ Validation fails
  ↓ render json: { errors: ["VIN has already been taken"] }, status: 422
  ↓
Frontend: catch block
  ↓ error.response.data.errors[0] → "VIN has already been taken"
  ↓ showAlert('VIN has already been taken', 'error')
```

## File Structure Boundaries

### Backend Responsibilities
- Database schema and migrations
- Business logic and calculations (total_cost)
- Multi-tenant scoping
- Authentication and authorization
- Data validation and integrity
- API response formatting

### Frontend Responsibilities
- User interface and interactions
- Form state management
- Client-side routing
- API request orchestration
- Display formatting (currency, dates)
- User feedback (alerts, confirmations)

### Shared Responsibilities
- Date formatting (backend stores ISO, frontend displays localized)
- Decimal precision (backend enforces decimal(10,2), frontend formats display)
- Role-based access (backend enforces, frontend hides UI elements)

## Security Boundaries

**Frontend Cannot Trust**:
- User inputs (always validate on backend)
- localStorage data (can be manipulated)
- Client-side role checks (only for UX, not security)

**Backend Must Enforce**:
- Authentication on every request
- Tenant isolation on every query
- Role-based permissions
- Data validation and sanitization
- SQL injection prevention (via ActiveRecord)

**Example**:
```javascript
// Frontend (UX only, not security)
{user?.role === 'admin' && (
  <button onClick={handleDelete}>Delete</button>
)}

// Backend (actual security)
before_action :require_admin, except: [:index, :show]

def require_admin
  unless current_user&.admin? || current_user&.super_admin?
    render json: { error: 'Forbidden' }, status: :forbidden
  end
end
```
