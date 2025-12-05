# AI Product Research - Setup Guide

## Overview
The AI Product Research system tracks what users search for on your site and uses AI to suggest products you should create.

## Setup Steps

### 1. Run Database Migration
Execute the SQL migration in Supabase SQL Editor:

```bash
# File location
supabase/migrations/ai_product_research.sql
```

**Or run directly in Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/ai_product_research.sql`
3. Click "Run"

### 2. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-...`)

### 3. Add API Key to Environment
Update `.env` file:
```bash
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 4. Add API Key to Cloudflare Worker
```bash
cd cloudflare-worker
npx wrangler secret put OPENAI_API_KEY
# Paste your API key when prompted
```

### 5. Create AI Analysis Endpoint in Worker
The worker needs an endpoint to analyze trends. This will be created in the next step.

## How It Works

### 1. Search Tracking (Automatic)
- Users search for products on your site
- Searches are automatically tracked in `search_queries` table
- No configuration needed - already integrated!

### 2. AI Analysis (Manual)
1. Go to **Admin → AI Product Research**
2. Click **"Analyze Trends"** button
3. AI analyzes top search queries
4. Generates product suggestions based on what users want

### 3. Review Suggestions
- View AI-generated product suggestions
- See search volume for each
- Approve or reject suggestions
- Create products from approved suggestions

## Features

### Search Analytics
- View top 20 search queries (last 30 days)
- See search volume for each query
- Identify trending categories

### AI Suggestions
- AI-generated product names
- Descriptions
- Price ranges
- Target crops
- Technical specifications
- Features and applications

### Workflow
1. **Track** → Users search automatically tracked
2. **Analyze** → Click button to run AI analysis
3. **Review** → Approve/reject AI suggestions
4. **Create** → Generate products from suggestions

## Cost Estimates

### OpenAI API Costs
- **Analysis**: ~$0.05-0.10 per analysis (20 suggestions)
- **Monthly**: ~$2-5 (if you run 2-3 analyses per week)
- Very affordable for the value!

## Next Steps

After setup:
1. Let users search for a few days to gather data
2. Run your first AI analysis
3. Review suggestions
4. Create your first AI-suggested product!

## Troubleshooting

### "No search data available"
- Wait for users to search
- Or manually test by searching on your Products page

### "Failed to analyze trends"
- Check OpenAI API key is correct
- Verify worker has OPENAI_API_KEY secret
- Check worker logs: `npx wrangler tail`

### "Failed to load suggestions"
- Verify database migration ran successfully
- Check Supabase RLS policies are enabled

## Future Enhancements

Coming soon:
- Bulk product generation from suggestions
- Auto-approve based on search volume
- Integration with product creation form
- Blog topic suggestions
- Competitor analysis

---

**You're all set! Start tracking searches and let AI help you build your 1000+ product catalog!** 🚀
