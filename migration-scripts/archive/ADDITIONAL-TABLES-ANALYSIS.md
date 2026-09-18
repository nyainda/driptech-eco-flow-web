# Additional Tables Analysis for D1 Migration

## Current Status
✅ **7 tables synced to D1:**
- products (45 records)
- blog_posts (13 records)
- videos (9/10 records)
- projects (syncing...)
- success_stories (syncing...)
- news_articles (syncing...)
- irrigation_kits (syncing...)

## Additional Tables Found (31 total)

### 🟢 High Priority - Public Read-Heavy Tables

#### 1. `team` (Team Members)
- **Purpose**: Team member profiles displayed on About page
- **Read Pattern**: Public-facing, rarely changes
- **Recommendation**: ✅ Add to D1
- **Benefit**: Faster team page loads

#### 2. `blog_categories` (Blog Categories)
- **Purpose**: Category list for blog navigation
- **Read Pattern**: Very static, frequently accessed
- **Recommendation**: ✅ Add to D1
- **Benefit**: Faster blog filtering

#### 3. `discount_banners` (Promotions)
- **Purpose**: Active promotional banners
- **Read Pattern**: Displayed on multiple pages
- **Recommendation**: ✅ Add to D1
- **Benefit**: Cached banner delivery

### 🟡 Medium Priority - Consider Adding

#### 4. `kit_documents` (Kit Documentation)
- **Purpose**: PDF/docs for irrigation kits
- **Read Pattern**: Accessed when viewing kit details
- **Recommendation**: ⚠️ Optional
- **Benefit**: Faster document links

#### 5. `variants` (Product Variants)
- **Purpose**: Product size/color variations
- **Read Pattern**: Loaded with product details
- **Recommendation**: ⚠️ Optional
- **Benefit**: Complete product data in D1

### 🔴 Keep in Supabase - Write-Heavy/Admin

**Admin & Auth:**
- admin_users
- user_roles
- system_settings
- notifications

**Business Operations:**
- contact_submissions
- quotes, quote_items
- customers
- invoices, invoice_items
- mpesa_transactions

**Analytics (Real-time):**
- visitor_sessions
- page_views
- product_interactions
- analytics_summary

**Maintenance:**
- customer_kit_installations
- kit_maintenance_logs
- health_checks
- image_uploads
- documents

## Recommendations

### Option A: Conservative (Recommended)
Add only the 3 high-priority tables:
- team
- blog_categories
- discount_banners

**Total D1 tables: 10**

### Option B: Comprehensive
Add all 5 suggested tables:
- team
- blog_categories
- discount_banners
- kit_documents
- variants

**Total D1 tables: 12**

### Option C: Minimal
Skip additional tables, proceed to Phase 4 with current 7 tables.

**Total D1 tables: 7**

## Next Steps

1. **User Decision**: Choose Option A, B, or C
2. **Update Schema**: Add chosen tables to `d1-schema.sql`
3. **Update Worker**: Add endpoints for new tables
4. **Sync Data**: Run sync for new tables
5. **Proceed to Phase 4**: Frontend migration
