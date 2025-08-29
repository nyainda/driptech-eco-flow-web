# Overview

DripTech EcoFlow is a modern web application for smart irrigation solutions focused on sustainable agriculture and water conservation in Kenya. The platform serves as both a marketing website and business management system, providing comprehensive irrigation system information, customer management, quotation generation, and project showcase capabilities. Built as a single-page React application with TypeScript, it integrates with Supabase for backend services and includes a full-featured admin dashboard for content and business management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**React 18 with TypeScript**: The application uses React 18 with TypeScript for type safety and modern React features. The codebase follows a component-based architecture with custom hooks for business logic separation.

**Routing Strategy**: React Router handles client-side routing with a comprehensive route structure covering main pages (products, services, projects, team), admin sections, and dynamic content pages. The app uses a single-page application approach with route-based code splitting.

**UI Component System**: Built on Radix UI primitives with custom Tailwind CSS styling. Components follow the shadcn/ui pattern with a centralized design system defined in CSS custom properties. The design system uses HSL color values for consistent theming and dark mode support.

**State Management**: Uses Tanstack Query (React Query) for server state management, providing caching, background updates, and optimistic updates. Local state is managed with React's built-in useState and useContext hooks.

**Form Handling**: React Hook Form with Zod resolvers for form validation and type safety. Forms include complex business logic for quotes, invoices, and product management.

## Backend Architecture  

**Supabase Integration**: Full backend-as-a-service integration providing PostgreSQL database, real-time subscriptions, authentication, and file storage. The client-side integration handles all database operations through the Supabase client.

**Authentication System**: Admin authentication system with session management, idle timeout warnings, and role-based access control. Includes security features like automatic logout and session refresh capabilities.

**Database Schema**: Comprehensive schema covering products, customers, quotes, invoices, blog posts, team members, projects, success stories, videos, and contact submissions. Includes foreign key relationships and proper indexing.

## Content Management

**Admin Dashboard**: Full-featured admin panel with role-based access for managing all content types. Includes analytics dashboard with visitor tracking, content statistics, and business metrics.

**Blog System**: Complete blog management with rich text editing, categorization, SEO optimization, and draft/published states. Includes reading time calculation and view tracking.

**Product Catalog**: Comprehensive product management with categories, variants, specifications, image galleries, and inventory tracking. Supports complex product hierarchies and filtering.

**Quote & Invoice System**: Business management tools for generating quotes, converting to invoices, tracking payments, and managing customer relationships. Includes PDF generation and email integration.

## Media Management

**File Upload System**: Handles image and video uploads through Supabase storage with progress tracking and validation. Supports multiple file formats and automatic resizing.

**Video Management**: Complete video content system with categorization, view tracking, and embedding capabilities. Includes support for both uploaded files and external video URLs.

**Document Management**: File storage and categorization system for technical documents, brochures, and installation guides with download tracking.

## Performance & SEO

**Build Optimization**: Vite-based build system with code splitting, tree shaking, and asset optimization. Development mode includes hot module replacement and fast refresh.

**SEO Implementation**: Comprehensive meta tags, Open Graph, and Twitter Card implementations. Includes structured data and canonical URLs for search engine optimization.

**Responsive Design**: Mobile-first responsive design using Tailwind CSS with breakpoint-specific optimizations and touch-friendly interfaces.

# External Dependencies

**Supabase**: Primary backend service providing PostgreSQL database, authentication, real-time subscriptions, and file storage. Handles all data persistence and user management.

**Vercel**: Deployment platform with automatic deployments, edge functions, and global CDN. Configured with custom routing for SPA behavior.

**Radix UI**: Headless UI component library providing accessible, unstyled components for building the design system. Includes complex components like dialogs, dropdowns, and form controls.

**Tailwind CSS**: Utility-first CSS framework for styling with custom design tokens and responsive design capabilities.

**Tanstack Query**: Server state management library handling API caching, synchronization, and background updates.

**Chart.js with React**: Data visualization library for admin dashboard analytics and business metrics display.

**TinyMCE**: Rich text editor for blog content creation and editing with extensive formatting capabilities.

**External Services**: Integration points prepared for M-Pesa payment processing and email services, though specific API keys would need to be configured.