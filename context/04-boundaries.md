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
