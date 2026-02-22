# BestCar - Mobile App (React Native + Expo)

## Overview

Public-facing React Native mobile app for browsing the BestCar catalog. Built with Expo SDK 54 and expo-router for file-based navigation. Features custom branding with Gagalin font, automatic OS language detection, and a modern 2-column grid catalog interface.

## Technology Stack

- **Framework**: React Native 0.81.5
- **Platform**: Expo SDK 54
- **Router**: expo-router ~6.0.23 (file-based navigation)
- **Node Version**: 22.16.0 (managed via `.nvmrc`)
- **State Management**: React hooks (useState, useEffect, useMemo, useRef)
- **HTTP Client**: Native `fetch` API
- **Navigation**: Stack navigation with expo-router
- **Internationalization**: i18next, react-i18next (French/Arabic support)
- **Language Detection**: expo-localization (OS language detection)
- **Fonts**:
  - expo-font, expo-splash-screen
  - @expo-google-fonts/nunito (app-wide typography)
  - Gagalin-Regular.otf (custom branding font)

## Project Structure

```
mobile/
├── app/                          # expo-router screens
│   ├── _layout.js               # Root navigation layout with i18n
│   ├── index.js                 # Catalog list screen (2-column grid)
│   └── car/
│       └── [id].js              # Car detail screen (modal presentation)
│
├── components/                   # Reusable components
│   ├── CarCard.js               # Catalog card (2-column grid layout)
│   ├── SplashScreen.js          # Custom splash with Gagalin font + language detection
│   └── PhotoViewer.js           # Fullscreen swipeable photo gallery
│
├── i18n/
│   └── index.js                 # i18next config with OS language detection
│
├── locales/
│   ├── fr.json                  # French translations
│   └── ar.json                  # Arabic translations
│
├── services/
│   └── api.js                   # API client (fetch-based)
│
├── constants/
│   └── theme.js                 # Centralized colors + fontFamily + fonts
│
├── utils/
│   └── formatters.js            # Price & mileage formatters (km→miles)
│
├── assets/
│   └── Gagalin-Regular.otf      # Custom branding font
│
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

**Design**:
- White background
- Custom header: BESTCAR logo (Gagalin font) centered, no language switcher
- Pill-shaped search bar with Feather search icon
- 2-column grid layout (numColumns: 2)

**Features**:
- Client-side search filtering by display_name (useMemo)
- Pull-to-refresh
- Infinite scroll (pagination)
- Loading & error states

**Data Display**:
- Photo priority: after_repair_photos first, fallback to salvage_photos
- First photo with rounded corners (borderRadius: 8)
- Car name (display_name) - bold (Nunito-Bold)
- Price - smaller, secondary color (Nunito-SemiBold)
- "VENDU" ribbon for sold cars

**State Management**:
```javascript
const [cars, setCars] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [loadingMore, setLoadingMore] = useState(false);
```

**Search Implementation**:
```javascript
const filteredCars = useMemo(() => {
  if (!searchQuery.trim()) return cars;
  return cars.filter(car =>
    car.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [cars, searchQuery]);
```

### 2. Car Detail (`app/car/[id].js`)

**Design**:
- Modal presentation (slide from bottom animation)
- Custom header: Back arrow (left), BESTCAR logo (center), empty spacer (right)
- White background matching home screen
- SafeAreaView for proper spacing

**Features**:
- Hero photo carousel with 4-second auto-swipe
- Full car information with RTL text alignment for Arabic
- Photo sections (before/after repair)
- Fullscreen photo viewer on tap
- Contact section with two clickable phone numbers

**Hero Carousel**:
- Photo priority: after_repair_photos first, fallback to salvage_photos
- Auto-swipe every 4 seconds using `setInterval` + `scrollToOffset`
- Height: 360px
- No pagination dots (removed)
- Swipeable with `pagingEnabled`

**Data Display**:
- Hero carousel (prioritized photos)
- Car name (bold, 22px, Nunito-Bold)
- Price (semiBold, 18px, textSecondary, Nunito-SemiBold)
- Details grid: Color, Mileage (miles), Year, Model
- After repair photos section (horizontal scroll)
- Salvage photos section (horizontal scroll)
- Contact section: Two phone buttons (36 20 30 52, 36 62 24 68)

**Navigation**:
```javascript
import { useLocalSearchParams, useRouter } from 'expo-router';
const { id } = useLocalSearchParams();
const router = useRouter();

// Back button handles both cases
router.canGoBack() ? router.back() : router.replace('/')
```

**Auto-swipe Implementation**:
```javascript
const heroRef = useRef(null);
const heroPhotos = useMemo(() => {
  if (!car) return null;
  const allPhotos = car.after_repair_photos?.length > 0
    ? car.after_repair_photos
    : (car.salvage_photos || []);
  return allPhotos.length > 0 ? allPhotos : null;
}, [car]);

useEffect(() => {
  if (!heroPhotos || heroPhotos.length <= 1) return;
  const timer = setInterval(() => {
    setHeroIndex((prev) => {
      const next = (prev + 1) % heroPhotos.length;
      heroRef.current?.scrollToOffset({
        offset: next * SCREEN_WIDTH,
        animated: true,
      });
      return next;
    });
  }, 4000);
  return () => clearInterval(timer);
}, [heroPhotos]);
```

**Contact Section**:
```javascript
<View style={styles.contactSection}>
  <Text style={styles.contactTitle}>{t('carDetail.contact')}</Text>
  <View style={styles.phoneNumbers}>
    <Pressable onPress={() => Linking.openURL('tel:36203052')}>
      <Feather name="phone" size={18} color={colors.primary} />
      <Text>36 20 30 52</Text>
    </Pressable>
    <Pressable onPress={() => Linking.openURL('tel:36622468')}>
      <Feather name="phone" size={18} color={colors.primary} />
      <Text>36 62 24 68</Text>
    </Pressable>
  </View>
</View>
```

## Components

### CarCard (`components/CarCard.js`)

2-column grid card component for catalog list.

**Props**:
- `car`: Car object from API

**Features**:
- Photo priority: after_repair_photos[0] || salvage_photos[0]
- Rounded image (borderRadius: 8, overflow: hidden)
- "VENDU" diagonal ribbon for sold cars
- Bold car title (Nunito-Bold, 13px)
- Smaller price (Nunito-SemiBold, 12px, textSecondary)
- Pressable (navigates to detail screen)

**Styling**:
- Container: flex: 1, paddingHorizontal/Vertical: 6
- Image: aspectRatio 4/3, resizeMode "cover", borderRadius: 8
- Ribbon: scaled down, position absolute, rotated 45deg

**Usage**:
```javascript
<FlatList
  data={cars}
  numColumns={2}
  renderItem={({ item }) => <CarCard car={item} />}
  keyExtractor={(item) => item.id}
/>
```

### SplashScreen (`components/SplashScreen.js`)

Custom branded splash screen with OS language detection.

**Features**:
- BESTCAR logo in Gagalin-Regular font (60px, fontWeight: 900)
- Subtitle based on OS language (expo-localization):
  - Arabic device: "إستيراد، بيع و تأجير السيارات"
  - Others: "Importation, Vente et Location de Voitures"
- Subtitle in Nunito-Bold (22px, textSecondary)
- Static glitch effect (cyan/magenta layers)
- White background with BestCar red text

**Implementation**:
```javascript
import { getLocales } from 'expo-localization';

const deviceLanguage = getLocales()[0]?.languageCode;
const subtitle = deviceLanguage === 'ar'
  ? 'إستيراد، بيع و تأجير السيارات'
  : 'Importation, Vente et Location de Voitures';
```

**Duration**: 1.5 seconds (configured in _layout.js)

### PhotoViewer (`components/PhotoViewer.js`)

Fullscreen modal for viewing photos with web compatibility.

**Props**:
- `photos`: Array of photo objects `[{ id, url, filename }]`
- `visible`: Boolean
- `initialIndex`: Starting photo index
- `onClose`: Callback function

**Features**:
- Horizontal FlatList with paging
- Photo counter (1 / 5)
- Close button (✕)
- Black background overlay (95% opacity)
- Swipe gestures

**Web Compatibility Fix**:
```javascript
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fixed height instead of percentage for web
photo: {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT * 0.7,
}
```

**Usage**:
```javascript
<PhotoViewer
  photos={heroPhotos}
  visible={viewerPhotos !== null}
  initialIndex={viewerIndex}
  onClose={() => setViewerPhotos(null)}
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

**Photo Priority Logic**:
Both home and detail screens prioritize after-repair photos:
```javascript
// CarCard
const photo = car.after_repair_photos?.[0] || car.salvage_photos?.[0];

// Detail hero carousel
const allPhotos = car.after_repair_photos?.length > 0
  ? car.after_repair_photos
  : (car.salvage_photos || []);
```

## Internationalization (i18n)

### Configuration (`i18n/index.js`)

**Supported Languages**:
- French (fr) - Default
- Arabic (ar) - Variant (only if device is Arabic)

**OS Language Detection**:
Uses expo-localization instead of manual switcher:
```javascript
import { getLocales } from 'expo-localization';

const deviceLanguage = getLocales()[0]?.languageCode;
const initialLanguage = deviceLanguage === 'ar' ? 'ar' : 'fr';
```

**Features**:
- Automatic language detection from device OS
- Synchronous RTL layout for Arabic (I18nManager)
- No AsyncStorage persistence (uses OS setting)
- Translation keys for all UI text

**Translation Files**:
- `locales/fr.json` - French translations
- `locales/ar.json` - Arabic translations

**Key Translation Sections**:
```javascript
{
  "common": { "loading", "error", "retry", "noPhoto", "price", "mileage", "year", "color", "model" },
  "catalog": { "title", "searchPlaceholder", "noCars", "pullToRefresh", "loadingMore" },
  "carDetail": {
    "title", "sold", "color", "mileage", "year", "model",
    "salvagePhotos": "Photos avant réparation",
    "afterRepairPhotos": "Photos après réparation",
    "contact": "Contacter"
  },
  "status": { "available", "sold" }
}
```

**RTL Support**:
- Text alignment automatically adjusts for Arabic
- Both labels and values align right when RTL active
- Configured at app initialization, no restart needed

## Theme & Styling

### Centralized Theme (`constants/theme.js`)

**All colors in one place**:

```javascript
export const colors = {
  primary: '#e61536',        // BestCar red
  primaryDark: '#b81129',    // Darker red
  background: '#ffffff',     // Changed to white
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  placeholder: '#e2e8f0',
  shadow: '#000000',
  success: '#10b981',
  warning: '#f59e0b',        // Used for "VENDU" ribbon
  error: '#ef4444',
};
```

**Font Family Object** (Nunito variants):

```javascript
export const fontFamily = {
  regular: 'Nunito-Regular',
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
};
```

**Font Configuration**:

```javascript
export const fonts = {
  regular: { fontSize: 14, color: colors.text },
  small: { fontSize: 12, color: colors.textSecondary },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '600', color: colors.text },
};
```

### Typography

**Gagalin Font** (branding):
- Used in: BESTCAR logo (splash screen, headers)
- Location: `mobile/assets/Gagalin-Regular.otf`
- Loaded via: `Font.loadAsync` in `_layout.js`

**Nunito Font Family** (app-wide):
- Regular: Body text, labels
- SemiBold: Prices, values, secondary emphasis
- Bold: Titles, headings, car names
- Installed via: `@expo-google-fonts/nunito`

**Font Loading** (_layout.js):
```javascript
await Font.loadAsync({
  'Gagalin-Regular': require('../assets/Gagalin-Regular.otf'),
  'Nunito-Regular': Nunito_400Regular,
  'Nunito-SemiBold': Nunito_600SemiBold,
  'Nunito-Bold': Nunito_700Bold,
});
```

### Styling Approach

- **StyleSheet.create()** for component styles
- Inline styles for dynamic values only
- Consistent spacing: 8px base unit (8, 10, 12, 16, 20)
- Border radius: 8px (images, cards, buttons), 26px (pill shapes)

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
npm install          # Install dependencies
```

### Running

```bash
npm start            # Start Expo dev server
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web browser (for testing)
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
- `cars.after_repair_photos` (has_many_attached)
- `cars.salvage_photos` (has_many_attached)

### API Endpoints
- `GET /api/public/catalog` - List endpoint with pagination
- `GET /api/public/catalog/:id` - Detail endpoint with all photos

### Photo Priority
Backend should return both photo arrays:
- `after_repair_photos`: Array of photo objects
- `salvage_photos`: Array of photo objects

App handles priority client-side (after-repair first).

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

1. **App Launch**:
   - Splash screen displays (1.5s) with Gagalin logo + language-aware subtitle
   - Fonts load (Gagalin + Nunito)
   - OS language detected → i18n initialized
   - Navigate to catalog list

2. **Catalog List**:
   - `getCatalog()` → `GET /api/public/catalog?page=1&per_page=20`
   - Map cars to `<CarCard>` components in 2-column grid
   - Client-side search filter active

3. **Tap Car**:
   - Navigate to `/car/[id]` with slide-from-bottom animation
   - Detail screen presented as modal

4. **Car Detail**:
   - `getCar(id)` → `GET /api/public/catalog/:id`
   - Display prioritized photos (after-repair first)
   - Auto-swipe hero carousel every 4 seconds
   - Contact section with phone numbers

5. **Photo Viewer**:
   - Tap any photo → fullscreen modal
   - Swipe through photos
   - Close to return to detail

## Common Patterns

### Navigation with Modal

```javascript
// _layout.js
<Stack.Screen
  name="car/[id]"
  options={{
    headerShown: false,
    animation: 'slide_from_bottom',
  }}
/>

// Back navigation with fallback
const router = useRouter();
router.canGoBack() ? router.back() : router.replace('/');
```

### Auto-swipe Carousel

```javascript
const heroRef = useRef(null);

useEffect(() => {
  if (!heroPhotos || heroPhotos.length <= 1) return;
  const timer = setInterval(() => {
    setHeroIndex((prev) => {
      const next = (prev + 1) % heroPhotos.length;
      heroRef.current?.scrollToOffset({
        offset: next * SCREEN_WIDTH,
        animated: true,
      });
      return next;
    });
  }, 4000);
  return () => clearInterval(timer);
}, [heroPhotos]);
```

### Client-side Search

```javascript
const [searchQuery, setSearchQuery] = useState('');

const filteredCars = useMemo(() => {
  if (!searchQuery.trim()) return cars;
  return cars.filter(car =>
    car.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [cars, searchQuery]);
```

### Phone Dialing

```javascript
import { Linking } from 'react-native';

<Pressable onPress={() => Linking.openURL('tel:36203052')}>
  <Text>36 20 30 52</Text>
</Pressable>
```

## Testing

### Manual Testing Checklist

**Splash Screen**:
- [ ] BESTCAR in Gagalin font, large and bold
- [ ] Subtitle in correct language (Arabic if device is AR, French otherwise)
- [ ] Subtitle in Nunito-Bold, readable size (22px)
- [ ] Glitch effect visible (cyan/magenta layers)
- [ ] Displays for ~1.5 seconds

**Home Screen**:
- [ ] White background
- [ ] BESTCAR header centered in Gagalin font
- [ ] Pill-shaped search bar with Feather search icon
- [ ] 2-column grid layout
- [ ] Car cards show rounded images
- [ ] Bold car titles, smaller prices
- [ ] After-repair photos prioritized (or salvage as fallback)
- [ ] Search filters cars by name in real-time
- [ ] Pull-to-refresh works
- [ ] Infinite scroll loads more pages

**Car Detail**:
- [ ] Slides up from bottom (modal animation)
- [ ] Custom BESTCAR header with back arrow
- [ ] Hero carousel auto-swipes every 4 seconds
- [ ] No pagination dots
- [ ] Photo priority: after-repair first, salvage fallback
- [ ] Car info displays correctly
- [ ] Contact section at bottom with two phone numbers side-by-side
- [ ] Tapping phone number opens dialer
- [ ] Back button returns to home

**Photo Viewer**:
- [ ] Opens in fullscreen
- [ ] Swipe between photos works
- [ ] Counter updates (1/5)
- [ ] Close button dismisses modal
- [ ] Photos display at correct size (web compatible)

**Fonts**:
- [ ] BESTCAR logo uses Gagalin everywhere
- [ ] All body text uses Nunito
- [ ] Bold titles use Nunito-Bold
- [ ] Prices use Nunito-SemiBold

**Language / RTL**:
- [ ] App language matches OS language (FR or AR)
- [ ] Text translates correctly
- [ ] RTL text aligns right for Arabic
- [ ] Numbers and prices display correctly

## Deployment

### Local Builds (no EAS, free)

Builds are done locally using `mobile/build.sh`. No EAS cloud required.

```bash
cd mobile
./build.sh android   # → AAB for Play Store
./build.sh ios       # → IPA for App Store
```

The script handles:

1. Switches to Java 17 (via sdkman)
2. Runs `expo prebuild --platform android --clean`
3. Auto-patches signing config into the regenerated `build.gradle`
4. Runs `./gradlew bundleRelease`

**Prerequisite**: Java 17 via sdkman — `sdk use java 17.0.10-tem`

### Android Release

| Field       | Value                                     |
|-------------|-------------------------------------------|
| Package     | `com.nv.bestcar`                          |
| versionCode | 1 (increment for each Play Store update)  |
| Keystore    | `keys/bestcar-release.keystore`           |
| Key alias   | `bestcar-key`                             |
| Key password| `bestcar2024`                             |

Build output: `android/app/build/outputs/bundle/release/app-release.aab`

Signing config is auto-patched by `build.sh` after every `prebuild --clean`.
Full signing details in `mobile/SIGNING.md`.

**R8 + resource shrinking enabled** — reduces AAB size significantly.

### Play Store Assets

| Asset                         | Location                          |
|-------------------------------|-----------------------------------|
| App icon (1024×1024)          | `mobile/assets/icon.png`          |
| Adaptive icon (1024×1024)     | `mobile/assets/adaptive-icon.png` |
| Splash icon (1024×1024)       | `mobile/assets/splash-icon.png`   |
| Play Store icon (512×512)     | `design/play-store-icon-512.png`  |
| Upload certificate (PEM)      | `keys/upload_certificate.pem`     |

### Production API

Production URL is already forced in `services/api.js`:

```javascript
const BASE_URL = PROD_URL; // https://api.bestcar-mr.com/api
```

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

### Auto-swipe not working
- Check `heroRef` is attached to FlatList
- Verify `heroPhotos.length > 1`
- Use `scrollToOffset` instead of `scrollToIndex` for horizontal lists

### Fonts not loading
- Check font files exist in `mobile/assets/`
- Verify `Font.loadAsync` in `_layout.js`
- Ensure `@expo-google-fonts/nunito` is installed
- Wait for fonts to load before hiding splash screen

### Web compatibility issues
- Use fixed heights instead of percentages where needed
- Test on web with `npm run web`
- Modal presentations may not work on web (use regular navigation)
