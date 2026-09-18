# Phase 1: Cloudflare D1 Setup Instructions

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser for authentication.

## Step 3: Create D1 Database

```bash
wrangler d1 create dripstech-products
```

**IMPORTANT**: Save the database ID from the output. You'll need it for configuration.

Example output:
```
✅ Successfully created DB 'dripstech-products'

[[d1_databases]]
binding = "DB"
database_name = "dripstech-products"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # SAVE THIS ID
```

## Step 4: Apply D1 Schema

```bash
wrangler d1 execute dripstech-products --file=migration-scripts/d1-schema.sql
```

This creates all the tables in your D1 database.

## Step 5: Verify Database Creation

```bash
# List all databases
wrangler d1 list

# Check tables in your database
wrangler d1 execute dripstech-products --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: products, blog_posts, videos, projects, success_stories, news_articles, irrigation_kits

## Step 6: Test Query

```bash
# Test that products table is empty but accessible
wrangler d1 execute dripstech-products --command "SELECT COUNT(*) as count FROM products"
```

Expected output: `count: 0`

## Next Steps

After completing Phase 1:
- ✅ D1 database created
- ✅ Schema applied
- ✅ Tables verified

**You're ready for Phase 2**: Creating the Cloudflare Worker API

## Troubleshooting

### If `wrangler` command not found:
```bash
# Check if installed globally
npm list -g wrangler

# Or install locally in project
cd /home/bruce/driptech-eco-flow-web
npm install -D wrangler
npx wrangler login
```

### If database creation fails:
- Make sure you're logged in: `wrangler whoami`
- Check Cloudflare dashboard: https://dash.cloudflare.com/
- Verify you have D1 access (free tier includes D1)

## Database ID Storage

Once you have your database ID, save it to a file for later use:

```bash
echo "D1_DATABASE_ID=your-database-id-here" >> .env.cloudflare
```

This will be needed when we create the Worker in Phase 2.
