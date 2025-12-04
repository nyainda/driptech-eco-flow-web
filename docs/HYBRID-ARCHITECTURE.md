# Hybrid Architecture: Supabase + Cloudflare D1

## Overview
This application uses a **hybrid data architecture** for optimal performance and flexibility:

- **Supabase**: Source of truth for admin operations and analytics
- **Cloudflare D1**: Fast, cached read layer for public content
- **Automatic Sync**: Supabase → Cloudflare D1

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
│                                                             │
│  Admin creates/updates content → Supabase (PostgreSQL)     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables (Write to Supabase):                         │  │
│  │  • products                                          │  │
│  │  • blog_posts                                        │  │
│  │  • videos                                            │  │
│  │  • projects                                          │  │
│  │  • success_stories                                   │  │
│  │  • news_articles                                     │  │
│  │  • irrigation_kits                                   │  │
│  │  • documents                                         │  │
│  │  • team                                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│                   ┌───────────────┐                         │
│                   │  Sync Trigger │                         │
│                   │  (Webhook)    │                         │
│                   └───────────────┘                         │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Cloudflare Worker    │
                │  Sync Endpoint        │
                │  /api/sync/:table     │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Cloudflare D1       │
                │   (SQLite)            │
                │   Read-only cache     │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   PUBLIC FRONTEND     │
                │   (Reads from D1)     │
                └───────────────────────┘
```

---

## Tables Strategy

### 📊 Analytics Tables (Supabase ONLY)
These tables are **NOT synced** to D1. They remain in Supabase for admin analytics:

- `visitor_sessions` - User session tracking
- `page_views` - Page view analytics
- `product_interactions` - Product interaction tracking
- `admin_users` - Admin authentication
- `user_roles` - User permissions
- `quotes` - Customer quotes (dynamic)
- `customers` - Customer data (PII)
- `contact_submissions` - Contact form submissions
- `system_settings` - App configuration

**Why?**: These tables contain:
- Personal data (PII)
- Real-time analytics
- Admin-only data
- Frequently changing data

### 📦 Content Tables (Synced to D1)
These tables are **synced** from Supabase → D1 for fast public reads:

- `products` ✅
- `blog_posts` ✅
- `blog_categories` ✅
- `videos` ✅
- `projects` ✅
- `success_stories` ✅
- `news_articles` ✅
- `irrigation_kits` ✅
- `documents` ✅
- `kit_documents` ✅
- `team` ✅

**Why?**: These tables contain:
- Public content
- Read-heavy data
- Infrequently changing data
- No PII

---

## Sync Mechanisms

### Option 1: Manual Sync (Current)
```bash
# Run migration script manually
node migrate-team.js
npx wrangler d1 execute dripstech-products --file=team_migration.sql --remote
```

### Option 2: Webhook-Based Sync (Recommended)
```
Supabase → Database Webhook → Cloudflare Worker → D1
```

**Setup**:
1. Create Supabase Database Webhook
2. Point to Cloudflare Worker endpoint: `/api/sync/:table`
3. Trigger on INSERT, UPDATE, DELETE

### Option 3: Scheduled Sync (Batch)
```
Cloudflare Cron Trigger → Worker → Fetch from Supabase → Update D1
```

**Setup**:
```toml
# wrangler.toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

---

## Environment Configuration

### Frontend (.env)
```bash
# Cloudflare D1 (Public reads)
VITE_USE_D1=true
VITE_WORKER_URL=https://dripstech-api.dripstech.workers.dev

# Supabase (Admin writes + Analytics)
VITE_SUPABASE_URL=https://cnvtnxesywbzwsxwpejw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Worker (wrangler.toml)
```toml
[[d1_databases]]
binding = "DB"
database_name = "dripstech-products"
database_id = "834d06cc-79b2-4586-bd50-047498e7a473"

[vars]
SUPABASE_URL = "https://cnvtnxesywbzwsxwpejw.supabase.co"
SUPABASE_SERVICE_KEY = "your_service_key"  # For sync
```

---

## Code Architecture

### dataService.ts
```typescript
// Public reads: Use D1
if (USE_D1) {
  return fetch(`${WORKER_URL}/api/products`);
}
// Admin reads: Use Supabase
else {
  return supabase.from('products').select('*');
}
```

### Admin Components
```typescript
// Always use Supabase for admin operations
import { supabase } from '@/integrations/supabase/client';

// Create/Update/Delete
await supabase.from('products').insert(newProduct);
// This triggers webhook → syncs to D1
```

### Public Components
```typescript
// Always use dataService (routes to D1)
import { dataService } from '@/services/dataService';

const products = await dataService.getProducts();
// Reads from Cloudflare D1 (fast, cached)
```

---

## Benefits

✅ **Performance**: Public reads from edge-cached D1  
✅ **Reliability**: Supabase as source of truth  
✅ **Security**: Analytics data stays in Supabase  
✅ **Scalability**: Cloudflare handles traffic spikes  
✅ **Cost**: Reduced Supabase read operations  
✅ **Flexibility**: Admin can use full Supabase features  

---

## Migration Status

| Table | Supabase Count | D1 Status | Sync Method |
|-------|---------------|-----------|-------------|
| `team` | 1 | ✅ Synced | Manual |
| `success_stories` | 4 | ⏳ Pending | - |
| `videos` | 10 | ⏳ Pending | - |
| `irrigation_kits` | 6 | ⏳ Pending | - |
| `documents` | 6 | ⏳ Pending | - |
| `visitor_sessions` | N/A | ❌ Supabase Only | - |
| `page_views` | N/A | ❌ Supabase Only | - |
| `product_interactions` | N/A | ❌ Supabase Only | - |

---

## Next Steps

1. ✅ **Complete**: Team data migrated to D1
2. ⏳ **Pending**: Migrate remaining content tables
3. ⏳ **Pending**: Implement webhook sync
4. ⏳ **Pending**: Update admin dashboard to trigger syncs
5. ⏳ **Pending**: Add sync status monitoring

---

## Troubleshooting

### Visitor Tracking Errors
**Issue**: `supabase.from(...).insert is not a function`  
**Solution**: Mock Supabase client now includes `.insert()`, `.update()`, `.delete()`, `.upsert()` methods that fail gracefully.

### Team Page Not Loading
**Issue**: Components using Supabase directly instead of dataService  
**Solution**: Updated `TeamGrid.tsx`, `Team.tsx`, `TeamSection.tsx` to use `dataService.getTeamMembers()`

### Sync Not Working
**Issue**: Data in Supabase but not in D1  
**Solution**: Run manual migration script or set up webhook sync
