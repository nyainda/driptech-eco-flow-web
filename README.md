# DripTech EcoFlow - Smart Irrigation Solutions

A modern web application for DripTech EcoFlow, providing innovative smart irrigation solutions for sustainable agriculture and water conservation.

## Features

### Core Features
- 🌱 **Smart Irrigation Systems** - Comprehensive catalog of drip irrigation, sprinklers, and filtration systems
- 💧 **Water Conservation Solutions** - Eco-friendly products designed for maximum water efficiency
- 📊 **Agricultural Monitoring** - Track project performance and water savings
- 🌍 **Sustainable Farming Practices** - Educational content and best practices
- 📱 **Fully Responsive Design** - Optimized for desktop, tablet, and mobile devices

### Advanced Features
- 🤖 **AI-Powered Content Generation** - Automated blog posts, product descriptions, and market research
- 📈 **Advanced Analytics Dashboard** - Real-time visitor tracking, product interactions, and performance metrics
- 💬 **WhatsApp Integration** - Direct customer communication and inquiry system
- 🔍 **Advanced Product Search** - Smart search with AI-powered tracking and suggestions
- 📦 **Product Variant Support** - Multiple configurations and pricing options per product
- ⭐ **Favorites & Sharing** - Save products and share via social media
- 📰 **Content Management** - Blog, news articles, videos, and project portfolio
- 🏆 **Success Stories** - Customer testimonials and case studies showcase
- 🎯 **SEO Optimized** - Structured data, meta tags, and performance optimization

## Live Demo

**URL**: https://driptech.co.ke

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Tanstack Query
- Vite

### Backend & Data
- **Supabase** - PostgreSQL database (source of truth, admin operations, analytics)
- **Cloudflare D1** - Edge SQLite database (fast public reads)
- **Cloudflare Workers** - Edge API and sync logic
- **Hybrid Architecture** - Automatic sync from Supabase to D1 via webhooks

## Getting Started

### Prerequisites

- Node.js 16+ or Bun
- npm/yarn/bun

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd driptech-eco-flow-web
```

2. Install dependencies
```bash
npm install
# or
bun install
```

3. Start the development server
```bash
npm run dev
# or
bun dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
# or
bun run build
```

## Deployment

The application is automatically deployed to Vercel when changes are pushed to the main branch.

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs) folder:

- **[Hybrid Architecture](./docs/HYBRID-ARCHITECTURE.md)** - Complete architecture overview
- **[Migration & Sync Guide](./docs/MIGRATION-SYNC-COMPLETE.md)** - Setup and sync instructions
- **[Schema Comparison](./docs/SCHEMA-COMPARISON.md)** - Supabase vs D1 schema reference
- **[Webhook Setup](./docs/SUPABASE-WEBHOOK-SETUP.md)** - Configure automatic sync
- **[Cleanup Summary](./docs/CLEANUP-SUMMARY.md)** - Project cleanup details

## Design Documentation

Comprehensive design documentation and visual guides are available:

- **[Complete Design Guide](./.gemini/antigravity/brain/3a0e1f8a-8a13-447b-b576-e580243d01a5/complete-design-guide.md)** - All-in-one design reference with database + UI/UX
- **[Database Flow Chart](./.gemini/antigravity/brain/3a0e1f8a-8a13-447b-b576-e580243d01a5/database-flow-chart.md)** - Complete ERD with all 11 tables and relationships
- **[UI/UX Architecture](./.gemini/antigravity/brain/3a0e1f8a-8a13-447b-b576-e580243d01a5/ui-ux-architecture.md)** - Component hierarchy, user flows, and design patterns
- **[Visual Mockups](./.gemini/antigravity/brain/3a0e1f8a-8a13-447b-b576-e580243d01a5/)** - Design mockups for homepage, products, and mobile views

### Design System
- **Primary Color**: `#4CAF50` (Green - DripTech brand)
- **Typography**: Inter font family
- **Components**: 60+ components using shadcn/ui + custom components
- **Responsive**: Mobile-first design with 5 breakpoints

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Header, Footer, Navigation
│   ├── Home/           # Homepage sections (20+ components)
│   ├── Products/       # Product-related components
│   ├── Admin/          # Admin dashboard (80+ components)
│   ├── Analytics/      # Analytics tracking
│   ├── SEO/            # SEO components
│   ├── common/         # Shared components
│   └── ui/             # shadcn/ui components (49 components)
├── pages/              # Page components (26 pages)
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── services/           # API services (dataService, aiProductService)
├── integrations/       # Third-party integrations (Supabase)
└── types/              # TypeScript type definitions

cloudflare-worker/      # Edge API and sync logic
migration-scripts/      # Database migration scripts
docs/                   # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Contact

For questions or support, please contact the DripTech EcoFlow team.