"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useCallback } from "react";

interface SponsorSearchProps {
  defaultSearch?: string;
}

export function SponsorSearch({ defaultSearch }: SponsorSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      router.push(`/sponsors?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <Input
      placeholder="Search sponsors…"
      defaultValue={defaultSearch}
      className="max-w-xs"
      onChange={(e) => updateSearch(e.target.value)}
    />
  );
}
