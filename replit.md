# DripTech EcoFlow - Smart Irrigation Solutions

## Overview

DripTech EcoFlow is a modern web application providing innovative smart irrigation solutions for sustainable agriculture and water conservation in Kenya and East Africa. The platform serves as a comprehensive digital presence for showcasing irrigation products, services, projects, and educational content while enabling customer engagement through quotes, consultations, and support systems.

The application targets farmers, agricultural businesses, and irrigation professionals, offering product catalogs, case studies, educational videos, blog content, and customer success stories. It includes a full-featured admin dashboard for content management, customer relationship management, and business operations.

## Recent Changes

**October 17, 2025 - Vercel to Replit Migration:**
- Migrated project from Vercel to Replit environment
- Removed hardcoded Supabase credentials for security (previously exposed in source code)
- Implemented environment variable-based configuration using Replit Secrets
- Updated Vite development server to use port 5000 and host 0.0.0.0 for Replit compatibility
- Created .env.example file to document required environment variables
- Configured workflow to run development server with proper settings
- Security improvement: All sensitive credentials now managed through environment variables

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Tailwind CSS with custom design system for responsive styling
- shadcn/ui component library built on Radix UI primitives
- React Router for client-side routing

**Design Patterns:**
- Component-based architecture with separation of concerns (pages, components, hooks, utilities)
- Custom hooks for shared logic (visitor tracking, invoice operations, toast notifications)
- Context API for theme management and admin authentication
- Responsive-first design with mobile breakpoints at 768px
- Progressive Web App (PWA) capabilities with service worker and offline support

**Key Architectural Decisions:**
- TypeScript with relaxed strictness for gradual type adoption
- Path aliases (@/*) for clean imports
- Component composition using shadcn/ui for consistent UI patterns
- Separate responsive.css for mobile-first utilities

### State Management & Data Fetching

**Primary Solution: TanStack Query (React Query)**
- Server state synchronization for all backend data
- Automatic caching and background refetching
- Query invalidation for real-time updates
- Used throughout for products, blogs, quotes, customers, projects, and analytics

**Local State:**
- React useState for component-level state
- Form state management with controlled components
- Admin authentication context for session management

**Session & Authentication:**
- Custom admin authentication with idle timeout (30 minutes)
- Activity-based session extension
- Manual logout and auto-logout on inactivity
- Session state managed via AdminAuthContext

### Backend Integration

**Supabase as Backend-as-a-Service:**
- PostgreSQL database for all application data
- Row-level security policies for data access control
- Real-time subscriptions for live updates
- File storage for images, documents, and media
- Client-side SDK (@supabase/supabase-js v2.50.5)

**Database Schema (Key Tables):**
- `products` - Product catalog with variants, specs, and images
- `customers` - Customer information and contacts
- `quotes` - Quote generation and management
- `invoices` & `invoice_items` - Billing and invoicing
- `projects` - Project portfolio and case studies
- `blog_posts` - Content management system
- `news_articles` - News and updates
- `videos` - Video library and tutorials
- `team` - Team member profiles
- `success_stories` - Customer testimonials
- `contact_submissions` - Lead capture and inquiries
- `documents` - Document management and downloads
- `irrigation_kits` - Pre-configured irrigation packages
- `visitor_sessions`, `page_views`, `product_interactions` - Analytics tracking

### Content Management

**Rich Text Editing:**
- TinyMCE integration for WYSIWYG blog and news editing
- DOMPurify for XSS protection on user-generated content
- Custom BlogEditor component with preview capabilities

**Media Management:**
- Image uploads to Supabase Storage
- Video hosting via external URLs (YouTube, Vimeo)
- Document management with download tracking
- Featured images with fallback handling

**SEO & Metadata:**
- Dynamic meta tags in index.html
- Canonical URLs and Open Graph tags
- Google Site Verification
- Sitemap and robots.txt configuration
- Security headers (CSP, X-Frame-Options, etc.)

### Admin Dashboard

**Comprehensive Management System:**
- Multi-tab interface for different business functions
- Real-time analytics dashboard with charts (Chart.js/Recharts)
- CRUD operations for all content types
- Role-based access (admin, super_admin, editor)
- Notification system for new contacts and activities

**Key Admin Features:**
- Product management with variants and specifications
- Quote generation and conversion to invoices
- Customer relationship management
- Blog and news content publishing
- Video library management
- Document repository
- Team member profiles
- Success stories and testimonials
- Discount/promotion management
- Visitor analytics and tracking

**Invoicing & Quotes:**
- Custom quote builder with itemized pricing
- PDF generation (html2pdf.js)
- Print functionality for quotes and invoices
- VAT calculation and multi-currency support
- Status tracking (draft, sent, accepted, paid)

### Analytics & Tracking

**Visitor Analytics System:**
- Session tracking with unique visitor IDs (UUID)
- Page view logging with referrer tracking
- Product interaction tracking (views, clicks, interests)
- Device and browser detection
- Geographic location tracking
- Time-on-page metrics
- Custom event tracking for business insights

**Admin Analytics Dashboard:**
- Real-time visitor statistics
- Product engagement metrics
- Conversion funnel analysis
- Device and browser distribution charts
- Time-series data visualization

### Routing & Navigation

**Client-Side Routing:**
- React Router v6 with BrowserRouter
- Route definitions in App.tsx
- Nested routes for admin sections
- 404 Not Found page for invalid routes
- ScrollToTop component for navigation resets

**Key Routes:**
- `/` - Home page with hero, services, products
- `/products/:slug?` - Product catalog and details
- `/services` - Service offerings
- `/projects` - Project portfolio
- `/team` - Team members
- `/about` - Company information
- `/contact` - Contact form
- `/admin` - Protected admin dashboard
- `/blog` & `/blog/:slug` - Blog system
- `/news` & `/news/:slug` - News articles
- `/videos` - Video library
- Legal pages: `/privacy`, `/terms`, `/cookies`

### Form Handling & Validation

**Form Management:**
- React Hook Form with Zod resolvers for validation
- Controlled components for form state
- Custom SimpleContactForm component
- Quote request forms with multi-step flows
- Admin forms with inline validation

**Data Submission:**
- Direct Supabase inserts for contact forms
- Toast notifications for user feedback
- Error handling with user-friendly messages
- Success states with confirmation

### UI/UX Design System

**Design Tokens:**
- CSS variables for theming (light/dark mode)
- Custom color palette (primary: emerald/green theme)
- Responsive breakpoints (xs: 475px, 2xl: 1400px)
- Animation utilities and duration standards
- Elevation shadows (low, medium, high)

**Component Library:**
- shadcn/ui components (40+ UI primitives)
- Custom business components (QuoteModal, ProductCard, etc.)
- Responsive layouts with mobile-first approach
- Accessibility features (ARIA labels, keyboard navigation)

**Theme System:**
- Dark/light mode toggle
- ThemeProvider context
- Persistent theme preference
- CSS variable-based theming

### Performance Optimizations

**Build & Bundle:**
- Vite for fast HMR and optimized production builds
- Code splitting by route
- Tree shaking for unused code elimination
- Component lazy loading where applicable

**Caching Strategy:**
- Service worker for offline capability
- TanStack Query cache management
- Browser caching headers via Vercel config
- Image optimization recommendations

**Loading States:**
- Skeleton screens for data fetching
- Loading spinners for async operations
- Progressive enhancement approach
- Error boundaries for graceful failures

### Development & Deployment

**Development Environment:**
- Hot module replacement via Vite
- TypeScript for type safety
- ESLint for code quality
- Component development with Lovable Tagger (dev only)

**Deployment Configuration:**
- Vercel hosting with SPA routing
- Cache control headers for static assets
- Rewrites for client-side routing
- Environment-specific builds

**Code Organization:**
- Feature-based folder structure
- Shared utilities in /utils
- Reusable hooks in /hooks
- Type definitions in /types
- Centralized API client (Supabase)

## External Dependencies

### Core Backend Service

**Supabase (Primary BaaS):**
- PostgreSQL database hosting
- Authentication and user management
- Real-time database subscriptions
- File storage (images, documents, videos)
- Row-level security policies
- RESTful API auto-generation
- Client library: @supabase/supabase-js v2.50.5

### UI & Component Libraries

**shadcn/ui & Radix UI:**
- 40+ accessible UI primitives (@radix-ui/react-* packages)
- Dialog, Dropdown, Select, Toast, Tabs, etc.
- Unstyled components with Tailwind styling
- Full keyboard navigation support

**Styling:**
- Tailwind CSS v3 for utility-first styling
- class-variance-authority for component variants
- clsx/tailwind-merge for conditional classes
- PostCSS for CSS processing

### Form & Validation

**React Hook Form:**
- @hookform/resolvers for schema validation
- Zod integration for type-safe validation
- Performant form state management

### Data Visualization

**Charts & Analytics:**
- Chart.js v4.5.0 for data visualization
- Recharts for React-specific charts
- Custom dashboard components

### Rich Text & Media

**Content Editing:**
- TinyMCE (@tinymce/tinymce-react) for WYSIWYG editing
- DOMPurify for HTML sanitization
- html2pdf.js for PDF generation

**Media Handling:**
- Embla Carousel for image galleries
- Native HTML5 video player
- External video embedding (YouTube, Vimeo)

### Utilities & Helpers

**Date & Time:**
- date-fns v3.6.0 for date formatting and manipulation

**Unique Identifiers:**
- uuid v10 for visitor tracking and session IDs

**API Queries:**
- @tanstack/react-query v5.56.2 for server state

### PWA & Offline Support

**Service Worker:**
- Custom sw.js for offline caching
- Manifest.json for PWA configuration
- Offline fallback page
- Cache-first strategy for static assets

### Payment Integration (Configured)

**M-Pesa:**
- Custom integration via Supabase Edge Functions (implied)
- Transaction tracking and status management
- Sandbox and production environment support

### Analytics & Tracking

**Visitor Tracking:**
- Custom implementation using Supabase
- UUID-based visitor identification
- Session management and page view logging
- Product interaction events

**SEO & Marketing:**
- Google Site Verification
- Open Graph meta tags
- Twitter Card support
- Structured data for rich snippets

### Development Tools

**Build & Dev:**
- Vite v5 (build tool and dev server)
- TypeScript v5 (type checking)
- ESLint (code linting)
- lovable-tagger (dev-only component tracking)

### Email & Communication

**Contact & Notifications:**
- Email via Supabase triggers (inferred)
- WhatsApp integration (links)
- Phone call-to-action buttons
- Contact form to database

### Hosting & Infrastructure

**Deployment:**
- Vercel (primary hosting platform)
- Custom domain: driptech.co.ke
- CDN for static assets
- SPA routing configuration

### Security

**Headers & Protection:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection enabled
- Referrer-Policy: strict-origin-when-cross-origin
- DOMPurify for XSS prevention
- Supabase RLS for data security