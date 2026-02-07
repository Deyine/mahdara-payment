# BestCar - Mobile App (React Native + Expo)

## Overview

Public-facing React Native mobile app for browsing the BestCar catalog. Built with Expo SDK 54 and expo-router for file-based navigation.

## Technology Stack

- **Framework**: React Native 0.81.5
- **Platform**: Expo SDK 54
- **Router**: expo-router ~6.0.23 (file-based navigation)
- **Node Version**: 22.16.0 (managed via `.nvmrc`)
- **State Management**: React hooks (useState, useEffect, useCallback)
- **HTTP Client**: Native `fetch` API
- **Navigation**: Stack navigation with expo-router

## Project Structure

```
mobile/
├── app/                          # expo-router screens
│   ├── _layout.js               # Root navigation layout
│   ├── index.js                 # Catalog list screen (home)
│   └── car/
│       └── [id].js              # Car detail screen (dynamic route)
│
├── components/                   # Reusable components
│   ├── CarCard.js               # Grid card for catalog list
│   ├── StatusBadge.js           # Status badge (Disponible/Vendu)
│   └── PhotoViewer.js           # Fullscreen swipeable photo gallery
│
├── services/
│   └── api.js                   # API client (fetch-based)
│
├── constants/
│   └── theme.js                 # Design tokens (colors, fonts)
│
├── utils/
│   └── formatters.js            # Price & mileage formatters
│
├── assets/                       # Images & icons
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── .nvmrc                       # Node version (22.16.0)
```

## API Configuration

The app connects to different endpoints based on environment:

```javascript
const DEV_URL = 'http://localhost:3061/api';
const PROD_URL = 'https://api.bestcar-mr.com/api';

// Auto-detect or force URL
const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;
// or const BASE_URL = PROD_URL; // Force production
```

**Endpoints Used**:
- `GET /api/public/catalog` - List published cars (paginated)
- `GET /api/public/catalog/:id` - Get car details

## Screens

### 1. Catalog List (`app/index.js`)

**Features**:
- Grid layout (2 columns)
- Filter tabs: All / Disponible / Vendu
- Pull-to-refresh
- Infinite scroll (pagination)
- Loading & error states

**Data Display**:
- Photo (first after_repair or salvage photo)
- Car name (display_name)
- Status badge
- Tenant name
- Price (listing_price or sale_price based on status)

**State Management**:
```javascript
const [cars, setCars] = useState([]);
const [filter, setFilter] = useState('all');
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [loadingMore, setLoadingMore] = useState(false);
```

**API Call**:
```javascript
const data = await getCatalog(page, perPage);
// Returns: { cars: [...], meta: { current_page, per_page, total_count, total_pages } }
```

### 2. Car Detail (`app/car/[id].js`)

**Features**:
- Hero photo carousel with pagination dots
- Full car information
- Photo sections (before/after repair)
- Fullscreen photo viewer on tap

**Data Display**:
- Hero carousel (all photos)
- Car name, status badge, tenant
- Price (listing_price or sale_price)
- Details grid: Color, Kilométrage, Année, Modèle
- After repair photos (horizontal scroll)
- Salvage photos (horizontal scroll)

**Navigation**:
```javascript
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams();
```

## Components

### CarCard (`components/CarCard.js`)

Grid card component for catalog list.

**Props**:
- `car`: Car object from API

**Features**:
- Pressable (navigates to detail screen)
- Photo display with placeholder
- Status badge integration
- Price formatting

**Usage**:
```javascript
<CarCard car={car} />
```

### StatusBadge (`components/StatusBadge.js`)

Status indicator badge.

**Props**:
- `status`: "active" or "sold"

**Config**:
```javascript
const STATUS_CONFIG = {
  active: { label: 'Disponible', bg: '#dcfce7', color: '#166534' },
  sold: { label: 'Vendu', bg: '#fef3c7', color: '#92400e' },
};
```

**Usage**:
```javascript
<StatusBadge status={car.status} />
```

### PhotoViewer (`components/PhotoViewer.js`)

Fullscreen modal for viewing photos.

**Props**:
- `photos`: Array of photo objects `[{ id, url, filename }]`
- `visible`: Boolean
- `initialIndex`: Starting photo index
- `onClose`: Callback function

**Features**:
- Horizontal FlatList with paging
- Photo counter (1 / 5)
- Close button
- Black background overlay
- Swipe gestures

**Usage**:
```javascript
<PhotoViewer
  photos={car.after_repair_photos}
  visible={viewerVisible}
  initialIndex={0}
  onClose={() => setViewerVisible(false)}
/>
```

## Services

### API Service (`services/api.js`)

Fetch-based API client.

**Functions**:

```javascript
// List catalog with pagination
getCatalog(page = 1, perPage = 20)
// Returns: { cars: [], meta: {} }

// Get single car details
getCar(id)
// Returns: car object
```

**Error Handling**:
```javascript
try {
  const data = await getCatalog();
} catch (err) {
  // err.message: "API error: 404"
}
```

## Theme & Styling

### Colors (`constants/theme.js`)

```javascript
export const colors = {
  primary: '#167bff',
  primaryDark: '#1260cc',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};
```

### Typography

```javascript
export const fonts = {
  regular: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.textSecondary },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '600', color: colors.text },
};
```

### Styling Approach

- **StyleSheet.create()** for component styles
- Inline styles for dynamic values only
- Consistent spacing: 8px base unit (8, 10, 12, 16, 20)
- Border radius: 4px (badges), 8px (thumbnails), 10px (cards)

## Formatters

### Price Formatter (`utils/formatters.js`)

```javascript
formatPrice(amount)
// 5000 → "5 000 MRU"
// null → "—"
```

### Number Formatter

```javascript
formatNumber(num)
// 5000 → "5 000"
// Uses French locale (fr-FR)
```

### Mileage Formatter

```javascript
formatMileage(km)
// 120000 → "120 000 km"
// null → "—"
```

## Development Workflow

### Setup

```bash
cd mobile
nvm use              # Switch to Node 22.16.0
npm install          # Already done
```

### Running

```bash
npm start            # Start Expo dev server
npm run ios          # iOS simulator
npm run android      # Android emulator
```

Scan QR code with:
- **iOS**: Camera app → opens in Expo Go
- **Android**: Expo Go app scanner

### Hot Reload

Expo enables fast refresh:
- Save file → changes reflect immediately
- Shake device → open dev menu
- Press `r` in terminal → reload
- Press `m` in terminal → toggle menu

## Backend Requirements

The mobile app requires these backend features:

### Database Fields
- `cars.published` (boolean, default: false)
- `cars.listing_price` (decimal 10,2)

### API Endpoints
- `GET /api/public/catalog` - List endpoint
- `GET /api/public/catalog/:id` - Detail endpoint

### CORS Configuration
```ruby
# config/initializers/cors.rb
allow do
  origins "*"
  resource "/api/public/*",
    headers: :any,
    methods: [:get, :options, :head],
    max_age: 600
end
```

## Data Flow

1. **App Launch**: User opens app → Catalog list screen loads
2. **Fetch Catalog**: `getCatalog()` → `GET /api/public/catalog?page=1&per_page=20`
3. **Display Cars**: Map cars to `<CarCard>` components
4. **Apply Filter**: Client-side filter by status (all/active/sold)
5. **Tap Car**: Navigate to `/car/[id]` with car ID
6. **Fetch Detail**: `getCar(id)` → `GET /api/public/catalog/:id`
7. **Display Detail**: Show photos, info, allow photo viewer

## Common Patterns

### Navigation

```javascript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push(`/car/${car.id}`);
router.back();
```

### Loading States

```javascript
if (loading) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
```

### Error Handling

```javascript
if (error) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable onPress={retry}>
        <Text>Réessayer</Text>
      </Pressable>
    </View>
  );
}
```

### Pull to Refresh

```javascript
<FlatList
  data={items}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
    />
  }
/>
```

### Infinite Scroll

```javascript
<FlatList
  data={items}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={
    loadingMore ? <ActivityIndicator /> : null
  }
/>
```

## Testing

### Manual Testing Checklist

**Catalog List**:
- [ ] Grid displays 2 columns
- [ ] Photos load correctly (or show placeholder)
- [ ] Status badges show correct color/text
- [ ] Price displays formatted with MRU
- [ ] Pull-to-refresh works
- [ ] Infinite scroll loads more pages
- [ ] Filter tabs work (All/Disponible/Vendu)
- [ ] Tap card navigates to detail

**Car Detail**:
- [ ] Hero carousel swipes correctly
- [ ] Pagination dots update on swipe
- [ ] All car info displays (name, status, price, color, mileage, year)
- [ ] Photo sections scroll horizontally
- [ ] Tap thumbnail opens fullscreen viewer
- [ ] Back button returns to list

**Photo Viewer**:
- [ ] Opens in fullscreen
- [ ] Swipe between photos works
- [ ] Counter updates (1/5)
- [ ] Close button dismisses modal
- [ ] Photos display at correct size

## Deployment

### Building for App Stores

```bash
# iOS build (requires Apple Developer account)
eas build --platform ios

# Android build (generates APK or AAB)
eas build --platform android
```

### Update Production API

Change `services/api.js`:
```javascript
const BASE_URL = PROD_URL; // Force production
```

Or use environment-based configuration with `app.config.js`.

## Troubleshooting

### "Cannot find module expo-router/entry"
- Ensure `package.json` has `"main": "expo-router/entry"`
- Delete `node_modules` and reinstall

### API 404 Errors
- Check backend is running on correct port
- Verify CORS configuration allows requests
- Check car is published: `car.published = true`

### Photos not loading
- Verify photo URLs are absolute (not relative paths)
- Check Active Storage is configured correctly
- Ensure `rails_blob_url(photo, only_path: false)` is used

### React/React-DOM version mismatch
- Pin `react-dom` to match `react` version:
  ```bash
  npm install react-dom@19.1.0
  ```
