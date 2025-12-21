# BestCar - Project Identity

## What is BestCar?

BestCar is a **multi-tenant salvage car inventory and expense tracking system** designed for businesses that purchase, repair, and resell salvage vehicles from auctions.

## Business Domain

**Salvage Car Business Management**
- Purchase vehicles from auctions (Copart, IAA, etc.)
- Track vehicle information (VIN, model, year, mileage, condition)
- Manage repair costs and expenses by category
- Calculate total investment per vehicle
- Multi-tenant architecture for multiple business units

## Target Users

### Primary Users
- **Car Dealers & Resellers** - Businesses that buy and resell salvage vehicles
- **Auction Buyers** - Professionals who purchase from Copart, IAA, and other auction houses
- **Repair Shops** - Shops that repair and flip salvage cars

### User Roles
- **Super Admin** - System-wide access, can manage all tenants
- **Admin** - Full access within their tenant (CRUD all entities)

## Problems Solved

### Core Problems
1. **Vehicle Inventory Chaos** - Track hundreds of VINs, purchase dates, sources, and locations
2. **Cost Tracking** - Calculate true cost including purchase price, clearance, towing, and repairs
3. **Expense Management** - Categorize repair costs (reparation) vs purchase costs (auction fees, shipping)
4. **Multi-Business Management** - Support multiple business units with complete data isolation

### Key Features
- Complete vehicle lifecycle tracking (purchase → repair → sale-ready)
- Expense categorization (reparation: engine, body, paint; purchase: fees, shipping, clearance)
- Real-time cost calculation and profitability analysis
- Multi-tenant architecture with subdomain support

## Technology Foundation

**Backend:** Ruby on Rails 8.0 API (PostgreSQL, UUID primary keys)
**Frontend:** React 19 + Vite 7
**Authentication:** JWT tokens
**UI Framework:** Tailwind CSS (Nexus Dashboard 3.1 design system)
**Language:** French UI

## Scope Boundaries

**In Scope:**
- Vehicle inventory management (VIN, model, purchase details)
- Seller/auction house management (name, location)
- Expense tracking by category and vehicle
- Cost calculation (purchase + clearance + towing + repairs)
- Multi-tenant data isolation
- Car model library management
- Expense category configuration
- Bulk vehicle import from Excel data

**Out of Scope:**
- Customer/buyer management
- Point-of-sale system
- Payment processing
- Accounting/bookkeeping integration
- Vehicle listing/marketplace features
- Automated VIN decoding/vehicle history reports
