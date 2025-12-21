# Glamova - API Contracts

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
    "role": "admin"
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
**Access**: Authenticated (admin, operator)
**Description**: Returns comprehensive dashboard statistics

**Request**: None (GET request with Authorization header)

**Response**:
```json
{
  "products": {
    "total": 42,
    "low_stock": 5,
    "out_of_stock": 2
  },
  "purchases": {
    "total": 15,
    "pending": 3,
    "completed": 12,
    "total_value": 15432.50
  },
  "expenses": {
    "total": 8,
    "total_amount": 4500.00,
    "this_month": 1200.00
  },
  "recent_purchases": [
    {
      "id": 1,
      "purchase_date": "2025-12-07",
      "supplier": "French Supplier Co.",
      "total_product_cost": "355.0",
      "delivery_cost": "150.0",
      "discount": "0.0",
      "status": "completed",
      "currency": "EUR",
      "exchange_rate": "45.5",
      "purchase_items": [
        {
          "id": 1,
          "quantity": 10,
          "unit_cost": "25.5",
          "product": {
            "id": 1,
            "name": "Product A",
            "sku": "PROD-A-001"
          }
        }
      ]
    }
  ],
  "recent_expenses": [
    {
      "id": 1,
      "expense_date": "2025-12-01",
      "amount": "1200.0",
      "description": "December rent",
      "currency": "MRU",
      "exchange_rate": "1.0",
      "expense_type": {
        "id": 1,
        "name": "Rent"
      }
    }
  ]
}
```

**Notes**:
- `total_value` is in MRU (sum of all completed purchases converted to MRU)
- `total_amount` and `this_month` are in MRU
- All decimal values returned as strings by Rails

**Updated Response** (with sales statistics):
```json
{
  "products": { ... },
  "purchases": { ... },
  "sales": {
    "total": 25,
    "completed": 20,
    "total_value_mru": 125000.00
  },
  "expenses": { ... },
  "recent_purchases": [ ... ],
  "recent_expenses": [ ... ]
}
```

---

## Products

### List Products
**Endpoint**: `GET /api/products`
**Access**: Authenticated (admin, operator)
**Description**: Returns all products

**Response**:
```json
[
  {
    "id": 1,
    "name": "Product A",
    "description": "Sample product",
    "sku": "PROD-A-001",
    "brand_id": 1,
    "current_stock": 50,
    "reorder_level": 10,
    "image_url": "http://localhost:3000/rails/active_storage/blobs/.../product.jpg",
    "thumbnail_url": "http://localhost:3000/rails/active_storage/representations/.../product.jpg",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z",
    "brand": {
      "id": 1,
      "name": "Nike",
      "created_at": "2025-12-13T16:00:00.000Z",
      "updated_at": "2025-12-13T16:00:00.000Z"
    }
  }
]
```

**Notes**:
- `brand_id` - Foreign key to brands table (nullable)
- `brand` - Associated brand object (null if no brand assigned)
- `image_url` - Full-size image URL (served by Active Storage)
- `thumbnail_url` - 800x800 medium_image variant URL (used for product display)
- Products are ordered by name alphabetically
- Query includes brand via `includes(:brand)` to prevent N+1 queries

### Get Single Product
**Endpoint**: `GET /api/products/:id`
**Access**: Authenticated (admin, operator)

**Response**: Same as single product object above

### Create Product
**Endpoint**: `POST /api/products`
**Access**: Admin only
**Description**: Create a new product with image upload (file or URL)
**Content-Type**: `multipart/form-data`

**Request Option 1 - File Upload** (FormData):
```javascript
FormData {
  'product[name]': 'New Product',
  'product[description]': 'Product description',
  'product[sku]': 'PROD-NEW-001',
  'product[reorder_level]': 5,
  'product[brand_id]': 1,  // Optional - brand ID
  'product[image]': File  // Upload file from device
}
```

**Request Option 2 - URL Upload** (FormData):
```javascript
FormData {
  'product[name]': 'New Product',
  'product[description]': 'Product description',
  'product[sku]': 'PROD-NEW-001',
  'product[reorder_level]': 5,
  'product[brand_id]': 1,  // Optional - brand ID
  'product[image_url]': 'https://example.com/image.jpg'  // Fetch from URL
}
```

**Response**: Created product object (status 201)

**Response** (Error - validation failure):
```json
{
  "errors": [
    "Image doit être présente",
    "Image doit être au format JPG, PNG, GIF ou WebP",
    "Image doit faire moins de 5 Mo"
  ]
}
```

**Response** (Error - URL fetch failure):
```json
{
  "errors": [
    "URL invalide",
    "Impossible d'accéder à l'image à cette URL",
    "Délai d'attente dépassé lors de la récupération de l'image",
    "L'URL ne pointe pas vers une image valide"
  ]
}
```

**Image Requirements**:

- **Required**: All products must have an image (via `product[image]` OR `product[image_url]`)
- **Formats**: JPG, JPEG, PNG, GIF, WebP
- **Max Size**: 5 MB
- **Validation**: Both client-side (frontend) and server-side (backend)
- **URL Timeout**: 10 seconds for URL fetching

**Notes**:
- `current_stock` is NOT included (defaults to 0, auto-calculated from purchases)
- SKU must be unique
- Image is required - products cannot be created without an image

### Update Product
**Endpoint**: `PUT /api/products/:id`
**Access**: Admin only
**Content-Type**: `multipart/form-data` (if updating image) OR `application/json` (if not)

**Request with File Image Update** (FormData):
```javascript
FormData {
  'product[name]': 'Updated Product',
  'product[description]': 'Updated description',
  'product[sku]': 'PROD-NEW-001',
  'product[reorder_level]': 10,
  'product[image]': File  // Optional - only if changing image via file
}
```

**Request with URL Image Update** (FormData):
```javascript
FormData {
  'product[name]': 'Updated Product',
  'product[description]': 'Updated description',
  'product[sku]': 'PROD-NEW-001',
  'product[reorder_level]': 10,
  'product[image_url]': 'https://example.com/new-image.jpg'  // Optional - only if changing image via URL
}
```

**Request without Image Update** (JSON):
```json
{
  "product": {
    "name": "Updated Product",
    "description": "Updated description",
    "reorder_level": 10
  }
}
```

**Response**: Updated product object

**Notes**:
- `current_stock` is NOT editable (auto-calculated)
- Image is optional when updating (keeps existing image if not provided)
- Can update image by providing new file in `product[image]` OR URL in `product[image_url]`

### Delete Product
**Endpoint**: `DELETE /api/products/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Product deleted successfully"
}
```

**Response** (Error - has purchases):
```json
{
  "error": "Cannot delete product with existing purchases"
}
```

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Product has associated purchases

---

## Purchases

### List Purchases
**Endpoint**: `GET /api/purchases`
**Access**: Authenticated (admin, operator)
**Description**: Returns all purchases with nested purchase_items

**Response**:
```json
[
  {
    "id": 1,
    "purchase_date": "2025-12-07",
    "supplier": "French Supplier Co.",
    "delivery_cost": "150.0",
    "discount": "0.0",
    "total_product_cost": "355.0",
    "notes": "Shipment from Paris",
    "status": "pending",
    "currency": "EUR",
    "exchange_rate": "45.5",
    "invoice_url": "http://localhost:3000/rails/active_storage/blobs/.../invoice.pdf",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z",
    "purchase_items": [
      {
        "id": 1,
        "quantity": 10,
        "unit_cost": "25.5",
        "product": {
          "id": 1,
          "name": "Product A",
          "sku": "PROD-A-001"
        }
      }
    ]
  }
]
```

### Get Single Purchase
**Endpoint**: `GET /api/purchases/:id`
**Access**: Authenticated (admin, operator)

**Response**: Same as single purchase object above

### Create Purchase
**Endpoint**: `POST /api/purchases`
**Access**: Admin only
**Description**: Create a purchase with nested purchase items and optional invoice attachment

**Request** (JSON for purchases without invoice):
```json
{
  "purchase": {
    "purchase_date": "2025-12-07",
    "supplier": "French Supplier Co.",
    "delivery_cost": 150.00,
    "discount": 0.00,
    "notes": "Shipment from Paris",
    "currency": "EUR",
    "exchange_rate": 45.5,
    "purchase_items_attributes": [
      {
        "product_id": 1,
        "quantity": 10,
        "unit_cost": 25.50
      },
      {
        "product_id": 2,
        "quantity": 5,
        "unit_cost": 40.00
      }
    ]
  }
}
```

**Request** (FormData with invoice file):

```text
Content-Type: multipart/form-data

purchase[purchase_date]: 2025-12-07
purchase[supplier]: French Supplier Co.
purchase[delivery_cost]: 150.00
purchase[discount]: 0.00
purchase[currency]: EUR
purchase[exchange_rate]: 45.5
purchase[total_product_cost]: 455.00
purchase[notes]: Shipment from Paris
purchase[status]: pending
purchase[invoice]: <File: invoice.pdf>
purchase[purchase_items_attributes][0][product_id]: 1
purchase[purchase_items_attributes][0][quantity]: 10
purchase[purchase_items_attributes][0][unit_cost]: 25.50
```

**Request** (FormData with invoice URL):

```text
Content-Type: multipart/form-data

purchase[purchase_date]: 2025-12-07
purchase[supplier]: French Supplier Co.
purchase[delivery_cost]: 150.00
purchase[discount]: 0.00
purchase[invoice_url]: https://example.com/invoice.pdf
... (other fields as above)
```

**Response**: Created purchase object with nested items and invoice_url (status 201)

**Notes**:

- `total_product_cost` is auto-calculated (sum of all line items)
- `status` defaults to 'pending'
- Exchange rate required for EUR/USD, auto-set to 1.0 for MRU
- **Invoice upload** supports two modes:
  - **File upload**: Send file via `purchase[invoice]` parameter (multipart/form-data)
  - **URL upload**: Send URL via `purchase[invoice_url]` parameter
- **Invoice validation**:
  - Accepted formats: PDF, JPG, PNG
  - Maximum size: 10MB
  - URL uploads use ImageFetcher service (same as products)

### Update Purchase
**Endpoint**: `PUT /api/purchases/:id`
**Access**: Admin only

**Request**: Same structure as Create (JSON or FormData)

**Response**: Updated purchase object with invoice_url

**Response** (Error - completed purchase):
```json
{
  "error": "Cannot edit a completed purchase. Please invalidate it first."
}
```

**Status Codes**:

- `200 OK` - Success
- `422 Unprocessable Entity` - Purchase is completed

**Notes**:

- CANNOT edit completed purchases
- Must uncomplete first, then edit, then re-complete
- **Invoice updates**: Can add/replace invoice using same methods as Create (file or URL)
- Replacing invoice: Simply upload a new file/URL, old invoice is automatically replaced

### Complete Purchase
**Endpoint**: `POST /api/purchases/:id/complete`
**Access**: Admin only
**Description**: Mark purchase as completed and update product stock

**Request**: None (POST with empty body)

**Response**:
```json
{
  "message": "Purchase completed successfully",
  "purchase": { /* updated purchase object */ }
}
```

**Side Effects**:
- Sets `status` to 'completed'
- Increments `current_stock` for each product by quantity in purchase_items
- Uses database transaction for atomicity

### Uncomplete Purchase
**Endpoint**: `POST /api/purchases/:id/uncomplete`
**Access**: Admin only
**Description**: Revert a completed purchase to pending status

**Request**: None (POST with empty body)

**Response**:
```json
{
  "message": "Purchase uncompleted successfully",
  "purchase": { /* updated purchase object */ }
}
```

**Response** (Error - insufficient stock):
```json
{
  "error": "Stock insuffisant pour Product A"
}
```

**Side Effects**:
- Sets `status` to 'pending'
- Decrements `current_stock` for each product by quantity
- Validates stock won't go negative
- Uses database transaction for atomicity

### Delete Purchase
**Endpoint**: `DELETE /api/purchases/:id`
**Access**: Admin only

**Response**:
```json
{
  "message": "Purchase deleted successfully"
}
```

**Notes**:
- CANNOT delete completed purchases (must uncomplete first)

---

## Brands

### List All Brands
**Endpoint**: `GET /api/brands`
**Access**: Authenticated (admin, operator)

**Response**:
```json
[
  {
    "id": 1,
    "name": "Nike",
    "created_at": "2025-12-13T16:00:00.000Z",
    "updated_at": "2025-12-13T16:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Adidas",
    "created_at": "2025-12-13T16:00:00.000Z",
    "updated_at": "2025-12-13T16:00:00.000Z"
  }
]
```

### Get Single Brand
**Endpoint**: `GET /api/brands/:id`
**Access**: Authenticated (admin, operator)

**Response**:
```json
{
  "id": 1,
  "name": "Nike",
  "created_at": "2025-12-13T16:00:00.000Z",
  "updated_at": "2025-12-13T16:00:00.000Z"
}
```

### Create Brand
**Endpoint**: `POST /api/brands`
**Access**: Admin only

**Request**:
```json
{
  "brand": {
    "name": "Puma"
  }
}
```

**Response** (Success - 201):
```json
{
  "id": 3,
  "name": "Puma",
  "created_at": "2025-12-13T16:00:00.000Z",
  "updated_at": "2025-12-13T16:00:00.000Z"
}
```

**Response** (Error - 422):
```json
{
  "errors": ["Name has already been taken"]
}
```

### Update Brand
**Endpoint**: `PUT /api/brands/:id`
**Access**: Admin only

**Request**:
```json
{
  "brand": {
    "name": "Puma Sports"
  }
}
```

**Response**: Updated brand object

### Delete Brand
**Endpoint**: `DELETE /api/brands/:id`
**Access**: Admin only

**Response**: 204 No Content (success)

**Error Response** (422):
```json
{
  "errors": ["Cannot delete brand with existing products"]
}
```

**Notes**:
- Brand names must be unique
- CANNOT delete brands that have associated products (`dependent: :restrict_with_error`)

---

## Expense Types

### List All Expense Types
**Endpoint**: `GET /api/expense_types`
**Access**: Admin only

**Response**:
```json
[
  {
    "id": 1,
    "name": "Rent",
    "description": "Monthly rent payment",
    "active": true,
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z"
  }
]
```

### List Active Expense Types
**Endpoint**: `GET /api/expense_types/active`
**Access**: Authenticated (admin, operator)
**Description**: Returns only active expense types (for dropdowns)

**Response**: Same format, filtered by `active: true`

### Create Expense Type
**Endpoint**: `POST /api/expense_types`
**Access**: Admin only

**Request**:
```json
{
  "expense_type": {
    "name": "New Category",
    "description": "Category description",
    "active": true
  }
}
```

**Response**: Created expense type object (status 201)

**Notes**:
- `name` must be unique

### Update Expense Type
**Endpoint**: `PUT /api/expense_types/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated expense type object

### Delete Expense Type
**Endpoint**: `DELETE /api/expense_types/:id`
**Access**: Admin only

**Response** (Success):
```json
{
  "message": "Expense type deleted successfully"
}
```

**Response** (Error - has expenses):
```json
{
  "error": "Cannot delete expense type with associated expenses"
}
```

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Has associated expenses

---

## Expenses

### List Expenses
**Endpoint**: `GET /api/expenses`
**Access**: Authenticated (admin, operator)
**Description**: Returns all expenses with expense type, ordered by date desc

**Response**:
```json
[
  {
    "id": 1,
    "expense_date": "2025-12-01",
    "amount": "1200.0",
    "description": "December rent",
    "currency": "MRU",
    "exchange_rate": "1.0",
    "created_at": "2025-12-07T12:00:00.000Z",
    "updated_at": "2025-12-07T12:00:00.000Z",
    "expense_type": {
      "id": 1,
      "name": "Rent"
    }
  }
]
```

### Get Single Expense
**Endpoint**: `GET /api/expenses/:id`
**Access**: Authenticated (admin, operator)

**Response**: Same as single expense object above

### Create Expense
**Endpoint**: `POST /api/expenses`
**Access**: Admin only

**Request**:
```json
{
  "expense": {
    "expense_date": "2025-12-01",
    "expense_type_id": 1,
    "amount": 1200.00,
    "description": "December rent",
    "currency": "MRU",
    "exchange_rate": 1.0
  }
}
```

**Response**: Created expense object (status 201)

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

## Data Type Notes

### Decimal/Float Handling

**CRITICAL**: Rails serializes `decimal` columns as **strings** in JSON.

**Backend** (Rails converts to float):
```ruby
{
  amount: expense.amount.to_f,
  exchange_rate: purchase.exchange_rate.to_f
}
```

**Frontend** (Always wrap in Number() before using toFixed()):
```jsx
{Number(expense.amount).toFixed(2)}
{Number(purchase.exchange_rate).toFixed(4)}
```

### Multi-Currency Fields

Both `purchases` and `expenses` include:
- `currency` - String: 'EUR' | 'USD' | 'MRU'
- `exchange_rate` - Decimal(10,4): How many MRU per currency unit

**Example**:
```json
{
  "currency": "EUR",
  "exchange_rate": "45.5",
  "delivery_cost": "150.0",
  "delivery_cost_mru": 6825.0,  // 150 × 45.5 (calculated on backend)
  "discount": "20.0",
  "discount_mru": 910.0  // 20 × 45.5 (calculated on backend)
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

## Nested Attributes

### Purchase with Items

Rails accepts `_attributes` suffix for nested resources:

```json
{
  "purchase": {
    "supplier": "ABC Corp",
    "purchase_items_attributes": [
      { "product_id": 1, "quantity": 10, "unit_cost": 25.50 },
      { "product_id": 2, "quantity": 5, "unit_cost": 40.00 }
    ]
  }
}
```

**Update** with `_destroy`:
```json
{
  "purchase": {
    "purchase_items_attributes": [
      { "id": 1, "quantity": 15 },           // Update existing
      { "product_id": 3, "quantity": 2 },    // Add new
      { "id": 2, "_destroy": true }          // Delete existing
    ]
  }
}
```

---

## Clients

### List Clients
**Endpoint**: `GET /api/clients`
**Access**: Authenticated (admin, operator)
**Description**: Returns all clients ordered by name

**Response**:
```json
[
  {
    "id": 1,
    "name": "Ahmed Mohamed",
    "phone": "12345678",
    "email": "ahmed@example.com",
    "address": "Nouakchott, Mauritania",
    "created_at": "2025-12-15T12:00:00.000Z",
    "updated_at": "2025-12-15T12:00:00.000Z"
  }
]
```

### Get Single Client
**Endpoint**: `GET /api/clients/:id`
**Access**: Authenticated (admin, operator)

**Response**: Same as single client object above

### Find Client by Phone
**Endpoint**: `GET /api/clients/find_by_phone?phone=12345678`
**Access**: Authenticated (admin, operator)
**Description**: Search for client by phone number (used by POS)

**Response** (Found):
```json
{
  "found": true,
  "client": {
    "id": 1,
    "name": "Ahmed Mohamed",
    "phone": "12345678",
    "email": "ahmed@example.com",
    "address": "Nouakchott, Mauritania"
  }
}
```

**Response** (Not Found):
```json
{
  "found": false
}
```

### Create Client
**Endpoint**: `POST /api/clients`
**Access**: Authenticated (admin, operator)

**Request**:
```json
{
  "client": {
    "name": "Ahmed Mohamed",
    "phone": "12345678",
    "email": "ahmed@example.com",
    "address": "Nouakchott, Mauritania"
  }
}
```

**Response**: Created client object (status 201)

**Notes**:
- Phone must be unique
- Email and address are optional

### Update Client
**Endpoint**: `PUT /api/clients/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated client object

### Delete Client
**Endpoint**: `DELETE /api/clients/:id`
**Access**: Admin only

**Response** (Success): 204 No Content

**Response** (Error - has sales):
```json
{
  "error": "Cannot delete client with existing sales"
}
```

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Client has associated sales

---

## Sales

### List Sales
**Endpoint**: `GET /api/sales`
**Access**: Authenticated (admin, operator)
**Description**: Returns all sales with nested sale_items, ordered by date desc

**Response**:
```json
[
  {
    "id": 1,
    "sale_date": "2025-12-15",
    "client_id": 1,
    "discount": "10.0",
    "total_product_cost": "500.0",
    "payment_amount": "490.0",
    "status": "completed",
    "notes": "Cash payment",
    "invoice_url": "http://localhost:3000/rails/active_storage/blobs/.../invoice.pdf",
    "created_at": "2025-12-15T12:00:00.000Z",
    "updated_at": "2025-12-15T12:00:00.000Z",
    "client": {
      "id": 1,
      "name": "Ahmed Mohamed",
      "phone": "12345678"
    },
    "sale_items": [
      {
        "id": 1,
        "quantity": 2,
        "unit_price": "250.0",
        "product": {
          "id": 1,
          "name": "Product A",
          "sku": "PROD-A-001"
        }
      }
    ]
  }
]
```

### Get Single Sale
**Endpoint**: `GET /api/sales/:id`
**Access**: Authenticated (admin, operator)

**Response**: Same as single sale object above

### Create Sale
**Endpoint**: `POST /api/sales`
**Access**: Authenticated (admin, operator)
**Description**: Create a sale with nested sale items (pending status)

**Request**:
```json
{
  "sale": {
    "sale_date": "2025-12-15",
    "client_id": 1,
    "discount": 10.00,
    "total_product_cost": 500.00,
    "payment_amount": 490.00,
    "status": "pending",
    "notes": "Cash payment",
    "sale_items_attributes": [
      {
        "product_id": 1,
        "quantity": 2,
        "unit_price": 250.00
      },
      {
        "product_id": 2,
        "quantity": 1,
        "unit_price": 0.00
      }
    ]
  }
}
```

**Response**: Created sale object with nested items (status 201)

**Notes**:
- `total_product_cost` is auto-calculated (sum of all line items)
- `status` defaults to 'pending'
- Currency is always MRU (no exchange rate needed)

### Update Sale
**Endpoint**: `PUT /api/sales/:id`
**Access**: Admin only

**Request**: Same structure as Create

**Response**: Updated sale object

**Response** (Error - completed sale):
```json
{
  "error": "Impossible de modifier une vente finalisée. Veuillez l'annuler d'abord."
}
```

**Status Codes**:
- `200 OK` - Success
- `422 Unprocessable Entity` - Sale is completed

**Notes**:
- CANNOT edit completed sales
- Must cancel first, then can delete and recreate

### Complete Sale
**Endpoint**: `POST /api/sales/:id/complete`
**Access**: Authenticated (admin, operator)
**Description**: Complete sale, decrement stock, generate PDF invoice

**Request**: None (POST with empty body)

**Response**:
```json
{
  "message": "Vente finalisée avec succès",
  "sale": { /* updated sale object with invoice_url */ }
}
```

**Response** (Error - insufficient stock):
```json
{
  "error": "Stock insuffisant pour Product A. Disponible: 5, Requis: 10"
}
```

**Side Effects**:
- Sets `status` to 'completed'
- Decrements `current_stock` for each product by quantity in sale_items
- Generates PDF invoice and attaches via Active Storage
- Uses database transaction for atomicity
- Validates sufficient stock before decrementing

### Cancel Sale
**Endpoint**: `POST /api/sales/:id/cancel`
**Access**: Admin only
**Description**: Cancel a completed sale and restore stock

**Request**: None (POST with empty body)

**Response**:
```json
{
  "message": "Vente annulée avec succès",
  "sale": { /* updated sale object */ }
}
```

**Side Effects**:
- Sets `status` to 'cancelled'
- Increments `current_stock` for each product by quantity
- Uses database transaction for atomicity

### Delete Sale
**Endpoint**: `DELETE /api/sales/:id`
**Access**: Admin only

**Response** (Success): 204 No Content

**Response** (Error - completed sale):
```json
{
  "error": "Impossible de supprimer une vente finalisée"
}
```

**Notes**:
- CANNOT delete completed sales
- Only pending sales can be deleted

---

## Cars

### List Cars
**Endpoint**: `GET /api/cars`
**Access**: Authenticated (admin, operator)
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

### Get Single Car
**Endpoint**: `GET /api/cars/:id`
**Access**: Authenticated (admin, operator)

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

---

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

---

### Add Salvage Photos
**Endpoint**: `POST /api/cars/:id/salvage_photos`
**Access**: Authenticated (admin, operator)
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
**Access**: Authenticated (admin, operator)
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

---

### Add After-Repair Photos
**Endpoint**: `POST /api/cars/:id/after_repair_photos`
**Access**: Authenticated (admin, operator)
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
**Access**: Authenticated (admin, operator)
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

---

### Add Invoices
**Endpoint**: `POST /api/cars/:id/invoices`
**Access**: Authenticated (admin, operator)
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
**Access**: Authenticated (admin, operator)
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
| GET/POST/PUT/DELETE | `/api/products` | Auth/Admin | Product CRUD |
| GET/POST/PUT/DELETE | `/api/purchases` | Auth/Admin | Purchase CRUD |
| POST | `/api/purchases/:id/complete` | Admin | Complete purchase |
| POST | `/api/purchases/:id/uncomplete` | Admin | Uncomplete purchase |
| GET | `/api/brands` | Auth | All brands |
| POST/PUT/DELETE | `/api/brands` | Admin | Brand CUD |
| GET | `/api/expense_types` | Admin | All expense types |
| GET | `/api/expense_types/active` | Auth | Active types only |
| POST/PUT/DELETE | `/api/expense_types` | Admin | Expense type CUD |
| GET | `/api/clients` | Auth | All clients |
| GET | `/api/clients/find_by_phone` | Auth | Find client by phone |
| POST/PUT | `/api/clients` | Auth | Create/Update client |
| DELETE | `/api/clients/:id` | Admin | Delete client |
| GET/POST/PUT/DELETE | `/api/sales` | Auth/Admin | Sale CRUD |
| POST | `/api/sales/:id/complete` | Auth | Complete sale |
| POST | `/api/sales/:id/cancel` | Admin | Cancel sale |

**Legend**:
- **Public**: No authentication required
- **Auth**: Requires JWT token (admin or operator)
- **Admin**: Requires JWT token with admin role
