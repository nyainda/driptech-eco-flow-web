# Batch 2-4 Migration Summary

## Components to Migrate (13 files)

### Batch 2: Home Page Components (4 files)
1. `src/components/Home/ProductsShowcase.tsx` - Featured products
2. `src/components/Home/BlogSection.tsx` - Blog section
3. `src/components/Home/BlogList.tsx` - Blog list
4. `src/components/Home/VideoSection.tsx` - Video section

### Batch 3: Blog & Services Pages (3 files)
5. `src/components/Home/BlogPostPage.tsx` - Individual blog post
6. `src/components/Home/BlogPage.tsx` - Blog listing
7. `src/components/Home/ServicesSection.tsx` - Services/kits section

### Batch 4: Main Pages (6 files)
8. `src/pages/Products.tsx` - Main products page
9. `src/pages/ProductCatalog.tsx` - Product catalog
10. `src/pages/VideosPage.tsx` - Videos page
11. `src/pages/InstallationGuides.tsx` - Installation guides
12. `src/pages/TechnicalSupport.tsx` - Technical support
13. `src/pages/IrrigationKits.tsx` - Irrigation kits page

---

## Migration Pattern

For each file, replace:

```typescript
// OLD
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('TABLE_NAME')
  .select('*')
  .eq('some_field', value);

if (error) throw error;
```

With:

```typescript
// NEW
import { dataService } from '@/services/dataService';

const data = await dataService.getMethodName(filters);
```

---

## Available dataService Methods

```typescript
// Products
dataService.getProducts({ category?, featured? })
dataService.getProductById(id)

// Blog
dataService.getBlogPosts({ category?, limit? })
dataService.getBlogBySlug(slug)

// Videos
dataService.getVideos({ category?, featured? })

// Projects
dataService.getProjects({ featured? })

// Success Stories
dataService.getSuccessStories()

// News
dataService.getNewsArticles(limit?)

// Irrigation Kits
dataService.getIrrigationKits({ category?, featured? })
```

---

## Testing Checklist

After migration, test with:

### VITE_USE_D1=false (Supabase - Baseline)
- [ ] All pages load
- [ ] No console errors
- [ ] Data displays correctly

### VITE_USE_D1=true (D1 - New)
- [ ] All pages load
- [ ] No console errors
- [ ] Data displays correctly
- [ ] Network tab shows Worker API calls
- [ ] Performance is same or better

---

## Quick Migration Guide

Since files are large (1000+ lines), I recommend:

**Option 1: Manual Find/Replace** (Safest)
1. Open each file
2. Find: `import { supabase }`
3. Replace: `import { dataService }`
4. Find each `.from('table_name')` query
5. Replace with appropriate `dataService.getMethod()`

**Option 2: Let me migrate** (Faster)
I can update all 13 files automatically, but you should:
1. Commit current code first (git safety)
2. Review changes after
3. Test thoroughly

**Which option do you prefer?**
