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
- **Internationalization**: i18next, react-i18next (French/Arabic support)
- **Storage**: @react-native-async-storage/async-storage (language persistence)
- **Fonts**: expo-font, expo-splash-screen

## Project Structure

```
mobile/
├── app/                          # expo-router screens
│   ├── _layout.js               # Root navigation layout with i18n
│   ├── index.js                 # Catalog list screen (single column)
│   └── car/
│       └── [id].js              # Car detail screen (dynamic route)
│
├── components/                   # Reusable components
│   ├── CarCard.js               # Catalog card (single column, responsive)
│   ├── LanguageSwitcher.js      # Globe icon with FR/AR dropdown
│   ├── SplashScreen.js          # Custom splash with glitch effect
│   ├── StatusBadge.js           # Status badge (deprecated in detail view)
│   └── PhotoViewer.js           # Fullscreen swipeable photo gallery
│
├── i18n/
│   └── index.js                 # i18next config with RTL support
│
├── locales/
│   ├── fr.json                  # French translations
│   └── ar.json                  # Arabic translations
│
├── services/
│   └── api.js                   # API client (fetch-based)
│
├── constants/
│   └── theme.js                 # Design tokens (BestCar red #e61536)
│
├── utils/
│   └── formatters.js            # Price & mileage formatters (km→miles)
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
- Single column layout with responsive card sizing (maxWidth: 500px)
- Filter tabs: Tous / Disponible / Vendu (translated based on language)
- Pull-to-refresh
- Infinite scroll (pagination)
- Loading & error states
- Language switcher in header (FR/AR)

**Data Display**:
- Photo (first after_repair or salvage photo, 4:3 aspect ratio)
- Car name (display_name)
- Mileage (converted from km to miles)
- "VENDU" ribbon for sold cars only
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
- Full car information with RTL text alignment for Arabic
- Photo sections (before/after repair)
- Fullscreen photo viewer on tap

**Data Display**:
- Hero carousel (all photos)
- Car name (no status badge or tenant name)
- Price (listing_price or sale_price)
- Details grid with RTL support: Color, Mileage (in miles), Year, Model
- After repair photos (horizontal scroll)
- Salvage photos (horizontal scroll)

**Navigation**:
```javascript
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams();
```

## Components

### CarCard (`components/CarCard.js`)

Single-column responsive card component for catalog list.

**Props**:
- `car`: Car object from API

**Features**:
- Pressable (navigates to detail screen)
- Photo display with 4:3 aspect ratio and cover mode
- "VENDU" diagonal ribbon for sold cars only
- Mileage display (converted to miles)
- Price formatting
- Responsive sizing (maxWidth: 500px, centered on large screens)

**Styling**:
- Container: maxWidth 500px, paddingHorizontal 12px
- Image: aspectRatio 4/3, resizeMode "cover"
- Ribbon: position absolute, rotated 45deg, amber background

**Usage**:
```javascript
<CarCard car={car} />
```

### SplashScreen (`components/SplashScreen.js`)

Custom branded splash screen with glitch effect.

**Features**:
- White background with BestCar red (#e61536) text
- "BESTCAR" in bold uppercase with wide letter spacing
- Static glitch effect (cyan and magenta color layers)
- Geometric triangle decorations in corners (inspired by brand design)
- Duration: 1.5 seconds (configurable in _layout.js)

**Styling**:
- Text: fontSize 50, fontWeight 'bold', letterSpacing 8
- Glitch layers: rgba(0, 255, 255, 0.5) and rgba(255, 0, 255, 0.5)
- Triangles: Semi-transparent primary color (15-25% opacity)

**Usage**:
Automatically displayed via `_layout.js` during app initialization.

### LanguageSwitcher (`components/LanguageSwitcher.js`)

Globe icon button with modal dropdown for language selection.

**Features**:
- Globe icon (🌐) in header
- Modal with FR/AR options (flag emojis + labels)
- Checkmark for active language
- Immediate language change
- Saves preference to AsyncStorage
- Alert about RTL changes (requires app restart on native)

**Languages**:
```javascript
[
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
]
```

**Usage**:
```javascript
<LanguageSwitcher /> // In header via _layout.js
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

## Internationalization (i18n)

### Configuration (`i18n/index.js`)

**Supported Languages**:
- French (fr) - Default
- Arabic (ar) - RTL support

**Features**:
- Synchronous initialization with i18next
- Language persistence via AsyncStorage
- Automatic RTL layout for Arabic (I18nManager)
- Translation keys for all UI text

**Translation Files**:
- `locales/fr.json` - French translations
- `locales/ar.json` - Arabic translations

**Key Translation Sections**:
```javascript
{
  "common": { "loading", "error", "retry", "noPhoto" },
  "catalog": { "title", "filterAll", "filterAvailable", "filterSold", "noCars" },
  "carDetail": { "title", "sold", "color", "mileage", "year", "model" },
  "settings": { "language" }
}
```

**Usage in Components**:
```javascript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

// Translate text
<Text>{t('catalog.title')}</Text>

// Check current language
const isArabic = i18n.language === 'ar';

// Change language
await i18n.changeLanguage('ar');
```

**RTL Support**:
- Text alignment automatically adjusts for Arabic
- Labels and values both align right when RTL active
- Requires app restart on native platforms for full RTL layout

**Language Persistence**:
```javascript
// Save preference
await saveLanguage('ar');

// Load on app start
const savedLanguage = await getInitialLanguage();
```

## Theme & Styling

### Colors (`constants/theme.js`)

**BestCar Brand Colors**:

```javascript
export const colors = {
  primary: '#e61536',        // BestCar red
  primaryDark: '#b81129',    // Darker red
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',        // Used for "VENDU" ribbon
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

**Automatic km → miles conversion** for target market:

```javascript
formatMileage(km)
// 120000 km → "74 564 mi" (120000 * 0.621371)
// null → "—"
// Uses French locale number formatting with space separators
```

**Conversion factor**: 1 km = 0.621371 miles

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

**Splash Screen**:
- [ ] White background with red BESTCAR text displays
- [ ] Glitch effect visible (cyan/magenta layers)
- [ ] Triangle decorations appear in corners
- [ ] Displays for ~1.5 seconds before catalog loads

**Catalog List**:
- [ ] Single column layout with centered cards
- [ ] Cards don't stretch beyond 500px on large screens
- [ ] Photos display with correct 4:3 aspect ratio
- [ ] "VENDU" ribbon appears only on sold cars
- [ ] Mileage displays in miles (not km)
- [ ] Price displays formatted with MRU
- [ ] Pull-to-refresh works
- [ ] Infinite scroll loads more pages
- [ ] Filter tabs work and show translated labels
- [ ] Tap card navigates to detail

**Language Switcher**:
- [ ] Globe icon visible in header
- [ ] Tap opens modal with FR/AR options
- [ ] Flag emojis and labels display correctly
- [ ] Checkmark shows on active language
- [ ] Switching language updates all UI text immediately
- [ ] Alert appears after switching (about RTL restart)
- [ ] Language preference persists after app restart

**Car Detail**:
- [ ] Hero carousel swipes correctly
- [ ] Pagination dots update on swipe
- [ ] Car name and price display (no status badge or tenant)
- [ ] Detail items show correct info (color, mileage in miles, year, model)
- [ ] RTL text alignment works for Arabic (both labels and values align right)
- [ ] Photo sections scroll horizontally
- [ ] Tap thumbnail opens fullscreen viewer
- [ ] Back button returns to list

**Photo Viewer**:
- [ ] Opens in fullscreen
- [ ] Swipe between photos works
- [ ] Counter updates (1/5)
- [ ] Close button dismisses modal
- [ ] Photos display at correct size

**RTL / Arabic**:
- [ ] All text translates to Arabic correctly
- [ ] Text aligns right when Arabic is active
- [ ] Layout feels natural for RTL users
- [ ] Numbers and prices display correctly

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
