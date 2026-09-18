# Sync Dashboard Features

## Overview

The Admin Sync Dashboard provides a comprehensive interface for managing data synchronization between Supabase and Cloudflare D1.

## Features

### 1. Quick Sync Cards (Priority Tables)
The dashboard displays cards for the most commonly used content tables:
- Products
- Blog Posts
- Videos
- Projects
- Success Stories
- News Articles
- Irrigation Kits
- Documents
- Team

**How to use:**
- Click the sync button on any card to sync that specific table
- Status indicators show success (✓) or error (✗)
- Real-time sync status and record count displayed

### 2. Sync All Tables
A single button to sync all priority tables at once.

**How to use:**
- Click "Sync All Tables" button
- Tables sync sequentially
- Progress shown for each table

### 3. Sync Specific Table (Dropdown)
A dropdown menu containing **ALL** available tables in your Supabase database.

**Available Tables:**
- **Content Tables**: products, blog_posts, videos, projects, success_stories, news_articles, irrigation_kits, documents, team
- **Relationship Tables**: blog_categories, variants, kit_documents
- **System Tables**: system_settings, user_roles
- **Transaction Tables**: mpesa_transactions, customers, quotes, invoices
- **Engagement Tables**: contact_submissions, page_views, visitor_sessions, product_interactions, notifications

**How to use:**
1. Select any table from the dropdown
2. Click the sync button
3. View sync status and results

### 4. Automatic Sync via Webhooks
Instructions and link to configure Supabase webhooks for automatic synchronization.

## Use Cases

### Syncing New Tables
When you create a new table in Supabase (e.g., `mpesa_transactions`):

1. **Create table in D1**:
   ```bash
   npx wrangler d1 execute dripstech-products --command="CREATE TABLE mpesa_transactions (...)" --remote
   ```

2. **Update Worker schema** in `cloudflare-worker/src/index.ts`:
   ```typescript
   const D1_SCHEMA = {
       // ...
       mpesa_transactions: ['id', 'amount', 'phone', 'status', ...]
   };
   ```

3. **Deploy Worker**:
   ```bash
   cd cloudflare-worker && npm run deploy
   ```

4. **Sync from Admin Dashboard**:
   - Go to Admin → Sync Status
   - Select `mpesa_transactions` from dropdown
   - Click sync button

### Syncing After Bulk Updates
If you make bulk updates in Supabase:
1. Go to Admin → Sync Status
2. Click "Sync All Tables" or sync specific affected tables
3. Changes appear on frontend within 5-10 minutes

### Troubleshooting Sync Issues
If data isn't appearing on the frontend:
1. Check sync status in Admin Dashboard
2. Look for error messages on specific table cards
3. Verify D1 schema matches Supabase (see `docs/SCHEMA-COMPARISON.md`)
4. Check browser console for failover warnings

## Status Indicators

- **Ready to sync** - Table has not been synced yet
- **Syncing...** - Sync in progress (spinner animation)
- **Synced X records** - Success (green checkmark)
- **Error message** - Failed (red X)

## Best Practices

### Which Tables to Sync?
✅ **Sync to D1**:
- Public content (products, blog, videos, etc.)
- Read-heavy data
- Data that benefits from edge caching

❌ **Keep in Supabase Only**:
- User authentication data
- Payment transactions (PII)
- Real-time data requiring immediate consistency
- Write-heavy logs

### When to Sync?
- **After content updates**: Sync specific table
- **After schema changes**: Sync affected tables
- **Initial setup**: Sync all tables
- **Regular maintenance**: Use webhooks for automatic sync

## Technical Details

### Sync Process
1. **Fetch**: Retrieve all records from Supabase table
2. **Send**: POST data to Cloudflare Worker endpoint
3. **Upsert**: Worker inserts/updates records in D1
4. **Cache**: D1 data cached at edge for 5 minutes
5. **Serve**: Frontend reads from D1 (with Supabase failover)

### Error Handling
- Schema mismatches are filtered automatically
- Unique constraint violations logged
- Network errors trigger Supabase failover
- All errors displayed in dashboard

### Performance
- **Sync Speed**: Depends on table size (typically 1-5 seconds)
- **Cache Duration**: 5 minutes with stale-while-revalidate
- **Failover**: Automatic fallback to Supabase if D1 fails

## Related Documentation

- **[Hybrid Architecture](./HYBRID-ARCHITECTURE.md)** - System overview
- **[Adding New Tables](./ADDING-NEW-TABLES.md)** - Step-by-step guide
- **[Failover System](./FAILOVER-SYSTEM.md)** - Automatic failover details
- **[Webhook Setup](./SUPABASE-WEBHOOK-SETUP.md)** - Configure automatic sync

## Future Enhancements

Potential improvements:
- [ ] Batch sync with progress bar
- [ ] Schedule automatic syncs
- [ ] Sync history and logs
- [ ] Selective column sync
- [ ] Conflict resolution UI
- [ ] Real-time sync status via WebSockets

---

**Your Sync Dashboard is now fully featured and ready to manage all your data synchronization needs!** 🎉
