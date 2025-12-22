# BestCar - Code Conventions & Patterns

## Development Workflow

### Git Workflow

**Staging Files**:

- ✅ ALWAYS stage only specific files related to the current task
- ✅ Use `git add <specific-file-paths>` for precise control
- ❌ NEVER use `git add .` to avoid committing unrelated changes

**Example**:

```bash
# Good - Specific files only
git add backend/app/models/car.rb backend/app/controllers/api/cars_controller.rb

# Bad - Stages everything including unrelated changes
git add .
```

**Pushing Changes**:

- ❌ NEVER push automatically without asking the user first
- ✅ Always confirm before pushing to remote

### Planning & Implementation

**Before Implementing**:

- ✅ Always provide a plan and wait for user validation
- ✅ Break down complex tasks into clear steps
- ❌ Exception: Git-related tasks (pushing code) don't require planning approval

**Workflow**:

```text
1. User requests feature/fix
   ↓
2. Analyze requirements
   ↓
3. Present implementation plan
   ↓
4. Wait for user approval
   ↓
5. Execute plan step by step
```

### Documentation Style

**When to Document**:

- ✅ Add documentation when necessary for clarity
- ✅ Document complex business logic
- ✅ Document non-obvious patterns
- ❌ Don't be overly verbose

**Philosophy**:

> "There is nothing more ugly than a bunch of code with no documentation"

**Guidelines**:

- Keep comments concise and meaningful
- Explain **why**, not just **what**
- Document edge cases and gotchas
- Use inline comments sparingly, prefer method/class documentation

**Example**:

```ruby
# Good - Explains why
# Soft delete used to preserve historical data
# deleted_at timestamp instead of hard delete
def car_params
  params.require(:car).permit(:vin, :car_model_id, :year, :color, :mileage, :purchase_price)
  # deleted_at intentionally omitted (set via destroy action)
end

# Bad - States the obvious
# This method gets car parameters
def car_params
  # Permit VIN, model, year, etc.
  params.require(:car).permit(:vin, :car_model_id, :year, :color)
end
```

## Design System - Nexus Dashboard 3.1

### Primary Colors
- **Primary Blue**: `#167bff` - Buttons, links, accents
- **Primary Hover**: `#0d5dd6` - Hover state for primary elements

### Background Colors
- **Page Background**: `#fafbfc` - Main page background
- **Card Background**: `#ffffff` - Cards and modals
- **Hover Background**: `#f1f5f9` - Hover states for list items

### Text Colors
- **Primary Text**: `#1e293b` - Headings, labels, main content
- **Secondary Text**: `#475569` - Descriptions, helper text
- **Tertiary Text**: `#64748b` - Muted text, placeholders

### Border Colors
- **Default Border**: `#e2e8f0` - Cards, inputs, tables
- **Light Border**: `#cbd5e1` - Dividers, subtle separators

### Status Colors
- **Success**: `#10b981` - Completed items, success messages
- **Success Light**: `#f0fdf4` - Success backgrounds
- **Error**: `#ef4444` - Error messages, delete actions
- **Error Light**: `#fef2f2` - Error backgrounds
- **Warning**: `#f59e0b` - Warning messages
- **Info Blue**: `#eff6ff` - Info boxes, highlights

## UI Component Patterns

### Modal Pattern

**Usage**: All add/edit forms use modals instead of inline forms

```jsx
{showForm && (
  <div
    className="fixed inset-0 z-50 overflow-y-auto"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
  >
    <div className="flex items-center justify-center min-h-screen p-4">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        {/* Modal header with close button */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold" style={{ color: '#1e293b' }}>
            {title}
          </h3>
          <button onClick={resetForm}>
            <svg className="h-6 w-6" style={{ color: '#64748b' }}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Form fields */}
        </form>
      </div>
    </div>
  </div>
)}
```

**Features**:
- Semi-transparent backdrop (`rgba(0, 0, 0, 0.5)`)
- **Modals only close via explicit buttons** (Cancel, Close X, or Submit)
- **No overlay click to close** - prevents accidental data loss
- Close button (X icon) in header
- z-index 50 for proper layering
- Max width: `max-w-2xl` (standard) or `max-w-4xl` (complex forms like Purchases)

**IMPORTANT**: Do NOT add `onClick={resetForm}` to the overlay or `onClick={(e) => e.stopPropagation()}` to modal content. Users must explicitly click buttons to close modals.

### Searchable Select Pattern

**Usage**: For dropdowns with many options (brands, products)

**Component**: `SearchableSelect.jsx` (uses react-select library)

```jsx
import SearchableSelect from '../components/SearchableSelect';

<SearchableSelect
  options={brands.map(brand => ({ value: brand.id, label: brand.name }))}
  value={formData.brand_id ? {
    value: parseInt(formData.brand_id),
    label: brands.find(b => b.id === parseInt(formData.brand_id)).name
  } : null}
  onChange={(option) => setFormData({
    ...formData,
    brand_id: option ? option.value.toString() : ''
  })}
  placeholder="-- Sélectionner une marque --"
  isClearable={true}
  isRequired={false}
/>
```

**Features**:

- Type-to-search functionality
- Keyboard navigation (arrow keys, Enter)
- Custom styling matching Nexus Dashboard theme
- Clear button (when `isClearable={true}`)
- French localization ("Aucune option trouvée")
- Focused border color: `#167bff`

**Props**:

- `options`: Array of `{ value, label }` objects
- `value`: Selected option object or `null`
- `onChange`: Callback with selected option
- `placeholder`: Placeholder text
- `isClearable`: Allow clearing selection (default: `true`)
- `isRequired`: Mark as required field (default: `false`)

### Photo Swiper Pattern

**Usage**: Horizontal scrollable gallery with navigation arrows for multiple photos

**PhotoGallery Component** (`client/src/components/PhotoGallery.jsx`):
```jsx
import { useState, useRef } from 'react';

const PhotoGallery = ({ photos, onUpload, onDelete, title }) => {
  const swiperRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to show/hide navigation arrows
  const checkScrollPosition = () => {
    if (swiperRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = swiperRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Scroll swiper left or right
  const scroll = (direction) => {
    if (swiperRef.current) {
      const scrollAmount = 220;
      const newScrollLeft = direction === 'left'
        ? swiperRef.current.scrollLeft - scrollAmount
        : swiperRef.current.scrollLeft + scrollAmount;

      swiperRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };
};
```

**Features**:
- **Horizontal swiper** with smooth scroll animation
- **Navigation arrows** (left/right) that auto-hide at edges
- **Snap scrolling** for precise photo alignment
- **Keyboard navigation** (← → arrow keys)
- **Hidden scrollbar** for clean look
- **Click photo to fullscreen** viewer
- **Space-efficient** - minimal vertical space usage

**CSS**:
```css
.photo-swiper {
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.photo-swiper::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
.photo-swiper-item {
  scroll-snap-align: start;
}
```

**Navigation Arrows**:
```jsx
{/* Left Arrow */}
{canScrollLeft && (
  <button
    onClick={() => scroll('left')}
    style={{
      position: 'absolute',
      left: '-12px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      backgroundColor: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}
  >
    <svg>...</svg>
  </button>
)}

{/* Right Arrow */}
{canScrollRight && (
  <button onClick={() => scroll('right')}>...</button>
)}
```

**Keyboard Navigation**:
```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!fullscreenImage && swiperRef.current) {
      if (e.key === 'ArrowLeft' && canScrollLeft) {
        scroll('left');
      } else if (e.key === 'ArrowRight' && canScrollRight) {
        scroll('right');
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canScrollLeft, canScrollRight, fullscreenImage]);
```

---

### Fullscreen Image Viewer Pattern

**Usage**: Click product images or photos to view full-size

```jsx
const [fullscreenImage, setFullscreenImage] = useState(null);

// Click handler on image
<img
  onClick={() => setFullscreenImage({
    url: product.image_url,
    name: product.name
  })}
  style={{ cursor: 'pointer' }}
/>

// Fullscreen modal
{fullscreenImage && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
  >
    <button
      onClick={() => setFullscreenImage(null)}
      className="absolute top-4 right-4 p-2 rounded-full transition-colors"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
    >
      <svg className="h-6 w-6">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    <div className="max-w-7xl max-h-full">
      <img
        src={fullscreenImage.url}
        alt={fullscreenImage.name}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
      />
      <p className="text-center mt-4 text-white font-medium">
        {fullscreenImage.name}
      </p>
    </div>
  </div>
)}
```

**Features**:

- Dark overlay (90% opacity black)
- Close via button or ESC key
- Image name displayed below
- z-index 60 (above regular modals)
- Responsive sizing (max 90vh height)

**ESC Key Handler**:
```jsx
useEffect(() => {
  const handleEscKey = (e) => {
    if (e.key === 'Escape' && fullscreenImage) {
      setFullscreenImage(null);
    }
  };
  window.addEventListener('keydown', handleEscKey);
  return () => window.removeEventListener('keydown', handleEscKey);
}, [fullscreenImage]);
```

### Button Patterns

**Primary Button** (Save, Submit):
```jsx
<button
  className="px-6 py-3 rounded-lg font-medium transition-colors text-white"
  style={{ backgroundColor: '#167bff' }}
  onMouseEnter={(e) => e.target.style.backgroundColor = '#0d5dd6'}
  onMouseLeave={(e) => e.target.style.backgroundColor = '#167bff'}
>
  Créer
</button>
```

**Secondary Button** (Cancel):
```jsx
<button
  className="px-6 py-3 rounded-lg font-medium transition-colors"
  style={{ backgroundColor: '#fafbfc', border: '1px solid #e2e8f0', color: '#475569' }}
  onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
  onMouseLeave={(e) => e.target.style.backgroundColor = '#fafbfc'}
>
  Annuler
</button>
```

**Icon Buttons** (Edit/Delete in tables):
```jsx
{/* Edit icon */}
<button
  style={{ color: '#167bff' }}
  onMouseEnter={(e) => e.target.style.color = '#0d5dd6'}
  title="Modifier"
>
  <svg className="h-5 w-5">
    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
</button>

{/* Delete icon */}
<button
  style={{ color: '#64748b' }}
  onMouseEnter={(e) => e.target.style.color = '#ef4444'}
  onMouseLeave={(e) => e.target.style.color = '#64748b'}
  title="Supprimer"
>
  <svg className="h-5 w-5">
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
</button>
```

### Input Fields

**Standard Input**:
```jsx
<input
  className="w-full px-4 py-3 rounded-lg transition-colors"
  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
  onFocus={(e) => e.target.style.borderColor = '#167bff'}
  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
  placeholder="Entrez le texte"
/>
```

**Large Number Input** (for amounts):
```jsx
<input
  type="number"
  className="w-full px-4 py-3 text-center text-2xl font-bold rounded-lg transition-colors"
  style={{ border: '1px solid #e2e8f0', color: '#1e293b' }}
  onFocus={(e) => e.target.style.borderColor = '#167bff'}
  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
/>
```

### Loading Spinner

```jsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#167bff' }}></div>
```

### Dialog System (Custom Alerts & Confirmations)

**IMPORTANT**: Never use native `alert()` or `confirm()`. Always use the custom DialogContext.

**Setup**:
```jsx
import { useDialog } from '../context/DialogContext';

function MyComponent() {
  const { showAlert, showConfirm } = useDialog();
  // ...
}
```

**Alert Usage**:
```jsx
// Error alert
await showAlert('Message d\'erreur', 'error');

// Success alert
await showAlert('Opération réussie', 'success');

// Warning alert
await showAlert('Attention!', 'warning');
```

**Confirm Usage**:
```jsx
const confirmed = await showConfirm(
  'Êtes-vous sûr de vouloir supprimer ce produit ?',
  'Supprimer le produit'
);

if (!confirmed) return;

// User clicked "Confirmer", proceed with action
await deleteProduct(id);
```

**Features**:
- Styled to match Nexus Dashboard theme
- Contextual icons (error, success, warning)
- Promise-based API (use with async/await)
- French labels ("Annuler", "Confirmer", "OK")
- Accessible and keyboard-friendly

### Message/Alert Boxes

**Success**:
```jsx
<div
  className="rounded-lg p-4 flex gap-3"
  style={{ backgroundColor: '#f0fdf4', border: '1px solid #10b981' }}
>
  <svg style={{ color: '#10b981' }}>...</svg>
  <span style={{ color: '#166534' }}>Message de succès</span>
</div>
```

**Error**:
```jsx
<div
  className="rounded-lg p-4 flex gap-3"
  style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444' }}
>
  <svg style={{ color: '#ef4444' }}>...</svg>
  <span style={{ color: '#991b1b' }}>Message d'erreur</span>
</div>
```

**Info**:
```jsx
<div
  className="rounded-lg p-4 flex gap-3"
  style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}
>
  <svg style={{ color: '#167bff' }}>...</svg>
  <span style={{ color: '#1e40af' }}>Information</span>
</div>
```

### Statistics Cards

```jsx
<div
  className="bg-white border-l-4 rounded-lg p-6 shadow-sm"
  style={{
    borderLeftColor: '#167bff',
    border: '1px solid #e2e8f0'
  }}
>
  <h3 className="text-sm mb-2" style={{ color: '#64748b' }}>Total Produits</h3>
  <p className="text-4xl font-bold" style={{ color: '#1e293b' }}>100</p>
</div>
```

**Border colors for stat types**:
- Primary: `#167bff` (blue)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (orange)
- Error: `#ef4444` (red)

### View-Only Modal Pattern

Read-only modals display data without allowing edits. Used for viewing completed transactions.

**State Management**:
```javascript
const [viewMode, setViewMode] = useState(false);
const [editingItem, setEditingItem] = useState(null);

// Open in view mode
const handleView = (item) => {
  setEditingItem(item);
  setViewMode(true);
  setFormData(item);
  setShowForm(true);
};

// Open in edit mode
const handleEdit = (item) => {
  setEditingItem(item);
  setViewMode(false);
  setFormData(item);
  setShowForm(true);
};
```

**UI Implementation**:
```jsx
{/* Dynamic modal header */}
<h3>
  {viewMode ? 'Détails de l\'Achat' : (editingItem ? 'Modifier' : 'Nouveau')}
</h3>

{/* Disable all inputs in view mode */}
<input
  value={formData.field}
  onChange={(e) => setFormData({...formData, field: e.target.value})}
  disabled={viewMode}
  style={{
    backgroundColor: viewMode ? '#f1f5f9' : 'white'
  }}
/>

{/* Hide action buttons in view mode */}
{!viewMode && (
  <button onClick={addItem}>+ Ajouter</button>
)}

{/* Different footer buttons */}
{viewMode ? (
  <button onClick={resetForm}>Fermer</button>
) : (
  <>
    <button onClick={resetForm}>Annuler</button>
    <button type="submit">Enregistrer</button>
  </>
)}
```

**Key Features**:
- Gray background (#f1f5f9) on disabled fields
- All inputs disabled with `disabled={viewMode}`
- Action buttons (add, remove, upload) hidden in view mode
- Single "Fermer" button instead of "Annuler" + submit
- Same modal used for create/edit/view - controlled by state

**Example Usage** (Purchases):
- Pending purchases: Can edit ✏️
- Completed purchases: Can view 👁️ (read-only) + can invalidate ↶

### Auto-Open Modal via URL Pattern

Used for automatically opening a modal after navigation (e.g., after creating/editing a resource).

**Flow**:
1. Action completes (create/edit sale)
2. Navigate with query parameter: `/sales?view=123`
3. Sales page loads, detects parameter, auto-opens modal
4. Query parameter removed after opening

**Implementation** (Sales.jsx):
```jsx
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();
const [sales, setSales] = useState([]);
const [viewingSale, setViewingSale] = useState(null);
const [showViewModal, setShowViewModal] = useState(false);

// Check for auto-open parameter
useEffect(() => {
  const viewSaleId = searchParams.get('view');
  if (viewSaleId && sales.length > 0) {
    const sale = sales.find(s => s.id === parseInt(viewSaleId));
    if (sale) {
      handleView(sale);
      // Clean URL
      setSearchParams({});
    }
  }
}, [sales, searchParams]);
```

**Navigate after create**:
```jsx
const response = await salesAPI.create(saleData);
navigate(`/sales?view=${response.data.id}`);
```

**Navigate after edit**:
```jsx
await salesAPI.update(saleId, saleData);
navigate(`/sales?view=${saleId}`);
```

**Benefits**:
- Smooth UX: User immediately sees result
- Clean URLs: Parameter removed after use
- Context preservation: Modal shows freshly created/edited data

### Edit Mode Reuses Creation Interface

Pattern for editing resources using the same screen as creation (POS example).

**Flow**:
1. User clicks edit on pending sale
2. Navigate to POS with query parameter: `/pos?edit=123`
3. POS loads in edit mode with pre-populated data
4. User modifies and saves
5. Navigate back with auto-open: `/sales?view=123`

**Implementation** (POS.jsx):
```jsx
import { useSearchParams } from 'react-router-dom';

const [searchParams] = useSearchParams();
const editSaleId = searchParams.get('edit');
const isEditMode = !!editSaleId;

useEffect(() => {
  fetchProducts();
  if (isEditMode) {
    loadSaleForEdit(editSaleId);
  }
}, []);

const loadSaleForEdit = async (saleId) => {
  const [saleResponse, productsResponse] = await Promise.all([
    salesAPI.getOne(saleId),
    productsAPI.getAll()  // Fresh stock data
  ]);

  const sale = saleResponse.data;
  setProducts(productsResponse.data);
  setSelectedClient(sale.client);
  setDiscount(sale.discount);
  setNotes(sale.notes);

  // Load cart with fresh stock values
  const items = sale.sale_items.map(item => {
    const freshProduct = productsResponse.data.find(p => p.id === item.product.id);
    return {
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      current_stock: freshProduct?.current_stock || 0,
      _id: item.id  // Keep ID for updates
    };
  });
  setCartItems(items);
};
```

**UI Updates**:
```jsx
// Dynamic header
<h2>{isEditMode ? `Modifier la Vente #${editingSale?.id}` : 'Point de Vente'}</h2>

// Dynamic button
<button>
  {isEditMode ? 'Enregistrer les modifications' : 'Enregistrer la Vente'}
</button>

// Cancel button in edit mode
{isEditMode && (
  <button onClick={() => navigate('/sales')}>Annuler</button>
)}
```

**Save Logic**:
```jsx
if (isEditMode) {
  await salesAPI.update(editingSale.id, saleData);
  navigate(`/sales?view=${editingSale.id}`);
} else {
  const response = await salesAPI.create(saleData);
  navigate(`/sales?view=${response.data.id}`);
}
```

**Benefits**:
- DRY: Single interface for create/edit
- Consistency: Same UX for both operations
- Fresh data: Reloads products for current stock
- Atomic updates: Uses sale_item IDs for PATCH

### Debounced Real-Time Search Pattern

Used for searching while user types, with delay to reduce API calls (POS client search).

**Implementation**:
```jsx
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [showResults, setShowResults] = useState(false);
const [isSearching, setIsSearching] = useState(false);

useEffect(() => {
  if (!searchQuery.trim()) {
    setSearchResults([]);
    setShowResults(false);
    return;
  }

  setIsSearching(true);

  // Debounce with setTimeout
  const timeoutId = setTimeout(async () => {
    try {
      const response = await clientsAPI.search(searchQuery);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300);  // 300ms delay

  // Cleanup timeout on next input
  return () => clearTimeout(timeoutId);
}, [searchQuery]);
```

**UI**:
```jsx
<input
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Rechercher par téléphone ou nom..."
/>

{isSearching && <span>Recherche...</span>}

{showResults && (
  <div className="results-dropdown">
    {searchResults.length > 0 ? (
      searchResults.map(client => (
        <button key={client.id} onClick={() => handleSelect(client)}>
          {client.name} ({client.phone})
        </button>
      ))
    ) : (
      <button onClick={handleCreateNew}>
        + Créer nouveau client
      </button>
    )}
  </div>
)}
```

**Benefits**:
- Reduced API load: Only 1 call per 300ms
- Responsive: Instant feedback with loading state
- User-friendly: Shows "create new" if no results
- Cleanup: Cancels pending requests on input change

### Status-Based Action Buttons Pattern

Modal footer buttons change based on resource status (Sales example).

**Implementation** (Sales.jsx):
```jsx
{/* Modal Footer */}
<div className="flex justify-between items-center p-6 border-t">
  <div className="flex gap-3">
    {/* Pending sale actions */}
    {viewingSale.status === 'pending' && (
      <>
        <button onClick={() => handleCompleteSale(viewingSale.id)}>
          ✓ Finaliser la Vente
        </button>
        <button onClick={() => handleEdit(viewingSale)}>
          ✏️ Modifier
        </button>
        <button onClick={() => handleCancelSale(viewingSale.id)}>
          Annuler la Vente
        </button>
      </>
    )}

    {/* Completed sale actions (admin only) */}
    {viewingSale.status === 'completed' && user?.role === 'admin' && (
      <button onClick={() => handleUncompleteSale(viewingSale.id)}>
        ↶ Invalider (Retour en Brouillon)
      </button>
    )}
  </div>

  <button onClick={closeViewModal}>Fermer</button>
</div>
```

**Button Colors by Action**:
- Complete: Green (`#10b981`) - Primary positive action
- Edit: Blue (`#167bff`) - Neutral modification
- Cancel: Red (`#ef4444`) - Destructive action
- Uncomplete: Orange (`#f59e0b`) - Warning/reversal action

**Benefits**:
- Clear workflow: Actions match status
- Single modal: All actions in one place
- Role-based: Admin-only actions protected
- Context-aware: No irrelevant buttons

### Conditional Access by Status Pattern

Restrict access to resources based on status (invoice downloads example).

**Table Column**:
```jsx
<td>
  {sale.status === 'completed' && sale.invoice_url ? (
    <a href={sale.invoice_url} target="_blank">
      📄 Télécharger
    </a>
  ) : (
    <span>-</span>
  )}
</td>
```

**Modal Section**:
```jsx
{viewingSale.status === 'completed' && viewingSale.invoice_url && (
  <div>
    <a href={viewingSale.invoice_url}>
      📄 Télécharger la Facture
    </a>
  </div>
)}
```

**Backend Validation**:
```ruby
def update
  if @sale.status == 'completed'
    render json: { error: 'Cannot modify completed sale' },
           status: :unprocessable_entity
    return
  end
  # Proceed with update
end
```

**Benefits**:
- Data integrity: Completed sales immutable
- Clear workflow: Invoice only after completion
- User guidance: Hidden until available
- Backend enforcement: Frontend checks backed by API

## Naming Conventions

### Backend (Rails)
- **Models**: Singular, PascalCase (e.g., `Product`, `PurchaseItem`)
- **Tables**: Plural, snake_case (e.g., `products`, `purchase_items`)
- **Controllers**: Plural, PascalCase + Controller (e.g., `ProductsController`)
- **Routes**: Plural, snake_case (e.g., `products`, `expense_types`)
- **Methods**: snake_case (e.g., `complete_purchase`, `needs_reorder?`)
- **Files**: snake_case (e.g., `operators_controller.rb`, `json_web_token.rb`)

### Frontend (React)
- **Components**: PascalCase (e.g., `Login.jsx`, `AdminDashboard.jsx`)
- **Utilities**: camelCase (e.g., `api.js`, `AuthContext.jsx`)
- **Functions**: camelCase (e.g., `handleSubmit`, `fetchProducts`)
- **Variables**: camelCase (e.g., `formData`, `currentUser`)

## Styling Guidelines

### NO DaisyUI Classes

The project has **removed all daisyUI dependencies**. Do not use:
- ❌ `btn`, `btn-primary`, `btn-ghost`
- ❌ `card`, `card-body`
- ❌ `alert`, `alert-success`
- ❌ `badge`, `badge-primary`
- ❌ `stats`, `stat`
- ❌ `loading`, `loading-spinner`

### Use Pure Tailwind + Inline Styles

Instead, use Tailwind utility classes with inline styles for colors:
- ✅ `className="px-4 py-2 rounded-lg"` + `style={{ backgroundColor: '#167bff' }}`
- ✅ Custom animations: `className="animate-spin rounded-full border-b-2"`

## French Localization

All UI text is in French with proper grammar:

- **Dates**: Use `toLocaleDateString('fr-FR')` for French date format (dd/mm/yyyy)
- **Plurals**: Handle properly ("produit" vs "produits", "article" vs "articles")
- **Gender**: Use proper French gender agreements
- **Status labels**: Contextual translations (e.g., "En Stock", "Stock Faible", "Rupture de Stock")
- **Form buttons**: "Créer", "Mettre à Jour", "Annuler", "Supprimer"
- **Confirmations**: "Êtes-vous sûr de vouloir supprimer..."

### Date Formatting

```javascript
// Always use French locale
new Date().toLocaleDateString('fr-FR')  // 20/10/2025
```

### Number & Currency Formatting

**Utility Functions** (`client/src/utils/formatters.js`):

```javascript
import { formatNumber } from '../utils/formatters';

// Format numbers with space thousands separator
formatNumber(1234.56)      // "1 234.56"
formatNumber(236545)       // "236 545.00"
formatNumber(1000, 0)      // "1 000" (no decimals)
```

**Usage Pattern**:

- ✅ Use `formatNumber()` for all monetary amounts displayed to users
- ✅ Apply to both original currency and MRU conversions
- ✅ Particularly important for MRU amounts (Mauritanian Ouguiya) for better readability
- ❌ Don't use `.toFixed()` directly for display - always use `formatNumber()`

**Currency Display**:

```javascript
const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'EUR': return '€';
    case 'USD': return '$';
    case 'MRU': return 'MRU';
    default: return currency;
  }
};

// Display pattern
{getCurrencySymbol(currency)} {formatNumber(amount)}
// Example outputs: "€ 1 234.56", "$ 5 678.90", "MRU 12 345.67"
```

**Where to Apply**:

- Purchase totals and line items
- Expense amounts
- Dashboard statistics
- Any financial data shown to users

## Rails Conventions

### RESTful Actions
- `index` - GET list
- `show` - GET single
- `create` - POST create
- `update` - PUT/PATCH update
- `destroy` - DELETE delete

### Association Naming
- `belongs_to :car_model` - expects `car_model_id` column
- `belongs_to :tenant` - all models scoped by tenant
- `has_many :expenses` - Expense model has car_id foreign key
- `dependent: :destroy` - cascade delete
- `dependent: :restrict_with_error` - prevent deletion if associated records exist

### Strong Parameters

**CarsController**:
```ruby
def car_params
  params.require(:car).permit(
    :vin, :car_model_id, :year, :color, :mileage,
    :purchase_date, :purchase_price, :seller, :location,
    :clearance_cost, :towing_cost
  )
  # NOTE: deleted_at is NOT permitted (set via destroy action)
  # NOTE: tenant_id set automatically from current_user
end
```

**ExpensesController**:
```ruby
def expense_params
  params.require(:expense).permit(
    :expense_date, :expense_category_id, :car_id, :amount,
    :description, :currency, :exchange_rate
  )
end
```

### ActiveRecord Best Practices

```ruby
# Good - Use scopes for reusable queries
scope :active, -> { where(deleted_at: nil) }
scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }

# Good - Use eager loading to avoid N+1
Car.includes(:car_model, :expenses)

# Good - Use validations
validates :vin, uniqueness: { scope: :tenant_id }, presence: true

# Good - Use transactions for multi-step operations
ActiveRecord::Base.transaction do
  # multiple operations
end
```

### Password Hashing - CRITICAL

**ALWAYS use `has_secure_password` correctly**:

✅ **Correct** (let Rails handle hashing):
```ruby
def operator_params
  params.permit(:name, :username, :password, :filiere_id)
end

# Rails automatically hashes password when you use has_secure_password
User.create(operator_params)
```

❌ **Wrong** (manually setting password_digest causes BCrypt errors):
```ruby
def operator_params
  permitted = params.permit(:name, :username, :password, :filiere_id)
  permitted[:password_digest] = permitted.delete(:password)  # DON'T DO THIS!
  permitted
end
```

## Common Issues & Fixes

### Issue: `toFixed is not a function`
**Cause**: Rails returns decimals as strings in JSON
**Fix**: Convert to number first: `Number(value).toFixed(2)`

### Issue: Double API calls in development
**Cause**: React StrictMode calls useEffect twice in development
**Fix**: This is intentional and won't happen in production. No fix needed.

### Issue: BCrypt invalid hash error on login
**Cause**: Password stored as plain text instead of being hashed
**Fix**: Use `has_secure_password` correctly, pass `:password` not `:password_digest`

### Issue: Modal won't close when clicking outside
**Cause**: Missing `stopPropagation` on modal content
**Fix**: Add `onClick={(e) => e.stopPropagation()}` to modal content div

### Issue: Production build calls localhost API
**Cause**: Built without `.env.production` or deployed old `dist/` folder
**Fix**: Always rebuild after updating `.env.production`

## CSV Import Features

### Automatic Separator Detection

CSV files can use either comma (`,`) or semicolon (`;`) as separator. The backend auto-detects:

```ruby
# In candidates_controller.rb
csv_text = params[:file].read.force_encoding('UTF-8')

# Detect separator by counting occurrences in first line
first_line = csv_text.lines.first || ''
comma_count = first_line.count(',')
semicolon_count = first_line.count(';')
separator = semicolon_count > comma_count ? ';' : ','

csv = CSV.parse(csv_text, headers: false, col_sep: separator)
```

**Why**: European Excel exports use semicolon separators by default.

## Performance Best Practices

### Avoid N+1 Queries
```ruby
# Good - eager load associations
Car.includes(:car_model, :expenses).where(tenant_id: tenant.id)

# Bad - N+1 query
Car.where(tenant_id: tenant.id).each { |c| c.car_model.name }
```

### Frontend Sorting
Always convert to numbers when sorting:
```javascript
// Good
sortedResults.sort((a, b) => Number(b.average) - Number(a.average))

// Bad (strings sort incorrectly: "9" > "10")
sortedResults.sort((a, b) => b.average - a.average)
```

## Database Considerations

### Ruby Version
Currently using **Ruby 3.2.1** (changed from 3.3.0)

### Decimal Precision
- Monetary values: `decimal(10, 2)` - 10 digits total, 2 after decimal
- Exchange rates: `decimal(10, 4)` - 4 decimal precision for accuracy

### Unique Constraints
- `users.username` - unique
- `tenants.subdomain` - unique
- `cars[tenant_id, vin]` - composite unique (VIN unique per tenant)
- `car_models[tenant_id, name]` - composite unique (model name unique per tenant)
