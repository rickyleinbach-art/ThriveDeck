"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  CARE_PROVIDER_KINDS,
  CARE_PROVIDER_KIND_LABELS,
  careProviderSchema,
  type CareProviderKind,
} from "@/lib/validations/peptide";
import { createCareProvider } from "@/lib/peptides/actions";

export function ProviderForm() {
  const router = useRouter();
  const [kind, setKind] = useState<CareProviderKind>("PROVIDER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = careProviderSchema.safeParse({
      kind,
      name,
      phone: phone || undefined,
      email: email || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entry");
      return;
    }

    setSubmitting(true);
    const result = await createCareProvider(parsed.data);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setName("");
    setPhone("");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cpKind">Type</Label>
          <Select
            id="cpKind"
            value={kind}
            onChange={(e) => setKind(e.target.value as CareProviderKind)}
          >
            {CARE_PROVIDER_KINDS.map((k) => (
              <option key={k} value={k}>
                {CARE_PROVIDER_KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpName">Name</Label>
          <Input
            id="cpName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Rivera / Main St Pharmacy"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cpPhone">Phone (optional)</Label>
          <Input
            id="cpPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cpEmail">Email (optional)</Label>
          <Input
            id="cpEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add contact"}
      </Button>
    </form>
  );
}
