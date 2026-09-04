import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Finds real candidate product photos for a given search query via SerpAPI's
// Google Images engine. The SERPAPI_KEY secret never reaches the browser —
// this function is the only thing that calls SerpAPI.
//
// Deploy:   supabase functions deploy product-image-search
// Secret:   supabase secrets set SERPAPI_KEY=your_key_here

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CandidateImage {
  thumbnail: string
  original: string
  title: string
  source: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      throw new Error('A search "query" string is required')
    }

    const apiKey = Deno.env.get('SERPAPI_KEY')
    if (!apiKey) {
      throw new Error('SERPAPI_KEY secret is not configured on this project')
    }

    const params = new URLSearchParams({
      engine: 'google_images',
      q: query,
      api_key: apiKey,
      num: '8',
      safe: 'active',
    })

    const resp = await fetch(`https://serpapi.com/search.json?${params.toString()}`)

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`SerpAPI error (${resp.status}): ${text.slice(0, 300)}`)
    }

    const data = await resp.json()
    const raw = Array.isArray(data.images_results) ? data.images_results : []

    // Only keep results with a usable full-resolution URL, cap at 6 candidates
    const candidates: CandidateImage[] = raw
      .filter((r: any) => r.original && r.thumbnail)
      .slice(0, 6)
      .map((r: any) => ({
        thumbnail: r.thumbnail,
        original: r.original,
        title: r.title || query,
        source: r.source || r.original_source_name || '',
      }))

    return new Response(
      JSON.stringify({ query, candidates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('product-image-search error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
