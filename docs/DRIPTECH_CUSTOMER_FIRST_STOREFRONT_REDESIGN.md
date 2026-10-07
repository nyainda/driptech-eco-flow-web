# DripTech Customer-First Storefront Redesign

## Goal
Redesign the customer-facing shopping experience across:
1. Homepage product showcase
2. Product catalogue
3. Product detail pages
4. Irrigation kits catalogue and kit details

Preserve existing product data, routes, SEO, analytics, filtering, WhatsApp flows, documents, variants, and Supabase-backed functionality.

## Visual direction
- Warm cream/stone page canvas.
- Forest green primary action/brand color.
- Harvest gold for featured/attention accents.
- White product surfaces with clear borders.
- No generic ecommerce card shadows.
- Libre Baskerville for major headings.
- IBM Plex Sans for interface/body.
- JetBrains Mono for prices, model numbers, and technical values.
- Moderate radii; avoid excessive pill/rounded-card treatment.
- Large, clean product imagery.
- Generous whitespace and stronger hierarchy.
- Reserve WhatsApp green for WhatsApp actions.

## Homepage
1. Keep the existing site hero.
2. Add a compact trust/capability strip below the hero.
3. Add a featured-product spotlight with large image, product information, price, and clear detail CTA.
4. Add visual "Browse by equipment type" navigation.
5. Add the main product grid with consistent premium cards.
6. Keep category filtering and live counts.
7. Keep load-more and browse-all.
8. Make the complete irrigation-kit promotion visually stronger and farm-oriented.
9. Do not rely on unverified statistics as primary trust content.

## Product card
- Large image area.
- Small category eyebrow.
- Compact stock/featured status.
- Serif product name.
- Two-line maximum description.
- Strong KES price / From KES variant price.
- One clear View product action.
- Keep WhatsApp enquiry accessible without making two equal full-width CTAs compete.
- Border-only surface, no shadow.
- Subtle image scale and border-color hover.
- Preserve analytics and product URLs.

## Product catalogue
- Strong catalogue heading and supporting copy.
- Search field.
- Horizontal category navigation.
- Keep useful filtering/sorting but reduce visual noise.
- Remove dashboard-like visual weight.
- Default to a clean product grid.
- Preserve list/table, favorites, comparison, pagination, stock and featured behavior where useful.
- Make mobile controls easy to use.

## Product detail
- Breadcrumb and category eyebrow.
- Large gallery left; title/model/description/price/stock/variants/WhatsApp right.
- Scannable technical values.
- Below hero: Overview, applications, specifications, features, resources, related products.
- Avoid a generic Card wrapping the entire detail page.
- Preserve documents, video, variants, SEO schema and WhatsApp analytics.

## Irrigation kits
- Hero focused on choosing a kit by farm/plot size.
- Prominent farm-size/package choices.
- Clean kit cards with imagery, coverage, price/from-price, installation complexity and key included components.
- Keep search/filter/sort/table as secondary tools.
- Kit detail should feel like a package product page rather than a dense modal.
- Make Ask on WhatsApp a strong conversion action.
- Preserve documents, pricing tiers, components, coverage, efficiency, warranty and installation information.
- Do not invent claims.

## Responsive behavior
- Mobile-first.
- Product cards remain scannable.
- Category navigation horizontally scrolls.
- Product detail becomes image-first then purchase information.
- Kits remain easy to compare on phones.
- CTAs remain thumb-friendly.

## Engineering constraints
Preserve Supabase/dataService loading, product routes, tracking, WhatsApp tracking, variants, resources, SEO/schema, filters/sorting, loading/error states, accessibility and dark mode.

Do not introduce another design system. Reuse existing DripTech tokens and shared components.

## First implementation targets
- `src/components/Home/ProductsShowcase.tsx`
- `src/components/Home/HomeOfferings.tsx`
- `src/components/Products/ProductCard.tsx`
- `src/pages/Products.tsx`
- `src/components/Products/ProductDetailView.tsx`
- `src/components/Products/ProductRecommendations.tsx`
- `src/pages/IrrigationKits.tsx`
