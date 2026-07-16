import { createClient } from "@/lib/supabase/client";
import { validatePhotoFile } from "@/lib/validations/weight";

const BUCKET = "progress-photos";

// Uploads directly from the browser so the file never passes through a
// server action body. Storage RLS requires the path to start with the
// uploader's own user id (see prisma/migrations/0002_weight_loss.sql).
export async function uploadProgressPhoto(file: File): Promise<
  { success: true; storagePath: string } | { success: false; error: string }
> {
  const validationError = validatePhotoFile(file);
  if (validationError) return { success: false, error: validationError };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in" };

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  });

  if (error) return { success: false, error: "Upload failed" };
  return { success: true, storagePath: path };
}
