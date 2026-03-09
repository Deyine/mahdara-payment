# Mahdara - Project Identity

## What is Mahdara?

Mahdara is a **single-tenant employee payment management system** for organizations that manage employee contracts and issue monthly salary payments.

## Business Domain

**Employee Payment Management**
- Manage employees with their NNI (National ID), personal info, and location
- Define employee types (categories like Titulaire, Contractuel)
- Assign contracts (CDI or CDD) with monthly amounts and start dates
- Create payment batches covering one or more employees for one or more months
- Track payment history and totals

## Target Users

- **Admin / Super Admin** — Full CRUD access (employees, contracts, payments, settings)
- **User** — Read-only access

## Problems Solved

1. **Employee Record Management** — Central registry with NNI-verified identities from Gov API (Huwiyeti)
2. **Location Hierarchy** — Wilaya → Moughataa → Commune → Village address system with CSV bulk import
3. **Contract Tracking** — CDI (unlimited) and CDD (fixed months) contract types with monthly amounts
4. **Payment Batching** — Group employees into payment batches, specify months paid per employee
5. **Total Visibility** — Live total calculation before saving a payment batch

## Technology Foundation

**Backend:** Ruby on Rails 8.0 API (PostgreSQL, UUID primary keys)
**Frontend:** React 19 + Vite 7
**Authentication:** JWT tokens (24h expiry)
**UI Framework:** Pure Tailwind CSS (Nexus Dashboard 3.1 design system)
**Language:** Arabic UI (RTL — `dir="rtl"` on `<html>`)

## Scope Boundaries

**In Scope:**
- Employee management (NNI, personal info, location, type, contract)
- Employee types CRUD (settings)
- Location hierarchy CRUD with CSV import: Wilaya → Moughataa → Commune → Village
- Contract management (CDI unlimited / CDD with duration in months)
- Payment batch creation and management with per-employee months count
- NNI lookup against Mauritanian Government API (Huwiyeti)

**Out of Scope:**
- Payslip/document generation
- Accounting/bookkeeping integration
- Bank transfer integration
- Leave/absence management
- Multi-tenancy
