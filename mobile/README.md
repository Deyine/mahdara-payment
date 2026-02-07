# BestCar Catalogue - Mobile App

React Native mobile app (Expo SDK 54) for browsing the BestCar public catalog.

## Requirements

- Node.js 22.16.0 (managed via `.nvmrc`)
- Expo Go app on your device (iOS/Android)

## Setup

```bash
# Ensure you're using the correct Node version
nvm use

# Install dependencies (already done)
npm install
```

## Running the App

```bash
# Start Expo dev server
npm start

# Or target specific platform
npm run ios     # iOS simulator
npm run android # Android emulator
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

## API Configuration

The app connects to:
- **Development**: `http://localhost:3061/api`
- **Production**: `https://api.bestcar-mr.com/api`

Edit [services/api.js](services/api.js) to change endpoints.

## Features

- **Catalog List**: Browse published cars with filters (All/Disponible/Vendu)
- **Car Details**: View photos, price, mileage, color, status
- **Photo Viewer**: Full-screen swipeable photo gallery
- **Pull to Refresh**: Refresh catalog
- **Infinite Scroll**: Paginated loading

## Project Structure

```
app/
├── _layout.js          # Root navigation layout
├── index.js            # Catalog list screen
└── car/[id].js         # Car detail screen

components/
├── CarCard.js          # Car grid item
├── StatusBadge.js      # Status badge (Disponible/Vendu)
└── PhotoViewer.js      # Fullscreen photo viewer

services/
└── api.js              # API client (fetch-based)

constants/
└── theme.js            # Colors & typography

utils/
└── formatters.js       # Price, mileage formatters
```

## Backend Requirements

Ensure your Rails backend has:
- ✅ `published` and `listing_price` fields on cars
- ✅ Public catalog endpoints: `GET /api/public/catalog` and `GET /api/public/catalog/:id`
- ✅ CORS configured for public endpoints

## Testing

1. Start your Rails backend: `cd backend && rails s -p 3061`
2. Publish a test car from the admin dashboard
3. Start Expo: `npm start`
4. Open in Expo Go and browse the catalog
