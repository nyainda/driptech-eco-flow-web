# Quick Start: Testing with Remote D1

## Step 1: Stop Current Worker

In the terminal running the Worker, press `Ctrl+C` to stop it.

## Step 2: Start Worker with Remote D1

```bash
cd cloudflare-worker
npm run dev -- --remote
```

This connects to your production D1 database with all 94 synced records!

## Step 3: Verify Worker API

Open a new terminal and test:

```bash
# Health check
curl http://localhost:8787/api/health

# Get products (should return 45 products)
curl http://localhost:8787/api/products | jq 'length'

# Get first product
curl http://localhost:8787/api/products | jq '.[0] | {id, name, price}'
```

## Step 4: Update Frontend .env

Make sure your `.env` has:

```bash
VITE_USE_D1=true
VITE_WORKER_URL=http://localhost:8787
```

## Step 5: Start Frontend

In another terminal:

```bash
npm run dev
```

## Step 6: Test!

1. Open http://localhost:5173
2. Click WhatsApp contact button → Should show products
3. Check product recommendations → Should display
4. Open DevTools Network tab → Verify requests go to `localhost:8787/api/*`

---

## Expected Results

✅ Worker returns data from remote D1  
✅ Frontend loads products from Worker  
✅ No CORS errors  
✅ Faster response times (with caching)

---

## If You See Errors

**"Failed to fetch":**
- Check Worker is running with `--remote` flag
- Verify `VITE_WORKER_URL=http://localhost:8787` in `.env`

**CORS errors:**
- Worker has CORS enabled, should work
- Check browser console for details

**No data:**
- Verify Worker can connect to remote D1
- Check Worker terminal for errors
