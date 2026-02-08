# ExportReady Battery - Frontend Functionality

> **Last Updated:** January 14, 2026  
> **Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts

---

## 📋 Overview

The ExportReady Battery frontend is a modern, dark-themed Next.js application that provides a comprehensive dashboard for managing battery passport generation, batch tracking, and compliance monitoring for both **India (Battery Aadhaar)** and **EU (Carbon Passport)** markets.

---

## 🔐 1. Authentication System

### Pages
| Route | File | Description |
|-------|------|-------------|
| `/login` | `app/(auth)/login/page.tsx` | User login with email/password |
| `/register` | `app/(auth)/register/page.tsx` | New tenant registration |

### Features
- ✅ JWT-based authentication with access + refresh tokens
- ✅ Protected route handling via `AuthProvider` context
- ✅ Auto-redirect on login success to `/dashboard`
- ✅ Persistent sessions using `localStorage`
- ✅ Logout with token cleanup

### Components
- `login-form.tsx` - Email/password form with validation
- `register-form.tsx` - Company registration with email verification
- `auth-context.tsx` - React context for user state management

---

## 🏠 2. Landing Page (Public)

### Route: `/`

### Components
| Component | File | Description |
|-----------|------|-------------|
| `PublicHeader` | `components/layout/public-header.tsx` | Navigation bar with Login/Register CTAs |
| `HeroSection` | `components/landing/HeroSection.tsx` | Animated hero with gradient backgrounds |
| `TrustBar` | `components/landing/TrustBar.tsx` | Partner logos / trust indicators |
| `FeatureGrid` | `components/landing/FeatureGrid.tsx` | Feature cards with icons |
| `HowItWorks` | `components/landing/HowItWorks.tsx` | Step-by-step process flow |
| `CTAFooter` | `components/landing/CTAFooter.tsx` | Call-to-action with signup prompt |

### Features
- ✅ Dark premium theme with gradient animations
- ✅ Responsive mobile-first design
- ✅ Framer Motion scroll animations
- ✅ SEO-optimized structure

---

## 💰 3. Pricing Page

### Route: `/pricing`

### Features
- ✅ Three-tier pricing (Starter, Growth, Exporter)
- ✅ Monthly/Yearly billing toggle with 20% annual discount
- ✅ Animated pricing cards with feature lists
- ✅ "All Plans Include" section
- ✅ Contact sales CTA for enterprise

### Components
- `PricingCard.tsx` - Reusable pricing tier card with feature highlighting

---

## 📊 4. Dashboard Overview

### Route: `/dashboard`

### Features
- ✅ Real-time statistics fetching from backend
- ✅ Stats cards: Total Passports, India Batches, EU Export, Active Batches
- ✅ **Production Chart** - Line chart showing cumulative passport production (last 7 days)
- ✅ **Quota Card** - Visual progress bar for monthly passport quota
- ✅ **Batch Status Chart** - Donut chart (Ready/Processing/Completed)
- ✅ **Recent Batches Table** - Top 5 batches with status, progress, and actions
- ✅ **Activity Feed** - Combined batch creation + scan events timeline

### Components
| Component | Description |
|-----------|-------------|
| `StatsCard.tsx` | Metric card with trend indicators |
| `QuotaCard.tsx` | Usage quota visualization |
| `ProductionChart.tsx` | Recharts area chart |
| `BatchStatusChart.tsx` | Recharts pie/donut chart |
| `RecentBatchesTable.tsx` | Batch list with progress bars |
| `ActivityFeed.tsx` | Timeline of recent events |
| `TopNav.tsx` | Dashboard header with user menu |
| `sidebar.tsx` | Navigation sidebar |

---

## 📦 5. Batch Management

### Routes
| Route | Description |
|-------|-------------|
| `/batches` | List all batches with filtering |
| `/batches/[id]` | Batch details with passport list |

### Batch List Page Features
- ✅ Grid view of all batches
- ✅ **Market Region Filter** - All / India 🇮🇳 / EU 🇪🇺 pills
- ✅ Color-coded cards by market (orange=India, blue=EU, green=Global)
- ✅ Status badges (Ready / Processing)
- ✅ Specs preview chips (Chemistry, Capacity, Carbon Footprint)
- ✅ PLI Ready indicator for India batches

### Batch Details Page Features
- ✅ Core specifications display (Manufacturer, Chemistry, Capacity, Voltage, Weight, Origin)
- ✅ **India Compliance Card** - Domestic Value Add %, Cell Source, PLI Eligibility, Serial Format
- ✅ **EU Compliance Card** - Carbon Footprint, Recyclable status, Certifications, Material Data
- ✅ CSV Upload for passport data
- ✅ **Download Actions:**
  - Download QR Codes (ZIP)
  - Download PDF Labels
  - Export Serial List (CSV)
- ✅ **Passport List Table** with pagination (50 per page)
- ✅ Pagination controls for large batches (5000+ passports)

### Components
| Component | Description |
|-----------|-------------|
| `create-batch-dialog.tsx` | Multi-step batch creation form |
| `upload-csv.tsx` | CSV file upload with drag-drop |
| `passport-list.tsx` | Paginated passport table |
| `DownloadLabelsDialog.tsx` | PDF label download options |

---

## ➕ 6. Batch Creation Dialog

### Features
- ✅ **Template Selection** - Load pre-saved battery specs
- ✅ **Market Region Toggle** - India (BPAN) vs EU (Full Carbon Passport)
- ✅ **Batch Name** - Auto-generated or custom
- ✅ **Core Specifications:**
  - Chemistry (LFP, NMC, Solid State, etc.)
  - Capacity (mAh)
  - Voltage (V)
  - Weight (g)
  - Manufacturer
  - Country of Origin
- ✅ **India-Specific Fields:**
  - Domestic Value Add %
  - Cell Source (Domestic/Imported)
  - PLI Compliance toggle
- ✅ **EU-Specific Fields:**
  - Carbon Footprint (kg CO₂e/kWh)
  - Recyclable toggle
- ✅ **Passport Count** - Number to generate (1-10,000)
- ✅ Form validation before submission

---

## 📄 7. Template Management

### Route: `/templates`

### Features
- ✅ Create reusable battery specification templates
- ✅ Template cards with specs preview
- ✅ Search/filter templates
- ✅ Delete templates with confirmation
- ✅ Use template to pre-fill batch creation

### Components
| Component | Description |
|-----------|-------------|
| `CreateTemplateDialog.tsx` | Form to save new template |
| `TemplateCard.tsx` | Template display with actions |
| `DeleteTemplateDialog.tsx` | Confirmation modal |

---

## 📈 8. Scan Analytics

### Route: `/analytics`

### Features
- ✅ **Stats Cards:**
  - Total Scans
  - Today's Scans
  - Unique Countries
  - Device Types
- ✅ **Country Chart** - Bar chart of scans by country
- ✅ **Device Chart** - Pie chart (Mobile/Desktop/Tablet)
- ✅ **Live Scan Feed** - Real-time list of recent scans
- ✅ Auto-refresh every 30 seconds
- ✅ Manual refresh button

### Components
| Component | Description |
|-----------|-------------|
| `ScanStatsCard.tsx` | Metric card |
| `CountryChart.tsx` | Recharts bar chart |
| `DeviceChart.tsx` | Recharts pie chart |
| `LiveScanFeed.tsx` | Scrollable scan list |

---

## ⚙️ 9. Organization Settings

### Route: `/settings`

### Features
- ✅ Company Name
- ✅ Manufacturer Address (displayed on passports)
- ✅ Support Email
- ✅ Company Website
- ✅ Logo URL (for passport branding)
- ✅ Save changes with API update
- ✅ Success/error feedback messages

---

## 🛂 10. Public Battery Passport Page

### Route: `/p/[uuid]`

### Features
- ✅ **Public-facing** (no auth required) - Accessed via QR code scan
- ✅ Premium dark theme with animated gradients
- ✅ Loading state with "Verifying Passport" animation
- ✅ Error handling for invalid UUIDs
- ✅ **Scan Recording** - Tracks IP, device, location for analytics

### PassportView Component Features
- ✅ **Status Badge** - Created/Active/Shipped/In Service/Recalled/Recycled/End of Life
- ✅ **Market Badge** - 🇮🇳 India / 🇪🇺 EU / 🌍 Global
- ✅ **Verified Badge** - Blockchain verification indicator
- ✅ **Serial Number** with BPAN format for India
- ✅ **Manufacturer Info** - Name, Address from tenant settings
- ✅ **Core Specs** - Capacity, Voltage, Chemistry, Weight
- ✅ **Carbon Footprint** - EU passports with CO₂e display
- ✅ **Material Composition** - Cobalt, Lithium, Nickel percentages
- ✅ **Certifications** - CE Mark, BIS Mark icons
- ✅ **Lifecycle Timeline** - Created -> Active -> Shipped -> In Service -> Recycled -> End of Life
- ✅ Contact support link
- ✅ QR code display

---

## 🧩 11. UI Components (shadcn/ui)

The project uses the following shadcn/ui components:

| Component | Usage |
|-----------|-------|
| `Button` | All clickable actions |
| `Card` | Content containers |
| `Badge` | Status indicators |
| `Dialog` | Modal dialogs |
| `Input` | Form inputs |
| `Label` | Form labels |
| `Select` | Dropdowns |
| `Tabs` | Tab navigation |
| `Switch` | Toggle switches |
| `Progress` | Progress bars |
| `Toast/Sonner` | Notifications |

---

## 🔗 12. API Integration

### API Client: `lib/api.ts`
- Axios instance with base URL configuration
- Automatic JWT token injection
- Token refresh handling
- Error response interceptors

### Endpoints Used
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | New registration |
| `/auth/me` | GET | Get current user |
| `/auth/profile` | PUT | Update profile |
| `/dashboard/stats` | GET | Dashboard metrics |
| `/batches` | GET | List batches |
| `/batches` | POST | Create batch |
| `/batches/:id` | GET | Batch details |
| `/batches/:id/passports` | GET | Paginated passports |
| `/batches/:id/download` | GET | QR codes ZIP |
| `/batches/:id/labels` | GET | PDF labels |
| `/batches/:id/export` | GET | CSV export |
| `/batches/:id/upload` | POST | CSV upload |
| `/templates` | GET/POST/DELETE | Template CRUD |
| `/passports/:uuid` | GET | Public passport |
| `/scans/record` | POST | Record scan event |
| `/scans/feed` | GET | Analytics data |

---

## 🎨 13. Design System

### Theme
- **Primary:** Emerald/Green (`#10b981`)
- **India Accent:** Orange (`#f97316`)
- **EU Accent:** Blue (`#3b82f6`)
- **Background:** Black (`#000000`) / Zinc-900
- **Text:** White/Zinc-100 to Zinc-500

### Typography
- Font: System sans-serif stack
- Headings: Bold, tracking-tight
- Body: Regular, text-sm to text-base

### Animations
- Framer Motion for page transitions
- Pulse animations for live indicators
- Hover effects on cards and buttons

---

## 📱 14. Responsive Design

All pages are fully responsive with:
- Mobile-first breakpoints
- Collapsible sidebar on mobile
- Grid layouts that stack on small screens
- Touch-friendly button sizes

---

## ✅ Summary: Implemented Features

| Category | Count | Status |
|----------|-------|--------|
| Pages | 12 | ✅ Complete |
| Components | 45+ | ✅ Complete |
| API Integrations | 15+ | ✅ Complete |
| Authentication | Full | ✅ Complete |
| Multi-Market Support | India + EU | ✅ Complete |
| Analytics | Scans + Charts | ✅ Complete |
| Dark Theme | Premium | ✅ Complete |

---

*This document is auto-generated based on the current frontend codebase.*
