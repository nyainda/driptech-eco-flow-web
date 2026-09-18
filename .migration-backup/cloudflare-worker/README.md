# Phase 2: Cloudflare Worker Setup

## What We Created

1. **Worker Project Structure**
   - `wrangler.toml` - Configuration file
   - `package.json` - Dependencies
   - `tsconfig.json` - TypeScript config
   - `src/index.ts` - Main API code (500+ lines)

2. **API Endpoints Created**
   - `/api/products` - Get all products (with category filter)
   - `/api/products/:id` - Get single product
   - `/api/blog` - Get blog posts
   - `/api/blog/:slug` - Get single blog post
   - `/api/videos` - Get videos
   - `/api/projects` - Get projects
   - `/api/success-stories` - Get success stories
   - `/api/news` - Get news articles
   - `/api/irrigation-kits` - Get irrigation kits
   - `/api/health` - Health check

3. **Features**
   - ✅ Cloudflare caching (1-2 hour cache times)
   - ✅ CORS enabled
   - ✅ JSON parsing for SQLite TEXT fields
   - ✅ Query parameters (category, featured, limit)
   - ✅ Error handling
   - ✅ TypeScript types

## Setup Instructions

### Step 1: Update Database ID

Edit `cloudflare-worker/wrangler.toml` and replace `YOUR_DATABASE_ID_HERE` with your actual database ID from Phase 1:

```toml
[[d1_databases]]
binding = "DB"
database_name = "dripstech-products"
database_id = "abc123-your-actual-id-here"  # Replace this!
```

### Step 2: Install Dependencies

```bash
cd /home/bruce/driptech-eco-flow-web/cloudflare-worker
npm install
```

### Step 3: Test Locally

```bash
npm run dev
```

This starts a local development server. Test endpoints:
```bash
# In another terminal
curl http://localhost:8787/api/health
curl http://localhost:8787/api/products
```

### Step 4: Deploy to Cloudflare

```bash
npm run deploy
```

This deploys your Worker to Cloudflare's global network!

### Step 5: Test Production

After deployment, you'll get a URL like:
```
https://dripstech-api.your-subdomain.workers.dev
```

Test it:
```bash
curl https://dripstech-api.your-subdomain.workers.dev/api/health
curl https://dripstech-api.your-subdomain.workers.dev/api/products
```

## API Documentation

### Products
```bash
# Get all products
GET /api/products

# Get products by category
GET /api/products?category=drip_irrigation

# Get featured products
GET /api/products?featured=true

# Get single product
GET /api/products/{id}
```

### Blog
```bash
# Get all published posts
GET /api/blog

# Get posts by category
GET /api/blog?category={category_id}

# Limit results
GET /api/blog?limit=10

# Get single post by slug
GET /api/blog/{slug}
```

### Videos
```bash
# Get all published videos
GET /api/videos

# Get videos by category
GET /api/videos?category=irrigation

# Get featured videos
GET /api/videos?featured=true
```

### Projects
```bash
# Get all projects
GET /api/projects

# Get featured projects
GET /api/projects?featured=true
```

### Success Stories
```bash
# Get all success stories
GET /api/success-stories
```

### News
```bash
# Get news articles
GET /api/news

# Limit results
GET /api/news?limit=5
```

### Irrigation Kits
```bash
# Get all active kits
GET /api/irrigation-kits

# Get kits by category
GET /api/irrigation-kits?category=drip

# Get featured kits
GET /api/irrigation-kits?featured=true
```

## Cache Times

- Products list: 1 hour
- Product detail: 2 hours
- Blog posts: 30 minutes
- Videos: 30 minutes
- Projects: 1 hour
- Success stories: 1 hour
- News: 30 minutes

## Next Steps

After Phase 2 completes:
- ✅ Worker API deployed
- ✅ All endpoints working
- ✅ Caching configured

**Phase 3**: Create data sync script to populate D1 from Supabase
