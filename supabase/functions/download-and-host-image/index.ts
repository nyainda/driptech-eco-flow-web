// Deploy: supabase functions deploy download-and-host-image
//
// Why this exists: the product/project image *search* pickers
// (product-image-search) return candidate photos from the open web
// (Amazon, Home Depot, manufacturer sites, etc.). Saving that raw
// external URL directly into the products/projects table means the
// site is hotlinking someone else's server -- it can go blank the
// moment they add hotlink protection, rename a file, or redesign
// their site, and it's using their photography without hosting or
// permission.
//
// This function downloads the selected image server-side and
// re-uploads it into this project's own "images" storage bucket,
// under products/<timestamp>-<random>.<ext> -- the exact same
// bucket and path convention the manual "Upload Images" button
// already uses (see ProductForm.tsx) -- then returns the new,
// self-hosted public URL. Callers should save *that* URL, never the
// original external one.
//
// This does not solve image *licensing* by itself -- re-hosting a
// copyrighted photo without permission is still using it without
// permission, just more reliably. It only fixes the "can break or
// disappear at any time" problem. Actual licensing/replacement
// (own photos, permitted supplier images, or free-licence stock)
// is a separate, human decision per image.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB safety cap per image

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

function extFromUrlOrType(url: string, contentType: string | null): string {
  const fromType = contentType ? EXT_BY_CONTENT_TYPE[contentType.split(";")[0].trim()] : null
  if (fromType) return fromType
  const match = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)
  const fromUrl = match?.[1]?.toLowerCase()
  if (fromUrl && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromUrl)) {
    return fromUrl === "jpeg" ? "jpg" : fromUrl
  }
  return "jpg" // reasonable default; browsers render it fine even if the sniff is imperfect
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl || typeof imageUrl !== "string") {
      throw new Error("imageUrl is required")
    }

    let parsed: URL
    try {
      parsed = new URL(imageUrl)
    } catch {
      throw new Error("imageUrl is not a valid URL")
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("imageUrl must be http(s)")
    }

    // Fetch the source image. Some sites (Amazon, retailers) reject
    // requests with no user agent / referer, so send a normal-looking one.
    const sourceResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DripTechImageMirror/1.0; +https://www.dripstech.co.ke)",
        Accept: "image/*",
      },
    })

    if (!sourceResponse.ok) {
      throw new Error(
        `Source image responded with ${sourceResponse.status} -- it may already be blocking hotlinks/bots`,
      )
    }

    const contentType = sourceResponse.headers.get("content-type")
    if (contentType && !contentType.startsWith("image/")) {
      throw new Error(`URL did not return an image (content-type: ${contentType})`)
    }

    const bytes = new Uint8Array(await sourceResponse.arrayBuffer())
    if (bytes.byteLength === 0) {
      throw new Error("Downloaded image was empty")
    }
    if (bytes.byteLength > MAX_BYTES) {
      throw new Error(
        `Image is too large (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB, max ${MAX_BYTES / 1024 / 1024} MB)`,
      )
    }

    const ext = extFromUrlOrType(imageUrl, contentType)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const filePath = `products/${fileName}`

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Server is missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY")
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, bytes, {
        contentType: contentType || `image/${ext === "jpg" ? "jpeg" : ext}`,
        cacheControl: "3600",
        upsert: false,
      })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)

    return new Response(
      JSON.stringify({
        hostedUrl: urlData.publicUrl,
        sourceUrl: imageUrl,
        sizeBytes: bytes.byteLength,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("download-and-host-image error:", err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
