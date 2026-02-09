# BestCar - API Contracts

All endpoints are namespaced under `/api` and return JSON responses.

## Authentication

### Login
**Endpoint**: `POST /api/auth/login`
**Access**: Public
**Description**: Authenticate user and receive JWT token

**Request**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response** (Success):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "Administrator",
    "username": "admin",
    "role": "admin",
    "tenant_id": "uuid"
  }
}
```

**Response** (Error):
```json
{
  "error": "Invalid credentials"
}
```

**Status Codes**:
- `200 OK` - Success
- `401 Unauthorized` - Invalid credentials

---

## Dashboard

### Get Statistics
**Endpoint**: `GET /api/dashboard/statistics`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns comprehensive dashboard statistics

**Request**: None (GET request with Authorization header)

**Response**:
```json
{
  "cars": {
    "total": 42,
    "active": 38,
    "sold": 4,
    "total_inventory_value": 315000.00
  },
  "expenses": {
    "total": 156,
    "total_amount": 45200.00,
    "this_month": 8500.00,
    "repair_expenses": 32000.00,
    "purchase_expenses": 13200.00
  },
  "car_models": {
    "total": 15,
    "active": 12
  },
  "recent_cars": [
    {
      "id": "uuid",
      "vin": "1HGCM82633A123456",
      "year": 2020,
      "purchase_date": "2025-12-15",
      "purchase_price": "8500.00",
      "total_cost": 10200.00,
      "car_model": {
        "name": "Honda Accord"
      }
    }
  ],
  "recent_expenses": [
    {
      "id": 1,
      "expense_date": "2025-12-01",
      "amount": "1200.0",
      "description": "Front bumper replacement",
      "currency": "EUR",
      "exchange_rate": "1.0",
      "expense_category": {
        "id": 1,
        "name": "Repair"
      },
      "car": {
        "id": "uuid",
        "vin": "1HGCM82633A123456"
      }
    }
  ]
}
```

**Notes**:
- `total_inventory_value` is sum of all active car total costs
- `total_amount` and `this_month` are expense totals
- All decimal values returned as strings by Rails

---

## Car Models

### List Car Models
**Endpoint**: `GET /api/car_models`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all car models for the current tenant

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Honda Accord",
    "active": true,
    "tenant_id": "uuid",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z"
  }
]
```

**Notes**:
- Models are ordered by name alphabetically
- Scoped to current user's tenant

### List Active Car Models
**Endpoint**: `GET /api/car_models/active`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns only active car models (for dropdowns)

**Response**: Same format, filtered by `active: true`

### Create Car Model
**Endpoint**: `POST /api/car_models`
**Access**: Admin only

**Request**:
```json
{
  "car_model": {
    "name": "Toyota Camry",
    "active": true
  }
}
```

**Response**: Created car model object (status 201)

**Response** (Error - validation failure):
```json
{
  "errors": [
    "Name has already been taken for this tenant"
  ]
}
```

**Notes**:
- Model name must be unique per tenant
- tenant_id automatically set from current_user

### Update Car Model
**Endpoint**: `PUT /api/car_models/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated car model object

### Delete Car Model
**Endpoint**: `DELETE /api/car_models/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Car model deleted successfully"
}
```

**Response** (Error - has cars):
```json
{
  "error": "Cannot delete car model with existing cars"
}
```

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Model has associated cars

---

## Expense Categories

### List All Expense Categories
**Endpoint**: `GET /api/expense_categories`
**Access**: Admin only
**Description**: Returns all expense categories for the current tenant

**Response**:
```json
[
  {
    "id": 1,
    "name": "Repair",
    "description": "Car repair and maintenance expenses",
    "expense_type": "reparation",
    "active": true,
    "tenant_id": "uuid",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z"
  }
]
```

**Notes**:
- `expense_type` can be "reparation" or "purchase"
- Scoped to current user's tenant

### List Active Expense Categories
**Endpoint**: `GET /api/expense_categories/active`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns only active expense categories (for dropdowns)

**Response**: Same format, filtered by `active: true`

### Create Expense Category
**Endpoint**: `POST /api/expense_categories`
**Access**: Admin only

**Request**:
```json
{
  "expense_category": {
    "name": "Parts",
    "description": "Auto parts and accessories",
    "expense_type": "reparation",
    "active": true
  }
}
```

**Response**: Created expense category object (status 201)

**Notes**:
- `name` must be unique per tenant
- `expense_type` must be either "reparation" or "purchase"

### Update Expense Category
**Endpoint**: `PUT /api/expense_categories/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated expense category object

### Delete Expense Category
**Endpoint**: `DELETE /api/expense_categories/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Expense category deleted successfully"
}
```

**Response** (Error - has expenses):
```json
{
  "error": "Cannot delete expense category with associated expenses"
}
```

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Has associated expenses

---

## Expenses

### List Expenses
**Endpoint**: `GET /api/expenses`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all expenses with category and car info, ordered by date desc

**Query Parameters**:
- `car_id=uuid` - Filter expenses for a specific car

**Response**:
```json
[
  {
    "id": 1,
    "expense_date": "2025-12-01",
    "amount": "1200.0",
    "description": "Front bumper replacement",
    "currency": "EUR",
    "exchange_rate": "1.0",
    "car_id": "uuid",
    "tenant_id": "uuid",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z",
    "expense_category": {
      "id": 1,
      "name": "Repair",
      "expense_type": "reparation"
    },
    "car": {
      "id": "uuid",
      "vin": "1HGCM82633A123456",
      "car_model": {
        "name": "Honda Accord"
      }
    }
  }
]
```

**Notes**:
- Scoped to current user's tenant
- `car` can be null if expense not linked to a specific car

### Get Single Expense
**Endpoint**: `GET /api/expenses/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single expense object above

### Create Expense
**Endpoint**: `POST /api/expenses`
**Access**: Admin only

**Request**:
```json
{
  "expense": {
    "expense_date": "2025-12-01",
    "expense_category_id": 1,
    "car_id": "uuid",
    "amount": 1200.00,
    "description": "Front bumper replacement",
    "currency": "EUR",
    "exchange_rate": 1.0
  }
}
```

**Response**: Created expense object (status 201)

**Notes**:
- `car_id` is optional (can be general expense not linked to a car)
- tenant_id automatically set from current_user

### Update Expense
**Endpoint**: `PUT /api/expenses/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated expense object

### Delete Expense
**Endpoint**: `DELETE /api/expenses/:id`
**Access**: Admin only

**Response**:
```json
{
  "message": "Expense deleted successfully"
}
```

---

## Payment Methods

### List All Payment Methods
**Endpoint**: `GET /api/payment_methods`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all payment methods for the current tenant

**Response**:
```json
[
  {
    "id": 1,
    "name": "Espèces",
    "active": true,
    "tenant_id": "uuid",
    "created_at": "2025-12-31T12:00:00.000Z",
    "updated_at": "2025-12-31T12:00:00.000Z"
  }
]
```

**Notes**:
- Payment methods are ordered by name alphabetically
- Scoped to current user's tenant

### List Active Payment Methods
**Endpoint**: `GET /api/payment_methods/active`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns only active payment methods (for dropdowns)

**Response**: Same format, filtered by `active: true`

### Create Payment Method
**Endpoint**: `POST /api/payment_methods`
**Access**: Admin only

**Request**:
```json
{
  "payment_method": {
    "name": "Carte Bancaire",
    "active": true
  }
}
```

**Response**: Created payment method object (status 201)

**Response** (Error - validation failure):
```json
{
  "errors": [
    "Name has already been taken for this tenant"
  ]
}
```

**Validation Rules**:
- `name`: required, unique per tenant
- `active`: defaults to true
- tenant_id automatically set from current_user

### Update Payment Method
**Endpoint**: `PUT /api/payment_methods/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated payment method object

### Delete Payment Method
**Endpoint**: `DELETE /api/payment_methods/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Payment method deleted successfully"
}
```

**Response** (Error - has payments):
```json
{
  "error": "Cannot delete payment method with associated payments"
}
```

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Payment method has associated payments

**Notes**:
- Payment methods cannot be deleted if they have payments referencing them
- Consider marking as inactive instead of deleting

---

## Payments

### List Payments
**Endpoint**: `GET /api/payments`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all payments with car and payment method info, ordered by payment_date desc

**Query Parameters**:
- `car_id=uuid` - Filter payments for a specific car

**Response**:
```json
[
  {
    "id": "uuid",
    "car_id": "uuid",
    "amount": 5000.00,
    "payment_date": "2025-12-20",
    "payment_method_id": 1,
    "payment_method": {
      "id": 1,
      "name": "Espèces"
    },
    "notes": "First installment",
    "created_at": "2025-12-20T12:00:00.000Z",
    "updated_at": "2025-12-20T12:00:00.000Z"
  }
]
```

**Notes**:
- Scoped to current user's tenant
- Ordered by payment_date DESC (most recent first)
- `payment_method` object is null if payment_method_id is not set

### Get Single Payment
**Endpoint**: `GET /api/payments/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single payment object above

### Create Payment
**Endpoint**: `POST /api/payments`
**Access**: Admin only
**Description**: Record a payment for a sold car

**Request**:
```json
{
  "payment": {
    "car_id": "uuid",
    "amount": 5000.00,
    "payment_date": "2025-12-20",
    "payment_method_id": 1,
    "notes": "First installment"
  }
}
```

**Response** (Success):
```json
{
  "id": "uuid",
  "car_id": "uuid",
  "amount": 5000.00,
  "payment_date": "2025-12-20",
  "payment_method_id": 1,
  "payment_method": {
    "id": 1,
    "name": "Espèces"
  },
  "notes": "First installment",
  "created_at": "2025-12-20T12:00:00.000Z",
  "updated_at": "2025-12-20T12:00:00.000Z"
}
```

**Response** (Error - car not sold):
```json
{
  "errors": ["Payments can only be added to sold cars"]
}
```

**Response** (Error - exceeds sale price):
```json
{
  "errors": ["Amount would exceed sale price by 1000.00 MRU"]
}
```

**Validation Rules**:
- car_id: required, must be a sold car (status='sold')
- amount: required, must be > 0
- payment_date: required
- payment_method_id: optional, must reference an existing payment method
- notes: optional
- Total payments (including this one) cannot exceed car's sale_price
- tenant_id automatically set from current_user

**Status Codes**:
- `201 Created` - Success
- `422 Unprocessable Entity` - Validation error

### Update Payment
**Endpoint**: `PUT /api/payments/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated payment object

**Notes**:
- Same validation rules as Create apply
- Total payments validation includes updated amount

### Delete Payment
**Endpoint**: `DELETE /api/payments/:id`
**Access**: Admin only

**Response**:
```json
{
  "message": "Payment deleted successfully"
}
```

**Status Codes**:
- `200 OK` - Success
- `404 Not Found` - Payment not found

---

## Users

### List Users
**Endpoint**: `GET /api/users`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all users in the current tenant

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "username": "john",
    "role": "admin",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z"
  },
  {
    "id": "uuid",
    "name": "Jane Smith",
    "username": "jane",
    "role": "manager",
    "created_at": "2025-12-08T12:00:00.000Z",
    "updated_at": "2025-12-08T12:00:00.000Z"
  }
]
```

**Notes**:
- Users ordered by name alphabetically
- Scoped to current user's tenant
- Used for user management and profit share dropdown

### List Managers
**Endpoint**: `GET /api/users/managers`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns only manager users (for profit share dropdown)

**Response**: Same format, filtered by `role: 'manager'`

### Get Manager Profits

**Endpoint**: `GET /api/users/profits`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns profit share data for managers with role-based filtering

**Response**:
```json
{
  "profits": [
    {
      "user": {
        "id": 123,
        "name": "Manager Name",
        "username": "manager1"
      },
      "total_profit": 15000.50,
      "total_user_profit": 3000.10,
      "total_company_profit": 12000.40,
      "cars": [
        {
          "id": "uuid",
          "ref": "CAR-001",
          "vin": "1HGBH41JXMN109186",
          "model_name": "Toyota Camry 2020",
          "status": "sold",
          "fully_paid": true,
          "profit": 5000.00,
          "profit_share_percentage": 20.0,
          "user_profit_amount": 1000.00,
          "company_net_profit": 4000.00,
          "sale_date": "2026-01-15",
          "purchase_date": "2025-12-01"
        },
        {
          "id": "uuid",
          "ref": "CAR-002",
          "vin": "2HGBH41JXMN109187",
          "model_name": "Honda Accord 2021",
          "status": "sold",
          "fully_paid": false,
          "profit": null,
          "profit_share_percentage": 20.0,
          "user_profit_amount": null,
          "company_net_profit": null,
          "sale_date": "2026-01-18",
          "purchase_date": "2025-12-15"
        }
      ]
    }
  ]
}
```

**Access Control**:

- **Managers**: See only their own profit share data
- **Admins/Super Admins**: See all managers' profit data

**Business Rules**:

- Cars are sorted by reference number (alphabetically)
- Only fully paid cars are included in total calculations
- Unpaid sold cars are shown in the list but with null profit values
- Totals only include cars where `fully_paid: true` and `profit` is present
- Filters out managers with no profit share cars (admin view only)

**Notes**:

- Used by `/profits` page for manager earnings dashboard
- `fully_paid` field indicates if car payment is complete
- Unpaid cars shown as "--" in UI to indicate profit not yet counted

### Get Single User
**Endpoint**: `GET /api/users/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single user object above

### Create User
**Endpoint**: `POST /api/users`
**Access**: Admin only
**Description**: Create a new user in the current tenant

**Request**:
```json
{
  "user": {
    "name": "New User",
    "username": "newuser",
    "password": "securepassword123",
    "role": "manager"
  }
}
```

**Response** (Success):
```json
{
  "id": "uuid",
  "name": "New User",
  "username": "newuser",
  "role": "manager",
  "created_at": "2025-12-15T12:00:00.000Z",
  "updated_at": "2025-12-15T12:00:00.000Z"
}
```

**Response** (Error - validation failure):
```json
{
  "errors": [
    "Username has already been taken"
  ]
}
```

**Response** (Error - permission denied):
```json
{
  "errors": [
    "Seul un super admin peut créer des utilisateurs admin"
  ]
}
```

**Validation Rules**:
- `name`: required
- `username`: required, unique per tenant
- `password`: required for new users
- `role`: required, must be 'manager' or 'admin' (only super_admin can create admin users)
- tenant_id automatically set from current_user

**Status Codes**:
- `201 Created` - Success
- `403 Forbidden` - Trying to create admin without super_admin permission
- `422 Unprocessable Entity` - Validation error

### Update User
**Endpoint**: `PUT /api/users/:id`
**Access**: Admin only

**Request**:
```json
{
  "user": {
    "name": "Updated Name",
    "username": "updateduser",
    "password": "newpassword",
    "role": "manager"
  }
}
```

**Response**: Updated user object

**Notes**:
- Password is optional on update (leave empty to keep current password)
- Cannot modify your own role
- Only super_admin can assign admin role

**Response** (Error - self role change):
```json
{
  "errors": [
    "Vous ne pouvez pas modifier votre propre rôle"
  ]
}
```

### Delete User
**Endpoint**: `DELETE /api/users/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Utilisateur supprimé avec succès"
}
```

**Response** (Error - self delete):
```json
{
  "error": "Vous ne pouvez pas supprimer votre propre compte"
}
```

**Response** (Error - super_admin protection):
```json
{
  "error": "Seul un super admin peut supprimer un super admin"
}
```

**Validation Rules**:
- Cannot delete yourself
- Only super_admin can delete super_admin users
- Regular admins can only delete manager users

**Status Codes**:
- `200 OK` - Success
- `403 Forbidden` - Permission denied
- `404 Not Found` - User not found

---

## Cars

### List Cars
**Endpoint**: `GET /api/cars`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns cars with their models and expenses (active by default)

**Query Parameters**:
- `only_deleted=true` - Return only soft-deleted cars
- `include_deleted=true` - Return all cars (active + deleted)

**Response**:
```json
[
  {
    "id": "uuid",
    "vin": "1HGCM82633A123456",
    "car_model_id": "uuid",
    "year": 2020,
    "color": "Black",
    "mileage": 45000,
    "purchase_date": "2025-12-01",
    "purchase_price": "8500.00",
    "seller": "Copart Auto Auction",
    "location": "Dallas, TX",
    "clearance_cost": "450.00",
    "towing_cost": "200.00",
    "deleted_at": null,
    "deleted": false,
    "tenant_id": "uuid",
    "status": "sold",
    "sale_price": 12000.00,
    "sale_date": "2025-12-20",
    "total_cost": 10200.00,
    "total_expenses": 1050.00,
    "total_paid": 5000.00,
    "remaining_balance": 7000.00,
    "fully_paid": false,
    "payment_percentage": 41.67,
    "profit": 1800.00,
    "profit_share_user_id": 2,
    "profit_share_percentage": 30.0,
    "profit_share_user": {
      "id": 2,
      "name": "Jane Smith",
      "username": "jane"
    },
    "has_profit_share": true,
    "user_profit_amount": 540.00,
    "company_net_profit": 1260.00,
    "daily_rental_rate": null,
    "rental_break_even": null,
    "total_rental_income": 0.00,
    "rental_transactions": [],
    "car_model": {
      "id": "uuid",
      "name": "Honda Accord"
    },
    "payments": [
      {
        "id": "uuid",
        "car_id": "uuid",
        "amount": 5000.00,
        "payment_date": "2025-12-20",
        "payment_method_id": 1,
        "payment_method": {
          "id": 1,
          "name": "Espèces"
        },
        "notes": "First installment",
        "created_at": "2025-12-20T12:00:00.000Z",
        "updated_at": "2025-12-20T12:00:00.000Z"
      }
    ],
    "salvage_photos": [
      {
        "id": "photo_uuid",
        "url": "/rails/active_storage/blobs/.../photo.jpg",
        "filename": "front_damage.jpg",
        "size": 524288,
        "content_type": "image/jpeg"
      }
    ],
    "after_repair_photos": [
      {
        "id": "photo_uuid",
        "url": "/rails/active_storage/blobs/.../repaired.jpg",
        "filename": "repaired_front.jpg",
        "size": 612352,
        "content_type": "image/jpeg"
      }
    ],
    "invoices": [
      {
        "id": "invoice_uuid",
        "url": "/rails/active_storage/blobs/.../invoice.pdf",
        "filename": "purchase_invoice.pdf",
        "size": 245760,
        "content_type": "application/pdf"
      }
    ]
  }
]
```

**Notes**:
- Cars ordered by purchase_date DESC (most recent first)
- `total_cost` includes purchase_price + clearance_cost + towing_cost + all expenses
- `total_expenses` is the sum of all expense amounts for this car
- `status` can be 'active' (available), 'sold', or 'rental'
- Sale fields (`sale_price`, `sale_date`, `total_paid`, `remaining_balance`, `payment_percentage`, `profit`) are only populated when status='sold'
- `profit` = sale_price - total_cost (null if not sold)
- `total_paid` = sum of all payment amounts
- `remaining_balance` = sale_price - total_paid
- `payment_percentage` = (total_paid / sale_price) * 100
- `fully_paid` = true when total_paid >= sale_price
- Profit share fields (only relevant when status='sold' and profit exists):
  - `profit_share_user_id` - ID of user receiving profit share (null if none)
  - `profit_share_percentage` - Percentage of profit allocated to user (0-100)
  - `profit_share_user` - User object with id, name, username (null if none)
  - `has_profit_share` - Boolean indicating if profit share is configured
  - `user_profit_amount` - Calculated amount: profit × percentage / 100
  - `company_net_profit` - Calculated amount: profit - user_profit_amount
- Rental fields (only relevant when status='rental'):
  - `daily_rental_rate` - Daily rental rate in MRU
  - `rental_break_even` - Number of days to break even: total_cost / daily_rental_rate
  - `total_rental_income` - Sum of all rental transaction amounts
  - `rental_transactions` - Array of rental transaction objects
- `payments` array contains all payment records for the car
- Photo arrays and invoices array are empty if nothing has been uploaded
- Scoped to current user's tenant

### Get Single Car
**Endpoint**: `GET /api/cars/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single car object above

### Create Car
**Endpoint**: `POST /api/cars`
**Access**: Admin only
**Description**: Create a new car (photos uploaded separately)

**Request**:
```json
{
  "car": {
    "vin": "1HGCM82633A123456",
    "car_model_id": "uuid",
    "year": 2020,
    "color": "Black",
    "mileage": 45000,
    "purchase_date": "2025-12-01",
    "purchase_price": 8500.00,
    "seller": "Copart Auto Auction",
    "location": "Dallas, TX",
    "clearance_cost": 450.00,
    "towing_cost": 200.00
  }
}
```

**Response**: Created car object (status 201)

**Response** (Error - validation failure):
```json
{
  "errors": [
    "VIN has already been taken",
    "Year must be greater than 1900"
  ]
}
```

**Validation Rules**:
- VIN: required, unique per tenant
- car_model_id: required
- year: required, 1900 to current_year+1
- purchase_date: required
- purchase_price: required, >= 0
- mileage: optional, integer >= 0
- clearance_cost, towing_cost: optional, >= 0
- tenant_id automatically set from current_user

### Update Car
**Endpoint**: `PUT /api/cars/:id`
**Access**: Admin only

**Request**: Same structure as Create, plus optional profit share fields

**Request** (with profit share):
```json
{
  "car": {
    "vin": "1HGCM82633A123456",
    "profit_share_user_id": 2,
    "profit_share_percentage": 30.0
  }
}
```

**Response**: Updated car object

**Validation Rules** (for profit share):
- `profit_share_user_id`: optional, must be a user in the same tenant (or null to remove)
- `profit_share_percentage`: optional, must be 0-100
- If `profit_share_user_id` is null, `profit_share_percentage` is set to 0

### Delete Car (Soft Delete)
**Endpoint**: `DELETE /api/cars/:id`
**Access**: Admin only
**Description**: Soft delete a car (sets deleted_at timestamp)

**Response** (Success):
```json
{
  "message": "Car deleted successfully"
}
```

**Status Codes**:
- `200 OK` - Success

**Notes**:
- Cars are ALWAYS soft-deleted (never permanently removed)
- No restrictions - cars with expenses can be soft-deleted
- Deleted cars excluded from default GET /api/cars queries
- Use `?only_deleted=true` to retrieve deleted cars

### Restore Car
**Endpoint**: `POST /api/cars/:id/restore`
**Access**: Admin only
**Description**: Restore a soft-deleted car (clears deleted_at)

**Response** (Success):
```json
{
  "message": "Car restored successfully",
  "car": { /* updated car object */ }
}
```

**Status Codes**:
- `200 OK` - Success
- `404 Not Found` - Car not found (or not deleted)

### Mark Car as Sold
**Endpoint**: `POST /api/cars/:id/sell`
**Access**: Admin only
**Description**: Mark a car as sold and set the sale price

**Request**:
```json
{
  "sale_price": 12000.00,
  "sale_date": "2025-12-20"
}
```

**Response** (Success):
```json
{
  "message": "Car marked as sold successfully",
  "car": {
    "id": "uuid",
    "status": "sold",
    "sale_price": 12000.00,
    "sale_date": "2025-12-20",
    "total_cost": 10200.00,
    "profit": 1800.00,
    "total_paid": 0.00,
    "remaining_balance": 12000.00,
    "payment_percentage": 0.0,
    "fully_paid": false
  }
}
```

**Response** (Error):
```json
{
  "error": "Sale price must be greater than 0"
}
```

**Validation Rules**:
- sale_price: required, must be > 0
- sale_date: optional, defaults to current date if not provided
- Car must have status='active'

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Validation error

**Notes**:
- Changes car status from 'active' to 'sold'
- Enables payment tracking for the car
- Profit is automatically calculated as: sale_price - total_cost

### Revert Car to Active (Unsell)
**Endpoint**: `POST /api/cars/:id/unsell`
**Access**: Admin only
**Description**: Revert a sold car back to active status

**Response** (Success):
```json
{
  "message": "Car marked as available successfully",
  "car": {
    "id": "uuid",
    "status": "active",
    "sale_price": null,
    "sale_date": null
  }
}
```

**Response** (Error - has payments):
```json
{
  "error": "Cannot mark as available: car has payments recorded"
}
```

**Validation Rules**:
- Car must have status='sold'
- Car must have NO payments recorded
- Once payments exist, car cannot be reverted to active

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Has payments or validation error

### Add Salvage Photos
**Endpoint**: `POST /api/cars/:id/salvage_photos`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Upload one or more salvage photos (initial condition)
**Content-Type**: `multipart/form-data`

**Request** (FormData):
```text
photos[]: File (image file)
photos[]: File (image file)
...
```

**Response**: Updated car object with new photos

**Photo Requirements**:
- Formats: JPG, JPEG, PNG, GIF, WebP
- Max Size: 5 MB per photo
- No limit on number of photos

**Response** (Error):
```json
{
  "errors": [
    "Salvage photos: front_damage.jpg must be less than 5MB"
  ]
}
```

### Delete Salvage Photo
**Endpoint**: `DELETE /api/cars/:id/salvage_photos/:photo_id`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Delete a specific salvage photo

**Response**:
```json
{
  "message": "Photo deleted successfully"
}
```

**Response** (Error - not found):
```json
{
  "error": "Photo not found"
}
```

### Add After-Repair Photos
**Endpoint**: `POST /api/cars/:id/after_repair_photos`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Upload one or more after-repair photos
**Content-Type**: `multipart/form-data`

**Request** (FormData):
```text
photos[]: File (image file)
photos[]: File (image file)
...
```

**Response**: Updated car object with new photos

**Photo Requirements**:
- Formats: JPG, JPEG, PNG, GIF, WebP
- Max Size: 5 MB per photo
- No limit on number of photos

**Response** (Error):
```json
{
  "errors": [
    "After repair photos: repaired_front.jpg must be less than 5MB"
  ]
}
```

### Delete After-Repair Photo
**Endpoint**: `DELETE /api/cars/:id/after_repair_photos/:photo_id`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Delete a specific after-repair photo

**Response**:
```json
{
  "message": "Photo deleted successfully"
}
```

**Response** (Error - not found):
```json
{
  "error": "Photo not found"
}
```

### Add Invoices
**Endpoint**: `POST /api/cars/:id/invoices`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Upload one or more purchase invoices/receipts
**Content-Type**: `multipart/form-data`

**Request** (FormData):
```text
invoices[]: File (PDF, JPG, or PNG file)
invoices[]: File (PDF, JPG, or PNG file)
...
```

**Response**: Updated car object with new invoices

**Invoice Requirements**:
- Formats: PDF, JPG, PNG
- Max Size: 10 MB per invoice
- No limit on number of invoices

**Response** (Error):
```json
{
  "errors": [
    "Invoice purchase_receipt.pdf must be less than 10MB",
    "Invoice photo.bmp must be PDF, JPG, or PNG format"
  ]
}
```

### Delete Invoice
**Endpoint**: `DELETE /api/cars/:id/invoices/:invoice_id`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Delete a specific invoice

**Response**:
```json
{
  "message": "Invoice deleted successfully"
}
```

**Response** (Error - not found):
```json
{
  "error": "Invoice not found"
}
```

### Mark Car as Rental
**Endpoint**: `POST /api/cars/:id/rent`
**Access**: Admin only
**Description**: Mark a car as available for rental with daily rate

**Request**:
```json
{
  "daily_rental_rate": 150.00
}
```

**Response** (Success):
```json
{
  "message": "Car marked as rental successfully",
  "car": {
    "id": "uuid",
    "status": "rental",
    "daily_rental_rate": 150.00,
    "rental_break_even": 68.0,
    "total_rental_income": 0.00
  }
}
```

**Response** (Error):
```json
{
  "error": "Daily rental rate must be greater than 0"
}
```

**Validation Rules**:
- daily_rental_rate: required, must be > 0
- Car must have status='active'
- Calculates rental_break_even as: total_cost / daily_rental_rate

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Validation error

**Notes**:
- Changes car status from 'active' to 'rental'
- Enables rental transaction tracking for the car

### Return Rental Car to Active
**Endpoint**: `POST /api/cars/:id/return_rental`
**Access**: Admin only
**Description**: Return a rental car back to active status

**Request** (optional):
```json
{
  "keep_rental_info": true
}
```

**Response** (Success):
```json
{
  "message": "Car returned to active status successfully",
  "car": {
    "id": "uuid",
    "status": "active",
    "daily_rental_rate": 150.00,
    "total_rental_income": 4500.00
  }
}
```

**Response** (Error - has active rentals):
```json
{
  "error": "Cannot return car to active: car has active rental transactions"
}
```

**Validation Rules**:
- Car must have status='rental'
- Car must have NO active (in_progress) rental transactions
- If `keep_rental_info` is false (default), clears daily_rental_rate

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Has active rentals or validation error

**Notes**:
- Preserves rental transaction history and total_rental_income
- By default clears daily_rental_rate unless keep_rental_info=true

---

## Rental Transactions

### List Rental Transactions
**Endpoint**: `GET /api/rental_transactions`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all completed rental transactions with car info, ordered by rental_date desc

**Query Parameters**:
- `car_id=uuid` - Filter rental transactions for a specific car

**Response**:
```json
[
  {
    "id": 1,
    "car_id": "uuid",
    "locataire": "Jean Dupont",
    "rental_date": "2026-01-01",
    "days": 15,
    "daily_rate": 150.00,
    "amount": 2250.00,
    "notes": "Location pour mariage",
    "created_at": "2026-01-01T12:00:00.000Z",
    "updated_at": "2026-01-01T12:00:00.000Z",
    "car": {
      "id": "uuid",
      "vin": "1HGCM82633A123456",
      "car_model": {
        "id": "uuid",
        "name": "Honda Accord"
      }
    }
  }
]
```

**Notes**:
- Scoped to current user's tenant
- Ordered by rental_date DESC (most recent first)
- All rentals are completed transactions (no status tracking)
- Amount is auto-calculated: amount = days × daily_rate

### Get Single Rental Transaction
**Endpoint**: `GET /api/rental_transactions/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single rental transaction object above

### Create Rental Transaction
**Endpoint**: `POST /api/rental_transactions`
**Access**: Admin only
**Description**: Record a completed rental transaction for a rental car

**Request**:
```json
{
  "rental_transaction": {
    "car_id": "uuid",
    "locataire": "Jean Dupont",
    "rental_date": "2026-01-01",
    "days": 15,
    "daily_rate": 150.00,
    "notes": "Location pour mariage"
  }
}
```

**Response** (Success):
```json
{
  "id": 1,
  "car_id": "uuid",
  "locataire": "Jean Dupont",
  "rental_date": "2026-01-01",
  "days": 15,
  "daily_rate": 150.00,
  "amount": 2250.00,
  "notes": "Location pour mariage",
  "created_at": "2026-01-01T12:00:00.000Z",
  "updated_at": "2026-01-01T12:00:00.000Z",
  "car": {
    "id": "uuid",
    "vin": "1HGCM82633A123456",
    "car_model": {
      "id": "uuid",
      "name": "Honda Accord"
    }
  }
}
```

**Response** (Error - car not rental):
```json
{
  "errors": ["Rental transactions can only be added to cars with rental status"]
}
```

**Validation Rules**:
- car_id: required, must be a rental car (status='rental')
- locataire: required, name of the renter
- rental_date: required, date when rental occurred
- days: required, must be > 0 (integer)
- daily_rate: required, must be > 0 (decimal)
- notes: optional
- amount: auto-calculated as days × daily_rate (not provided in request)
- tenant_id automatically set from current_user

**Status Codes**:
- `201 Created` - Success
- `422 Unprocessable Entity` - Validation error

### Update Rental Transaction
**Endpoint**: `PUT /api/rental_transactions/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated rental transaction object

**Notes**:
- Amount is recalculated when days or daily_rate changes
- All fields can be updated

### Delete Rental Transaction
**Endpoint**: `DELETE /api/rental_transactions/:id`
**Access**: Admin only

**Response**:
```json
{
  "message": "Rental transaction deleted successfully"
}
```

**Status Codes**:
- `200 OK` - Success
- `404 Not Found` - Rental transaction not found

---

## Sellers

### List All Sellers

**Endpoint**: `GET /api/sellers`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all sellers/auction houses for the current tenant

**Response**:
```json
[
  {
    "id": 1,
    "name": "Copart Auto Auction",
    "location": "Dallas, TX",
    "active": true,
    "tenant_id": "uuid",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z"
  }
]
```

**Notes**:

- Sellers are ordered by name alphabetically
- Scoped to current user's tenant

### List Active Sellers

**Endpoint**: `GET /api/sellers/active`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns only active sellers (for dropdowns in car purchase forms)

**Response**: Same format, filtered by `active: true`

### Create Seller

**Endpoint**: `POST /api/sellers`
**Access**: Admin only

**Request**:
```json
{
  "seller": {
    "name": "IAA Insurance Auto Auctions",
    "location": "Phoenix, AZ",
    "active": true
  }
}
```

**Response**: Created seller object (status 201)

**Response** (Error - validation failure):
```json
{
  "errors": [
    "Name has already been taken for this tenant"
  ]
}
```

**Validation Rules**:

- `name`: required, unique per tenant
- `location`: optional
- `active`: defaults to true
- tenant_id automatically set from current_user

### Update Seller

**Endpoint**: `PUT /api/sellers/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated seller object

### Delete Seller

**Endpoint**: `DELETE /api/sellers/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Seller deleted successfully"
}
```

**Response** (Error - has cars):
```json
{
  "error": "Cannot delete seller with associated cars"
}
```

**Status Codes**:

- `200 OK` - Success
- `422 Unprocessable Entity` - Seller has associated cars

**Notes**:

- Sellers cannot be deleted if they have cars referencing them
- Consider marking as inactive instead of deleting

---

## Data Type Notes

### Decimal/Float Handling

**CRITICAL**: Rails serializes `decimal` columns as **strings** in JSON.

**Backend** (Rails converts to float):
```ruby
{
  amount: expense.amount.to_f,
  purchase_price: car.purchase_price.to_f
}
```

**Frontend** (Always wrap in Number() before using toFixed()):
```jsx
{Number(expense.amount).toFixed(2)}
{Number(car.purchase_price).toFixed(2)}
```

### Multi-Currency Fields

Expenses include:
- `currency` - String: 'EUR' | 'USD' | 'MRU'
- `exchange_rate` - Decimal(10,4): How many MRU per currency unit

**Example**:
```json
{
  "currency": "EUR",
  "exchange_rate": "1.0",
  "amount": "1200.0"
}
```

### Date Format

**Backend** sends ISO 8601 date strings:
```json
{
  "purchase_date": "2025-12-07",
  "created_at": "2025-12-07T12:00:00.000Z"
}
```

**Frontend** displays in French format:
```javascript
new Date('2025-12-07').toLocaleDateString('fr-FR')  // "07/12/2025"
```

---

## Authorization Headers

All authenticated endpoints require JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Setup** (Frontend):
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## Error Response Format

All errors return JSON with `error` key:

```json
{
  "error": "Descriptive error message"
}
```

**Common Status Codes**:
- `200 OK` - Success
- `201 Created` - Resource created
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions (not admin)
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error or business logic violation
- `500 Internal Server Error` - Server error

---

## Car Shares

### List Car Shares

**Endpoint**: `GET /api/car_shares`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all car shares for the current tenant

**Query Parameters**:
- `car_id=uuid` - Filter shares for a specific car

**Response**:
```json
[
  {
    "id": "uuid",
    "token": "abc123xyz789token",
    "car_id": "uuid",
    "car_display_name": "#REF-001 Honda Accord 2020",
    "show_costs": true,
    "show_expenses": false,
    "expires_at": "2026-02-01T12:00:00.000Z",
    "expired": false,
    "view_count": 15,
    "share_url": "/share/abc123xyz789token",
    "created_at": "2026-01-21T10:00:00.000Z",
    "created_by": {
      "id": 1,
      "name": "John Doe"
    }
  }
]
```

**Notes**:
- Shares are ordered by created_at DESC (most recent first)
- Scoped to current user's tenant
- `expired` is computed based on current time vs expires_at

### Get Single Car Share

**Endpoint**: `GET /api/car_shares/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single car share object above

### Create Car Share

**Endpoint**: `POST /api/car_shares`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Create a shareable link for a car

**Request**:
```json
{
  "car_share": {
    "car_id": "uuid",
    "show_costs": true,
    "show_expenses": false,
    "expires_at": "2026-02-01T12:00:00.000Z"
  }
}
```

**Response** (Success):
```json
{
  "id": "uuid",
  "token": "abc123xyz789token",
  "car_id": "uuid",
  "car_display_name": "#REF-001 Honda Accord 2020",
  "show_costs": true,
  "show_expenses": false,
  "expires_at": "2026-02-01T12:00:00.000Z",
  "expired": false,
  "view_count": 0,
  "share_url": "/share/abc123xyz789token",
  "created_at": "2026-01-21T10:00:00.000Z",
  "created_by": {
    "id": 1,
    "name": "John Doe"
  }
}
```

**Validation Rules**:
- `car_id`: required, must exist in tenant
- `show_costs`: optional, defaults to false
- `show_expenses`: optional, defaults to false
- `expires_at`: optional, datetime for expiration
- `token`: automatically generated (SecureRandom.urlsafe_base64(16))
- `created_by`: automatically set to current_user
- `tenant_id`: automatically set from current_user

**Status Codes**:
- `201 Created` - Success
- `422 Unprocessable Entity` - Validation error

### Update Car Share

**Endpoint**: `PUT /api/car_shares/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Request**: Same structure as Create (excluding car_id and token)

**Response**: Updated car share object

### Delete Car Share

**Endpoint**: `DELETE /api/car_shares/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**:
```json
{
  "message": "Lien de partage supprimé"
}
```

**Status Codes**:
- `200 OK` - Success
- `404 Not Found` - Share not found

### Get Shared Car (Public)

**Endpoint**: `GET /api/public/cars/:token`
**Access**: Public (no authentication required)
**Description**: View a publicly shared car via token

**Response**:
```json
{
  "id": "uuid",
  "vin": "1HGCM82633A123456",
  "ref": "REF-001",
  "display_name": "#REF-001 Honda Accord 2020",
  "year": 2020,
  "color": "Black",
  "mileage": 45000,
  "purchase_date": "2025-12-01",
  "car_model": {
    "name": "Honda Accord"
  },
  "seller": {
    "name": "Copart Auto Auction"
  },
  "salvage_photos": [
    {
      "id": "photo_uuid",
      "url": "/rails/active_storage/blobs/.../photo.jpg",
      "filename": "front_damage.jpg"
    }
  ],
  "after_repair_photos": [
    {
      "id": "photo_uuid",
      "url": "/rails/active_storage/blobs/.../repaired.jpg",
      "filename": "repaired_front.jpg"
    }
  ],
  "share_settings": {
    "show_costs": true,
    "show_expenses": false
  },
  "costs": {
    "purchase_price": 8500.0,
    "clearance_cost": 450.0,
    "towing_cost": 200.0,
    "total_expenses": 1050.0,
    "total_cost": 10200.0
  }
}
```

**Conditional Fields**:
- `costs`: Only included if `show_costs: true`
- `expenses`: Only included if `show_expenses: true`

**Response** (Error - invalid/expired token):
```json
{
  "error": "Ce lien de partage n'existe pas ou a expiré"
}
```

**Status Codes**:
- `200 OK` - Success
- `404 Not Found` - Invalid or expired token

**Notes**:
- No authentication required
- Increments view_count on each access
- Returns 404 if token doesn't exist or share is expired
- Always visible: vehicle info, salvage_photos, after_repair_photos
- Optional: costs, expenses (based on share settings)

---

## Public Catalog API

Public endpoints for the mobile app. No authentication required. CORS configured to allow any origin.

### List Catalog

**Endpoint**: `GET /api/public/catalog`
**Access**: Public (no auth)
**Description**: Returns paginated list of published cars

**Query Parameters**:

- `page` (optional): Page number, default 1
- `per_page` (optional): Items per page, default 20, max 50

**Request**: None (GET request)

**Response**:

```json
{
  "cars": [
    {
      "id": "uuid",
      "display_name": "Honda Accord 2019",
      "year": 2019,
      "color": "Silver",
      "mileage": 85000,
      "status": "active",
      "price": 5000.0,
      "car_model": {
        "name": "Honda Accord"
      },
      "tenant_name": "BestCar Nouakchott",
      "salvage_photos": [
        {
          "id": "photo_uuid",
          "url": "https://api.bestcar-mr.com/rails/active_storage/blobs/.../photo.jpg",
          "filename": "salvage_front.jpg"
        }
      ],
      "after_repair_photos": [
        {
          "id": "photo_uuid",
          "url": "https://api.bestcar-mr.com/rails/active_storage/blobs/.../repaired.jpg",
          "filename": "repaired_front.jpg"
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total_count": 42,
    "total_pages": 3
  }
}
```

**Status Codes**:

- `200 OK` - Success

**Notes**:

- Only returns cars where `published: true` and `deleted_at: null`
- Only returns cars with status "active" or "sold"
- Shows all published cars across ALL tenants (no tenant filtering)
- `price` field shows `listing_price` for active cars, `sale_price` for sold cars
- Photo URLs are absolute (full URLs with domain)
- VIN, costs, expenses, and invoices are NOT included (public-safe)
- Ordered by `updated_at DESC`

### Get Catalog Car

**Endpoint**: `GET /api/public/catalog/:id`
**Access**: Public (no auth)
**Description**: Returns single car details from catalog

**Request**: None (GET request with car ID in URL)

**Response**: Single car object (same format as list endpoint)

**Response** (Error - not found):

```json
{
  "error": "Véhicule non trouvé"
}
```

**Status Codes**:

- `200 OK` - Success
- `404 Not Found` - Car not found or not published

**Notes**:

- Returns 404 if car is not published, deleted, or has wrong status
- Same data restrictions as list endpoint (no VIN, costs, etc.)

---

## Time Tracking

Time tracking system for managing projects, tasks, and time entries. Completely isolated from car management via `TimeTracking::` namespace.

### List Time Tracking Projects

**Endpoint**: `GET /api/time_tracking/projects`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns all time tracking projects for the current tenant

**Response**:
```json
[
  {
    "id": "uuid",
    "label": "Development Project",
    "description": "Main development work",
    "status": "active",
    "tenant_id": "uuid",
    "user_id": 1,
    "deleted_at": null,
    "total_time_seconds": 36000,
    "total_time_formatted": "10h 0m",
    "tasks_count": 5,
    "completed_tasks_count": 2,
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "john"
    },
    "created_at": "2026-02-09T12:00:00.000Z",
    "updated_at": "2026-02-09T12:00:00.000Z"
  }
]
```

**Notes**:
- Projects ordered by updated_at DESC (most recent first)
- Scoped to current user's tenant
- `total_time_seconds` is sum of all task time entries
- `total_time_formatted` shows as "Xh Ym"

### Get Single Time Tracking Project

**Endpoint**: `GET /api/time_tracking/projects/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single project object above

### Create Time Tracking Project

**Endpoint**: `POST /api/time_tracking/projects`
**Access**: Admin only
**Description**: Create a new time tracking project

**Request**:
```json
{
  "project": {
    "label": "Development Project",
    "description": "Main development work",
    "status": "active"
  }
}
```

**Response** (Success):
```json
{
  "id": "uuid",
  "label": "Development Project",
  "description": "Main development work",
  "status": "active",
  "tenant_id": "uuid",
  "user_id": 1,
  "total_time_seconds": 0,
  "total_time_formatted": "0h 0m",
  "tasks_count": 0,
  "completed_tasks_count": 0,
  "user": {...}
}
```

**Response** (Error - validation failure):
```json
{
  "errors": ["Label has already been taken"]
}
```

**Validation Rules**:
- `label`: required, unique per tenant (excluding deleted)
- `description`: optional
- `status`: required, must be 'draft', 'active', 'completed', or 'archived' (default: 'active')
- tenant_id automatically set from current_user

**Status Codes**:
- `201 Created` - Success
- `422 Unprocessable Entity` - Validation error

### Update Time Tracking Project

**Endpoint**: `PUT /api/time_tracking/projects/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated project object

### Delete Time Tracking Project (Soft Delete)

**Endpoint**: `DELETE /api/time_tracking/projects/:id`
**Access**: Admin only
**Description**: Soft delete a project (sets deleted_at timestamp)

**Response** (Success):
```json
{
  "message": "Project deleted successfully"
}
```

**Notes**:
- Projects are ALWAYS soft-deleted (never permanently removed)
- No restrictions - projects with tasks can be soft-deleted
- Deleted projects excluded from default queries

### Restore Time Tracking Project

**Endpoint**: `POST /api/time_tracking/projects/:id/restore`
**Access**: Admin only
**Description**: Restore a soft-deleted project (clears deleted_at)

**Response** (Success):
```json
{
  "message": "Project restored successfully",
  "project": { /* updated project object */ }
}
```

---

### List Tasks

**Endpoint**: `GET /api/time_tracking/tasks`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns tasks with optional filters

**Query Parameters**:
- `project_id=uuid` - Filter tasks for a specific project

**Response**:
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Implement feature X",
    "description": "Add new functionality",
    "position": 1,
    "status": "active",
    "tenant_id": "uuid",
    "user_id": 1,
    "deleted_at": null,
    "total_time_seconds": 7200,
    "total_time_formatted": "2h 0m",
    "entries_count": 3,
    "project": {
      "id": "uuid",
      "label": "Development Project"
    },
    "user": {
      "id": 1,
      "name": "John Doe"
    },
    "created_at": "2026-02-09T12:00:00.000Z",
    "updated_at": "2026-02-09T12:00:00.000Z"
  }
]
```

**Notes**:
- Tasks ordered by position ASC
- Scoped to current user's tenant
- `total_time_seconds` is sum of all time entry durations
- `entries_count` includes both running and completed entries

### Get Single Task

**Endpoint**: `GET /api/time_tracking/tasks/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single task object above

### Create Task

**Endpoint**: `POST /api/time_tracking/tasks`
**Access**: Admin only

**Request**:
```json
{
  "task": {
    "project_id": "uuid",
    "title": "Implement feature X",
    "description": "Add new functionality",
    "status": "active"
  }
}
```

**Response** (Success):
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "title": "Implement feature X",
  "description": "Add new functionality",
  "position": 3,
  "status": "active",
  "total_time_seconds": 0,
  "total_time_formatted": "0h 0m",
  "entries_count": 0
}
```

**Validation Rules**:
- `project_id`: required, must belong to tenant
- `title`: required
- `description`: optional
- `status`: required, must be 'active', 'completed', or 'archived' (default: 'active')
- `position`: auto-set to max_position + 1
- tenant_id automatically set from current_user

**Status Codes**:
- `201 Created` - Success
- `422 Unprocessable Entity` - Validation error

### Update Task

**Endpoint**: `PUT /api/time_tracking/tasks/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated task object

### Delete Task (Soft Delete)

**Endpoint**: `DELETE /api/time_tracking/tasks/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Task deleted successfully"
}
```

### Mark Task as Completed

**Endpoint**: `POST /api/time_tracking/tasks/:id/complete`
**Access**: Admin only
**Description**: Mark a task as completed

**Response** (Success):
```json
{
  "message": "Task marked as completed",
  "task": {
    "id": "uuid",
    "status": "completed"
  }
}
```

---

### List Time Entries

**Endpoint**: `GET /api/time_tracking/time_entries`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Returns time entries with filters

**Query Parameters**:
- `task_id=uuid` - Filter entries for a specific task
- `user_id=uuid` - Filter entries for a specific user (admin only)
- `running=true` - Filter only running entries
- `running=false` - Filter only completed entries

**Response**:
```json
[
  {
    "id": "uuid",
    "task_id": "uuid",
    "title": "Work session",
    "start_time": "2026-02-09T14:00:00.000Z",
    "end_time": "2026-02-09T16:30:00.000Z",
    "duration_seconds": 9000,
    "duration_formatted": "2h 30m",
    "notes": "Completed feature implementation",
    "running": false,
    "tenant_id": "uuid",
    "user_id": 1,
    "task": {
      "id": "uuid",
      "title": "Implement feature X",
      "project": {
        "id": "uuid",
        "label": "Development Project"
      }
    },
    "user": {
      "id": 1,
      "name": "John Doe"
    },
    "created_at": "2026-02-09T14:00:00.000Z",
    "updated_at": "2026-02-09T16:30:00.000Z"
  }
]
```

**Notes**:
- Entries ordered by start_time DESC (most recent first)
- Scoped to current user's tenant
- Managers only see their own entries (unless admin)
- `running` is true when end_time is null
- `duration_formatted` shows as "Xh Ym"

### Get Single Time Entry

**Endpoint**: `GET /api/time_tracking/time_entries/:id`
**Access**: Authenticated (admin, super_admin, manager)

**Response**: Same as single time entry object above

### Create Time Entry (Start Timer)

**Endpoint**: `POST /api/time_tracking/time_entries`
**Access**: Authenticated (admin, super_admin, manager)
**Description**: Start a new timer or create a manual time entry

**Request** (Start timer):
```json
{
  "time_entry": {
    "task_id": "uuid",
    "title": "Work session",
    "start_time": "2026-02-09T14:00:00.000Z"
  }
}
```

**Request** (Manual entry with duration):
```json
{
  "time_entry": {
    "task_id": "uuid",
    "title": "Work session",
    "start_time": "2026-02-09T14:00:00.000Z",
    "end_time": "2026-02-09T16:00:00.000Z",
    "notes": "Completed task X"
  }
}
```

**Response** (Success):
```json
{
  "id": "uuid",
  "task_id": "uuid",
  "title": "Work session",
  "start_time": "2026-02-09T14:00:00.000Z",
  "end_time": null,
  "duration_seconds": null,
  "duration_formatted": "0h 0m",
  "running": true,
  "user_id": 1
}
```

**Response** (Error - validation failure):
```json
{
  "errors": ["A time entry is already running for this user"]
}
```

**Validation Rules**:
- `task_id`: required, must belong to tenant
- `title`: required
- `start_time`: required
- `end_time`: optional, must be after start_time
- `notes`: optional
- User can only have ONE running entry at a time
- duration_seconds auto-calculated when end_time is set
- user_id automatically set to current_user
- tenant_id automatically set from current_user

**Status Codes**:
- `201 Created` - Success
- `422 Unprocessable Entity` - Validation error

### Update Time Entry

**Endpoint**: `PUT /api/time_tracking/time_entries/:id`
**Access**: Owner or Admin
**Description**: Update a time entry

**Request**: Same structure as Create

**Response**: Updated time entry object

**Notes**:
- Only the entry owner or admin can update
- Cannot update running entries (must stop first)

### Delete Time Entry

**Endpoint**: `DELETE /api/time_tracking/time_entries/:id`
**Access**: Owner or Admin

**Response** (Success):
```json
{
  "message": "Time entry deleted successfully"
}
```

**Notes**:
- Only the entry owner or admin can delete
- Soft deletes the entry (sets deleted_at)

### Stop Timer

**Endpoint**: `POST /api/time_tracking/time_entries/:id/stop`
**Access**: Entry Owner only
**Description**: Stop a running timer

**Request** (optional):
```json
{
  "end_time": "2026-02-09T16:30:00.000Z"
}
```

**Response** (Success):
```json
{
  "message": "Timer stopped",
  "entry": {
    "id": "uuid",
    "end_time": "2026-02-09T16:30:00.000Z",
    "duration_seconds": 9000,
    "duration_formatted": "2h 30m",
    "running": false
  }
}
```

**Response** (Error - not owner):
```json
{
  "error": "Forbidden"
}
```

**Notes**:
- Only the entry owner can stop their own timer
- If `end_time` not provided, uses current time
- Automatically calculates duration_seconds
- Sets running to false

---

## Route Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/dashboard/statistics` | Auth | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/users` | Auth/Admin | User CRUD |
| GET | `/api/users/managers` | Auth | List managers only |
| GET/POST/PUT/DELETE | `/api/cars` | Auth/Admin | Car CRUD |
| POST | `/api/cars/:id/restore` | Admin | Restore soft-deleted car |
| POST | `/api/cars/:id/sell` | Admin | Mark car as sold |
| POST | `/api/cars/:id/unsell` | Admin | Revert sold car to active |
| POST | `/api/cars/:id/rent` | Admin | Mark car as rental |
| POST | `/api/cars/:id/return_rental` | Admin | Return rental car to active |
| POST | `/api/cars/:id/salvage_photos` | Auth | Add salvage photos |
| DELETE | `/api/cars/:id/salvage_photos/:photo_id` | Auth | Delete salvage photo |
| POST | `/api/cars/:id/after_repair_photos` | Auth | Add after-repair photos |
| DELETE | `/api/cars/:id/after_repair_photos/:photo_id` | Auth | Delete after-repair photo |
| POST | `/api/cars/:id/invoices` | Auth | Add invoices |
| DELETE | `/api/cars/:id/invoices/:invoice_id` | Auth | Delete invoice |
| GET | `/api/car_models` | Auth | All car models |
| GET | `/api/car_models/active` | Auth | Active models only |
| POST/PUT/DELETE | `/api/car_models` | Admin | Car model CUD |
| GET | `/api/expense_categories` | Auth | All expense categories |
| GET | `/api/expense_categories/active` | Auth | Active categories only |
| POST/PUT/DELETE | `/api/expense_categories` | Admin | Expense category CUD |
| GET/POST/PUT/DELETE | `/api/expenses` | Auth/Admin | Expense CRUD |
| GET | `/api/sellers` | Auth | All sellers |
| GET | `/api/sellers/active` | Auth | Active sellers only |
| POST/PUT/DELETE | `/api/sellers` | Admin | Seller CUD |
| GET | `/api/payment_methods` | Auth | All payment methods |
| GET | `/api/payment_methods/active` | Auth | Active payment methods only |
| POST/PUT/DELETE | `/api/payment_methods` | Admin | Payment method CUD |
| GET/POST/PUT/DELETE | `/api/payments` | Auth/Admin | Payment CRUD |
| GET/POST/PUT/DELETE | `/api/rental_transactions` | Auth/Admin | Rental transaction CRUD |
| POST | `/api/rental_transactions/:id/complete` | Admin | Complete rental transaction |
| GET/POST/PUT/DELETE | `/api/car_shares` | Auth | Car share CRUD |
| GET | `/api/public/cars/:token` | Public | View shared car (no auth) |
| GET | `/api/public/catalog` | Public | List published cars (catalog) |
| GET | `/api/public/catalog/:id` | Public | View single catalog car |
| GET/POST/PUT/DELETE | `/api/time_tracking/projects` | Auth/Admin | Time tracking projects |
| POST | `/api/time_tracking/projects/:id/restore` | Admin | Restore deleted project |
| GET/POST/PUT/DELETE | `/api/time_tracking/tasks` | Auth/Admin | Time tracking tasks |
| POST | `/api/time_tracking/tasks/:id/complete` | Admin | Mark task as completed |
| GET/POST/PUT/DELETE | `/api/time_tracking/time_entries` | Auth | Time entries (timer tracking) |
| POST | `/api/time_tracking/time_entries/:id/stop` | Owner | Stop running timer |

**Legend**:

- **Public**: No authentication required
- **Auth**: Requires JWT token (admin or super_admin)
- **Admin**: Requires JWT token with admin or super_admin role
