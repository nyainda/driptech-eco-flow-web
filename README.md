# DripTech EcoFlow - Smart Irrigation Solutions

A modern web application for DripTech EcoFlow, providing innovative smart irrigation solutions for sustainable agriculture and water conservation.

## Features

- 🌱 Smart irrigation systems
- 💧 Water conservation solutions
- 📊 Agricultural monitoring
- 🌍 Sustainable farming practices
- 📱 Responsive design

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

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and configurations
└── types/         # TypeScript type definitions
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