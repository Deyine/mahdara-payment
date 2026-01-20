# BestCar - Frontend ↔ Backend Boundaries

This document describes how the React frontend integrates with the Rails backend.

## API Service Layer

### Configuration (`client/src/services/api.js`)

```javascript
import axios from 'axios';

// Environment-based API URL (Vite build-time variable)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Key Features**:
- Axios instance with base URL from environment variable
- Automatic JWT token attachment to all requests
- Automatic redirect to login on 401 Unauthorized
- Centralized error handling

## Authentication State

### AuthContext (`client/src/context/AuthContext.jsx`)

```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Usage in Components**:
```javascript
import { useAuth } from '../context/AuthContext';

function SomeComponent() {
  const { user, login, logout } = useAuth();

  if (user?.role === 'admin') {
    // Show admin features
  }
}
```

## Data Fetching Patterns

### Initial Data Load (useEffect)

```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2"
             style={{ borderColor: '#167bff' }} />
      ) : (
        products.map(product => <div key={product.id}>{product.name}</div>)
      )}
    </div>
  );
}
```

### Create with Nested Attributes

**Purchase with Items**:
```javascript
const createPurchase = async (formData) => {
  try {
    const response = await api.post('/purchases', {
      purchase: {
        purchase_date: formData.purchase_date,
        supplier: formData.supplier,
        delivery_cost: parseFloat(formData.delivery_cost),
        notes: formData.notes,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate),
        purchase_items_attributes: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost)
        }))
      }
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
```

### Update with Nested Attributes

```javascript
const updatePurchase = async (id, formData) => {
  try {
    const response = await api.put(`/purchases/${id}`, {
      purchase: {
        purchase_date: formData.purchase_date,
        supplier: formData.supplier,
        delivery_cost: parseFloat(formData.delivery_cost),
        notes: formData.notes,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate),
        purchase_items_attributes: formData.items.map(item => ({
          id: item.id || undefined,  // Include ID for existing items
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
          _destroy: item._destroy || false  // Mark for deletion
        }))
      }
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
```

### Delete with Confirmation

```javascript
import { useDialog } from '../context/DialogContext';

function ProductList() {
  const { showConfirm, showAlert } = useDialog();

  const handleDelete = async (productId) => {
    const confirmed = await showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      'Supprimer le produit'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/products/${productId}`);
      await showAlert('Produit supprimé avec succès', 'success');
      fetchProducts();  // Refresh list
    } catch (error) {
      await showAlert(
        error.response?.data?.error || 'Erreur lors de la suppression',
        'error'
      );
    }
  };
}
```

## Data Transformation

### Backend → Frontend (Parsing)

**Decimal Strings to Numbers**:
```javascript
// Backend sends decimals as strings
const purchase = response.data;

// Convert to numbers for display
const displayAmount = Number(purchase.delivery_cost).toFixed(2);
const displayRate = Number(purchase.exchange_rate).toFixed(4);

// For calculations
const totalCostMRU = Number(purchase.total_product_cost) * Number(purchase.exchange_rate);
```

**Date Parsing**:
```javascript
// Backend sends ISO date string "2025-12-07"
const purchase = response.data;

// Display in French format
const frenchDate = new Date(purchase.purchase_date).toLocaleDateString('fr-FR');
// Result: "07/12/2025"

// For input[type="date"]
const inputDate = purchase.purchase_date;  // Use as-is: "2025-12-07"
```

### Frontend → Backend (Serialization)

**Form Data to API Payload**:
```javascript
// Form state
const [formData, setFormData] = useState({
  name: '',
  amount: '',
  currency: 'EUR',
  exchange_rate: '1'
});

// Convert to API payload
const payload = {
  expense: {
    name: formData.name,
    amount: parseFloat(formData.amount),      // String → Number
    currency: formData.currency,
    exchange_rate: parseFloat(formData.exchange_rate)
  }
};

await api.post('/expenses', payload);
```

**Date Input to ISO String**:
```javascript
// HTML input[type="date"] value is already ISO format "2025-12-07"
const formData = {
  purchase_date: '2025-12-07'  // Send as-is to backend
};
```

## State Management Patterns

### Local State (useState)

**When to use**:
- Component-specific UI state (modals, forms)
- Data that doesn't need to be shared

```javascript
const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState({ name: '', sku: '' });
const [viewMode, setViewMode] = useState(false);
```

**Multi-Mode Forms** (Create/Edit/View):
```javascript
const [editingItem, setEditingItem] = useState(null);
const [viewMode, setViewMode] = useState(false);

// Create mode
const handleCreate = () => {
  setEditingItem(null);
  setViewMode(false);
  setFormData(emptyData);
  setShowForm(true);
};

// Edit mode
const handleEdit = (item) => {
  setEditingItem(item);
  setViewMode(false);
  setFormData(item);
  setShowForm(true);
};

// View mode (read-only)
const handleView = (item) => {
  setEditingItem(item);
  setViewMode(true);
  setFormData(item);
  setShowForm(true);
};

// Reset clears all modes
const resetForm = () => {
  setShowForm(false);
  setEditingItem(null);
  setViewMode(false);
  setFormData(emptyData);
};
```

### Context State (React Context)

**When to use**:
- Authentication state (user, token)
- Dialog system (alerts, confirms)
- Global UI state

```javascript
// AuthContext - user authentication
const { user, login, logout } = useAuth();

// DialogContext - custom alerts/confirms
const { showAlert, showConfirm } = useDialog();
```

### Server State (API + useEffect)

**When to use**:
- Data from backend (products, purchases, expenses)
- Refetch after mutations

```javascript
const [products, setProducts] = useState([]);

useEffect(() => {
  fetchProducts();
}, []);

const handleCreate = async (data) => {
  await api.post('/products', data);
  fetchProducts();  // Refetch to get updated list
};
```

## Error Handling

### API Error Handling Pattern

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await api.post('/products', { product: formData });
    await showAlert('Produit créé avec succès', 'success');
    resetForm();
    fetchProducts();
  } catch (error) {
    // Extract error message from backend
    const errorMessage = error.response?.data?.error
      || error.message
      || 'Une erreur est survenue';

    await showAlert(errorMessage, 'error');
    console.error('Error creating product:', error);
  }
};
```

### Backend Error Response Handling

```javascript
// Backend returns: { error: "Cannot delete product with existing purchases" }
catch (error) {
  if (error.response?.status === 422) {
    // Validation or business logic error
    await showAlert(error.response.data.error, 'error');
  } else if (error.response?.status === 401) {
    // Handled by axios interceptor (auto-logout)
  } else if (error.response?.status === 403) {
    await showAlert('Accès interdit', 'error');
  } else {
    await showAlert('Erreur du serveur', 'error');
  }
}
```

## Route Protection

### Protected Routes Pattern

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Usage in routes
<Route path="/products" element={
  <ProtectedRoute adminOnly={true}>
    <Products />
  </ProtectedRoute>
} />
```

## Real-Time Updates

### When to Refetch Data

```javascript
// After Create
const handleCreate = async (data) => {
  await api.post('/products', data);
  fetchProducts();  // ← Refetch list
};

// After Update
const handleUpdate = async (id, data) => {
  await api.put(`/products/${id}`, data);
  fetchProducts();  // ← Refetch list
};

// After Delete
const handleDelete = async (id) => {
  await api.delete(`/products/${id}`);
  fetchProducts();  // ← Refetch list
};

// After Purchase Complete (affects stock)
const handleCompletePurchase = async (id) => {
  await api.post(`/purchases/${id}/complete`);
  fetchPurchases();  // ← Refetch purchases
  // Note: Product component should also refetch if visible
};
```

## File Upload Patterns

### Product Image Upload

**Component State** (`client/src/pages/Products.jsx`):
```javascript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  sku: '',
  reorder_level: 0
});
const [selectedImage, setSelectedImage] = useState(null);
const [imagePreview, setImagePreview] = useState(null);
```

**Image Selection Handler with Client-Side Validation**:
```javascript
const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('L\'image doit faire moins de 5 Mo', 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert('Format non supporté. Utilisez JPG, PNG, GIF ou WebP', 'error');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));  // Create preview URL
  }
};
```

**Form Submission with FormData**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate image is selected for new products
  if (!editingProduct && !selectedImage) {
    await showAlert('Veuillez sélectionner une image', 'error');
    return;
  }

  try {
    // Create FormData for multipart/form-data upload
    const formDataToSend = new FormData();
    formDataToSend.append('product[name]', formData.name);
    formDataToSend.append('product[description]', formData.description);
    formDataToSend.append('product[sku]', formData.sku);
    formDataToSend.append('product[reorder_level]', formData.reorder_level);

    // Only append image if one is selected
    if (selectedImage) {
      formDataToSend.append('product[image]', selectedImage);
    }

    if (editingProduct) {
      await productsAPI.update(editingProduct.id, formDataToSend);
      await showAlert('Produit modifié avec succès', 'success');
    } else {
      await productsAPI.create(formDataToSend);
      await showAlert('Produit créé avec succès', 'success');
    }

    resetForm();
    fetchProducts();
  } catch (error) {
    await showAlert(error.response?.data?.errors?.[0] || 'Erreur', 'error');
  }
};
```

**Form Cleanup with Blob URL Revocation**:
```javascript
const resetForm = () => {
  setShowForm(false);
  setEditingProduct(null);
  setFormData({ name: '', description: '', sku: '', reorder_level: 0 });
  setSelectedImage(null);

  // Clean up blob URL to prevent memory leaks
  if (imagePreview && !editingProduct) {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
  }
  setImagePreview(null);
};
```

**File Input in Form**:
```jsx
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
  onChange={handleImageSelect}
  required={!editingProduct}
/>

{imagePreview && (
  <div>
    <img
      src={imagePreview}
      alt="Aperçu"
      style={{ maxWidth: '200px', maxHeight: '200px' }}
    />
  </div>
)}
```

**API Service Layer** (`client/src/services/api.js`):
```javascript
export const productsAPI = {
  getAll: () => api.get('/products'),
  getOne: (id) => api.get(`/products/${id}`),

  create: (data) => {
    // Detect FormData vs JSON and set appropriate headers
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};

    // FormData is sent as-is, JSON is wrapped in { product: data }
    return api.post('/products',
      data instanceof FormData ? data : { product: data },
      config
    );
  },

  update: (id, data) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};

    return api.put(`/products/${id}`,
      data instanceof FormData ? data : { product: data },
      config
    );
  },

  delete: (id) => api.delete(`/products/${id}`),
};
```

**Key Concepts**:
- **URL.createObjectURL()** - Creates a blob URL for immediate preview without uploading
- **URL.revokeObjectURL()** - Cleans up blob URLs to prevent memory leaks
- **FormData** - Browser API for multipart/form-data encoding
- **instanceof FormData** - Detect FormData to set correct Content-Type header
- **Client-side validation** - Check file size and type before upload
- **Server-side validation** - Backend also validates (never trust client-side only)

### URL-Based Image Upload

**Frontend State** (`client/src/pages/Products.jsx`):
```javascript
const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
const [imageUrl, setImageUrl] = useState('');
```

**Toggle UI Component**:
```jsx
<div className="flex gap-2 mb-3">
  <button
    type="button"
    onClick={() => setUploadMode('file')}
    style={{
      backgroundColor: uploadMode === 'file' ? '#167bff' : '#eff6ff',
      color: uploadMode === 'file' ? 'white' : '#167bff'
    }}
  >
    Télécharger un Fichier
  </button>
  <button
    type="button"
    onClick={() => setUploadMode('url')}
    style={{
      backgroundColor: uploadMode === 'url' ? '#167bff' : '#eff6ff',
      color: uploadMode === 'url' ? 'white' : '#167bff'
    }}
  >
    URL d'Image
  </button>
</div>

{/* Conditional rendering based on mode */}
{uploadMode === 'file' && (
  <input type="file" onChange={handleImageSelect} />
)}

{uploadMode === 'url' && (
  <input
    type="url"
    value={imageUrl}
    onChange={(e) => setImageUrl(e.target.value)}
    placeholder="https://exemple.com/image.jpg"
  />
)}
```

**Form Submission**:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  const formDataToSend = new FormData();
  formDataToSend.append('product[name]', formData.name);
  // ... other fields

  // Append based on upload mode
  if (uploadMode === 'file' && selectedImage) {
    formDataToSend.append('product[image]', selectedImage);
  } else if (uploadMode === 'url' && imageUrl.trim()) {
    formDataToSend.append('product[image_url]', imageUrl.trim());
  }

  await productsAPI.create(formDataToSend);
};
```

**Backend Flow** (`ImageFetcher` service):

```text
1. Controller receives product[image_url] parameter
2. ImageFetcher.fetch(url) is called
3. Validate URL format (URI.parse)
4. HTTParty.get(url, timeout: 10)
5. Validate Content-Type (must be image/*)
6. Validate Content-Length (max 5MB)
7. Download image to Tempfile
8. Validate actual file size (max 5MB)
9. Attach Tempfile to product.image via Active Storage
10. Clean up Tempfile in ensure block
```

**Error Handling**:

- Invalid URL → `"URL invalide"`
- 404/403 → `"Impossible d'accéder à l'image à cette URL"`
- Timeout → `"Délai d'attente dépassé lors de la récupération de l'image"`
- Non-image content → `"L'URL ne pointe pas vers une image valide"`
- File too large → `"L'image doit faire moins de 5 Mo"`

**Image Display**:
```jsx
// In product list/grid
<img
  src={product.thumbnail_url}
  alt={product.name}
  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
/>

// In product detail view
<img
  src={product.image_url}
  alt={product.name}
  style={{ maxWidth: '800px' }}
/>
```

### CSV Upload Pattern (Future Feature)

```javascript
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    await showAlert(`${response.data.count} produits importés`, 'success');
    fetchProducts();
  } catch (error) {
    await showAlert(error.response?.data?.error, 'error');
  }
};
```

## Environment-Specific Behavior

### Development vs Production

```javascript
// Vite exposes import.meta.env
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// API URL (configured at build time)
const API_URL = import.meta.env.VITE_API_URL;

// Debug logging (development only)
if (isDev) {
  console.log('API Response:', response.data);
}
```

### CORS Considerations

**Development** (localhost:5173 → localhost:3000):
- Rails CORS configured to allow localhost:5173
- Cookies and Authorization headers allowed

**Production** (static build → production API):
- Rails CORS configured for production domain
- Static files served by nginx
- API calls to production backend URL

## Common Integration Patterns

### Master-Detail Relationship

```javascript
// Products list with purchases
const [products, setProducts] = useState([]);
const [selectedProduct, setSelectedProduct] = useState(null);
const [productPurchases, setProductPurchases] = useState([]);

const handleSelectProduct = async (product) => {
  setSelectedProduct(product);

  // Fetch related purchases
  const response = await api.get(`/products/${product.id}/purchases`);
  setProductPurchases(response.data);
};
```

### Cascading Dropdowns

```javascript
// Currency changes affect exchange rate input
const [currency, setCurrency] = useState('EUR');
const [exchangeRate, setExchangeRate] = useState('1.0');

const handleCurrencyChange = (newCurrency) => {
  setCurrency(newCurrency);

  if (newCurrency === 'MRU') {
    setExchangeRate('1.0');  // Auto-set for base currency
  }
};
```

### Optimistic Updates

```javascript
// Update UI immediately, rollback on error
const handleToggleActive = async (expenseType) => {
  // Optimistic update
  setExpenseTypes(prev =>
    prev.map(et =>
      et.id === expenseType.id
        ? { ...et, active: !et.active }
        : et
    )
  );

  try {
    await api.put(`/expense_types/${expenseType.id}`, {
      expense_type: { active: !expenseType.active }
    });
  } catch (error) {
    // Rollback on error
    fetchExpenseTypes();
    await showAlert('Erreur lors de la mise à jour', 'error');
  }
};
```

## Performance Optimization

### Avoid N+1 Queries

**Backend** (Eager loading):
```ruby
# Good - One query with joins
purchases = Purchase.includes(purchase_items: :product).all

# Bad - N+1 query problem
purchases = Purchase.all
purchases.each { |p| p.purchase_items.each { |i| i.product.name } }
```

**Frontend** (Use includes in API calls):
```javascript
// Products already included in purchases endpoint
const response = await api.get('/purchases');
// response.data[0].purchase_items[0].product is already loaded
```

### Debounced Search

```javascript
import { useState, useEffect } from 'react';

const [searchTerm, setSearchTerm] = useState('');
const [filteredProducts, setFilteredProducts] = useState([]);

useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (searchTerm) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, 300);  // 300ms debounce

  return () => clearTimeout(timeoutId);
}, [searchTerm, products]);
```

## Settings Menu & Nested Routes

### Settings Page with Tab Navigation

The Settings page (`client/src/pages/Settings.jsx`) provides a centralized location for admin configuration with tabbed sub-navigation.

**Component Structure**:
```javascript
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function Settings() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const settingsMenuItems = [
    { path: '/settings/expense-types', label: 'Types de Dépenses', icon: '🏷️' },
    { path: '/settings/brands', label: 'Marques', icon: '🏭' },
  ];

  return (
    <div>
      <h1>Paramètres</h1>

      {/* Tab Navigation */}
      <div>
        {settingsMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={isActive(item.path) ? 'active' : ''}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </div>

      {/* Renders the active sub-page */}
      <Outlet />
    </div>
  );
}
```

**Nested Routes** (`client/src/App.jsx`):
```javascript
<Route
  path="/settings"
  element={
    <PrivateRoute requireAdmin>
      <Settings />
    </PrivateRoute>
  }
>
  <Route index element={<Navigate to="/settings/expense-types" replace />} />
  <Route path="expense-types" element={<ExpenseTypes />} />
  <Route path="brands" element={<Brands />} />
</Route>
```

**Navigation Menu** (`client/src/components/Layout.jsx`):
```javascript
const navItems = [
  { path: '/', label: 'Tableau de Bord', icon: '📊', adminOnly: false },
  { path: '/products', label: 'Produits', icon: '📦', adminOnly: false },
  { path: '/purchases', label: 'Achats', icon: '🛒', adminOnly: false },
  { path: '/expenses', label: 'Dépenses', icon: '💰', adminOnly: false },
  { path: '/settings', label: 'Paramètres', icon: '⚙️', adminOnly: true },
];
```

**Key Concepts**:
- **Nested Routes** - Sub-pages render inside the parent Settings component via `<Outlet>`
- **Index Route** - `/settings` redirects to `/settings/expense-types` by default
- **Active Tab Detection** - `location.pathname` determines which tab is highlighted
- **Layout Simplification** - ExpenseTypes and Brands components no longer have full-page wrappers

## Manager Profits Dashboard

### Profits Page Overview

The Manager Profits page (`/profits`) provides role-based profit visibility for managers and administrators. Managers can view their own profit earnings, while admins can see all managers' profits with detailed car-level breakdowns.

### API Integration

**API Service** (`client/src/services/api.js`):

```javascript
export const usersAPI = {
  getAll: () => api.get('/users'),
  getManagers: () => api.get('/users/managers'),
  getProfits: () => api.get('/users/profits'),  // NEW
  // ...
};
```

**Backend Endpoint**: `GET /api/users/profits`

- **Managers**: Returns only their own profit data
- **Admins/Super Admins**: Returns all managers' profit data

### Component Structure

**ManagerProfits Page** (`client/src/pages/ManagerProfits.jsx`):

```javascript
export default function ManagerProfits() {
  const { user } = useAuth();
  const [profitsData, setProfitsData] = useState([]);
  const [expandedManagers, setExpandedManagers] = useState(new Set());

  useEffect(() => {
    fetchProfits();
  }, []);

  const fetchProfits = async () => {
    const response = await usersAPI.getProfits();
    setProfitsData(response.data.profits);
  };

  // Expandable manager cards with car-level details
  // ...
}
```

### UI Pattern: Expandable Summary

The page uses a consistent expandable pattern also used in Expenses and Payment Tracking:

**Collapsed State (Default)**:

- Manager avatar and name
- Three summary cards:
  - Total Profit (blue background)
  - Manager Share (amber background)
  - Company Share (green background)
- Expand/collapse arrow button
- Car count badge

**Expanded State**:

- Full car list in table format
- Columns: Ref, Model, Status, Total Profit, Share %, Manager Amount, Company Amount
- Click any row to navigate to car detail page
- Ordered by reference number

### Business Logic

**Profit Calculation Rules**:

- Only fully paid cars are counted in totals
- Unpaid sold cars are shown but display "--" for profit amounts
- Status badges:
  - Green "Vendu": Sold and fully paid
  - Red "Non payé": Sold but not fully paid
  - Blue: Rental or Active status

**Data Flow**:

```text
Backend calculates:
├── total_profit (sum of fully paid cars only)
├── total_user_profit (manager's share)
├── total_company_profit (company's share)
└── cars[] (all profit share cars, sorted by ref)
    ├── fully_paid: true/false
    ├── profit: amount or null
    └── user_profit_amount: amount or null

Frontend displays:
├── Summary cards (from totals)
└── Car table (from cars array)
    └── Show "--" if !fully_paid
```

### Navigation & Access Control

**Route** (`client/src/App.jsx`):

```javascript
<Route
  path="/profits"
  element={
    <PrivateRoute>
      <ManagerProfits />
    </PrivateRoute>
  }
/>
```

**Navigation Item** (`client/src/components/Layout.jsx`):

```javascript
const navItems = [
  { path: '/', label: 'Tableau de Bord', icon: '📊', adminOnly: false },
  { path: '/cars', label: 'Véhicules', icon: '🚗', adminOnly: false },
  { path: '/profits', label: 'Profits', icon: '💰', adminOnly: false, requireManagerOrAdmin: true },
  { path: '/settings', label: 'Paramètres', icon: '⚙️', adminOnly: true },
];

// Visibility logic
if (item.requireManagerOrAdmin && !isManagerOrAdmin) return null;
```

**Access Control Helper**:

```javascript
const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin';
```

### Key Features

- **Role-based filtering**: Backend automatically filters based on user role
- **Smart totals**: Only counts profits from fully paid cars
- **Unpaid visibility**: Shows unpaid cars with "--" to indicate pending profit
- **Alphabetical ordering**: Cars sorted by reference for easy lookup
- **Click-through navigation**: Click any car row to view full details
- **Responsive design**: Works on mobile and desktop
- **Empty state**: Clear messaging when no profit data exists

## Brand Filtering & Product Association

### Brand Selection in Product Form

Products can optionally be associated with a brand via `brand_id` (nullable foreign key).

**API Service** (`client/src/services/api.js`):
```javascript
export const brandsAPI = {
  getAll: () => api.get('/brands'),
  getOne: (id) => api.get(`/brands/${id}`),
  create: (data) => api.post('/brands', { brand: data }),
  update: (id, data) => api.put(`/brands/${id}`, { brand: data }),
  delete: (id) => api.delete(`/brands/${id}`),
};
```

**Products Page State** (`client/src/pages/Products.jsx`):
```javascript
const [products, setProducts] = useState([]);
const [brands, setBrands] = useState([]);
const [filterBrand, setFilterBrand] = useState('');

useEffect(() => {
  fetchProducts();
  fetchBrands();
}, []);

const fetchBrands = async () => {
  const response = await brandsAPI.getAll();
  setBrands(response.data);
};

// Filter products by brand
const filteredProducts = filterBrand
  ? products.filter(p => p.brand_id === parseInt(filterBrand))
  : products;
```

**Brand Filter Dropdown**:
```javascript
<select
  value={filterBrand}
  onChange={(e) => setFilterBrand(e.target.value)}
>
  <option value="">Toutes les marques</option>
  {brands.map((brand) => (
    <option key={brand.id} value={brand.id}>
      {brand.name}
    </option>
  ))}
</select>
```

**Brand Selection in Product Form**:
```javascript
<select
  value={formData.brand_id}
  onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
>
  <option value="">-- Sélectionner une marque --</option>
  {brands.map((brand) => (
    <option key={brand.id} value={brand.id}>
      {brand.name}
    </option>
  ))}
</select>
```

**Brand Display on Product Card**:
```javascript
{product.brand && (
  <p className="text-xs font-semibold mb-1" style={{ color: '#167bff' }}>
    {product.brand.name}
  </p>
)}
<h3 className="font-bold text-lg">{product.name}</h3>
```

**FormData Submission**:
```javascript
const formDataToSend = new FormData();
formDataToSend.append('product[name]', formData.name);
formDataToSend.append('product[sku]', formData.sku);

if (formData.brand_id) {
  formDataToSend.append('product[brand_id]', formData.brand_id);
}
```

**API Response** (with brand included):
```json
{
  "id": 1,
  "name": "Product A",
  "brand_id": 1,
  "brand": {
    "id": 1,
    "name": "Nike"
  }
}
```

**Key Concepts**:
- **Optional Association** - `brand_id` is nullable, products can exist without a brand
- **Client-Side Filtering** - Filter array based on `brand_id` match
- **Eager Loading** - Backend uses `includes(:brand)` to prevent N+1 queries
- **Dropdown Population** - Fetch brands on mount, populate both filter and form dropdowns
- **Nested Object in Response** - API returns full brand object, not just ID

---

## Vite Development Proxy

### Active Storage URL Proxying

**Problem**: Active Storage generates relative URLs like `/rails/active_storage/blobs/...` which the Vite dev server (localhost:5173) cannot resolve, since the backend runs on localhost:3000.

**Solution**: Vite proxy configuration forwards Active Storage requests to the backend.

**Vite Config** (`client/vite.config.js`):
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/rails/active_storage': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

**How It Works**:
1. Backend generates: `/rails/active_storage/blobs/redirect/...`
2. Frontend displays: `<img src="/rails/active_storage/blobs/..." />`
3. Browser requests: `http://localhost:5173/rails/active_storage/blobs/...`
4. Vite proxy forwards to: `http://localhost:3000/rails/active_storage/blobs/...`
5. Backend serves the file via Active Storage

**Development vs Production**:
- **Development**: Relative URLs work via Vite proxy
- **Production**: Relative URLs work if frontend and backend share same domain
- **Cross-domain Production**: Configure `config.action_controller.asset_host` in Rails

**Note**: Vite config changes require dev server restart.

---

## Car Photo Management (Two Groups)

### Overview

Cars have two separate photo groups managed via Active Storage:
- **Salvage Photos** - Initial condition photos from auction/purchase
- **After Repair Photos** - Photos showing vehicle after repairs completed

**Key Features**:
- Unlimited photos per group
- 5MB max per photo
- File upload only (no URL upload)
- Photos not required at car creation
- Operators can upload/delete photos
- Dedicated detail page for comprehensive car view

### Backend Implementation

**Car Model** (`backend/app/models/car.rb`):
```ruby
class Car < ApplicationRecord
  # Active Storage attachments for two photo groups
  has_many_attached :salvage_photos      # Photos from auction/initial state
  has_many_attached :after_repair_photos  # Photos after repairs completed

  # Photo validations (max 5MB per photo)
  validate :salvage_photos_size_validation
  validate :after_repair_photos_size_validation

  # Serialize photo URLs for JSON response
  def as_json(options = {})
    super(options).merge(
      salvage_photos: salvage_photos_data,
      after_repair_photos: after_repair_photos_data
    )
  end

  private

  def salvage_photos_data
    salvage_photos.map do |photo|
      {
        id: photo.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(photo, only_path: true),
        filename: photo.filename.to_s,
        size: photo.byte_size,
        content_type: photo.content_type
      }
    end
  end

  def validate_photos_size(photos, group_name)
    photos.each do |photo|
      if photo.byte_size > 5.megabytes
        errors.add(:base, "#{group_name}: #{photo.filename} must be less than 5MB")
      end
    end
  end
end
```

**API Endpoints** (`backend/app/controllers/api/cars_controller.rb`):
```ruby
# Add salvage photos (operators can access)
def add_salvage_photos
  if params[:photos].present?
    @car.salvage_photos.attach(params[:photos])

    if @car.save
      render json: @car
    else
      render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
    end
  else
    render json: { error: 'No photos provided' }, status: :unprocessable_entity
  end
end

# Delete a specific salvage photo
def delete_salvage_photo
  photo = @car.salvage_photos.find(params[:photo_id])
  photo.purge
  render json: { message: 'Photo deleted successfully' }
rescue ActiveRecord::RecordNotFound
  render json: { error: 'Photo not found' }, status: :not_found
end
```

**Routes** (`backend/config/routes.rb`):
```ruby
resources :cars do
  member do
    post 'salvage_photos', to: 'cars#add_salvage_photos'
    delete 'salvage_photos/:photo_id', to: 'cars#delete_salvage_photo'
    post 'after_repair_photos', to: 'cars#add_after_repair_photos'
    delete 'after_repair_photos/:photo_id', to: 'cars#delete_after_repair_photo'
  end
end
```

### Frontend Implementation

**PhotoGallery Component** (`client/src/components/PhotoGallery.jsx`):

Reusable component for managing photo groups with these features:
- Multi-file upload with preview
- Client-side validation (5MB, image formats)
- 3-column grid display
- Fullscreen viewer (ESC to close)
- Delete individual photos with confirmation
- Automatic blob URL cleanup

**Component Props**:
```javascript
<PhotoGallery
  photos={car.salvage_photos || []}
  onUpload={handleUploadSalvagePhotos}
  onDelete={handleDeleteSalvagePhoto}
  title="Photos d'État Initial (Salvage)"
  emptyMessage="Aucune photo d'état initial. Téléchargez des photos..."
/>
```

**File Selection Handler with Validation**:
```javascript
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  const validFiles = [];
  const errors = [];

  files.forEach(file => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push(`${file.name}: Format non supporté`);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push(`${file.name}: L'image doit faire moins de 5 Mo`);
      return;
    }

    validFiles.push(file);
  });

  if (errors.length > 0) {
    showAlert(errors.join('\n'), 'error');
  }

  if (validFiles.length > 0) {
    setSelectedFiles(validFiles);

    // Create previews
    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPreviews(newPreviews);
  }

  // Reset input
  e.target.value = '';
};
```

**Upload Handler**:
```javascript
const handleUpload = async () => {
  if (selectedFiles.length === 0) return;

  try {
    await onUpload(selectedFiles);

    // Clean up previews
    previews.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setSelectedFiles([]);
    setPreviews([]);

    await showAlert(
      `${selectedFiles.length} photo${selectedFiles.length > 1 ? 's' : ''} téléchargée${selectedFiles.length > 1 ? 's' : ''} avec succès`,
      'success'
    );
  } catch (error) {
    await showAlert(
      error.response?.data?.errors?.[0] || 'Erreur lors du téléchargement',
      'error'
    );
  }
};
```

**Fullscreen Viewer**:
```javascript
// ESC key handler for fullscreen viewer
useEffect(() => {
  const handleEscKey = (e) => {
    if (e.key === 'Escape' && fullscreenImage) {
      setFullscreenImage(null);
    }
  };
  window.addEventListener('keydown', handleEscKey);
  return () => window.removeEventListener('keydown', handleEscKey);
}, [fullscreenImage]);

// Fullscreen modal
{fullscreenImage && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
    onClick={() => setFullscreenImage(null)}
  >
    <img
      src={fullscreenImage.url}
      alt={fullscreenImage.filename}
      className="max-w-full max-h-[90vh] object-contain rounded-lg"
    />
  </div>
)}
```

**API Service Layer** (`client/src/services/api.js`):
```javascript
export const carsAPI = {
  // Photo management
  addSalvagePhotos: (carId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return api.post(`/cars/${carId}/salvage_photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteSalvagePhoto: (carId, photoId) =>
    api.delete(`/cars/${carId}/salvage_photos/${photoId}`),

  addAfterRepairPhotos: (carId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos[]', file));
    return api.post(`/cars/${carId}/after_repair_photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteAfterRepairPhoto: (carId, photoId) =>
    api.delete(`/cars/${carId}/after_repair_photos/${photoId}`),
};
```

### Car Detail Page

**Dedicated Detail Page** (`client/src/pages/CarDetail.jsx`):

Accessible via `/cars/:id`, replaces modal-based detail view for better UX.

**Page Sections**:
1. **Header** - VIN, Model, Year with back button and action buttons
2. **Vehicle Information Card** - All car details in grid layout
3. **Cost Breakdown Card** - Purchase price, clearance, towing, expenses, total
4. **Salvage Photos Section** - PhotoGallery component
5. **After Repair Photos Section** - PhotoGallery component
6. **Expenses Section** - List of all expenses with "Add Expense" button

**Photo Upload Integration**:
```javascript
const handleUploadSalvagePhotos = async (files) => {
  await carsAPI.addSalvagePhotos(id, files);
  await fetchCarDetails();
};

const handleDeleteSalvagePhoto = async (photoId) => {
  await carsAPI.deleteSalvagePhoto(id, photoId);
  await fetchCarDetails();
};
```

**Navigation**:
```javascript
// From Cars list page
<button onClick={() => navigate(`/cars/${car.id}`)}>
  Voir Détails
</button>

// Route definition
<Route path="/cars/:id" element={<CarDetail />} />
```

### Key Concepts

**Active Storage Setup**:
- Run `rails active_storage:install` to generate migrations
- Run `rails db:migrate` to create required tables
- Tables: `active_storage_blobs`, `active_storage_attachments`, `active_storage_variant_records`

**Blob URL Management**:
- `URL.createObjectURL(file)` creates temporary preview URL
- `URL.revokeObjectURL(url)` cleans up to prevent memory leaks
- Always clean up in `useEffect` cleanup function or when component unmounts

**FormData for Multipart Upload**:
- Use `FormData` for file uploads, not JSON
- Append files with array notation: `photos[]`
- Set `Content-Type: multipart/form-data` header

**Photo Validation**:
- **Client-side**: Quick feedback, better UX
- **Server-side**: Security, never trust client-side only
- Validate: file type, file size, total size

**Memory Management**:
```javascript
useEffect(() => {
  return () => {
    // Cleanup blob URLs when component unmounts
    previews.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });
  };
}, [previews]);
```

**Permissions**:
- Operators can upload/delete photos (not admin-only)
- Photo endpoints skip admin requirement in `before_action`
- Authentication still required (JWT token)

---

## Invoice Management

### Overview

Cars can have purchase invoices and receipts attached via Active Storage:
- **Purchase Invoices** - PDF or image files of purchase documentation
- **Receipt Support** - Auction receipts, customs documents, etc.

**Key Features**:
- Unlimited invoices per car
- 10MB max per invoice (larger than photos due to PDF size)
- PDF, JPG, PNG formats supported
- File upload only (no URL upload)
- Invoices not required at car creation
- Operators can upload/delete invoices
- Displayed on car detail page

### Backend Implementation

**Car Model** (`backend/app/models/car.rb`):
```ruby
class Car < ApplicationRecord
  # Active Storage attachment for invoices
  has_many_attached :invoices  # Purchase invoices and receipts

  # Invoice validations (max 10MB per invoice, PDF/JPG/PNG only)
  validate :invoices_validation

  # Serialize invoice URLs for JSON response
  def as_json(options = {})
    super(options).merge(
      salvage_photos: salvage_photos_data,
      after_repair_photos: after_repair_photos_data,
      invoices: invoices_data
    )
  end

  private

  def invoices_data
    invoices.map do |invoice|
      {
        id: invoice.id,
        url: Rails.application.routes.url_helpers.rails_blob_url(invoice, only_path: true),
        filename: invoice.filename.to_s,
        size: invoice.byte_size,
        content_type: invoice.content_type
      }
    end
  end

  def invoices_validation
    invoices.each do |invoice|
      # Validate file size (max 10MB)
      if invoice.byte_size > 10.megabytes
        errors.add(:base, "Invoice #{invoice.filename} must be less than 10MB")
      end

      # Validate content type (PDF, JPG, PNG only)
      allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      unless allowed_types.include?(invoice.content_type)
        errors.add(:base, "Invoice #{invoice.filename} must be PDF, JPG, or PNG format")
      end
    end
  end
end
```

**API Endpoints** (`backend/app/controllers/api/cars_controller.rb`):
```ruby
# Add invoices (operators can access)
def add_invoices
  if params[:invoices].present?
    @car.invoices.attach(params[:invoices])

    if @car.save
      render json: @car
    else
      render json: { errors: @car.errors.full_messages }, status: :unprocessable_entity
    end
  else
    render json: { error: 'No invoices provided' }, status: :unprocessable_entity
  end
end

# Delete a specific invoice
def delete_invoice
  invoice = @car.invoices.find(params[:invoice_id])
  invoice.purge
  render json: { message: 'Invoice deleted successfully' }
rescue ActiveRecord::RecordNotFound
  render json: { error: 'Invoice not found' }, status: :not_found
end
```

**Routes** (`backend/config/routes.rb`):
```ruby
resources :cars do
  member do
    post 'salvage_photos', to: 'cars#add_salvage_photos'
    delete 'salvage_photos/:photo_id', to: 'cars#delete_salvage_photo'
    post 'after_repair_photos', to: 'cars#add_after_repair_photos'
    delete 'after_repair_photos/:photo_id', to: 'cars#delete_after_repair_photo'
    post 'invoices', to: 'cars#add_invoices'
    delete 'invoices/:invoice_id', to: 'cars#delete_invoice'
  end
end
```

### Frontend Implementation

**InvoiceManager Component** (`client/src/components/InvoiceManager.jsx`):

Dedicated component for managing car invoices with these features:
- Multi-file upload (PDF, JPG, PNG)
- Client-side validation (10MB, accepted formats)
- File icon display (📄 for PDF, 🖼️ for images)
- Download button for each invoice
- Delete with confirmation
- File size display
- Empty state with format information

**Component Usage**:
```javascript
<InvoiceManager
  invoices={car.invoices || []}
  onUpload={handleUploadInvoices}
  onDelete={handleDeleteInvoice}
/>
```

**File Selection Handler with Validation**:
```javascript
const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);

  // No validation here - let user select all files
  // Upload handler will validate before sending to server

  if (files.length > 0) {
    onUpload(files);
    e.target.value = ''; // Reset input
  }
};
```

**File Icon Helper**:
```javascript
const getFileIcon = (contentType) => {
  if (contentType === 'application/pdf') {
    return '📄'; // PDF icon
  } else if (contentType?.startsWith('image/')) {
    return '🖼️'; // Image icon
  }
  return '📎'; // Generic file icon
};
```

**File Size Formatter**:
```javascript
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
```

**Invoice Display**:
```jsx
{invoices.map((invoice) => (
  <div key={invoice.id} className="invoice-item">
    <div className="flex items-center gap-3">
      <span style={{ fontSize: '24px' }}>
        {getFileIcon(invoice.content_type)}
      </span>
      <div>
        <p className="font-medium">{invoice.filename}</p>
        <p className="text-sm text-gray-600">
          {formatFileSize(invoice.size)}
        </p>
      </div>
    </div>

    <div className="flex gap-2">
      <a
        href={invoice.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-download"
      >
        📥 Télécharger
      </a>
      <button onClick={() => onDelete(invoice.id)} className="btn-delete">
        🗑️ Supprimer
      </button>
    </div>
  </div>
))}
```

**API Service Layer** (`client/src/services/api.js`):
```javascript
export const carsAPI = {
  // Invoice management
  addInvoices: (carId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('invoices[]', file));
    return api.post(`/cars/${carId}/invoices`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deleteInvoice: (carId, invoiceId) =>
    api.delete(`/cars/${carId}/invoices/${invoiceId}`),
};
```

### Car Detail Page Integration

**Invoice Upload Integration** (`client/src/pages/CarDetail.jsx`):
```javascript
// Invoice upload handlers
const handleUploadInvoices = async (files) => {
  try {
    await carsAPI.addInvoices(id, files);
    await showAlert('Facture(s) téléchargée(s) avec succès', 'success');
    await fetchCarDetails();
  } catch (error) {
    await showAlert(
      error.response?.data?.errors?.[0] || 'Erreur lors du téléchargement',
      'error'
    );
  }
};

const handleDeleteInvoice = async (invoiceId) => {
  const confirmed = await showConfirm(
    'Êtes-vous sûr de vouloir supprimer cette facture ?',
    'Supprimer la facture'
  );

  if (!confirmed) return;

  try {
    await carsAPI.deleteInvoice(id, invoiceId);
    await showAlert('Facture supprimée avec succès', 'success');
    await fetchCarDetails();
  } catch (error) {
    await showAlert(
      error.response?.data?.error || 'Erreur lors de la suppression',
      'error'
    );
  }
};
```

**Component Integration**:
```jsx
{/* Invoices Section */}
<InvoiceManager
  invoices={car.invoices || []}
  onUpload={handleUploadInvoices}
  onDelete={handleDeleteInvoice}
/>
```

### Key Concepts

**PDF Support**:
- Invoices can be PDF files (common for auction receipts)
- 10MB limit accommodates multi-page PDFs
- PDFs displayed with download button (no preview)

**Validation Strategy**:
- **Client-side**: Quick feedback, better UX
- **Server-side**: Security, content type validation
- Validate: file type (PDF/JPG/PNG), file size (10MB)

**File Download**:
```jsx
<a
  href={invoice.url}
  target="_blank"
  rel="noopener noreferrer"
  download={invoice.filename}
>
  Download
</a>
```

**Permissions**:
- Operators can upload/delete invoices (not admin-only)
- Invoice endpoints skip admin requirement in `before_action`
- Authentication still required (JWT token)

**Differences from Photos**:
- Larger file size limit (10MB vs 5MB for photos)
- Supports PDF format (photos only support images)
- No preview/fullscreen viewer (just download)
- List view instead of grid gallery
- Different icon per file type

---

## Expense Management

### Overview

Cars track expenses for repairs and purchases via the Expense system:

- **Reparation Expenses** - Repair costs (engine, body work, paint, etc.)
- **Purchase Expenses** - Acquisition costs (auction fees, shipping, clearance)

**Key Features**:

- Unlimited expenses per car
- Category-based organization (ExpenseCategory with expense_type)
- Full CRUD operations in car detail view
- Real-time total cost updates
- Admin-only create/update/delete (view available to all authenticated users)

### Backend Implementation

**Expense Model** (`backend/app/models/expense.rb`):
```ruby
class Expense < ApplicationRecord
  belongs_to :tenant
  belongs_to :car
  belongs_to :expense_category

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :expense_date, presence: true

  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :for_car, ->(car_id) { where(car_id: car_id) }
  scope :recent, -> { order(expense_date: :desc) }

  default_scope -> { order(expense_date: :desc) }
end
```

**ExpenseCategory Model** (`backend/app/models/expense_category.rb`):
```ruby
class ExpenseCategory < ApplicationRecord
  belongs_to :tenant
  has_many :expenses, dependent: :restrict_with_error

  EXPENSE_TYPES = %w[reparation purchase].freeze

  validates :name, presence: true, uniqueness: { scope: :tenant_id }
  validates :expense_type, presence: true, inclusion: { in: EXPENSE_TYPES }

  scope :active, -> { where(active: true) }
  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
end
```

**API Endpoints** (`backend/app/controllers/api/expenses_controller.rb`):
```ruby
# List expenses (optionally filtered by car_id)
def index
  @expenses = tenant_scope(Expense).includes(:car, :expense_category).recent
  @expenses = @expenses.for_car(params[:car_id]) if params[:car_id].present?
  render json: @expenses, include: [:car, :expense_category]
end

# Create expense
def create
  @expense = tenant_scope(Expense).new(expense_params)
  @expense.tenant = current_tenant

  if @expense.save
    render json: @expense, status: :created
  else
    render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
  end
end

# Update expense
def update
  if @expense.update(expense_params)
    render json: @expense
  else
    render json: { errors: @expense.errors.full_messages }, status: :unprocessable_entity
  end
end

# Delete expense
def destroy
  @expense.destroy
  render json: { message: 'Expense deleted successfully' }
end

private

def expense_params
  params.require(:expense).permit(:car_id, :expense_category_id, :amount, :description, :expense_date)
end
```

**Routes** (`backend/config/routes.rb`):
```ruby
resources :expenses  # Full RESTful routes
```

### Frontend Implementation

**ExpenseManager Component** (`client/src/components/ExpenseManager.jsx`):

Reusable component for managing car expenses with these features:

- Add/Edit/Delete expenses via modal form
- Category selection with expense type badges
- Real-time expense list display
- Confirmation dialogs for destructive actions
- Empty state messaging

**Component Props**:
```javascript
<ExpenseManager
  expenses={expenses}           // Array of expense objects
  carId={carId}                 // Car UUID for new expenses
  onExpenseChange={handler}     // Callback(action, expenseId, expenseData)
/>
```

**State Management**:
```javascript
const [showForm, setShowForm] = useState(false);
const [editingExpense, setEditingExpense] = useState(null);
const [formData, setFormData] = useState({
  expense_category_id: '',
  amount: '',
  description: '',
  expense_date: new Date().toISOString().split('T')[0]
});
```

**CRUD Handler Pattern**:
```javascript
const handleExpenseChange = async (action, expenseId, expenseData) => {
  if (action === 'create') {
    await expensesAPI.create(expenseData);
  } else if (action === 'update') {
    await expensesAPI.update(expenseId, expenseData);
  } else if (action === 'delete') {
    await expensesAPI.delete(expenseId);
  }
  await fetchCarDetails();  // Refresh car data including updated total_cost
};
```

**Modal Form**:
```jsx
{showForm && (
  <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
    <div className="bg-white rounded-lg shadow-xl max-w-md">
      <form onSubmit={handleSubmit}>
        <select name="expense_category_id" required>
          {expenseCategories.map(category => (
            <option value={category.id}>
              [{category.expense_type === 'reparation' ? 'Réparation' : 'Achat'}] {category.name}
            </option>
          ))}
        </select>

        <input type="number" name="amount" step="0.01" min="0.01" required />
        <input type="date" name="expense_date" required />
        <textarea name="description" />

        <button type="submit">{editingExpense ? 'Modifier' : 'Créer'}</button>
      </form>
    </div>
  </div>
)}
```

**Expense Display**:
```jsx
{expenses.map(expense => {
  const badge = expense.expense_category?.expense_type === 'reparation'
    ? { backgroundColor: '#fef3c7', color: '#92400e' }  // Orange for repairs
    : { backgroundColor: '#dbeafe', color: '#1e40af' };  // Blue for purchases

  return (
    <div key={expense.id}>
      <p>{new Date(expense.expense_date).toLocaleDateString('fr-FR')}</p>
      <span style={badge}>{expense.expense_category?.name}</span>
      <p>{expense.description || '-'}</p>
      <p>{formatCurrency(expense.amount)} MRU</p>

      <button onClick={() => handleEditExpense(expense)}>✏️</button>
      <button onClick={() => handleDeleteExpense(expense.id)}>🗑️</button>
    </div>
  );
})}
```

### Car Detail Integration

**Integration** (`client/src/pages/CarDetail.jsx`):
```javascript
import ExpenseManager from '../components/ExpenseManager';

// Fetch expenses with car data
const fetchCarDetails = async () => {
  const [carResponse, expensesResponse] = await Promise.all([
    carsAPI.getOne(id),
    expensesAPI.getAll(id)  // Filter expenses by car_id
  ]);

  setCar(carResponse.data);
  setExpenses(expensesResponse.data);
};

// Expense change handler
const handleExpenseChange = async (action, expenseId, expenseData) => {
  if (action === 'create') {
    await expensesAPI.create(expenseData);
  } else if (action === 'update') {
    await expensesAPI.update(expenseId, expenseData);
  } else if (action === 'delete') {
    await expensesAPI.delete(expenseId);
  }
  await fetchCarDetails();  // Refresh to update total_cost
};

// Render in car detail page
<ExpenseManager
  expenses={expenses}
  carId={id}
  onExpenseChange={handleExpenseChange}
/>
```

**Total Cost Updates**:

When expenses are added/updated/deleted, the car's `total_cost` automatically recalculates:

```ruby
# Car model calculates total including expenses
def total_cost
  base = purchase_price.to_f
  base += clearance_cost.to_f if clearance_cost
  base += towing_cost.to_f if towing_cost
  base += expenses.sum(:amount).to_f  # ← Includes all expenses
  base
end
```

### Expense API Service

**Expenses API** (`client/src/services/api.js`):

```javascript
export const expensesAPI = {
  // Get all expenses, optionally filtered by car_id
  getAll: (carId = null) => {
    const params = carId ? `?car_id=${carId}` : '';
    return api.get(`/expenses${params}`);
  },

  // Get single expense
  getOne: (id) => api.get(`/expenses/${id}`),

  // Create expense
  create: (data) => api.post('/expenses', { expense: data }),

  // Update expense
  update: (id, data) => api.put(`/expenses/${id}`, { expense: data }),

  // Delete expense
  delete: (id) => api.delete(`/expenses/${id}`),
};
```

### Key Concepts

**Category-Based Organization**:

- Each expense has an `expense_category_id`
- Categories have `expense_type` ('reparation' or 'purchase')
- UI displays color-coded badges based on type

**Modal Form Pattern**:

- Reuses single form for create/edit modes
- `editingExpense` state determines mode
- Form resets on submit or cancel

**Real-Time Updates**:

- After CRUD operation, `fetchCarDetails()` is called
- Refreshes both car data and expenses list
- Car's `total_cost` reflects new expense totals immediately

**Validation**:

- **Client-side**: Required fields, amount > 0, date required
- **Server-side**: Model validations, tenant scoping, associations

**Permissions**:

- Admin required for create/update/delete
- All authenticated users can view expenses
- Backend enforces via `before_action :require_admin`

**Empty State**:

```jsx
{expenses.length === 0 ? (
  <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#f1f5f9' }}>
    <p>Aucune dépense enregistrée pour ce véhicule</p>
    <p>Cliquez sur "Ajouter une Dépense" pour commencer</p>
  </div>
) : (
  // Expense list
)}
```

**Differences from InvoiceManager**:

- Database records (not file uploads)
- Full CRUD operations (invoices only add/delete)
- Category selection with type badges
- Amount and date fields
- Impacts car's total_cost calculation
- Admin-only modifications

---

## Seller Relationship Handling

### Seller Object Structure

Cars have a `seller` relationship that returns a full seller object (not a simple string field).

**Backend Response** (after Excel import or API fetch):
```json
{
  "id": "car-uuid",
  "vin": "ABC123",
  "seller_id": "seller-uuid",
  "seller": {
    "id": "seller-uuid",
    "name": "Arrivage Canada",
    "location": "Canada/USA",
    "active": true,
    "tenant_id": "tenant-uuid"
  }
}
```

### Frontend Display

**Car List** (`Cars.jsx`):
```jsx
// Seller not displayed in list cards (only in detail view)
```

**Car Detail** (`CarDetail.jsx`):
```jsx
{car.seller && (
  <div>
    <p className="text-sm mb-1" style={{ color: '#64748b' }}>Vendeur</p>
    <p className="font-semibold" style={{ color: '#1e293b' }}>{car.seller.name}</p>
  </div>
)}
```

**Edit Form** (`CarDetail.jsx`):
```jsx
// When opening edit form, extract name from seller object
const handleEdit = () => {
  setFormData({
    vin: car.vin,
    seller: car.seller?.name || '',  // Extract name, not entire object
    // ...
  });
};
```

**Search Filter** (`Cars.jsx`):
```jsx
const filteredCars = cars.filter((car) =>
  car.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  car.car_model?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  car.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase())  // Search by seller name
);
```

### Implementation Notes

**Object vs String**:

- Backend returns `seller` as a full object with id, name, location, active, etc.
- Frontend must access `car.seller.name` (not just `car.seller`)
- Attempting to render `{car.seller}` directly causes React error: "Objects are not valid as a React child"

**Optional Chaining**:

- Always use `car.seller?.name` to handle cases where seller is null/undefined
- Prevents crashes when car has no seller assigned

**Form Handling**:

- Forms use `seller_id` (UUID) for creating/updating cars
- Display extracts `seller.name` from the relationship object
- Edit mode populates text field with seller name (legacy compatibility)

---

## Car List Enhanced Cards

### Card Components

Car list cards display comprehensive vehicle information including photos, financial details, and status.

### Photo Swiper Component

**Display** (`Cars.jsx` - lines 325-381):

```jsx
{/* Shows first 5 salvage photos in horizontal scrollable gallery */}
{car.salvage_photos && car.salvage_photos.length > 0 && (
  <div style={{ marginBottom: '15px', position: 'relative' }}>
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        scrollSnapType: 'x mandatory'
      }}
      className="car-photos-swiper"
    >
      {car.salvage_photos.slice(0, 5).map((photo, index) => (
        <div
          key={photo.id || index}
          style={{
            minWidth: '100px',
            height: '100px',
            borderRadius: '6px',
            overflow: 'hidden',
            scrollSnapAlign: 'start',
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={() => handleView(car)}
        >
          <img
            src={photo.url}
            alt={`Photo ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          {/* Show +X overlay on 5th photo if more than 5 exist */}
          {index === 4 && car.salvage_photos.length > 5 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              +{car.salvage_photos.length - 5}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

**CSS for Hidden Scrollbar**:

```jsx
<style>{`
  .car-photos-swiper::-webkit-scrollbar {
    display: none;
  }
  .car-photos-swiper {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
`}</style>
```

**Features**:

- Horizontal scroll with snap-to-photo behavior
- Hidden scrollbar for clean appearance
- Touch-optimized scrolling
- Clickable photos navigate to car detail page
- "+X" overlay shows count of additional photos (e.g., "+3" if 8 total)
- Only shows first 5 photos to keep cards compact

### Enhanced Financial Display

**Cost Breakdown** (`Cars.jsx` - lines 383-442):

```jsx
<div style={{ marginBottom: '15px', fontSize: '14px' }}>
  {/* Basic info: year, color, mileage */}

  {/* Visual separator */}
  <div style={{
    borderTop: '1px solid #e5e7eb',
    paddingTop: '8px',
    marginTop: '8px',
    marginBottom: '8px'
  }} />

  {/* Purchase price */}
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
    <span style={{ color: '#6b7280' }}>Prix d'achat:</span>
    <span style={{ fontWeight: '500' }}>
      {formatCurrency(car.purchase_price)}
    </span>
  </div>

  {/* Clearance cost (Dédouanement) - only if > 0 */}
  {car.clearance_cost && parseFloat(car.clearance_cost) > 0 && (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
      <span style={{ color: '#6b7280' }}>Dédouanement:</span>
      <span style={{ fontWeight: '500' }}>
        {formatCurrency(car.clearance_cost)}
      </span>
    </div>
  )}

  {/* Total expenses - orange color to highlight repair costs */}
  {car.total_expenses && parseFloat(car.total_expenses) > 0 && (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
      <span style={{ color: '#6b7280' }}>Total dépenses:</span>
      <span style={{ fontWeight: '500', color: '#f59e0b' }}>
        {formatCurrency(car.total_expenses)}
      </span>
    </div>
  )}

  {/* Total cost - bold red with larger font */}
  {car.total_cost && (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px solid #e5e7eb'
    }}>
      <span style={{ color: '#1e293b', fontWeight: 'bold' }}>Coût total:</span>
      <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>
        {formatCurrency(car.total_cost)}
      </span>
    </div>
  )}
</div>
```

**Color Coding**:

- Regular costs: Default color (#1e293b)
- Total expenses: Orange (#f59e0b) - highlights repair costs
- Total cost: Red (#dc2626) with larger font - emphasizes final investment

**Conditional Display**:

- Clearance cost: Only shown if value exists and > 0
- Total expenses: Only shown if value exists and > 0
- Separators: Used to visually group related information

### Card Layout Structure

**Complete Card Structure**:

1. **Header Section**: Model name and VIN
2. **Photo Swiper**: First 5 salvage photos (if available)
3. **Basic Info**: Year, color, mileage (if available)
4. **Separator**
5. **Financial Details**:
   - Purchase price
   - Clearance cost (conditional)
   - Total expenses (conditional)
   - **Separator**
   - Total cost (emphasized)
6. **Action Buttons**: "Voir Détails" + Delete/Restore

**Grid Layout**:

```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: '20px'
}}>
  {/* Car cards */}
</div>
```

### Design Benefits and Performance

**Photo Swiper Benefits**:

- Provides visual preview without opening detail page
- Horizontal scroll conserves vertical space
- Snap scrolling ensures clean photo transitions
- Clickable photos provide quick navigation to details

**Financial Summary Benefits**:

- At-a-glance cost overview
- Color coding helps identify high-expense vehicles
- Conditional display keeps cards compact
- Separators improve readability

**Performance Considerations**:

- Photos lazy-loaded by browser
- Only first 5 photos loaded per card
- CSS-only scrollbar hiding (no JS needed)
- Slice operation prevents rendering excess photos

---

## Cars Page Filters and View Modes

### Overview

The Cars page (`Cars.jsx`) provides multiple filtering and viewing options to help users manage their vehicle inventory efficiently.

### Status Filters

**Implementation** (`Cars.jsx` - lines 386-457):

```jsx
const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'fully_paid', 'in_progress', 'not_sold', 'rental'

// Payment status filter
if (paymentFilter !== 'all') {
  if (paymentFilter === 'not_sold' && (car.status === 'sold' || car.status === 'rental')) return false;
  if (paymentFilter === 'rental' && car.status !== 'rental') return false;
  if (paymentFilter === 'fully_paid' && !(car.status === 'sold' && car.fully_paid)) return false;
  if (paymentFilter === 'in_progress' && !(car.status === 'sold' && !car.fully_paid)) return false;
}
```

**Filter Buttons**:

```jsx
{/* All vehicles */}
<button
  onClick={() => setPaymentFilter('all')}
  style={{
    backgroundColor: paymentFilter === 'all' ? '#167bff' : 'white',
    color: paymentFilter === 'all' ? 'white' : '#475569'
  }}
>
  Tous
</button>

{/* Non-sold vehicles (excludes sold and rental) */}
<button
  onClick={() => setPaymentFilter('not_sold')}
  style={{
    backgroundColor: paymentFilter === 'not_sold' ? '#167bff' : 'white'
  }}
>
  Non Vendus
</button>

{/* Rental vehicles only */}
<button
  onClick={() => setPaymentFilter('rental')}
  style={{
    backgroundColor: paymentFilter === 'rental' ? '#f59e0b' : 'white',
    color: paymentFilter === 'rental' ? 'white' : '#475569'
  }}
>
  En Location
</button>

{/* In-progress payments */}
<button
  onClick={() => setPaymentFilter('in_progress')}
  style={{
    backgroundColor: paymentFilter === 'in_progress' ? '#167bff' : 'white'
  }}
>
  En Cours de Paiement
</button>

{/* Fully paid vehicles */}
<button
  onClick={() => setPaymentFilter('fully_paid')}
  style={{
    backgroundColor: paymentFilter === 'fully_paid' ? '#167bff' : 'white'
  }}
>
  Payés Intégralement
</button>
```

**Filter Logic**:

- **Tous**: Shows all vehicles regardless of status
- **Non Vendus**: Shows only vehicles with `status !== 'sold'` AND `status !== 'rental'` (active inventory)
- **En Location**: Shows only vehicles with `status === 'rental'` (currently rented out)
- **En Cours de Paiement**: Shows sold vehicles where `fully_paid === false`
- **Payés Intégralement**: Shows sold vehicles where `fully_paid === true`

**Color Coding**:

- Primary filters (Tous, Non Vendus, En Cours, Payés): Blue (`#167bff`)
- Rental filter: Orange (`#f59e0b`) - matches rental status theme

### View Mode Toggle

**Implementation** (`Cars.jsx` - lines 322-383):

```jsx
const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

{/* View Toggle */}
<div style={{
  display: 'flex',
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '4px'
}}>
  <button
    onClick={() => setViewMode('grid')}
    style={{
      backgroundColor: viewMode === 'grid' ? 'white' : 'transparent',
      color: viewMode === 'grid' ? '#167bff' : '#64748b',
      boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
    }}
  >
    <svg>📊 Grid Icon</svg>
    <span>Grille</span>
  </button>
  <button
    onClick={() => setViewMode('list')}
    style={{
      backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
      color: viewMode === 'list' ? '#167bff' : '#64748b',
      boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
    }}
  >
    <svg>📋 List Icon</svg>
    <span>Paiements</span>
  </button>
</div>
```

**Two View Modes**:

1. **Grid View** (default):
   - Card-based layout with photos
   - Comprehensive financial details
   - Photo swiper with up to 5 images
   - Info tooltips for detailed cost breakdown
   - Best for visual browsing

2. **List View** (Payment-focused):
   - Tabular layout optimized for payment tracking
   - Columns: Vehicle, Prix de vente, Payé, Reste
   - Mini progress bars showing payment completion
   - Compact rows for high-density viewing
   - Best for payment management

### Mobile Tappable Card Pattern

**Implementation** (`Cars.jsx` - List View, lines 486-515):

```jsx
<div
  onClick={(e) => {
    // Only trigger on mobile and if not clicking on action buttons
    if (window.innerWidth < 640 && !e.target.closest('button')) {
      handleView(car);
    }
  }}
  className="sm:cursor-default"
  style={{
    cursor: window.innerWidth < 640 ? 'pointer' : 'default',
    transition: 'transform 0.15s ease'
  }}
  onTouchStart={(e) => {
    if (window.innerWidth < 640 && !e.target.closest('button')) {
      e.currentTarget.style.transform = 'scale(0.98)';
    }
  }}
  onTouchEnd={(e) => {
    if (window.innerWidth < 640) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }}
>
  {/* Chevron indicator */}
  <div
    className="flex sm:hidden"
    style={{
      position: 'absolute',
      top: '50%',
      right: '12px',
      transform: 'translateY(-50%)',
      color: '#94a3b8',
      pointerEvents: 'none',
      zIndex: 0
    }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  </div>
  {/* Card content */}
</div>
```

**Mobile Interaction Features**:

- **Full card tap**: Entire card is clickable on mobile (< 640px width)
- **Touch feedback**: Card scales down to 0.98 on touch, returns to 1.0 on release
- **Chevron indicator**: Subtle arrow (→) on right side shows card is tappable
- **Smart click detection**: `e.target.closest('button')` prevents conflicts with action buttons
- **Pointer events**: Chevron has `pointerEvents: 'none'` to avoid blocking taps
- **Desktop behavior**: Cards are not clickable on desktop, maintaining button-based navigation

**Why This Pattern**:

- Modern mobile-native interaction (like iOS/Android apps)
- More intuitive than top-corner buttons
- Maximizes tap target area
- Provides tactile feedback
- Prevents accidental action button triggers

### Payment-Focused List View Details

**Desktop Layout** (`Cars.jsx` - lines 458-477):

```jsx
{/* List Header */}
<div className="hidden sm:flex" style={{
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748b',
  textTransform: 'uppercase'
}}>
  <div style={{ flex: 2 }}>Véhicule</div>
  <div style={{ width: '110px', textAlign: 'right' }}>Prix de vente</div>
  <div style={{ width: '110px', textAlign: 'right' }}>Payé</div>
  <div style={{ width: '130px', textAlign: 'right' }}>Reste</div>
  <div style={{ width: '80px', textAlign: 'center' }}>Actions</div>
</div>
```

**Vehicle Info Column**:
- 44x44px thumbnail (photo or car icon)
- Display name or model name
- VIN number
- Status badges (SUPPRIMÉ, ✓ PAYÉ, ⏳ EN COURS, LOCATION, EN STOCK)
- Tags with colored dots

**Financial Columns**:
- **Prix de vente**: Sale price (or "-" if not sold)
- **Payé**: Total paid amount in green
- **Reste**: Remaining balance with payment percentage
- **Mini progress bar**: Visual payment completion indicator

**Mobile Layout** (`Cars.jsx` - lines 658-695):

```jsx
{/* Mobile: Financial summary in a row */}
<div className="flex sm:hidden" style={{
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
  padding: '10px',
  gap: '8px'
}}>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>Vente</div>
    <div style={{ fontWeight: '600', fontSize: '13px' }}>
      {car.status === 'sold' ? formatCurrency(car.sale_price) : '-'}
    </div>
  </div>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: '9px', color: '#64748b' }}>Payé</div>
    <div style={{ fontWeight: '600', fontSize: '13px', color: '#10b981' }}>
      {car.status === 'sold' ? formatCurrency(car.total_paid || 0) : '-'}
    </div>
  </div>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: '9px', color: '#64748b' }}>Reste</div>
    <div style={{ fontWeight: '600', fontSize: '13px', color: car.remaining_balance > 0 ? '#dc2626' : '#10b981' }}>
      {car.status === 'sold' ? (
        <span>
          {car.fully_paid ? '0' : formatCurrency(car.remaining_balance)}
          <span style={{ marginLeft: '4px', fontSize: '11px', color: '#f59e0b' }}>
            ({paymentPercent}%)
          </span>
        </span>
      ) : '-'}
    </div>
  </div>
</div>
```

**Mobile Optimizations**:
- Financial data in compact 3-column row
- 9px uppercase labels
- 13px values with color coding
- Inline payment percentage
- All data visible without scrolling

### Benefits

**Filter System**:
- Quick access to specific vehicle categories
- Rental filter helps track vehicles currently generating income
- Payment filters aid in cash flow management
- Clear visual distinction with color coding

**View Modes**:
- Grid view for general inventory browsing
- List view optimized for payment tracking workflows
- Persistent view mode preference per session

**Mobile Experience**:
- Native app-like tappable cards
- Touch feedback provides tactile confirmation
- Chevron indicates interactivity
- Prevents accidental button presses
- Optimized layouts for small screens

---

## Excel Import with Searchable Category Matching

### Overview

The Excel import feature (`ImportCars.jsx`) allows bulk vehicle import with intelligent expense category matching and manual selection when auto-detection fails.

### Unmatched Category Handling

When the import cannot automatically match an expense category name, users can manually select from existing categories using a searchable dropdown to prevent duplicate category creation.

**Visual Indicator**:
- Yellow/amber highlighted expense card
- Badge: "📝 Sera créée" (will be created)

### Searchable Dropdown Component

**Implementation** (`ImportCars.jsx` - lines 964-1016):

```jsx
{/* Manual category selection for unmatched categories */}
{expense.will_create_category && (
  <div className="mt-2 pt-2" style={{ borderTop: '1px solid #fcd34d' }}>
    <label className="block text-xs font-medium mb-1" style={{ color: '#92400e' }}>
      Ou sélectionner une catégorie existante:
    </label>

    {/* Searchable Dropdown */}
    <div className="relative">
      <input
        type="text"
        value={categoryDropdowns[getDropdownKey(index, i)]?.search || ''}
        onChange={(e) => updateCategorySearch(index, i, e.target.value)}
        onFocus={() => toggleCategoryDropdown(index, i)}
        onBlur={() => closeCategoryDropdown(index, i)}
        placeholder="Tapez pour rechercher une catégorie..."
        className="w-full px-3 py-2 rounded text-sm"
        style={{
          border: '1px solid #fbbf24',
          backgroundColor: 'white',
          color: '#1e293b'
        }}
      />

      {/* Dropdown List */}
      {categoryDropdowns[getDropdownKey(index, i)]?.isOpen && (
        <div
          className="absolute z-10 w-full mt-1 rounded shadow-lg"
          style={{
            backgroundColor: 'white',
            border: '1px solid #fbbf24',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {getFilteredCategories(index, i).length > 0 ? (
            getFilteredCategories(index, i).map(cat => (
              <div
                key={cat.id}
                onClick={() => updateExpenseCategory(index, i, cat.id)}
                className="px-3 py-2 cursor-pointer text-sm"
                style={{ borderBottom: '1px solid #fef3c7' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fef3c7'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                {cat.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm" style={{ color: '#64748b' }}>
              Aucune catégorie trouvée
            </div>
          )}
        </div>
      )}
    </div>

    <p className="text-xs mt-1" style={{ color: '#92400e' }}>
      💡 Si la catégorie existe avec un nom différent, tapez pour la rechercher et éviter les doublons
    </p>
  </div>
)}
```

### State Management

**Dropdown State** (`ImportCars.jsx` - lines 18-19):
```jsx
// State for searchable category dropdowns: {carIndex-expenseIndex: {search: '', isOpen: false}}
const [categoryDropdowns, setCategoryDropdowns] = useState({});
```

**Helper Functions**:
```jsx
// Generate unique key for each expense dropdown
const getDropdownKey = (carIndex, expenseIndex) => `${carIndex}-${expenseIndex}`;

// Toggle dropdown open/closed
const toggleCategoryDropdown = (carIndex, expenseIndex) => {
  const key = getDropdownKey(carIndex, expenseIndex);
  setCategoryDropdowns(prev => ({
    ...prev,
    [key]: {
      search: prev[key]?.search || '',
      isOpen: !prev[key]?.isOpen
    }
  }));
};

// Update search term and keep dropdown open
const updateCategorySearch = (carIndex, expenseIndex, searchTerm) => {
  const key = getDropdownKey(carIndex, expenseIndex);
  setCategoryDropdowns(prev => ({
    ...prev,
    [key]: {
      search: searchTerm,
      isOpen: true
    }
  }));
};

// Filter categories based on search term
const getFilteredCategories = (carIndex, expenseIndex) => {
  const key = getDropdownKey(carIndex, expenseIndex);
  const searchTerm = categoryDropdowns[key]?.search?.toLowerCase() || '';

  if (!searchTerm) return expenseCategories;

  return expenseCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm)
  );
};

// Close dropdown with delay to allow click events
const closeCategoryDropdown = (carIndex, expenseIndex) => {
  const key = getDropdownKey(carIndex, expenseIndex);
  setTimeout(() => {
    setCategoryDropdowns(prev => ({
      ...prev,
      [key]: { ...prev[key], isOpen: false }
    }));
  }, 200);
};
```

**Update Category Selection**:
```jsx
const updateExpenseCategory = (carIndex, expenseIndex, categoryId) => {
  setParsedCars(prev => {
    const updated = [...prev];
    const matchedCategory = expenseCategories.find(ec => ec.id === categoryId);

    if (matchedCategory) {
      updated[carIndex].expenses[expenseIndex] = {
        ...updated[carIndex].expenses[expenseIndex],
        matched_category_id: matchedCategory.id,
        matched_category_name: matchedCategory.name,
        will_create_category: false,
      };

      // Close the dropdown after selection
      const key = `${carIndex}-${expenseIndex}`;
      setCategoryDropdowns(prev => ({
        ...prev,
        [key]: { search: '', isOpen: false }
      }));
    }

    return updated;
  });
};
```

### User Flow Example

**Scenario**: Import detects "Retro viseurs L" but system has "Rétroviseurs"

1. **Initial State**:
   - Expense shows yellow highlight
   - Badge: "📝 Sera créée"
   - Manual selection section appears

2. **User Action**:
   - Click/focus on search input
   - Dropdown opens showing all categories
   - Type "retro"

3. **Filtering**:
   - Dropdown updates in real-time
   - Shows only: "Rétroviseurs"

4. **Selection**:
   - Click "Rétroviseurs"
   - Expense updates to use existing category
   - Badge changes to: "✓ Rétroviseurs" (green)
   - Dropdown closes

5. **Import Result**:
   - Expense uses existing "Rétroviseurs" category
   - No duplicate category created

### Features

**Type-to-Search**:
- Real-time case-insensitive filtering
- Shows all categories when empty
- Placeholder text guides users

**Smart Behavior**:
- Opens on focus
- Closes on blur (200ms delay for click events)
- Auto-closes after selection
- Clears search after selection

**Visual Feedback**:
- Hover states on dropdown items (yellow highlight)
- Empty state message when no matches
- Amber border matching warning theme
- Shadow for depth

**Performance**:
- Independent state for each expense dropdown
- Efficient filtering with `.includes()`
- Minimal re-renders

### Benefits

**Prevents Duplicates**:
- User can search and find existing categories with different names
- Example: "Peinture" vs "Paint Job", "Retro" vs "Rétroviseurs"

**Improved UX**:
- Much faster than scrolling through long select dropdown
- Type-ahead feels natural and responsive
- Clear visual feedback for matches

**Data Quality**:
- Reduces category proliferation
- Maintains consistent naming
- Users can still create new categories if truly needed
