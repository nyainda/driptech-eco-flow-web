import { supabase } from '@/integrations/supabase/client';

/**
 * Track user search queries for AI analysis
 */
export async function trackSearch(
    query: string,
    category?: string,
    resultsCount?: number
) {
    try {
        // Get or create session ID
        let sessionId = sessionStorage.getItem('visitor_session_id');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem('visitor_session_id', sessionId);
        }

        await supabase.from('search_queries').insert({
            query: query.toLowerCase().trim(),
            category,
            results_count: resultsCount || 0,
            user_session_id: sessionId
        });
    } catch (error) {
        console.error('Failed to track search:', error);
        // Don't throw - tracking shouldn't break the app
    }
}

/**
 * Get AI product suggestions
 */
export async function getAISuggestions(status?: string) {
    const query = supabase
        .from('ai_product_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

    if (status) {
        query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * Update AI suggestion status
 */
export async function updateSuggestionStatus(
    id: string,
    status: 'approved' | 'rejected' | 'created'
) {
    const { data, error } = await supabase
        .from('ai_product_suggestions')
        .update({
            status,
            updated_at: new Date().toISOString(),
            ...(status === 'approved' && {
                approved_at: new Date().toISOString()
            })
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete AI suggestion
 */
export async function deleteSuggestion(id: string) {
    const { error } = await supabase
        .from('ai_product_suggestions')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Get search analytics
 */
export async function getSearchAnalytics(days: number = 30) {
    const { data, error } = await supabase
        .from('search_queries')
        .select('query, category')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Aggregate by query
    const analytics = data.reduce((acc: any, item) => {
        const key = item.query;
        if (!acc[key]) {
            acc[key] = { query: key, count: 0, categories: new Set() };
        }
        acc[key].count++;
        if (item.category) acc[key].categories.add(item.category);
        return acc;
    }, {});

    return Object.values(analytics)
        .map((item: any) => ({
            ...item,
            categories: Array.from(item.categories)
        }))
        .sort((a: any, b: any) => b.count - a.count);
}
