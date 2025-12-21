# BestCar - API Contracts

## Base Configuration

**Base URL**: `http://localhost:3000/api` (development)
**Content-Type**: `application/json`
**Authentication**: Bearer token in Authorization header

```http
Authorization: Bearer <jwt_token>
```

## Authentication

### Login
**Endpoint**: `POST /api/auth/login`
**Access**: Public (no authentication required)

**Request**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Success Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "Demo Administrator",
    "username": "admin",
    "role": "admin",
    "tenant_id": "uuid-here"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Invalid credentials"
}
```

## Dashboard

### Get Statistics
**Endpoint**: `GET /api/dashboard/statistics`
**Access**: Authenticated users
**Tenant Scope**: Automatic (filtered by user's tenant)

**Response** (200 OK):
```json
{
  "cars": {
    "total": 25,
    "recent": [
      {
        "id": "uuid",
        "vin": "1HGCM82633A123456",
        "car_model": {
          "id": "uuid",
          "name": "Toyota Camry"
        },
        "year": 2020,
        "color": "Silver",
        "purchase_date": "2025-11-17",
        "purchase_price": "8500.00",
        "total_cost": "9550.00",
        "created_at": "2025-12-17T10:00:00.000Z"
      }
    ]
  },
  "expenses": {
    "total": 48,
    "total_amount": "125000.00",
    "this_month": "15000.00",
    "recent": [
      {
        "id": "uuid",
        "car": {
          "id": "uuid",
          "vin": "1HGCM82633A123456",
          "car_model": {
            "name": "Toyota Camry"
          }
        },
        "expense_category": {
          "id": "uuid",
          "name": "Engine Repair",
          "expense_type": "reparation"
        },
        "amount": "1250.00",
        "description": "Replace timing belt",
        "expense_date": "2025-12-15"
      }
    ]
  },
  "summary": {
    "total_cars_value": "850000.00",
    "total_expenses": "125000.00",
    "total_investment": "975000.00"
  }
}
```

## Tenants (Super Admin Only)

### List All Tenants
**Endpoint**: `GET /api/tenants`
**Access**: Super Admin only

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Demo Salvage Cars",
    "subdomain": "demo",
    "active": true,
    "created_at": "2025-12-17T10:00:00.000Z",
    "updated_at": "2025-12-17T10:00:00.000Z"
  }
]
```

### Create Tenant
**Endpoint**: `POST /api/tenants`
**Access**: Super Admin only

**Request**:
```json
{
  "tenant": {
    "name": "New Salvage Business",
    "subdomain": "newsalvage",
    "active": true
  }
}
```

**Success Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "New Salvage Business",
  "subdomain": "newsalvage",
  "active": true,
  "created_at": "2025-12-17T10:00:00.000Z",
  "updated_at": "2025-12-17T10:00:00.000Z"
}
```

**Error Response** (422 Unprocessable Entity):
```json
{
  "errors": ["Subdomain has already been taken"]
}
```

### Update Tenant
**Endpoint**: `PUT /api/tenants/:id`
**Access**: Super Admin only

**Request**:
```json
{
  "tenant": {
    "name": "Updated Name",
    "active": false
  }
}
```

### Delete Tenant
**Endpoint**: `DELETE /api/tenants/:id`
**Access**: Super Admin only

**Error Response** (422) if has associated data:
```json
{
  "error": "Cannot delete tenant with existing users or data"
}
```

## Cars

### List All Cars
**Endpoint**: `GET /api/cars`
**Access**: Authenticated users
**Tenant Scope**: Automatic

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "vin": "1HGCM82633A123456",
    "car_model_id": "uuid",
    "car_model": {
      "id": "uuid",
      "name": "Toyota Camry",
      "active": true
    },
    "year": 2020,
    "color": "Silver",
    "mileage": 45000,
    "purchase_date": "2025-11-17",
    "purchase_price": "8500.00",
    "seller": "Copart Auto Auction",
    "location": "Dallas, TX",
    "clearance_cost": "450.00",
    "towing_cost": "200.00",
    "tenant_id": "uuid",
    "expenses": [
      {
        "id": "uuid",
        "amount": "400.00",
        "expense_date": "2025-11-25"
      }
    ],
    "total_cost": "9550.00",
    "total_expenses": "400.00",
    "created_at": "2025-12-17T10:00:00.000Z",
    "updated_at": "2025-12-17T10:00:00.000Z"
  }
]
```

### Get One Car
**Endpoint**: `GET /api/cars/:id`
**Access**: Authenticated users
**Tenant Scope**: Automatic

**Response**: Same structure as list item with full expense details

### Create Car
**Endpoint**: `POST /api/cars`
**Access**: Admin only

**Request**:
```json
{
  "car": {
    "vin": "1HGCM82633A123456",
    "car_model_id": "uuid",
    "year": 2020,
    "color": "Silver",
    "mileage": 45000,
    "purchase_date": "2025-11-17",
    "purchase_price": "8500.00",
    "seller": "Copart Auto Auction",
    "location": "Dallas, TX",
    "clearance_cost": "450.00",
    "towing_cost": "200.00"
  }
}
```

**Required Fields**:
- `vin` (string, unique per tenant)
- `car_model_id` (uuid)
- `year` (integer, 1900-current_year+1)
- `purchase_date` (date)
- `purchase_price` (decimal >= 0)

**Optional Fields**:
- `color` (string)
- `mileage` (integer >= 0)
- `seller` (string)
- `location` (string)
- `clearance_cost` (decimal >= 0)
- `towing_cost` (decimal >= 0)

**Success Response** (201 Created):
```json
{
  "id": "uuid",
  "vin": "1HGCM82633A123456",
  ... // full car object
}
```

**Error Response** (422):
```json
{
  "errors": ["VIN has already been taken"]
}
```

### Update Car
**Endpoint**: `PUT /api/cars/:id`
**Access**: Admin only
**Request**: Same as create (all fields optional)

### Delete Car
**Endpoint**: `DELETE /api/cars/:id`
**Access**: Admin only

**Error Response** (422) if has expenses:
```json
{
  "error": "Cannot delete car with existing expenses"
}
```

**Success Response** (200 OK):
```json
{
  "message": "Car deleted successfully"
}
```

## Car Models

### List All Car Models
**Endpoint**: `GET /api/car_models`
**Access**: Authenticated users
**Tenant Scope**: Automatic

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Toyota Camry",
    "active": true,
    "tenant_id": "uuid",
    "created_at": "2025-12-17T10:00:00.000Z",
    "updated_at": "2025-12-17T10:00:00.000Z"
  }
]
```

### Get Active Car Models
**Endpoint**: `GET /api/car_models/active`
**Access**: Authenticated users
**Tenant Scope**: Automatic

**Response**: Same as list, but only active models

### Create Car Model
**Endpoint**: `POST /api/car_models`
**Access**: Admin only

**Request**:
```json
{
  "car_model": {
    "name": "Ford F-150",
    "active": true
  }
}
```

**Required Fields**:
- `name` (string, unique per tenant)

**Optional Fields**:
- `active` (boolean, default: true)

### Update Car Model
**Endpoint**: `PUT /api/car_models/:id`
**Access**: Admin only

### Delete Car Model
**Endpoint**: `DELETE /api/car_models/:id`
**Access**: Admin only

**Error Response** (422) if has associated cars:
```json
{
  "error": "Cannot delete car model with existing cars"
}
```

## Expense Categories

### List All Expense Categories
**Endpoint**: `GET /api/expense_categories`
**Access**: Authenticated users
**Tenant Scope**: Automatic

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "name": "Engine Repair",
    "expense_type": "reparation",
    "active": true,
    "tenant_id": "uuid",
    "created_at": "2025-12-17T10:00:00.000Z",
    "updated_at": "2025-12-17T10:00:00.000Z"
  }
]
```

### Get Active Expense Categories
**Endpoint**: `GET /api/expense_categories/active`
**Access**: Authenticated users
**Tenant Scope**: Automatic

**Response**: Same as list, but only active categories

### Create Expense Category
**Endpoint**: `POST /api/expense_categories`
**Access**: Admin only

**Request**:
```json
{
  "expense_category": {
    "name": "Transmission Repair",
    "expense_type": "reparation",
    "active": true
  }
}
```

**Required Fields**:
- `name` (string, unique per tenant)
- `expense_type` (string, 'reparation' or 'purchase')

**Optional Fields**:
- `active` (boolean, default: true)

### Update Expense Category
**Endpoint**: `PUT /api/expense_categories/:id`
**Access**: Admin only

### Delete Expense Category
**Endpoint**: `DELETE /api/expense_categories/:id`
**Access**: Admin only

**Error Response** (422) if has associated expenses:
```json
{
  "error": "Cannot delete expense category with associated expenses"
}
```

## Expenses

### List All Expenses
**Endpoint**: `GET /api/expenses`
**Query Parameters**: `?car_id=uuid` (optional filter by car)
**Access**: Authenticated users
**Tenant Scope**: Automatic

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "car_id": "uuid",
    "car": {
      "id": "uuid",
      "vin": "1HGCM82633A123456",
      "car_model": {
        "name": "Toyota Camry"
      }
    },
    "expense_category_id": "uuid",
    "expense_category": {
      "id": "uuid",
      "name": "Engine Repair",
      "expense_type": "reparation"
    },
    "amount": "1250.00",
    "description": "Replace timing belt",
    "expense_date": "2025-12-15",
    "tenant_id": "uuid",
    "created_at": "2025-12-17T10:00:00.000Z",
    "updated_at": "2025-12-17T10:00:00.000Z"
  }
]
```

### Get One Expense
**Endpoint**: `GET /api/expenses/:id`
**Access**: Authenticated users
**Tenant Scope**: Automatic

### Create Expense
**Endpoint**: `POST /api/expenses`
**Access**: Admin only

**Request**:
```json
{
  "expense": {
    "car_id": "uuid",
    "expense_category_id": "uuid",
    "amount": "1250.00",
    "description": "Replace timing belt",
    "expense_date": "2025-12-15"
  }
}
```

**Required Fields**:
- `car_id` (uuid)
- `expense_category_id` (uuid)
- `amount` (decimal > 0)
- `expense_date` (date)

**Optional Fields**:
- `description` (text)

**Success Response** (201 Created):
```json
{
  "id": "uuid",
  "car_id": "uuid",
  ... // full expense object
}
```

### Update Expense
**Endpoint**: `PUT /api/expenses/:id`
**Access**: Admin only
**Request**: Same as create

### Delete Expense
**Endpoint**: `DELETE /api/expenses/:id`
**Access**: Admin only

**Success Response** (200 OK):
```json
{
  "message": "Expense deleted successfully"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause**: Missing or invalid JWT token

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```
**Cause**: User lacks required permissions (e.g., non-admin trying to create)

### 404 Not Found
**Cause**: Resource doesn't exist or doesn't belong to user's tenant

### 422 Unprocessable Entity
```json
{
  "errors": ["Name has already been taken", "Amount must be greater than 0"]
}
```
**Cause**: Validation errors

## Multi-Tenant Behavior

All tenant-scoped endpoints automatically filter by `current_user.tenant_id`:
- Users can only see data from their own tenant
- Cross-tenant access attempts return 404 (not 403 to avoid data leakage)
- VIN uniqueness is enforced per tenant
- Category/Model names are unique per tenant

Example: User from Tenant A cannot access cars from Tenant B, even with valid car ID.
