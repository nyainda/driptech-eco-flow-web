# Phase 1 Quick Reference

## What We Created

1. **D1 Schema** (`migration-scripts/d1-schema.sql`)
   - Converted Supabase PostgreSQL schema to D1 (SQLite)
   - Tables: products, blog_posts, videos, projects, success_stories, news_articles, irrigation_kits
   - All indexes for performance

2. **Setup Script** (`migration-scripts/setup-phase1.sh`)
   - Automated installation and setup
   - Interactive prompts for database ID

3. **Instructions** (`migration-scripts/PHASE1-SETUP.md`)
   - Step-by-step manual instructions

## Run Phase 1 Now

### Option 1: Automated Script (Recommended)
```bash
cd /home/bruce/driptech-eco-flow-web
./migration-scripts/setup-phase1.sh
```

### Option 2: Manual Steps
```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login
wrangler login

# 3. Create database
wrangler d1 create dripstech-products
# SAVE THE DATABASE ID!

# 4. Apply schema
wrangler d1 execute dripstech-products --file=migration-scripts/d1-schema.sql

# 5. Verify
wrangler d1 execute dripstech-products --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## What Happens Next

After Phase 1 completes:
- ✅ D1 database exists in Cloudflare
- ✅ All tables created (empty, no data yet)
- ✅ Database ID saved for Phase 2

**Phase 2 Preview**: We'll create a Cloudflare Worker API to read from D1

## Important Notes

- **No data migration yet** - Tables are empty
- **Website unchanged** - Still using Supabase
- **Safe to run** - No impact on production
- **Free tier** - D1 free tier is generous (5GB storage, 5M reads/day)

## Troubleshooting

If you get "command not found" for wrangler:
```bash
# Check installation
npm list -g wrangler

# Or use npx
npx wrangler login
npx wrangler d1 create dripstech-products
```

## Ready to Start?

Run the setup script:
```bash
cd /home/bruce/driptech-eco-flow-web
./migration-scripts/setup-phase1.sh
```

This will take about 5 minutes and guide you through each step!
