import { SponsorForm } from "@/components/sponsors/SponsorForm";

export default function NewSponsorPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">New Sponsor</h1>
      <SponsorForm />
    </div>
  );
}
