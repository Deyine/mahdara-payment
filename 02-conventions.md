# BestCar - Conventions & Standards

## Design System

### Color Palette (Nexus Dashboard 3.1)

**Primary Brand Color**:
- `#167bff` - Primary blue (buttons, links, active states)
- `#0d5dd6` - Hover state for primary

**Neutral Colors**:
- `#1e293b` - Dark text (headings)
- `#475569` - Medium text (labels)
- `#64748b` - Light text (descriptions)
- `#e2e8f0` - Borders
- `#f1f5f9` - Background (cards, hover states)
- `#fafbfc` - Page background

**Status Colors**:
- `#10b981` - Success (green)
- `#f59e0b` - Warning (amber)
- `#ef4444` - Error/Danger (red)

**Component Backgrounds**:
- White (`#ffffff`) - Cards, modals, tables
- Light gray (`#f9fafb`) - Table headers
- Very light gray (`#fafbfc`) - Page backgrounds

### Typography

**Font Family**: System font stack (Tailwind CSS default)

**Font Sizes**:
- 3xl: 30px - Page titles
- 2xl: 24px - Section headers
- xl: 20px - Card titles
- lg: 18px - Large text
- base: 16px - Body text
- sm: 14px - Small text
- xs: 12px - Very small text (labels, badges)

**Font Weights**:
- `bold` (700) - Headings, important values
- `semibold` (600) - Subheadings
- `medium` (500) - Labels, buttons
- `normal` (400) - Body text

## UI Patterns

### Buttons

**Primary Action** (Create, Save):
```jsx
<button style={{
  backgroundColor: '#167bff',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '6px',
  border: 'none',
  fontWeight: 'bold'
}}>
  + Nouveau Véhicule
</button>
```

**Secondary Action** (Edit, View):
```jsx
<button style={{
  border: '1px solid #167bff',
  backgroundColor: 'white',
  color: '#167bff',
  padding: '8px 16px',
  borderRadius: '6px'
}}>
  Modifier
</button>
```

**Danger Action** (Delete):
```jsx
<button style={{
  border: '1px solid #dc2626',
  backgroundColor: 'white',
  color: '#dc2626',
  padding: '8px 12px',
  borderRadius: '6px'
}}>
  Supprimer
</button>
```

### Forms

**Input Fields**:
```jsx
<input
  type="text"
  style={{
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px'
  }}
  required
/>
```

**Labels**:
```jsx
<label style={{
  display: 'block',
  marginBottom: '5px',
  fontSize: '14px',
  fontWeight: '500'
}}>
  VIN *
</label>
```

**Form Layout**: Use CSS Grid for multi-column forms
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '15px'
}}>
```

### Cards

**Standard Card**:
```jsx
<div style={{
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb'
}}>
```

**Card with Left Border Accent**:
```jsx
<div style={{
  backgroundColor: 'white',
  borderLeft: '4px solid #167bff',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e2e8f0'
}}>
```

### Badges & Status Indicators

**Active/Success**:
```jsx
<span style={{
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500',
  backgroundColor: '#d1fae5',
  color: '#065f46'
}}>
  Actif
</span>
```

**Inactive/Error**:
```jsx
<span style={{
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500',
  backgroundColor: '#fee2e2',
  color: '#991b1b'
}}>
  Inactif
</span>
```

**Warning/Info**:
```jsx
<span style={{
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500',
  backgroundColor: '#fef3c7',
  color: '#92400e'
}}>
  Réparation
</span>
```

### Tables

**Table Structure**:
```jsx
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <th style={{
        padding: '12px',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        Column Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '12px', fontSize: '14px' }}>
        Cell Content
      </td>
    </tr>
  </tbody>
</table>
```

### Modals

**Modal Overlay & Container**:
```jsx
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
}}>
  <div style={{
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto'
  }}>
    <h2 style={{
      margin: '0 0 20px 0',
      fontSize: '20px',
      fontWeight: 'bold'
    }}>
      Modal Title
    </h2>
    {/* Modal content */}
  </div>
</div>
```

## Code Conventions

### Naming Standards

**React Components**: PascalCase
```javascript
Dashboard.jsx
Cars.jsx
CarModels.jsx
ExpenseCategories.jsx
```

**API Service Methods**: camelCase
```javascript
carsAPI.getAll()
carsAPI.create(data)
carModelsAPI.getActive()
```

**Database Tables**: snake_case, plural
```ruby
tenants
users
car_models
cars
expense_categories
expenses
```

**Database Columns**: snake_case
```ruby
car_model_id
purchase_date
purchase_price
clearance_cost
expense_type
```

**Rails Models**: PascalCase, singular
```ruby
Tenant
User
CarModel
Car
ExpenseCategory
Expense
```

### French UI Text Standards

**Button Labels**:
- Create: "Créer", "+ Nouveau/Nouvelle"
- Edit: "Modifier"
- Delete: "Supprimer"
- Save: "Enregistrer"
- Cancel: "Annuler"
- View: "Voir"
- Close: "Fermer"

**Status Labels**:
- Active: "Actif"
- Inactive: "Inactif"
- Pending: "En attente"
- Completed: "Terminé"
- Cancelled: "Annulé"

**Common Labels**:
- Search: "Rechercher"
- Filter: "Filtrer"
- Export: "Exporter"
- Import: "Importer"
- Settings: "Paramètres"
- Dashboard: "Tableau de Bord"

**Entity Names**:
- Car: "Véhicule" (plural: "Véhicules")
- Model: "Modèle" (plural: "Modèles")
- Expense: "Dépense" (plural: "Dépenses")
- Category: "Catégorie" (plural: "Catégories")

### Date Formatting

**French Locale**: Always use `fr-FR`
```javascript
new Date(dateString).toLocaleDateString('fr-FR')
// Output: "17/12/2025"
```

**Date Input Fields**: Use ISO format (YYYY-MM-DD)
```javascript
<input
  type="date"
  value={formData.purchase_date}
  // Browser renders in user's locale
/>
```

### Currency Formatting

**MRU (Mauritanian Ouguiya)**:
```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MRU'
  }).format(amount);
};
// Output: "8 500,00 MRU"
```

**Number Formatting**:
```javascript
amount.toLocaleString('fr-FR')
// Output: "45 000" (with thousand separators)
```

## API Request Patterns

### Standard CRUD Operations

**List All**:
```javascript
const response = await carsAPI.getAll();
const cars = response.data;
```

**Get One**:
```javascript
const response = await carsAPI.getOne(id);
const car = response.data;
```

**Create**:
```javascript
await carsAPI.create({
  vin: '1HGCM82633A123456',
  car_model_id: modelId,
  year: 2020,
  purchase_date: '2025-12-17',
  purchase_price: 8500.00
});
```

**Update**:
```javascript
await carsAPI.update(id, {
  color: 'Blue',
  mileage: 50000
});
```

**Delete**:
```javascript
await carsAPI.delete(id);
```

### Error Handling Pattern

```javascript
try {
  await carsAPI.create(formData);
  await showAlert('Véhicule ajouté avec succès', 'success');
  fetchCars();
} catch (error) {
  await showAlert(
    error.response?.data?.errors?.[0] || 'Erreur lors de l\'enregistrement',
    'error'
  );
}
```

### Loading States

```javascript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  try {
    setLoading(true);
    const response = await api.getAll();
    setData(response.data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

if (loading) {
  return <div>Chargement...</div>;
}
```

## Git Workflow

### Branch Naming
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/car-management` - New features
- `fix/vin-validation` - Bug fixes

### Commit Message Format
```
feat: Add car expense tracking
fix: Correct VIN validation for tenant scope
refactor: Simplify dashboard statistics query
docs: Update API documentation for expenses
```

**Prefixes**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation only
- `style:` - Code style/formatting
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## File Organization

### React Component Structure
```javascript
import { useState, useEffect } from 'react';
import { useDialog } from '../context/DialogContext';
import { carsAPI } from '../services/api';

export default function Cars() {
  // 1. State declarations
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 2. Effects
  useEffect(() => {
    fetchCars();
  }, []);
  
  // 3. Event handlers
  const handleCreate = () => { /* ... */ };
  const handleEdit = (car) => { /* ... */ };
  
  // 4. Helper functions
  const formatCurrency = (amount) => { /* ... */ };
  
  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Rails Controller Structure
```ruby
class Api::CarsController < ApplicationController
  include MultiTenantable
  
  before_action :authenticate_user!
  before_action :require_admin, except: [:index, :show]
  before_action :set_car, only: [:show, :update, :destroy]
  
  def index
    # List all cars for tenant
  end
  
  def create
    # Create car with tenant_id
  end
  
  private
  
  def set_car
    @car = tenant_scope(Car).find(params[:id])
  end
  
  def car_params
    params.require(:car).permit(/* ... */)
  end
end
```

## Documentation Standards

### Inline Comments
- Comment "why", not "what"
- Explain business logic and complex calculations
- Document multi-tenant considerations
- Note any tenant-specific validation rules

### Function Documentation
```javascript
/**
 * Calculates the total cost of a car including all expenses
 * @param {Object} car - Car object with purchase_price, clearance_cost, towing_cost
 * @param {Array} expenses - Array of expense objects with amount property
 * @returns {number} Total cost in MRU
 */
const calculateTotalCost = (car, expenses) => {
  // Implementation
};
```

## Performance Best Practices

- Use `.includes()` for eager loading in Rails
- Implement search/filter on backend (not frontend)
- Paginate large lists (when > 100 items)
- Cache dashboard statistics when appropriate
- Use indexes for frequently queried columns
- Limit API response payload size

## Testing Conventions

**Not currently implemented** - Future considerations:
- Jest for React components
- RSpec for Rails models/controllers
- Test multi-tenant isolation
- Test role-based permissions
- Test cost calculations
