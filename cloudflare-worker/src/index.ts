/**
 * DripTech Cloudflare Worker API
 * Provides cached API endpoints for D1 database
 */

export interface Env {
    DB: D1Database;
    ALLOWED_ORIGINS: string;
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Cache durations (in seconds)
// Reduced to 5 minutes for faster updates while maintaining good performance
const CACHE_TIMES = {
    products: 300,       // 5 minutes
    productDetail: 600,  // 10 minutes
    blog: 300,           // 5 minutes
    videos: 300,         // 5 minutes
    projects: 300,       // 5 minutes
    successStories: 300, // 5 minutes
    news: 300,           // 5 minutes
    documents: 300,      // 5 minutes
    kitDocuments: 300,   // 5 minutes
    team: 300,           // 5 minutes
    services: 300,       // 5 minutes
    technicians: 300,    // 5 minutes
    bookings: 60,        // 1 minute (more dynamic)
};

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS Preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        try {
            // Products
            if (path === '/api/products') return handleProducts(env, url, ctx);
            if (path.match(/^\/api\/products\/[\w-]+$/)) {
                const id = path.split('/').pop()!;
                return handleProductById(env, id, ctx);
            }

            // Blog
            if (path === '/api/blog') return handleBlog(env, url, ctx);
            if (path === '/api/blog/search') return handleBlogSearch(env, url, ctx);

            // Special blog endpoints (must come before slug matcher)
            if (path === '/api/blog/categories') return handleBlogCategories(env, ctx);
            if (path === '/api/blog/count') return handleBlogPostCount(env, ctx);

            if (path.match(/^\/api\/blog\/[\w-]+$/)) {
                const slug = path.split('/').pop()!;
                return handleBlogBySlug(env, slug, ctx);
            }

            // Videos
            if (path === '/api/videos') return handleVideos(env, url, ctx);

            // Projects
            if (path === '/api/projects') return handleProjects(env, url, ctx);

            // Success Stories
            if (path === '/api/success-stories') return handleSuccessStories(env, ctx);

            // News
            if (path === '/api/news') return handleNews(env, url, ctx);

            // Irrigation Kits
            if (path === '/api/irrigation-kits') return handleIrrigationKits(env, url, ctx);

            // Documents
            if (path === '/api/documents') return handleDocuments(env, url, ctx);
            if (path === '/api/kit-documents') return handleKitDocuments(env, url, ctx);

            // Team
            if (path === '/api/team') return handleTeam(env, url, ctx);

            // Technician Services
            if (path === '/api/service-categories') return handleServiceCategories(env, url, ctx);
            if (path === '/api/service-packages') return handleServicePackages(env, url, ctx);
            if (path === '/api/technicians') return handleTechnicians(env, url, ctx);
            if (path === '/api/service-bookings') return handleServiceBookings(env, url, ctx);
            if (path === '/api/service-reviews') return handleServiceReviews(env, url, ctx);

            // Sync endpoints (for Phase 3)
            if (request.method === 'POST' && url.pathname.startsWith('/api/sync/')) {
                return await handleSync(request, env, url);
            }

            // AI Analysis endpoint
            if (request.method === 'POST' && path === '/api/ai/analyze-trends') {
                return await handleAIAnalysis(request, env);
            }

            // Webhooks
            if (path === '/api/webhooks/supabase' && request.method === 'POST') {
                return handleSupabaseWebhook(request, env);
            }

            // Health check
            if (url.pathname === '/api/health') {
                return jsonResponse({ status: 'healthy', timestamp: new Date().toISOString() });
            }

            return jsonResponse({ error: 'Not Found' }, 404);
        } catch (error: any) {
            console.error('Worker error:', error);
            return jsonResponse({ error: error.message || 'Internal Server Error' }, 500);
        }
    },
};

// ============================================
// PRODUCTS HANDLERS
// ============================================

// ============================================
// PRODUCTS HANDLERS
// ============================================

async function handleProducts(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const category = url.searchParams.get('category');
    const subcategory = url.searchParams.get('subcategory');
    const featured = url.searchParams.get('featured');
    const inStock = url.searchParams.get('in_stock');
    const search = url.searchParams.get('search');
    const minPrice = parseFloat(url.searchParams.get('min_price') || '0');
    const maxPrice = parseFloat(url.searchParams.get('max_price') || '0');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '0');
    const offset = (page - 1) * (limit || 12);

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
    }

    if (subcategory) {
        query += ' AND subcategory = ?';
        params.push(subcategory);
    }

    if (featured === 'true') {
        query += ' AND (featured = 1 OR is_featured = 1)';
    }

    if (inStock === 'true') {
        query += ' AND in_stock = 1';
    }

    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR model_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (minPrice > 0) {
        query += ' AND price >= ?';
        params.push(minPrice);
    }

    if (maxPrice > 0) {
        query += ' AND price <= ?';
        params.push(maxPrice);
    }

    // Sorting
    switch (sortBy) {
        case 'price':
            query += ` ORDER BY price ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
            break;
        case 'name':
            query += ` ORDER BY name ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
            break;
        default:
            query += ' ORDER BY created_at DESC';
    }

    // Pagination
    if (limit > 0) {
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Parse JSON fields
    const products = results.map(parseProductJson);

    return cachedJsonResponse(products, CACHE_TIMES.products, ctx);
}

async function handleProductById(env: Env, id: string, ctx: ExecutionContext): Promise<Response> {
    const { results } = await env.DB.prepare(
        'SELECT * FROM products WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
        return jsonResponse({ error: 'Product not found' }, 404);
    }

    const product = parseProductJson(results[0]);
    return cachedJsonResponse(product, CACHE_TIMES.productDetail, ctx);
}

// ============================================
// BLOG HANDLERS
// ============================================

async function handleBlog(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = 'SELECT * FROM blog_posts WHERE published = 1';
    const params: any[] = [];

    if (category) {
        query += ' AND category_id = ?';
        params.push(category);
    }

    query += ' ORDER BY published_at DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const posts = results.map(parseBlogJson);

    return cachedJsonResponse(posts, CACHE_TIMES.blog, ctx);
}

async function handleBlogSearch(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const searchTerm = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    const sortBy = url.searchParams.get('sortBy') || 'newest';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '9');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE published = 1';
    const params: any[] = [];

    if (searchTerm) {
        whereClause += ' AND (title LIKE ? OR content LIKE ?)';
        params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (category && category !== 'all') {
        whereClause += ' AND category_id IN (SELECT id FROM blog_categories WHERE slug = ?)';
        params.push(category);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM blog_posts ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const totalCount = countResult?.total || 0;

    // Fetch posts with categories
    let query = `
        SELECT blog_posts.*, blog_categories.name as category_name, blog_categories.slug as category_slug
        FROM blog_posts
        LEFT JOIN blog_categories ON blog_posts.category_id = blog_categories.id
        ${whereClause}
    `;

    switch (sortBy) {
        case 'newest':
            query += ' ORDER BY blog_posts.published_at DESC';
            break;
        case 'oldest':
            query += ' ORDER BY blog_posts.published_at ASC';
            break;
        case 'popular':
            query += ' ORDER BY blog_posts.views DESC';
            break;
        case 'alphabetical':
            query += ' ORDER BY blog_posts.title ASC';
            break;
        default:
            query += ' ORDER BY blog_posts.published_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const posts = results.map(parseBlogJson);

    return jsonResponse({
        data: posts,
        pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
        },
    });
}

async function handleBlogBySlug(env: Env, slug: string, ctx: ExecutionContext): Promise<Response> {
    const { results } = await env.DB.prepare(`
        SELECT blog_posts.*, blog_categories.name as category_name, blog_categories.slug as category_slug
        FROM blog_posts
        LEFT JOIN blog_categories ON blog_posts.category_id = blog_categories.id
        WHERE blog_posts.slug = ? AND blog_posts.published = 1
    `).bind(slug).all();

    if (results.length === 0) {
        return jsonResponse({ error: 'Blog post not found' }, 404);
    }

    const row: any = results[0];
    const post = parseBlogJson(row);
    post.blog_categories = {
        name: row.category_name,
        slug: row.category_slug
    };

    return cachedJsonResponse(post, CACHE_TIMES.blog, ctx);
}

// ============================================
// VIDEOS HANDLERS
// ============================================

async function handleVideos(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sort_by') || 'newest';
    const limit = parseInt(url.searchParams.get('limit') || '0');

    let query = 'SELECT * FROM videos WHERE published = 1';
    const params: any[] = [];

    if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
    }

    if (featured === 'true') {
        query += ' AND featured = 1';
    }

    if (search) {
        query += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    switch (sortBy) {
        case 'newest':
            query += ' ORDER BY created_at DESC';
            break;
        case 'oldest':
            query += ' ORDER BY created_at ASC';
            break;
        case 'most-viewed':
            query += ' ORDER BY views DESC';
            break;
        case 'least-viewed':
            query += ' ORDER BY views ASC';
            break;
        case 'featured':
            query += ' ORDER BY featured DESC, created_at DESC';
            break;
        default:
            query += ' ORDER BY created_at DESC';
    }

    if (limit > 0) {
        query += ' LIMIT ?';
        params.push(limit);
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const videos = results.map(parseVideoJson);

    return cachedJsonResponse(videos, CACHE_TIMES.videos, ctx);
}

// ============================================
// PROJECTS HANDLERS
// ============================================

async function handleProjects(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const featured = url.searchParams.get('featured');

    let query = 'SELECT * FROM projects';
    const params: any[] = [];

    if (featured === 'true') {
        query += ' WHERE featured = 1';
    }

    query += ' ORDER BY completion_date DESC, created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const projects = results.map(parseProjectJson);

    return cachedJsonResponse(projects, CACHE_TIMES.projects, ctx);
}

// ============================================
// SUCCESS STORIES HANDLERS
// ============================================

async function handleSuccessStories(env: Env, ctx: ExecutionContext): Promise<Response> {
    const { results } = await env.DB.prepare(
        'SELECT * FROM success_stories ORDER BY created_at DESC'
    ).all();

    return cachedJsonResponse(results, CACHE_TIMES.successStories, ctx);
}

// ============================================
// NEWS HANDLERS
// ============================================

async function handleNews(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const { results } = await env.DB.prepare(
        'SELECT * FROM news_articles WHERE published = 1 ORDER BY published_at DESC, created_at DESC LIMIT ?'
    ).bind(limit).all();

    const articles = results.map(parseNewsJson);
    return cachedJsonResponse(articles, CACHE_TIMES.news, ctx);
}

// ============================================
// IRRIGATION KITS HANDLERS
// ============================================

async function handleIrrigationKits(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');
    const search = url.searchParams.get('search');
    const kitType = url.searchParams.get('kit_type');
    const complexity = url.searchParams.get('complexity');
    const minPrice = parseFloat(url.searchParams.get('min_price') || '0');
    const maxPrice = parseFloat(url.searchParams.get('max_price') || '0');
    const sortBy = url.searchParams.get('sort_by') || 'featured';
    const limit = parseInt(url.searchParams.get('limit') || '0');

    let query = 'SELECT * FROM irrigation_kits WHERE active = 1';
    const params: any[] = [];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (featured === 'true') {
        query += ' AND featured = 1';
    }

    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ? OR recommended_crops LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (kitType && kitType !== 'all') {
        query += ' AND kit_type = ?';
        params.push(kitType);
    }

    if (complexity && complexity !== 'all') {
        query += ' AND installation_complexity = ?';
        params.push(complexity);
    }

    if (minPrice > 0) {
        query += ' AND price >= ?';
        params.push(minPrice);
    }

    if (maxPrice > 0) {
        query += ' AND price <= ?';
        params.push(maxPrice);
    }

    switch (sortBy) {
        case 'price_low':
            query += ' ORDER BY price ASC';
            break;
        case 'price_high':
            query += ' ORDER BY price DESC';
            break;
        case 'coverage_area':
            query += ' ORDER BY coverage_area DESC';
            break;
        case 'efficiency':
            query += ' ORDER BY water_efficiency_percentage DESC';
            break;
        case 'newest':
            query += ' ORDER BY created_at DESC';
            break;
        default:
            query += ' ORDER BY featured DESC, created_at DESC';
    }

    if (limit > 0) {
        query += ' LIMIT ?';
        params.push(limit);
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const kits = results.map(parseIrrigationKitJson);

    return cachedJsonResponse(kits, CACHE_TIMES.products, ctx);
}

// ============================================
// TEAM HANDLERS
// ============================================

async function handleTeam(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const featured = url.searchParams.get('featured');

    let query = 'SELECT * FROM team';
    const params: any[] = [];

    if (featured === 'true') {
        query += ' WHERE featured = 1';
    }

    query += ' ORDER BY created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const team = results.map(parseTeamJson);

    // Cache for 1 hour
    return cachedJsonResponse(team, 3600, ctx);
}

// ============================================
// SYNC HANDLER (Phase 3)
// ============================================

async function handleSync(request: Request, env: Env, url: URL): Promise<Response> {
    const table = url.pathname.split('/').pop();
    const data = await request.json() as any[];

    const syncedTables = [
        'products', 'blog_posts', 'videos', 'projects',
        'success_stories', 'news_articles', 'irrigation_kits',
        'documents', 'team'
    ];

    if (!syncedTables.includes(table!)) {
        return jsonResponse({ error: 'Invalid table' }, 400);
    }

    try {
        for (const record of data) {
            await upsertRecord(env, table!, record);
        }

        return jsonResponse({ success: true, synced: data.length });
    } catch (error: any) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// ============================================
// AI ANALYSIS HANDLER
// ============================================

async function handleAIAnalysis(request: Request, env: Env): Promise<Response> {
    try {
        // 1. Get Gemini API key from Supabase
        const supabaseUrl = 'https://cnvtnxesywbzwsxwpejw.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudnRueGVzeXdiendzeHdwZWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDc5MTQsImV4cCI6MjA2Nzk4MzkxNH0.2N0Ou0PypE0U773zX0864G4Z27-lpmyZQJ6G31F1_Es';

        const settingsResponse = await fetch(
            `${supabaseUrl}/rest/v1/system_settings?setting_key=eq.gemini_api_key&select=setting_value`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            }
        );

        if (!settingsResponse.ok) {
            console.error('Failed to fetch settings:', await settingsResponse.text());
            return jsonResponse({ error: 'Failed to fetch API key from settings' }, 500);
        }

        const settings = await settingsResponse.json();
        console.log('Settings response:', settings);

        const geminiApiKey = settings[0]?.setting_value;

        if (!geminiApiKey) {
            console.error('No API key found. Settings:', settings);
            return jsonResponse({
                error: 'Gemini API key not configured. Please add it in Admin → Settings → API Keys',
                debug: { settingsCount: settings.length }
            }, 400);
        }

        // 2. Get top search queries from last 30 days
        const searchResponse = await fetch(
            `${supabaseUrl}/rest/v1/search_queries?select=query,category&created_at=gte.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            }
        );

        const searches = await searchResponse.json();

        // Aggregate search queries
        const queryMap = new Map<string, { count: number; categories: Set<string> }>();
        searches.forEach((s: any) => {
            const existing = queryMap.get(s.query) || { count: 0, categories: new Set() };
            existing.count++;
            if (s.category) existing.categories.add(s.category);
            queryMap.set(s.query, existing);
        });

        const topQueries = Array.from(queryMap.entries())
            .map(([query, data]) => ({ query, count: data.count, categories: Array.from(data.categories) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        if (topQueries.length === 0) {
            return jsonResponse({ error: 'No search data available yet' }, 400);
        }

        // 3. Call Gemini API to analyze trends
        const prompt = `You are an irrigation equipment expert. Analyze these search queries from a Kenyan irrigation website:

${JSON.stringify(topQueries, null, 2)}

Based on these searches, generate 15 product suggestions that would satisfy user demand. For each product, provide:

{
  "suggestions": [
    {
      "name": "Professional product name",
      "category": "drip_irrigation | sprinkler_systems | filtration_systems | control_systems | accessories",
      "description": "2-3 paragraphs describing the product, its benefits, and applications",
      "price_range": "KSH X,XXX - X,XXX",
      "estimated_price": XXXX,
      "target_crops": ["Tomatoes", "Peppers", "etc"],
      "technical_specs": {
        "material": "LDPE/PVC/etc",
        "size": "16mm/etc",
        "flow_rate": "2.0 L/hr/etc"
      },
      "features": ["Feature 1", "Feature 2", "etc"],
      "applications": ["Greenhouse", "Open field", "etc"],
      "search_volume": <count from queries>
    }
  ]
}

Make products realistic, market-accurate, and aligned with Kenyan irrigation needs. Output ONLY valid JSON, no markdown.`;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        if (!geminiResponse.ok) {
            const error = await geminiResponse.json();
            throw new Error(error.error?.message || 'Gemini API failed');
        }

        const geminiData = await geminiResponse.json();
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('No content generated from Gemini');
        }

        // 4. Parse JSON response
        const cleanJson = generatedText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // 5. Save suggestions to Supabase
        const suggestions = parsed.suggestions || [];

        for (const suggestion of suggestions) {
            await fetch(
                `${supabaseUrl}/rest/v1/ai_product_suggestions`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        name: suggestion.name,
                        category: suggestion.category,
                        description: suggestion.description,
                        price_range: suggestion.price_range,
                        estimated_price: suggestion.estimated_price,
                        target_crops: suggestion.target_crops,
                        technical_specs: suggestion.technical_specs,
                        features: suggestion.features,
                        applications: suggestion.applications,
                        search_volume: suggestion.search_volume || 0,
                        status: 'pending'
                    })
                }
            );
        }

        return jsonResponse({
            success: true,
            suggestions: suggestions,
            analyzed_queries: topQueries.length
        });

    } catch (error: any) {
        console.error('AI Analysis error:', error);
        return jsonResponse({ error: error.message || 'Analysis failed' }, 500);
    }
}

async function handleSupabaseWebhook(request: Request, env: Env): Promise<Response> {
    try {
        const payload = await request.json() as any;
        const { type, table, record, old_record } = payload;

        const syncedTables = [
            'products', 'blog_posts', 'videos', 'projects',
            'success_stories', 'news_articles', 'irrigation_kits',
            'documents', 'team'
        ];

        if (!syncedTables.includes(table)) {
            return jsonResponse({ message: `Table ${table} not synced` }, 200);
        }

        console.log(`Webhook received: ${type} on ${table}`);

        if (type === 'INSERT' || type === 'UPDATE') {
            await upsertRecord(env, table, record);
        } else if (type === 'DELETE') {
            await deleteRecord(env, table, old_record.id);
        }

        return jsonResponse({ success: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

// D1 Schema - defines which columns exist in each D1 table
const D1_SCHEMA: Record<string, string[]> = {
    products: ['id', 'name', 'description', 'price', 'category', 'subcategory', 'images', 'technical_specs', 'features', 'applications', 'specifications', 'variants', 'in_stock', 'featured', 'is_featured', 'model_number', 'brochure_url', 'installation_guide_url', 'maintenance_manual_url', 'video_url', 'created_at', 'updated_at'],
    blog_posts: ['id', 'title', 'slug', 'content', 'excerpt', 'author_id', 'category_id', 'tags', 'featured_image', 'featured_image_url', 'likes', 'published', 'published_at', 'views', 'created_at', 'updated_at'],
    videos: ['id', 'title', 'description', 'video_url', 'thumbnail_url', 'category', 'tags', 'file_size', 'published', 'featured', 'views', 'duration', 'created_at', 'updated_at'],
    projects: ['id', 'name', 'location', 'completion_date', 'deadline', 'project_type', 'area_covered', 'water_saved', 'before_images', 'after_images', 'project_images', 'featured', 'created_at', 'updated_at', 'testimonial', 'status', 'start_date', 'yield_improvement', 'customer_id', 'quote_id'],
    success_stories: ['id', 'title', 'description', 'client_name', 'client_company', 'image_url', 'before_image', 'after_image', 'results', 'featured', 'created_at', 'updated_at'],
    news_articles: ['id', 'title', 'slug', 'content', 'excerpt', 'featured_image', 'featured_image_url', 'category', 'tags', 'author', 'published', 'published_at', 'views', 'likes', 'comments_count', 'reading_time', 'created_at', 'updated_at'],
    irrigation_kits: ['id', 'name', 'description', 'category', 'coverage_area', 'target_area', 'target_crop', 'components', 'price', 'in_stock', 'featured', 'maintenance_level', 'created_at', 'updated_at', 'active', 'images', 'installation_complexity', 'installation_time_hours', 'kit_type', 'recommended_crops', 'warranty_months', 'water_efficiency_percentage'],
    documents: ['id', 'title', 'description', 'file_url', 'file_type', 'file_size', 'category', 'tags', 'download_count', 'requires_login', 'created_at', 'updated_at'],
    team: ['id', 'name', 'position', 'bio', 'image_url', 'linkedin_url', 'email', 'phone', 'featured', 'created_at', 'updated_at']
};

async function upsertRecord(env: Env, table: string, record: any): Promise<void> {
    // Get allowed columns for this table
    const allowedColumns = D1_SCHEMA[table];
    if (!allowedColumns) {
        throw new Error(`Unknown table: ${table}`);
    }

    // Filter record to only include columns that exist in D1
    const filteredRecord: Record<string, any> = {};
    for (const col of allowedColumns) {
        if (col in record) {
            filteredRecord[col] = record[col];
        }
    }

    const columns = Object.keys(filteredRecord);
    if (columns.length === 0) {
        console.warn(`No valid columns to sync for table ${table}`);
        return;
    }

    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(filteredRecord);

    const processedValues = values.map(v => {
        if (v && typeof v === 'object') return JSON.stringify(v);
        if (typeof v === 'boolean') return v ? 1 : 0;
        return v;
    });

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
                 ON CONFLICT(id) DO UPDATE SET ${columns.map(c => `${c}=excluded.${c}`).join(', ')}`;

    await env.DB.prepare(sql).bind(...processedValues).run();
}

async function deleteRecord(env: Env, table: string, id: string): Promise<void> {
    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
}

// ============================================
// JSON PARSERS
// ============================================

function parseProductJson(row: any): any {
    return {
        ...row,
        images: tryParseJson(row.images, []),
        technical_specs: tryParseJson(row.technical_specs, {}),
        features: tryParseJson(row.features, []),
        applications: tryParseJson(row.applications, []),
        specifications: tryParseJson(row.specifications, {}),
        variants: tryParseJson(row.variants, []),
        in_stock: Boolean(row.in_stock),
        featured: Boolean(row.featured || row.is_featured),
    };
}

function parseBlogJson(row: any): any {
    const parsed: any = {
        ...row,
        tags: tryParseJson(row.tags, []),
        published: Boolean(row.published),
    };

    // If we have category data from a join, create the blog_categories object
    if (row.category_name || row.category_slug) {
        parsed.blog_categories = {
            name: row.category_name,
            slug: row.category_slug,
        };
    }

    return parsed;
}

function parseVideoJson(row: any): any {
    return {
        ...row,
        tags: tryParseJson(row.tags, []),
        published: Boolean(row.published),
        featured: Boolean(row.featured),
    };
}

function parseProjectJson(row: any): any {
    return {
        ...row,
        before_images: tryParseJson(row.before_images, []),
        after_images: tryParseJson(row.after_images, []),
        project_images: tryParseJson(row.project_images, []),
        featured: Boolean(row.featured),
    };
}

function parseNewsJson(row: any): any {
    return {
        ...row,
        tags: tryParseJson(row.tags, []),
        published: Boolean(row.published),
    };
}

function parseIrrigationKitJson(row: any): any {
    return {
        ...row,
        components: tryParseJson(row.components, {}),
        images: tryParseJson(row.images, []),
        recommended_crops: tryParseJson(row.recommended_crops, []),
        in_stock: Boolean(row.in_stock),
        featured: Boolean(row.featured),
        active: Boolean(row.active),
    };
}

function parseTeamJson(row: any): any {
    return {
        ...row,
        featured: Boolean(row.featured),
    };
}

function tryParseJson(value: any, defaultValue: any): any {
    if (!value) return defaultValue;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return defaultValue;
    }
}

// ============================================
// RESPONSE HELPERS
// ============================================

function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    });
}

function cachedJsonResponse(data: any, cacheTime: number, ctx: ExecutionContext): Response {
    return new Response(JSON.stringify(data), {
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            // Cache for cacheTime, but allow serving stale content while revalidating
            'Cache-Control': `public, max-age=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`,
            'CDN-Cache-Control': `max-age=${cacheTime}`,
        },
    });
}

async function handleBlogCategories(env: Env, ctx: ExecutionContext): Promise<Response> {
    const { results } = await env.DB.prepare(
        `SELECT * FROM blog_categories ORDER BY name ASC`
    ).all();
    return cachedJsonResponse(results, CACHE_TIMES.blog, ctx);
}

async function handleBlogPostCount(env: Env, ctx: ExecutionContext): Promise<Response> {
    const { results } = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM blog_posts WHERE published = 1`
    ).all();
    return cachedJsonResponse(results[0], CACHE_TIMES.blog, ctx);
}

// ============================================
// TECHNICIAN SERVICES HANDLERS
// ============================================

async function handleServiceCategories(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const active = url.searchParams.get('active');

    let query = 'SELECT * FROM service_categories';
    const params: any[] = [];

    if (active === 'true') {
        query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY display_order ASC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const categories = results.map(parseServiceCategoryJson);

    return cachedJsonResponse(categories, CACHE_TIMES.services, ctx);
}

async function handleServicePackages(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const categoryId = url.searchParams.get('category_id');
    const active = url.searchParams.get('active');

    let query = 'SELECT * FROM service_packages WHERE 1=1';
    const params: any[] = [];

    if (categoryId) {
        query += ' AND service_category_id = ?';
        params.push(categoryId);
    }

    if (active === 'true') {
        query += ' AND is_active = 1';
    }

    query += ' ORDER BY price ASC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const packages = results.map(parseServicePackageJson);

    return cachedJsonResponse(packages, CACHE_TIMES.services, ctx);
}

async function handleTechnicians(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const active = url.searchParams.get('active');
    const specialization = url.searchParams.get('specialization');

    let query = 'SELECT * FROM technicians WHERE 1=1';
    const params: any[] = [];

    if (active === 'true') {
        query += ' AND is_active = 1';
    }

    if (specialization) {
        query += ' AND specializations LIKE ?';
        params.push(`%"${specialization}"%`);
    }

    query += ' ORDER BY rating DESC, total_jobs_completed DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const technicians = results.map(parseTechnicianJson);

    return cachedJsonResponse(technicians, CACHE_TIMES.technicians, ctx);
}

async function handleServiceBookings(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const customerEmail = url.searchParams.get('customer_email');
    const status = url.searchParams.get('status');
    const technicianId = url.searchParams.get('technician_id');

    let query = 'SELECT * FROM service_bookings WHERE 1=1';
    const params: any[] = [];

    if (customerEmail) {
        query += ' AND customer_email = ?';
        params.push(customerEmail);
    }

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (technicianId) {
        query += ' AND assigned_technician_id = ?';
        params.push(technicianId);
    }

    query += ' ORDER BY created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const bookings = results.map(parseServiceBookingJson);

    return cachedJsonResponse(bookings, CACHE_TIMES.bookings, ctx);
}

async function handleServiceReviews(env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
    const technicianId = url.searchParams.get('technician_id');
    const approved = url.searchParams.get('approved');

    let query = 'SELECT * FROM service_reviews WHERE 1=1';
    const params: any[] = [];

    if (technicianId) {
        query += ' AND technician_id = ?';
        params.push(technicianId);
    }

    if (approved === 'true') {
        query += ' AND is_approved = 1';
    }

    query += ' ORDER BY created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const reviews = results.map(parseServiceReviewJson);

    return cachedJsonResponse(reviews, CACHE_TIMES.services, ctx);
}

// ============================================
// SERVICE JSON PARSERS
// ============================================

function parseServiceCategoryJson(row: any): any {
    return {
        ...row,
        features: tryParseJson(row.features, []),
        pricing_details: tryParseJson(row.pricing_details, {}),
        is_active: Boolean(row.is_active),
    };
}

function parseServicePackageJson(row: any): any {
    return {
        ...row,
        included_services: tryParseJson(row.included_services, []),
        is_featured: Boolean(row.is_featured),
        is_active: Boolean(row.is_active),
    };
}

function parseTechnicianJson(row: any): any {
    return {
        ...row,
        specializations: tryParseJson(row.specializations, []),
        certifications: tryParseJson(row.certifications, []),
        service_areas: tryParseJson(row.service_areas, []),
        availability_schedule: tryParseJson(row.availability_schedule, {}),
        is_active: Boolean(row.is_active),
    };
}

function parseServiceBookingJson(row: any): any {
    return {
        ...row,
        location_coordinates: tryParseJson(row.location_coordinates, null),
    };
}

function parseServiceReviewJson(row: any): any {
    return {
        ...row,
        is_approved: Boolean(row.is_approved),
        is_featured: Boolean(row.is_featured),
    };
}
