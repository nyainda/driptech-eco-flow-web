import { supabase } from '@/integrations/supabase/client';

const USE_D1 = import.meta.env.VITE_USE_D1 === 'true';
const WORKER_URL = import.meta.env.VITE_WORKER_URL;
// Deployments that provide the Worker URL should use it even if the legacy
// VITE_USE_D1 flag was not configured. Otherwise a missing Supabase setup can
// silently return the mock client's empty list instead of the live catalogue.
const HAS_D1_BACKEND = USE_D1 || Boolean(WORKER_URL);

/**
 * Helper function to fetch from D1 with automatic fallback to Supabase
 * @param d1Fetcher - Function that fetches from D1
 * @param supabaseFetcher - Function that fetches from Supabase (fallback)
 * @returns Data from D1 or Supabase (if D1 fails)
 */
async function fetchWithFailover<T>(
    d1Fetcher: () => Promise<T>,
    supabaseFetcher: () => Promise<T>
): Promise<T> {
    if (HAS_D1_BACKEND) {
        try {
            return await d1Fetcher();
        } catch (error) {
            console.warn('D1 fetch failed, falling back to Supabase:', error);
            return await supabaseFetcher();
        }
    } else {
        return await supabaseFetcher();
    }
}

/**
 * Data Service Abstraction Layer
 * 
 * Provides a unified interface for fetching data from either Supabase or Cloudflare D1.
 * Features automatic failover: if D1 fails, automatically falls back to Supabase.
 * Toggle between sources using VITE_USE_D1 environment variable.
 */
export const dataService = {
    // ============================================
    // PRODUCTS
    // ============================================

    async getProducts(filters?: {
        category?: string;
        subcategory?: string;
        featured?: boolean;
        inStock?: boolean;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        limit?: number;
        page?: number;
    }) {
        const fetchFromD1 = async () => {
            const params = new URLSearchParams();
            if (filters?.category) params.set('category', filters.category);
            if (filters?.subcategory) params.set('subcategory', filters.subcategory);
            if (filters?.featured) params.set('featured', 'true');
            if (filters?.inStock) params.set('in_stock', 'true');
            if (filters?.search) params.set('search', filters.search);
            if (filters?.minPrice) params.set('min_price', filters.minPrice.toString());
            if (filters?.maxPrice) params.set('max_price', filters.maxPrice.toString());
            if (filters?.sortBy) params.set('sort_by', filters.sortBy);
            if (filters?.sortOrder) params.set('sort_order', filters.sortOrder);
            if (filters?.limit) params.set('limit', filters.limit.toString());
            if (filters?.page) params.set('page', filters.page.toString());

            const response = await fetch(`${WORKER_URL}/api/products?${params}`);
            if (!response.ok) throw new Error('Failed to fetch products from D1');
            return await response.json();
        };

        const fetchFromSupabase = async () => {
            let query = supabase.from('products').select('*');
            if (filters?.category) {
                const categoryMap: Record<string, string> = {
                    drip: "drip_irrigation",
                    sprinklers: "sprinkler_systems",
                    filtration: "filtration_systems",
                    controls: "control_systems",
                    accessories: "accessories",
                    pumps: "pumps_motors",
                    pipes: "pipes_fittings",
                    solar: "solar_irrigation",
                    fertigation: "fertigation_systems",
                    greenhouse: "greenhouse_systems",
                    emitters: "emitters_drippers",
                    valves: "valves_regulators",
                    storage: "water_storage",
                    "rain-guns": "rain_guns",
                    "filters-strainers": "filters_strainers",
                    controllers: "controllers_timers",
                    mulching: "mulching_materials",
                    "greenhouse-accessories": "greenhouse_accessories",
                    "growing-media": "growing_media",
                    seedlings: "seedling_trays_nursery",
                    borehole: "borehole_equipment",
                };
                const dbCategory = categoryMap[filters.category] || filters.category;
                query = query.eq('category', dbCategory);
            }
            if (filters?.subcategory) query = query.eq('subcategory', filters.subcategory);
            if (filters?.featured) query = query.eq('featured', true);
            if (filters?.inStock) query = query.eq('in_stock', true);

            if (filters?.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,model_number.ilike.%${filters.search}%`);
            }

            if (filters?.minPrice) query = query.gte('price', filters.minPrice);
            if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);

            if (filters?.sortBy) {
                const order = filters.sortOrder || 'desc';
                query = query.order(filters.sortBy, { ascending: order === 'asc' });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            if (filters?.limit) {
                const page = filters.page || 1;
                const from = (page - 1) * filters.limit;
                const to = from + filters.limit - 1;
                query = query.range(from, to);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        };

        return await fetchWithFailover(fetchFromD1, fetchFromSupabase);
    },

    async getProductById(id: string) {
        if (USE_D1) {
            const response = await fetch(`${WORKER_URL}/api/products/${id}`);
            if (!response.ok) throw new Error('Product not found in D1');
            return await response.json();
        } else {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        }
    },

    // ============================================
    // BLOG
    // ============================================

    async getBlogPosts(filters?: { category?: string; limit?: number }) {
        if (USE_D1) {
            const params = new URLSearchParams();
            if (filters?.category) params.set('category', filters.category);
            if (filters?.limit) params.set('limit', filters.limit.toString());

            const response = await fetch(`${WORKER_URL}/api/blog?${params}`);
            if (!response.ok) throw new Error('Failed to fetch blog posts from D1');
            return await response.json();
        } else {
            let query = supabase
                .from('blog_posts')
                .select('*, blog_categories(name, slug)')
                .eq('published', true)
                .order('published_at', { ascending: false });

            if (filters?.category) query = query.eq('category_id', filters.category);
            if (filters?.limit) query = query.limit(filters.limit);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    },

    async getBlogBySlug(slug: string) {
        if (USE_D1) {
            const response = await fetch(`${WORKER_URL}/api/blog/${slug}`);
            if (!response.ok) throw new Error('Blog post not found in D1');
            return await response.json();
        } else {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*, blog_categories(name, slug)')
                .eq('slug', slug)
                .eq('published', true)
                .single();
            if (error) throw error;
            return data;
        }
    },



    async getBlogCategories() {
        if (USE_D1) {
            const response = await fetch(`${WORKER_URL}/api/blog/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories from D1');
            return await response.json();
        } else {
            const { data, error } = await supabase
                .from('blog_categories')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        }
    },

    async getBlogPostCount() {
        if (USE_D1) {
            const response = await fetch(`${WORKER_URL}/api/blog/count`);
            if (!response.ok) throw new Error('Failed to fetch blog count from D1');
            const data = await response.json();
            return data.count;
        } else {
            const { count, error } = await supabase
                .from('blog_posts')
                .select('*', { count: 'exact', head: true })
                .eq('published', true);
            if (error) throw error;
            return count || 0;
        }
    },

    // ============================================
    // VIDEOS
    // ============================================

    async getVideos(filters?: {
        category?: string;
        featured?: boolean;
        search?: string;
        sortBy?: string;
        limit?: number;
    }) {
        if (USE_D1) {
            const params = new URLSearchParams();
            if (filters?.category) params.set('category', filters.category);
            if (filters?.featured) params.set('featured', 'true');
            if (filters?.search) params.set('search', filters.search);
            if (filters?.sortBy) params.set('sort_by', filters.sortBy);
            if (filters?.limit) params.set('limit', filters.limit.toString());

            const response = await fetch(`${WORKER_URL}/api/videos?${params}`);
            if (!response.ok) throw new Error('Failed to fetch videos from D1');
            return await response.json();
        } else {
            let query = supabase.from('videos').select('*').eq('published', true);

            if (filters?.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }

            if (filters?.featured) query = query.eq('featured', true);

            if (filters?.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
            }

            switch (filters?.sortBy) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'oldest':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'most-viewed':
                    query = query.order('views', { ascending: false });
                    break;
                case 'least-viewed':
                    query = query.order('views', { ascending: true });
                    break;
                case 'featured':
                    query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }

            if (filters?.limit) query = query.limit(filters.limit);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    },

    // ============================================
    // PROJECTS
    // ============================================

    async getProjects(filters?: { featured?: boolean }) {
        if (USE_D1) {
            const params = new URLSearchParams();
            if (filters?.featured) params.set('featured', 'true');

            const response = await fetch(`${WORKER_URL}/api/projects?${params}`);
            if (!response.ok) throw new Error('Failed to fetch projects from D1');
            return await response.json();
        } else {
            let query = supabase.from('projects').select('*');
            if (filters?.featured) query = query.eq('featured', true);

            const { data, error } = await query.order('completion_date', { ascending: false });
            if (error) throw error;
            return data;
        }
    },

    // ============================================
    // SUCCESS STORIES
    // ============================================

    async getSuccessStories() {
        if (USE_D1) {
            const response = await fetch(`${WORKER_URL}/api/success-stories`);
            if (!response.ok) throw new Error('Failed to fetch success stories from D1');
            return await response.json();
        } else {
            const { data, error } = await supabase
                .from('success_stories')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    },

    // ============================================
    // NEWS ARTICLES
    // ============================================

    async getNewsArticles(limit?: number) {
        if (USE_D1) {
            const params = new URLSearchParams();
            if (limit) params.set('limit', limit.toString());

            const response = await fetch(`${WORKER_URL}/api/news?${params}`);
            if (!response.ok) throw new Error('Failed to fetch news from D1');
            return await response.json();
        } else {
            let query = supabase
                .from('news_articles')
                .select('*')
                .eq('published', true)
                .order('published_at', { ascending: false });

            if (limit) query = query.limit(limit);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    },

    // ============================================
    // IRRIGATION KITS
    // ============================================

    async getBlogPostsPaginated(params: {
        search?: string;
        category?: string;
        sortBy?: string;
        page?: number;
        limit?: number;
    }) {
        const fetchFromD1 = async () => {
            const queryParams = new URLSearchParams();
            if (params.search) queryParams.set('search', params.search);
            if (params.category) queryParams.set('category', params.category);
            if (params.sortBy) queryParams.set('sortBy', params.sortBy);
            if (params.page) queryParams.set('page', params.page.toString());
            if (params.limit) queryParams.set('limit', params.limit.toString());

            const response = await fetch(`${WORKER_URL}/api/blog/search?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch blog posts from D1');
            const json = await response.json();
            return {
                posts: json.data,
                totalCount: json.pagination.total
            };
        };

        const fetchFromSupabase = async () => {
            let query = supabase
                .from('blog_posts')
                .select(
                    `
                    *,
                    blog_categories (
                        name,
                        slug
                    )
                `,
                    { count: 'exact' }
                )
                .eq('published', true);

            if (params.search) {
                query = query.or(
                    `title.ilike.%${params.search}%,content.ilike.%${params.search}%,tags.cs.{${params.search}}`
                );
            }

            if (params.category && params.category !== 'all') {
                query = query.eq('blog_categories.slug', params.category);
            }

            switch (params.sortBy) {
                case 'newest':
                    query = query.order('published_at', { ascending: false });
                    break;
                case 'oldest':
                    query = query.order('published_at', { ascending: true });
                    break;
                case 'popular':
                    query = query.order('views', { ascending: false });
                    break;
                case 'alphabetical':
                    query = query.order('title', { ascending: true });
                    break;
                default:
                    query = query.order('published_at', { ascending: false });
            }

            const page = params.page || 1;
            const limit = params.limit || 9;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;
            return {
                posts: data,
                totalCount: count || 0,
            } as { posts: any[]; totalCount: number };
        };

        return await fetchWithFailover(fetchFromD1, fetchFromSupabase);
    },

    // ============================================
    // IRRIGATION KITS
    // ============================================

    async getIrrigationKits(filters?: {
        category?: string;
        featured?: boolean;
        search?: string;
        kitType?: string;
        complexity?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: string;
        limit?: number;
    }) {
        if (USE_D1) {
            const params = new URLSearchParams();
            if (filters?.category) params.set('category', filters.category);
            if (filters?.featured) params.set('featured', 'true');
            if (filters?.search) params.set('search', filters.search);
            if (filters?.kitType) params.set('kit_type', filters.kitType);
            if (filters?.complexity) params.set('complexity', filters.complexity);
            if (filters?.minPrice) params.set('min_price', filters.minPrice.toString());
            if (filters?.maxPrice) params.set('max_price', filters.maxPrice.toString());
            if (filters?.sortBy) params.set('sort_by', filters.sortBy);
            if (filters?.limit) params.set('limit', filters.limit.toString());

            const response = await fetch(`${WORKER_URL}/api/irrigation-kits?${params}`);
            if (!response.ok) throw new Error('Failed to fetch irrigation kits from D1');
            return await response.json();
        } else {
            let query = supabase.from('irrigation_kits').select('*').eq('active', true);
            if (filters?.category) query = query.eq('category', filters.category);
            if (filters?.featured) query = query.eq('featured', true);

            if (filters?.search) {
                query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,recommended_crops.ilike.%${filters.search}%`);
            }

            if (filters?.kitType && filters.kitType !== 'all') query = query.eq('kit_type', filters.kitType);
            if (filters?.complexity && filters.complexity !== 'all') query = query.eq('installation_complexity', filters.complexity);
            if (filters?.minPrice) query = query.gte('price', filters.minPrice);
            if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);

            switch (filters?.sortBy) {
                case 'price_low':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_high':
                    query = query.order('price', { ascending: false });
                    break;
                case 'coverage_area':
                    query = query.order('coverage_area', { ascending: false });
                    break;
                case 'efficiency':
                    query = query.order('water_efficiency_percentage', { ascending: false });
                    break;
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                default:
                    query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
            }

            if (filters?.limit) query = query.limit(filters.limit);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    },

    // ============================================
    // DOCUMENTS
    // ============================================

    async getDocuments(filters?: { category?: string | string[]; requiresLogin?: boolean; limit?: number }) {
        if (USE_D1) {
            const params = new URLSearchParams();
            if (filters?.category) {
                if (Array.isArray(filters.category)) {
                    filters.category.forEach(cat => params.append('category', cat));
                } else {
                    params.set('category', filters.category);
                }
            }
            if (filters?.requiresLogin !== undefined) params.set('requires_login', filters.requiresLogin.toString());
            if (filters?.limit) params.set('limit', filters.limit.toString());

            const response = await fetch(`${WORKER_URL}/api/documents?${params}`);
            if (!response.ok) throw new Error('Failed to fetch documents from D1');
            return await response.json();
        } else {
            let query = supabase.from('documents').select('*');

            if (filters?.category) {
                if (Array.isArray(filters.category)) {
                    query = query.in('category', filters.category);
                } else {
                    query = query.eq('category', filters.category);
                }
            }

            if (filters?.requiresLogin === false) {
                query = query.eq('requires_login', false);
            }

            query = query.order('created_at', { ascending: false });

            if (filters?.limit) query = query.limit(filters.limit);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    },

    async getKitDocuments(kitId: string) {
        if (USE_D1) {
            const response = await fetch(`${WORKER_URL}/api/kit-documents?kit_id=${kitId}`);
            if (!response.ok) throw new Error('Failed to fetch kit documents from D1');
            return await response.json();
        } else {
            const { data, error } = await supabase
                .from('kit_documents')
                .select('*')
                .eq('kit_id', kitId)
                .order('document_type');
            if (error) throw error;
            return data;
        }
    },

    async getTeamMembers(filters?: { featured?: boolean }) {
        if (USE_D1) {
            const params = new URLSearchParams();
            if (filters?.featured) params.set('featured', 'true');

            const response = await fetch(`${WORKER_URL}/api/team?${params}`);
            if (!response.ok) throw new Error('Failed to fetch team members from D1');
            return await response.json();
        } else {
            let query = supabase.from('team').select('*');
            if (filters?.featured) query = query.eq('featured', true);

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    },

    // ============================================
    // TECHNICIAN SERVICES
    // ============================================

    async getServiceCategories(filters?: { active?: boolean }) {
        const fetchFromD1 = async () => {
            const params = new URLSearchParams();
            if (filters?.active) params.set('active', 'true');

            const response = await fetch(`${WORKER_URL}/api/service-categories?${params}`);
            if (!response.ok) throw new Error('Failed to fetch service categories from D1');
            return await response.json();
        };

        const fetchFromSupabase = async () => {
            let query = supabase.from('service_categories').select('*').order('display_order');
            if (filters?.active) query = query.eq('is_active', true);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        };

        return await fetchWithFailover(fetchFromD1, fetchFromSupabase);
    },

    async getServicePackages(filters?: { categoryId?: string; active?: boolean }) {
        const fetchFromD1 = async () => {
            const params = new URLSearchParams();
            if (filters?.categoryId) params.set('category_id', filters.categoryId);
            if (filters?.active) params.set('active', 'true');

            const response = await fetch(`${WORKER_URL}/api/service-packages?${params}`);
            if (!response.ok) throw new Error('Failed to fetch service packages from D1');
            return await response.json();
        };

        const fetchFromSupabase = async () => {
            let query = supabase.from('service_packages').select('*, service_categories(name, slug)');
            if (filters?.categoryId) query = query.eq('service_category_id', filters.categoryId);
            if (filters?.active) query = query.eq('is_active', true);

            const { data, error } = await query.order('price');
            if (error) throw error;
            return data;
        };

        return await fetchWithFailover(fetchFromD1, fetchFromSupabase);
    },

    async getTechnicians(filters?: { active?: boolean; specialization?: string }) {
        const fetchFromD1 = async () => {
            const params = new URLSearchParams();
            if (filters?.active) params.set('active', 'true');
            if (filters?.specialization) params.set('specialization', filters.specialization);

            const response = await fetch(`${WORKER_URL}/api/technicians?${params}`);
            if (!response.ok) throw new Error('Failed to fetch technicians from D1');
            return await response.json();
        };

        const fetchFromSupabase = async () => {
            let query = supabase.from('technicians').select('*').order('rating', { ascending: false });
            if (filters?.active) query = query.eq('is_active', true);
            if (filters?.specialization) {
                query = query.contains('specializations', [filters.specialization]);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        };

        return await fetchWithFailover(fetchFromD1, fetchFromSupabase);
    },

    async createServiceBooking(bookingData: {
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        service_category_id: string;
        service_type: string;
        service_description?: string;
        location_address: string;
        farm_name?: string;
        farm_size_acres?: number;
        preferred_date?: string;
        preferred_time_slot?: string;
        special_requirements?: string;
        priority?: string;
    }) {
        // Always use Supabase for creating bookings (write operations)
        const { data, error } = await supabase
            .from('service_bookings')
            .insert([bookingData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getServiceBookings(filters?: {
        customerEmail?: string;
        status?: string;
        technicianId?: string;
    }) {
        const fetchFromD1 = async () => {
            const params = new URLSearchParams();
            if (filters?.customerEmail) params.set('customer_email', filters.customerEmail);
            if (filters?.status) params.set('status', filters.status);
            if (filters?.technicianId) params.set('technician_id', filters.technicianId);

            const response = await fetch(`${WORKER_URL}/api/service-bookings?${params}`);
            if (!response.ok) throw new Error('Failed to fetch service bookings from D1');
            return await response.json();
        };

        const fetchFromSupabase = async () => {
            let query = supabase
                .from('service_bookings')
                .select(`
                    *,
                    service_categories(name, slug),
                    technicians(full_name, phone, profile_image_url)
                `)
                .order('created_at', { ascending: false });

            if (filters?.customerEmail) query = query.eq('customer_email', filters.customerEmail);
            if (filters?.status) query = query.eq('status', filters.status);
            if (filters?.technicianId) query = query.eq('assigned_technician_id', filters.technicianId);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        };

        return await fetchWithFailover(fetchFromD1, fetchFromSupabase);
    },

    async getServiceReviews(filters?: { technicianId?: string; approved?: boolean }) {
        const fetchFromD1 = async () => {
            const params = new URLSearchParams();
            if (filters?.technicianId) params.set('technician_id', filters.technicianId);
            if (filters?.approved) params.set('approved', 'true');

            const response = await fetch(`${WORKER_URL}/api/service-reviews?${params}`);
            if (!response.ok) throw new Error('Failed to fetch service reviews from D1');
            return await response.json();
        };

        const fetchFromSupabase = async () => {
            let query = supabase
                .from('service_reviews')
                .select('*, technicians(full_name)')
                .order('created_at', { ascending: false });

            if (filters?.technicianId) query = query.eq('technician_id', filters.technicianId);
            if (filters?.approved) query = query.eq('is_approved', true);

            const { data, error } = await query;
            if (error) throw error;
            return data;
        };

        return await fetchWithFailover(fetchFromD1, fetchFromSupabase);
    },



    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check if D1 is currently enabled
     */
    isD1Enabled(): boolean {
        return USE_D1;
    },

    /**
     * Get the current data source name
     */
    getDataSource(): string {
        return USE_D1 ? 'Cloudflare D1' : 'Supabase';
    },
};
