"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { progressPhotoSchema } from "@/lib/validations/weight";
import { createProgressPhoto } from "@/lib/weight/actions";
import { uploadProgressPhoto } from "@/lib/weight/photo-upload";

function todayLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function PhotoUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [takenAt, setTakenAt] = useState(todayLocal());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose a photo first");
      return;
    }

    const parsed = progressPhotoSchema.safeParse({ takenAt });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the date");
      return;
    }

    setSubmitting(true);
    const uploaded = await uploadProgressPhoto(file);
    if (!uploaded.success) {
      setError(uploaded.error);
      setSubmitting(false);
      return;
    }

    const result = await createProgressPhoto({
      ...parsed.data,
      storagePath: uploaded.storagePath,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="photo">Progress photo</Label>
        <Input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="photoDate">Date taken</Label>
        <Input
          id="photoDate"
          type="date"
          value={takenAt}
          max={todayLocal()}
          onChange={(e) => setTakenAt(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} variant="outline" className="w-full">
        {submitting ? "Uploading…" : "Upload photo"}
      </Button>
    </form>
  );
}
