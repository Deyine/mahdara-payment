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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)

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

## Cars

### List Cars
**Endpoint**: `GET /api/cars`
**Access**: Authenticated (admin, super_admin)
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
    "tenant_id": "uuid",
    "total_cost": 10200.00,
    "total_expenses": 1050.00,
    "car_model": {
      "id": "uuid",
      "name": "Honda Accord"
    },
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
- Photo arrays and invoices array are empty if nothing has been uploaded
- Scoped to current user's tenant

### Get Single Car
**Endpoint**: `GET /api/cars/:id`
**Access**: Authenticated (admin, super_admin)

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

**Request**: Same structure as Create

**Response**: Updated car object

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

### Add Salvage Photos
**Endpoint**: `POST /api/cars/:id/salvage_photos`
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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
**Access**: Authenticated (admin, super_admin)
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

## Route Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/dashboard/statistics` | Auth | Dashboard stats |
| GET/POST/PUT/DELETE | `/api/cars` | Auth/Admin | Car CRUD |
| POST | `/api/cars/:id/restore` | Admin | Restore soft-deleted car |
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

**Legend**:
- **Public**: No authentication required
- **Auth**: Requires JWT token (admin or super_admin)
- **Admin**: Requires JWT token with admin or super_admin role
