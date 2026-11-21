import { supabase } from "@/integrations/supabase/client";

/** Validates, uploads an image to Supabase Storage, and returns its public URL. */
export async function uploadAdminPublicImage(
  file: File,
  prefix: string,
  bucket = "images",
  maxSizeMb = 5,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file (PNG, JPG, WebP).");
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`Image size must be ${maxSizeMb}MB or smaller.`);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}
