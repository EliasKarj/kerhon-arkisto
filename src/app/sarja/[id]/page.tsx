import { PagePlaceholder } from "@/components/page-placeholder";

export default async function SeriesPage({ params }: PageProps<"/sarja/[id]">) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title="Sarjan sivu"
      description="Sarjan perustiedot, radar-kaavio jäsenten pisteytyksistä, best girl/boy -äänten jakauma ja jäsenten kommentit korteissa."
    >
      <p className="text-sm text-foreground/60">
        Sarjan tunniste: <code className="font-mono">{id}</code>
      </p>
    </PagePlaceholder>
  );
}
