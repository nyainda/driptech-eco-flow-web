# Testing Guide for Phase 4

## Current Status

✅ Worker running locally: `http://localhost:8787`  
✅ Batch 1 components migrated (3 files)  
⏳ Ready for frontend testing

---

## Step 1: Test Worker API

The Worker is running and serving data from D1. Test the endpoints:

```bash
# Health check
curl http://localhost:8787/api/health

# Get products
curl http://localhost:8787/api/products | jq '.[0]'

# Get blog posts
curl http://localhost:8787/api/blog | jq '.[0]'

# Get videos
curl http://localhost:8787/api/videos | jq '.[0]'
```

Expected: JSON responses with data from D1

---

## Step 2: Update Frontend .env

Your `.env` file should have:

```bash
# Existing Supabase config
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# NEW: Cloudflare D1 Configuration
VITE_USE_D1=false  # Start with false for baseline testing
VITE_WORKER_URL=http://localhost:8787
```

---

## Step 3: Test with D1 Disabled (Baseline)

```bash
# Make sure .env has:
VITE_USE_D1=false

# Start dev server (in a new terminal)
npm run dev
```

**Test these features:**
1. Open http://localhost:5173
2. Click WhatsApp contact button
3. Check product recommendations
4. Verify no errors in browser console

**Expected:** Everything works normally (using Supabase)

---

## Step 4: Test with D1 Enabled

```bash
# Update .env:
VITE_USE_D1=true

# Restart dev server
# (Ctrl+C and run npm run dev again)
```

**Test the same features:**
1. WhatsApp contact button
2. Product recommendations  
3. Check browser console Network tab
4. Verify requests go to `http://localhost:8787/api/*`

**Expected:** Same functionality, but data comes from D1 via Worker

---

## Step 5: Compare Performance

Open browser DevTools → Network tab

**With D1 disabled (Supabase):**
- Note response times for product queries

**With D1 enabled (Worker):**
- Note response times for same queries
- Should see requests to localhost:8787

---

## Troubleshooting

### Issue: "Failed to fetch from D1"
**Solution:** 
- Check Worker is running (`http://localhost:8787/api/health`)
- Verify `VITE_WORKER_URL=http://localhost:8787` in `.env`
- Restart dev server after changing `.env`

### Issue: CORS errors
**Solution:**
- Worker has CORS enabled for `*`
- Check browser console for specific error
- Verify Worker is running

### Issue: No data returned
**Solution:**
- Check D1 has data: `npm run sync:d1 -- --dry-run`
- Verify Worker can query D1
- Check Worker logs in terminal

---

## Success Criteria

✅ Worker API returns data  
✅ Frontend works with D1 disabled  
✅ Frontend works with D1 enabled  
✅ No console errors  
✅ Data matches between Supabase and D1

---

## Next Steps After Testing

If all tests pass:
1. Report results
2. Proceed to Batch 2 (4 more components)
3. Continue gradual migration

If issues found:
1. Report specific errors
2. Debug together
3. Fix before proceeding
