// Deploy:  supabase functions deploy product-image-rehost
//
// Why this exists: the product/project image picker (ImagePickerDialog.tsx,
// ProjectImagePickerDialog.tsx) used to save a search result's *original*
// URL directly onto the record -- which just adds a new hotlink to
// whatever site Google Images found the photo on (Amazon, Home Depot,
// competitor sites, etc). That's exactly the "images can be blocked at
// any time" problem, and a copyright-exposure problem, at the same time.
//
// This function fetches the image bytes *server-side* (no browser CORS
// restriction applies here, unlike fetching from the browser) and uploads
// them into this project's own Supabase Storage ("images" bucket, same
// bucket and path convention as the manual "Upload Images" button), then
// returns the new, permanently-owned public URL. The picker should call
// this for every image the admin selects, and save the returned URL --
// never the original external one.
//
// This does not solve the underlying licensing question (see the
// dripstech SEO/image plan) -- it only stops the site depending on a
// third party's server. Real product photos or properly licensed/AI
// images are still the actual fix for copyright exposure; this function
// is meant mainly for re-hosting the free-licence/AI category images,
// not as a way to keep using unlicensed retailer photos safely.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB safety cap
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

interface RehostRequest {
  url: string
  // Optional hint used to build a nicer filename, e.g. a product slug.
  // Falls back to a random name if omitted.
  filename_hint?: string
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, filename_hint }: RehostRequest = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'A source image "url" is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'That is not a valid URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return new Response(
        JSON.stringify({ error: 'Only http/https image URLs are supported.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Already hosted on our own storage -- nothing to do, hand it straight back.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (supabaseUrl && url.startsWith(supabaseUrl)) {
      return new Response(
        JSON.stringify({ url, alreadyHosted: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Fetch the image server-side (no CORS restriction applies here) ---
    const imageResponse = await fetch(url, {
      headers: {
        // A number of retailer image CDNs (including some seen in this
        // catalog) reject requests with no User-Agent or Referer.
        'User-Agent': 'Mozilla/5.0 (compatible; DripTechImageRehost/1.0)',
      },
    })

    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Source server returned ${imageResponse.status} for that image.` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const contentType = imageResponse.headers.get('content-type')?.split(';')[0]?.trim() || ''
    const extension = ALLOWED_CONTENT_TYPES[contentType]
    if (!extension) {
      return new Response(
        JSON.stringify({ error: `Unsupported or missing content-type: "${contentType}".` }),
        { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const contentLengthHeader = imageResponse.headers.get('content-length')
    if (contentLengthHeader && Number(contentLengthHeader) > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: `Image is too large (over ${MAX_BYTES / (1024 * 1024)} MB).` }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const bytes = new Uint8Array(await imageResponse.arrayBuffer())
    if (bytes.byteLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: `Image is too large (over ${MAX_BYTES / (1024 * 1024)} MB).` }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Upload into our own storage, same bucket/path convention as the
    //     manual "Upload Images" button in ProductForm.tsx ---
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server is missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const namePart = filename_hint ? slugify(filename_hint) : Math.random().toString(36).slice(2)
    const fileName = `${Date.now()}-${namePart}.${extension}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, bytes, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath)

    return new Response(
      JSON.stringify({ url: urlData.publicUrl, alreadyHosted: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('product-image-rehost error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
