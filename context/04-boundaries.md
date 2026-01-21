# BestCar - Frontend ↔ Backend Integration

This document describes how the React frontend integrates with the Rails backend API.

---

## API Service Layer

### Axios Configuration

**File**: `client/src/services/api.js`

- Base URL from environment variable (`VITE_API_URL`)
- Automatic JWT token attachment via request interceptor
- Automatic redirect to login on 401 Unauthorized
- Centralized error handling

**Key Interceptors**:
```javascript
// Request - attach JWT token
config.headers.Authorization = `Bearer ${token}`;

// Response - handle 401
if (error.response?.status === 401) {
  localStorage.clear();
  window.location.href = '/login';
}
```

---

## Authentication Flow

### AuthContext

**File**: `client/src/context/AuthContext.jsx`

**State Management**:

- User object stored in localStorage + React state
- JWT token stored in localStorage
- Login/logout methods update both storage and state

**Access Control Helpers**:
```javascript
const { user, canWrite, isAdmin, isManager } = useAuth();

// Manager role: read-only access
// Admin/Super Admin: full write access
```

**Route Protection**:

- `<PrivateRoute>` wrapper checks authentication
- `requireAdmin` prop restricts write operations
- Managers see UI but all action buttons hidden via `canWrite` check

---

## Data Fetching Patterns

### Standard CRUD Flow

**Fetch List**:
```javascript
useEffect(() => {
  fetchCars();
}, []);

const fetchCars = async () => {
  const response = await api.get('/cars');
  setCars(response.data);
};
```

**Create**:
```javascript
const response = await api.post('/cars', { car: formData });
await showAlert('Véhicule créé', 'success');
fetchCars(); // Refetch list
```

**Update**:
```javascript
await api.put(`/cars/${id}`, { car: formData });
fetchCars(); // Refetch list
```

**Delete with Confirmation**:
```javascript
const confirmed = await showConfirm('Supprimer ?');
if (!confirmed) return;

await api.delete(`/cars/${id}`);
fetchCars(); // Refetch list
```

### Nested Resources

**Create Car with Expenses** (example pattern):
```javascript
// POST /api/cars
{
  car: {
    vin: "...",
    car_model_id: "uuid",
    // ...base fields
  }
}

// Then POST /api/expenses for each expense
{
  expense: {
    car_id: "uuid",
    expense_category_id: "uuid",
    amount: 1200.00,
    // ...
  }
}
```

**Note**: BestCar uses separate endpoints, not nested attributes like `expenses_attributes`.

---

## Data Transformation

### Backend → Frontend

**Decimal Strings to Numbers**:
```javascript
// Rails sends decimals as strings
const amount = Number(car.purchase_price).toFixed(2);

// For calculations
const total = Number(car.purchase_price) + Number(car.clearance_cost);
```

**Date Display**:
```javascript
// Backend: "2025-12-07"
// Display: French format
new Date(car.purchase_date).toLocaleDateString('fr-FR'); // "07/12/2025"
```

### Frontend → Backend

**Form Data to Payload**:
```javascript
// Convert string inputs to proper types
const payload = {
  car: {
    purchase_price: parseFloat(formData.purchase_price),
    year: parseInt(formData.year),
    purchase_date: formData.purchase_date // Already ISO format from input[type="date"]
  }
};
```

---

## Error Handling

### Standard Pattern

```javascript
try {
  await api.post('/cars', { car: formData });
  await showAlert('Succès', 'success');
} catch (error) {
  const message = error.response?.data?.errors?.[0]
    || error.response?.data?.error
    || 'Erreur serveur';
  await showAlert(message, 'error');
}
```

### Status Code Handling

- **401 Unauthorized**: Auto-handled by interceptor (logout + redirect)
- **403 Forbidden**: Permission denied (shown to managers attempting writes)
- **422 Unprocessable Entity**: Validation errors from backend
- **404 Not Found**: Resource not found (or cross-tenant access attempt)

---

## File Upload Patterns

### Active Storage Uploads

**Pattern Used**: Photo/invoice uploads separate from car creation/update.

**Car Photos** (salvage_photos, after_repair_photos):
```javascript
// 1. Create/update car first (get car ID)
// 2. Upload photos separately

const formData = new FormData();
Array.from(files).forEach(file => {
  formData.append('photos[]', file);
});

await api.post(`/cars/${carId}/salvage_photos`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Car Invoices**:
```javascript
const formData = new FormData();
Array.from(files).forEach(file => {
  formData.append('invoices[]', file);
});

await api.post(`/cars/${carId}/invoices`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Delete Photo/Invoice**:
```javascript
await api.delete(`/cars/${carId}/salvage_photos/${photoId}`);
await api.delete(`/cars/${carId}/invoices/${invoiceId}`);
```

**Rendering Photos**:
```javascript
// Backend returns: { id, url, filename, size, content_type }
{car.salvage_photos.map(photo => (
  <img key={photo.id} src={photo.url} alt={photo.filename} />
))}
```

---

## Car-Specific Integrations

### Car Photo Management

**Two Separate Collections**:
- `salvage_photos`: Before-repair condition
- `after_repair_photos`: After-repair condition

**Upload Flow**:

1. User uploads multiple photos at once (FormData with `photos[]`)
2. Backend attaches to car via Active Storage
3. Frontend refetches car data to get updated photo URLs
4. Display in PhotoGallery component (horizontal swiper)

**Features**:

- Multiple photo upload
- Individual photo deletion
- Fullscreen image viewer
- Photo swiper with navigation arrows

### Invoice Management

**Supported Formats**: PDF, JPG, PNG (max 10 MB)

**Upload Pattern**: Same as photos (separate endpoint after car creation)

**Display**: List of invoices with download links in car detail page.

### Expense Tracking

**Create Expense**:
```javascript
// POST /api/expenses
{
  expense: {
    car_id: "uuid",
    expense_category_id: "uuid",
    amount: 1250.00,
    expense_date: "2025-12-15",
    description: "Engine repair"
  }
}
```

**Filter by Car**:
```javascript
// GET /api/expenses?car_id=uuid
const response = await api.get(`/expenses?car_id=${carId}`);
```

**Impact on Car Total Cost**:

- Frontend refetches car after expense created/updated/deleted
- Backend recalculates `total_cost` automatically
- UI shows updated totals immediately

### Seller Relationship

**Pattern**: String field, not foreign key relationship.

**Why**: Sellers change less frequently, simpler to store as string in car record.

**Implementation**:
- Backend: `t.string :seller` on cars table
- Frontend: Text input (not dropdown)
- Future: Could add sellers table + dropdown if needed

**Display**: Show seller name directly from car record.

### Car Sharing (Public Links)

**Overview**: Create public shareable links for car details with configurable visibility.

**Access Control**: All authenticated users (admin, super_admin, manager) can create/manage shares.

**Create Share Link**:
```javascript
// POST /api/car_shares
const response = await carSharesAPI.create({
  car_id: "uuid",
  show_costs: true,          // Optional: show cost breakdown
  show_expenses: false,       // Optional: show expenses list
  expires_at: "2026-02-01T12:00:00Z"  // Optional: expiration date
});
// Returns: { token: "abc123xyz...", share_url: "/share/abc123xyz..." }
```

**List Shares for Car**:
```javascript
// GET /api/car_shares?car_id=uuid
const response = await carSharesAPI.getAll(carId);
// Returns array of share objects with view counts
```

**Delete Share**:
```javascript
// DELETE /api/car_shares/:id
await carSharesAPI.delete(shareId);
```

**Public Access (No Auth)**:
```javascript
// GET /api/public/cars/:token
const response = await publicAPI.getSharedCar(token);
// Returns car data based on share settings
```

**Frontend Integration**:

1. **Share Button**: Visible to all authenticated users on CarDetail page
2. **ShareCarModal Component**: Manages share creation/listing
   - Form to create new share with checkboxes for optional sections
   - List of existing shares with copy/delete actions
   - View count tracking
3. **SharedCar Page**: Public route (`/share/:token`) - no auth required
   - Always shows: vehicle info, salvage photos, after-repair photos
   - Conditionally shows: costs, expenses (based on share settings)
   - Fullscreen photo viewer
   - Responsive design

**Copy to Clipboard**:
```javascript
const url = `${window.location.origin}/share/${token}`;
await navigator.clipboard.writeText(url);
```

**Data Flow**:

1. User clicks "Partager" button on CarDetail
2. Modal opens, fetches existing shares for that car
3. User configures visibility options and creates share
4. Backend generates unique token (SecureRandom.urlsafe_base64)
5. User copies share URL
6. Anonymous user visits `/share/:token`
7. PublicController increments view count, returns filtered car data
8. SharedCar page displays data based on share settings

**Security**:

- Token-based access (22-char URL-safe random string)
- Optional expiration dates
- Multi-tenant scoped (shares isolated per tenant)
- No sensitive data in default view (costs/expenses are opt-in)
- View count tracking for analytics

**PublicCarSerializer Behavior**:

```javascript
// Always included
{
  vin, year, color, mileage, purchase_date,
  car_model: { name },
  seller: { name },
  salvage_photos: [...],
  after_repair_photos: [...]
}

// Conditionally included (if show_costs: true)
{
  costs: {
    purchase_price, clearance_cost, towing_cost,
    total_expenses, total_cost
  }
}

// Conditionally included (if show_expenses: true)
{
  expenses: [
    { expense_date, amount, description, category }
  ]
}
```

**UI Components**:

- **ShareCarModal**: `client/src/components/ShareCarModal.jsx`
  - Create share form with checkboxes
  - List existing shares with metadata
  - Copy/delete actions

- **SharedCar**: `client/src/pages/SharedCar.jsx`
  - Public page (no Layout wrapper)
  - Responsive grid layouts
  - Photo gallery with fullscreen viewer
  - Conditional section rendering

**Common Use Cases**:

1. **Basic share** (vehicle info + photos only): Leave both checkboxes unchecked
2. **Full transparency** (show everything): Check both "Afficher les Couts" and "Afficher les Depenses"
3. **Time-limited share**: Set expires_at for temporary access
4. **Analytics**: Track view counts to measure interest

---

## Payment & Rental Management

### Payment Tracking (Sold Cars)

**Mark Car as Sold**:
```javascript
// POST /api/cars/:id/sell
{
  sale_price: 12000.00,
  sale_date: "2025-12-20"
}
```

**Record Payment**:
```javascript
// POST /api/payments
{
  payment: {
    car_id: "uuid",
    amount: 5000.00,
    payment_date: "2025-12-20",
    payment_method_id: 1, // optional
    notes: "First installment"
  }
}
```

**Backend Validations**:

- Car must have status='sold'
- Total payments cannot exceed sale_price
- Amount must be > 0

**Frontend Display**:

- Payment progress bar (total_paid / sale_price)
- Remaining balance
- Payment history list
- Profit calculation (sale_price - total_cost)

### Rental Transactions

**Mark Car as Rental**:
```javascript
// POST /api/cars/:id/rent
{
  daily_rental_rate: 150.00
}
```

**Create Rental Transaction**:
```javascript
// POST /api/rental_transactions
{
  rental_transaction: {
    car_id: "uuid",
    start_date: "2026-01-01",
    end_date: null, // null for in-progress
    daily_rate: 150.00,
    status: "in_progress",
    notes: "Wedding rental"
  }
}
```

**Complete Rental**:
```javascript
// POST /api/rental_transactions/:id/complete
{
  end_date: "2026-01-15" // defaults to today if not provided
}

// Backend calculates:
// - days = end_date - start_date
// - amount = days × daily_rate
// - Updates car's total_rental_income
```

**Return Car to Active**:
```javascript
// POST /api/cars/:id/return_rental
// Can only return if no active (in_progress) rentals exist
```

---

## Manager Profits Dashboard

### Endpoint

**GET /api/users/profits**

**Access Control**:

- Managers: See only their own profit data
- Admins/Super Admins: See all managers' profit data

**Response Structure**:
```javascript
{
  profits: [
    {
      user: { id, name, username },

      // Car sales profits
      total_profit: 1800.00,
      total_user_profit: 540.00,
      total_company_profit: 1260.00,
      cars: [/* sold cars with profit_share */],

      // Rental profits
      total_rental_amount: 4500.00,
      total_rental_user_profit: 600.00,
      total_rental_company_profit: 3900.00,
      rentals: [/* completed rentals with profit_share */]
    }
  ]
}
```

**Business Rules**:

- Only fully paid cars included in sales totals
- Unpaid sold cars shown but with null profit values
- All completed rental transactions included
- Filters out managers with no profit share

**Frontend Display**:

- Separate sections for sales profits and rental profits
- Expandable tables showing individual cars/rentals
- Total manager profit, cashouts, available balance
- "Cash Out" button for creating cashouts

---

## Cashout Management

### Create Cashout

```javascript
// POST /api/cashouts
{
  cashout: {
    user_id: 2, // manager
    amount: 300.00,
    cashout_date: "2026-01-20",
    notes: "Monthly withdrawal"
  }
}
```

**Validation**:

- Amount must be > 0
- Cannot exceed available balance (total_manager_profit - total_cashouts)
- User must be a manager
- User must belong to current tenant

**Frontend Integration**:

- Cashout modal with amount, date, notes fields
- Real-time balance calculation
- Amount input with max validation
- Refreshes profits data after creation

---

## Car Status Workflow Integration

### Status Transitions

**Active → Sold**:
```javascript
// POST /api/cars/:id/sell
// Frontend: Navigate to sales payment tracking
```

**Sold → Active** (if no payments):
```javascript
// POST /api/cars/:id/unsell
// Frontend: Revert to active status, clear sale fields
```

**Active → Rental**:
```javascript
// POST /api/cars/:id/rent
// Frontend: Navigate to rental transaction tracking
```

**Rental → Active** (if no active rentals):
```javascript
// POST /api/cars/:id/return_rental
// Frontend: Revert to active, preserve rental history
```

**Frontend Constraints**:

- Disable status change buttons based on current state
- Show appropriate action buttons per status
- Validate before allowing transitions
- Display warnings for irreversible actions

---

## CSV/Excel Import Patterns

### Expense Import

**Pattern**: Parse CSV client-side, create expenses via API.

**Flow**:

1. User selects CSV file
2. Frontend parses with Papa Parse
3. Show preview table with category matching
4. User confirms/maps categories
5. Bulk create via individual POST requests

**Category Matching**:

- Fuzzy search to find matching expense categories
- Highlight unmatched categories
- Allow manual category selection via searchable dropdown
- Option to create new categories on-the-fly (admin only)

**Frontend Validation**:

- Check required fields (date, amount, category)
- Validate amount > 0
- Validate date format
- Show errors before submission

---

## Filter & View Mode Patterns

### Car List Filters

**Status Filter**:
```javascript
const [statusFilter, setStatusFilter] = useState('all');

// Filter cars by status
const filteredCars = cars.filter(car => {
  if (statusFilter === 'all') return true;
  return car.status === statusFilter;
});
```

**View Modes**:

- **Grid View**: Cards with photos, key stats (default)
- **List View**: Compact table rows, payment-focused
- Toggle persisted in localStorage

**Deleted Cars Toggle**:
```javascript
const [showDeleted, setShowDeleted] = useState(false);

// Fetch with query param
const url = showDeleted ? '/cars?only_deleted=true' : '/cars';
```

---

## Performance Considerations

### Avoid N+1 Queries

**Backend**: Always use `.includes()` for associations.

```ruby
# Good
Car.includes(:car_model, :expenses, :payments)

# Bad
Car.all # Then accessing car.car_model causes N+1
```

**Frontend Impact**: Single API call returns all needed data.

### Debounced Search

**Pattern**: Delay search API calls until user stops typing.

```javascript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    performSearch(query);
  }, 300); // 300ms delay

  return () => clearTimeout(timeoutId);
}, [query]);
```

**Usage**: Search bars, live filters, autocomplete dropdowns.

---

## State Management Summary

### Local State (useState)

**Use for**:

- Form data
- Modal visibility
- View modes
- UI-only state

### Context State

**AuthContext**: User authentication, role-based access
**DialogContext**: Custom alerts/confirms (replaces native alert/confirm)

### Server State

**Pattern**: useState + useEffect + refetch after mutations.

**Not using**: React Query, SWR, or other data fetching libraries (simple refetch pattern sufficient for current needs).

---

## Key Integration Principles

1. **Separation of Concerns**: Frontend handles UI/UX, backend handles business logic and validations
2. **Optimistic UI**: Show loading states, refetch after mutations to confirm changes
3. **Error Handling**: Always catch and display user-friendly error messages
4. **Type Conversion**: Always convert Rails decimal strings to numbers before using `.toFixed()`
5. **Multi-Tenancy**: All API calls automatically scoped by tenant via JWT token
6. **Role-Based Access**: UI hides actions, backend enforces permissions
7. **Soft Deletion**: Cars use `deleted_at`, require separate endpoints to view/restore
8. **File Uploads**: Separate endpoints after resource creation (not nested attributes)
9. **Status Workflows**: Clear transitions with validation on both sides
10. **Real-Time Updates**: Always refetch list data after create/update/delete operations

---

## Common Pitfalls & Solutions

### Pitfall: `toFixed is not a function`

**Cause**: Rails returns decimals as strings.

**Solution**: `Number(value).toFixed(2)`

### Pitfall: Modal won't close on overlay click

**Cause**: Overlay click closes modal accidentally.

**Solution**: Per conventions, modals ONLY close via explicit buttons (intentional design).

### Pitfall: Double API calls in development

**Cause**: React StrictMode calls useEffect twice.

**Solution**: Ignore in development, won't happen in production.

### Pitfall: 403 Forbidden for managers

**Cause**: Manager role attempting write operation.

**Solution**: Check `canWrite` before showing action buttons, backend returns 403 as expected.

### Pitfall: Cross-tenant data access returns 404

**Cause**: Multi-tenant scoping filters by tenant_id.

**Solution**: This is intentional security, returns 404 instead of 403 to avoid data leakage.
