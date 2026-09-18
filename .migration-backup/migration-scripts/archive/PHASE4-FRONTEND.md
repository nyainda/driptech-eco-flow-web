# Phase 4: Frontend Migration Guide

## Quick Start

### Step 1: Add Environment Variables

Add these to your `.env` file:

```bash
# Cloudflare D1 Configuration
VITE_USE_D1=false  # Start with false for testing
VITE_WORKER_URL=https://dripstech-api.YOUR-SUBDOMAIN.workers.dev
```

**Important**: Replace `YOUR-SUBDOMAIN` with your actual Cloudflare Workers subdomain.

### Step 2: Test with Supabase (Baseline)

With `VITE_USE_D1=false`:

```bash
npm run dev
```

Visit these pages and verify they work:
- Products: http://localhost:5000/products
- Blog: http://localhost:5000/blog
- Videos: http://localhost:5000/videos
- Projects: http://localhost:5000/projects

### Step 3: Enable D1

Update `.env`:
```bash
VITE_USE_D1=true
```

Restart dev server:
```bash
npm run dev
```

Test the same pages again. Data should now come from D1!

### Step 4: Verify Data Source

Open browser console and check network tab:
- With D1 disabled: Requests go to Supabase
- With D1 enabled: Requests go to your Worker URL

---

## Migration Checklist

### Components to Update

The following components need to be updated to use `dataService` instead of direct Supabase calls:

#### High Priority (Public Pages)
- [ ] `src/pages/Products.tsx` - Product listing
- [ ] `src/components/Products/*` - Product components
- [ ] `src/pages/Blog.tsx` - Blog listing
- [ ] `src/pages/Videos.tsx` - Video listing
- [ ] `src/pages/Projects.tsx` - Projects showcase
- [ ] `src/pages/Index.tsx` - Home page (featured content)

#### Medium Priority
- [ ] `src/components/Home/*` - Home page components
- [ ] `src/components/common/WhatsAppContact.tsx` - Product selection
- [ ] `src/hooks/useWhatsAppProducts.ts` - WhatsApp product hook

#### Low Priority
- [ ] Any other components querying the 7 migrated tables

---

## Migration Pattern

### Before (Direct Supabase)
```typescript
import { supabase } from '@/integrations/supabase/client';

// In component
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'drip_irrigation');

if (error) throw error;
```

### After (Data Service)
```typescript
import { dataService } from '@/services/dataService';

// In component
try {
  const products = await dataService.getProducts({ 
    category: 'drip_irrigation' 
  });
} catch (error) {
  console.error('Failed to fetch products:', error);
}
```

---

## Testing Strategy

### 1. Test with D1 Disabled (Supabase)

```bash
# .env
VITE_USE_D1=false
```

- [ ] All pages load correctly
- [ ] No console errors
- [ ] Data displays properly
- [ ] Filters work
- [ ] Search works

### 2. Test with D1 Enabled

```bash
# .env
VITE_USE_D1=true
```

- [ ] All pages load correctly
- [ ] No console errors
- [ ] Data displays properly
- [ ] Filters work
- [ ] Search works
- [ ] Check network tab for Worker API calls
- [ ] Verify caching headers

### 3. Performance Comparison

Compare page load times:

| Page | Supabase | D1 (First Load) | D1 (Cached) |
|------|----------|-----------------|-------------|
| Products | ___ ms | ___ ms | ___ ms |
| Blog | ___ ms | ___ ms | ___ ms |
| Videos | ___ ms | ___ ms | ___ ms |

Expected: D1 cached should be 50-80% faster

---

## Troubleshooting

### Issue: "Failed to fetch from D1"

**Solution**: Check that:
1. `VITE_WORKER_URL` is correct in `.env`
2. Worker is deployed and accessible
3. CORS is enabled in Worker
4. Network connection is stable

### Issue: Data looks different

**Solution**: 
1. Check data types (D1 uses TEXT for UUIDs, INTEGER for booleans)
2. Verify JSON parsing in Worker
3. Compare Supabase vs D1 responses

### Issue: Slow performance

**Solution**:
1. Check Cloudflare Analytics for cache hit rate
2. Verify caching headers in Worker responses
3. Check if Worker is in correct region

---

## Rollback Plan

If issues occur in production:

1. **Immediate Rollback**:
   ```bash
   # Update .env
   VITE_USE_D1=false
   
   # Redeploy
   npm run build
   vercel --prod
   ```

2. **Verify Rollback**:
   - Check that data loads from Supabase
   - Monitor error rates
   - Verify performance is stable

3. **Debug**:
   - Check Worker logs
   - Review D1 data
   - Test locally with D1 enabled

---

## Production Deployment

### Gradual Rollout Strategy

#### Week 1: Deploy with D1 Disabled
```bash
# .env.production
VITE_USE_D1=false
```

- Deploy to production
- Monitor for 24 hours
- Verify no regressions

#### Week 2: Enable for 10% of Traffic
```bash
# Use Vercel environment variables
# Set VITE_USE_D1=true for 10% of requests
```

- Monitor performance
- Check error rates
- Verify cache hit rates

#### Week 3: Increase to 50%
- Continue monitoring
- Compare costs (Supabase reads should decrease)

#### Week 4: Full Rollout (100%)
```bash
# .env.production
VITE_USE_D1=true
```

- Enable for all traffic
- Monitor closely for first 48 hours
- Keep Supabase as backup

---

## Success Metrics

After full rollout:

- [ ] Cache hit rate > 80%
- [ ] Page load time improved by 50%+
- [ ] Supabase reads reduced by 80%
- [ ] Zero user-facing errors
- [ ] No breaking changes

---

## Next Steps

1. ✅ Data service created
2. ⏳ Add environment variables
3. ⏳ Update components to use data service
4. ⏳ Test with D1 disabled
5. ⏳ Test with D1 enabled
6. ⏳ Deploy to production with D1 disabled
7. ⏳ Gradual rollout

**Current Status**: Ready to update components!
