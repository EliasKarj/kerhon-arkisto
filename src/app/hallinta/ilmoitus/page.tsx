import { AnnouncementForm } from "@/components/admin/announcement-form";

export default function AnnouncementPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Lähetä ilmoitus</h1>
      <p className="text-sm text-muted">Lähetä ilmoitus Discordiin ja/tai sivustolla oleville (toast).</p>
      <AnnouncementForm />
    </div>
  );
}
