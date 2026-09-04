import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Finds real candidate product photos for a given search query.
//
// Spreads load across up to three providers (SerpAPI, Serper, SearchApi.io)
// instead of hammering a single one:
//   - Each call picks a random starting provider among the ones that have a
//     configured key, so usage is distributed roughly evenly over time.
//   - If the chosen provider errors out (quota exhausted, invalid key,
//     upstream failure), the function automatically falls through to the
//     next configured provider before giving up.
//
// All API keys are read server-side only — none of them ever reach the
// browser.
//
// Deploy:  supabase functions deploy product-image-search
// Secrets (configure at least one, ideally all three):
//   supabase secrets set SERPAPI_KEY=your_serpapi_key
//   supabase secrets set SERPER_API_KEY=your_serper_key
//   supabase secrets set SEARCHAPI_KEY=your_searchapi_key

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

type ProviderName = 'serpapi' | 'serper' | 'searchapi'

interface ProviderResult {
  provider: ProviderName
  candidates: CandidateImage[]
}

// --- Per-provider fetchers -------------------------------------------------
// Each throws on failure (bad key, non-2xx response, quota exceeded, etc.)
// so the caller can move on to the next provider in the rotation.

async function searchSerpApi(query: string): Promise<CandidateImage[]> {
  const apiKey = Deno.env.get('SERPAPI_KEY')
  if (!apiKey) throw new Error('SERPAPI_KEY not configured')

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

  return raw
    .filter((r: any) => r.original && r.thumbnail)
    .slice(0, 6)
    .map((r: any) => ({
      thumbnail: r.thumbnail,
      original: r.original,
      title: r.title || query,
      source: r.source || r.original_source_name || '',
    }))
}

async function searchSerper(query: string): Promise<CandidateImage[]> {
  const apiKey = Deno.env.get('SERPER_API_KEY')
  if (!apiKey) throw new Error('SERPER_API_KEY not configured')

  const resp = await fetch('https://google.serper.dev/images', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 8 }),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Serper error (${resp.status}): ${text.slice(0, 300)}`)
  }

  const data = await resp.json()
  const raw = Array.isArray(data.images) ? data.images : []

  return raw
    .filter((r: any) => r.imageUrl && r.thumbnailUrl)
    .slice(0, 6)
    .map((r: any) => ({
      thumbnail: r.thumbnailUrl,
      original: r.imageUrl,
      title: r.title || query,
      source: r.source || r.domain || '',
    }))
}

async function searchSearchApi(query: string): Promise<CandidateImage[]> {
  const apiKey = Deno.env.get('SEARCHAPI_KEY')
  if (!apiKey) throw new Error('SEARCHAPI_KEY not configured')

  const params = new URLSearchParams({
    engine: 'google_images',
    q: query,
    api_key: apiKey,
    num: '8',
  })

  const resp = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`)
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`SearchApi.io error (${resp.status}): ${text.slice(0, 300)}`)
  }

  const data = await resp.json()
  const raw = Array.isArray(data.images) ? data.images : []

  return raw
    .filter((r: any) => (r.original || r.image) && (r.thumbnail || r.thumbnail_url))
    .slice(0, 6)
    .map((r: any) => ({
      thumbnail: r.thumbnail || r.thumbnail_url,
      original: r.original || r.image,
      title: r.title || query,
      source: r.source || r.domain || '',
    }))
}

const PROVIDERS: Record<ProviderName, (query: string) => Promise<CandidateImage[]>> = {
  serpapi: searchSerpApi,
  serper: searchSerper,
  searchapi: searchSearchApi,
}

// Only rotate across providers that actually have a key configured.
function configuredProviders(): ProviderName[] {
  const names: ProviderName[] = ['serpapi', 'serper', 'searchapi']
  return names.filter((name) => {
    if (name === 'serpapi') return !!Deno.env.get('SERPAPI_KEY')
    if (name === 'serper') return !!Deno.env.get('SERPER_API_KEY')
    return !!Deno.env.get('SEARCHAPI_KEY')
  })
}

// Shuffle the provider order per-request (Fisher-Yates) so load is spread
// roughly evenly over time instead of always hitting the same provider first.
function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function searchWithFallback(query: string): Promise<ProviderResult> {
  const available = configuredProviders()
  if (available.length === 0) {
    throw new Error(
      'No image-search provider is configured. Set at least one of SERPAPI_KEY, SERPER_API_KEY, SEARCHAPI_KEY.',
    )
  }

  const order = shuffled(available)
  const errors: string[] = []

  for (const provider of order) {
    try {
      const candidates = await PROVIDERS[provider](query)
      if (candidates.length > 0) {
        return { provider, candidates }
      }
      // Provider responded fine but had nothing useful — try the next one
      // rather than returning an empty result immediately.
    } catch (err: any) {
      errors.push(`${provider}: ${err.message || 'unknown error'}`)
    }
  }

  // Every provider either errored or returned nothing usable.
  if (errors.length > 0) {
    console.error('product-image-search: all providers failed —', errors.join(' | '))
  }
  return { provider: order[order.length - 1], candidates: [] }
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

    const { provider, candidates } = await searchWithFallback(query)

    return new Response(
      JSON.stringify({ query, provider, candidates }),
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
