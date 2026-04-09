"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Sponsor } from "@/db/schema";

interface SponsorFormProps {
  sponsor?: Sponsor;
}

export function SponsorForm({ sponsor }: SponsorFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));

    // Parse tags
    const tagsRaw = (data.tags as string).trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const body = {
      companyName: data.companyName,
      contactName: data.contactName || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      url: data.url || undefined,
      targetCustomerRevenue: data.targetCustomerRevenue || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      notes: data.notes || undefined,
      tags,
    };

    const url = sponsor ? `/api/sponsors/${sponsor.id}` : "/api/sponsors";
    const method = sponsor ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json();
      toast.success(sponsor ? "Sponsor updated" : "Sponsor created");
      router.push(`/sponsors/${saved.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const tags = sponsor?.tags ? (JSON.parse(sponsor.tags) as string[]).join(", ") : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          name="companyName"
          required
          defaultValue={sponsor?.companyName}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactName">Contact Name</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={sponsor?.contactName ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={sponsor?.email ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={sponsor?.phone ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="url">Website URL</Label>
          <Input
            id="url"
            name="url"
            type="url"
            placeholder="https://example.com"
            defaultValue={sponsor?.url ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={sponsor?.city ?? ""} />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" defaultValue={sponsor?.state ?? ""} />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={sponsor?.country ?? ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="targetCustomerRevenue">Target Customer Revenue</Label>
        <Input
          id="targetCustomerRevenue"
          name="targetCustomerRevenue"
          placeholder="e.g. SMB $1–10M ARR, Enterprise $50M+"
          defaultValue={sponsor?.targetCustomerRevenue ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="tech, fortune500, returning"
          defaultValue={tags}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={sponsor?.notes ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : sponsor ? "Save Changes" : "Create Sponsor"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
