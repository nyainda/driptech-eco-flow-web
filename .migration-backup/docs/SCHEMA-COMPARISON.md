# Schema Comparison: Supabase vs Cloudflare D1

## Products Table

### ✅ Supabase Columns (from types.ts)
- id
- name
- description
- price
- category
- subcategory
- model_number
- images (JSON array)
- technical_specs (JSON)
- features (JSON array)
- applications (JSON array)
- specifications (JSON)
- **variants (JSON)** ✅ EXISTS
- brochure_url
- installation_guide_url
- maintenance_manual_url
- video_url
- in_stock (boolean)
- featured (boolean)
- created_at
- updated_at

### ✅ D1 Columns (Current)
- id
- name
- description
- price
- category
- subcategory
- model_number
- images (TEXT/JSON)
- technical_specs (TEXT/JSON)
- features (TEXT/JSON)
- applications (TEXT/JSON)
- specifications (TEXT/JSON)
- **variants (TEXT/JSON)** ✅ ADDED
- brochure_url
- installation_guide_url
- maintenance_manual_url
- video_url
- in_stock (INTEGER 0/1)
- featured (INTEGER 0/1)
- is_featured (INTEGER 0/1)
- stock_quantity (INTEGER)
- created_at (TEXT)
- updated_at (TEXT)

### Status: ✅ COMPLETE
All Supabase columns are now in D1 (variants added)

---

## Blog Posts Table

### ✅ Supabase Columns
- id
- title
- slug
- content
- excerpt
- author_id
- category_id
- tags (array)
- featured_image
- featured_image_url
- **likes (number)** ❌ NOT IN D1
- **reading_time (number)** ❌ NOT IN D1
- **seo_description** ❌ NOT IN D1
- **seo_title** ❌ NOT IN D1
- published (boolean)
- published_at
- views (number)
- created_at
- updated_at

### ✅ D1 Columns (Current)
- id
- title
- slug
- content
- excerpt
- author_id
- category_id
- tags (TEXT/JSON)
- featured_image
- published (INTEGER 0/1)
- published_at
- views (INTEGER)
- created_at (TEXT)
- updated_at (TEXT)

### Status: ⚠️ MISSING COLUMNS
- likes
- reading_time
- seo_description
- seo_title
- featured_image_url

---

## Videos Table

### ✅ Supabase Columns
- id
- title
- description
- video_url
- thumbnail_url
- category
- tags (array)
- **file_size** ❌ NOT IN D1
- published (boolean)
- featured (boolean)
- views (number)
- duration (number)
- created_at
- updated_at

### ✅ D1 Columns (Current)
- id
- title
- description
- video_url
- thumbnail_url
- category
- tags (TEXT/JSON)
- published (INTEGER 0/1)
- featured (INTEGER 0/1)
- views (INTEGER)
- duration (INTEGER)
- created_at (TEXT)
- updated_at (TEXT)

### Status: ⚠️ MISSING COLUMN
- file_size

---

## Projects Table

### ✅ Supabase Columns (Need to check)
- id
- title
- description
- client_name
- location
- completion_date
- **deadline** ❌ NOT IN D1
- project_type
- area_covered
- water_saved
- before_images (JSON array)
- after_images (JSON array)
- project_images (JSON array)
- featured (boolean)
- created_at
- updated_at

### ✅ D1 Columns (Current)
- id
- title
- description
- client_name
- location
- completion_date
- project_type
- area_covered
- water_saved
- before_images (TEXT/JSON)
- after_images (TEXT/JSON)
- project_images (TEXT/JSON)
- featured (INTEGER 0/1)
- created_at (TEXT)
- updated_at (TEXT)

### Status: ⚠️ MISSING COLUMN
- deadline

---

## News Articles Table

### ✅ Supabase Columns (Need to check)
- id
- title
- slug
- content
- excerpt
- **author** ❌ NOT IN D1
- featured_image
- category
- tags (array)
- published (boolean)
- published_at
- views (number)
- created_at
- updated_at

### ✅ D1 Columns (Current)
- id
- title
- slug
- content
- excerpt
- featured_image
- category
- tags (TEXT/JSON)
- published (INTEGER 0/1)
- published_at
- views (INTEGER)
- created_at (TEXT)
- updated_at (TEXT)

### Status: ⚠️ MISSING COLUMN
- author

---

## Irrigation Kits Table

### ✅ Supabase Columns (Need to check)
- id
- name
- description
- category
- coverage_area
- **target_area** ❌ NOT IN D1
- target_crop
- components (JSON)
- price
- in_stock (boolean)
- featured (boolean)
- maintenance_level
- active (boolean)
- images (JSON array)
- installation_complexity
- installation_time_hours
- kit_type
- recommended_crops (JSON array)
- warranty_months
- water_efficiency_percentage
- created_at
- updated_at

### ✅ D1 Columns (Current)
- id
- name
- description
- category
- coverage_area
- target_crop
- components (TEXT/JSON)
- price
- in_stock (INTEGER 0/1)
- featured (INTEGER 0/1)
- maintenance_level
- active (INTEGER 0/1)
- images (TEXT/JSON)
- installation_complexity
- installation_time_hours
- kit_type
- recommended_crops (TEXT/JSON)
- warranty_months
- water_efficiency_percentage
- created_at (TEXT)
- updated_at (TEXT)

### Status: ⚠️ MISSING COLUMN
- target_area

---

## Summary

### ✅ Fully Synced Tables
- **products** - All columns present (variants added)
- **success_stories** - All columns present
- **documents** - All columns present
- **team** - All columns present

### ⚠️ Tables with Missing Columns

| Table | Missing Columns | Impact |
|-------|----------------|--------|
| **blog_posts** | likes, reading_time, seo_description, seo_title, featured_image_url | SEO and engagement features won't sync |
| **videos** | file_size | File size info won't display |
| **projects** | deadline | Project deadlines won't sync |
| **news_articles** | author | Author info won't display |
| **irrigation_kits** | target_area | Target area info won't sync |

### Recommendation

**Option 1: Keep as-is** (Current)
- Core functionality works
- Missing columns are non-critical
- Sync continues to work by filtering them out

**Option 2: Add missing columns** (Recommended for completeness)
- Add all missing columns to D1 schema
- Update D1_SCHEMA in worker
- Re-sync all tables
- Full feature parity with Supabase

---

## Next Steps

If you want to add the missing columns:

1. Update `migration-scripts/d1-schema.sql`
2. Run ALTER TABLE commands on D1
3. Update `D1_SCHEMA` in `cloudflare-worker/src/index.ts`
4. Deploy worker
5. Re-sync affected tables

Let me know if you want me to add all the missing columns!
