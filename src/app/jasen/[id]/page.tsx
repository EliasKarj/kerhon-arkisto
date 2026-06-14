import { PagePlaceholder } from "@/components/page-placeholder";

export default async function MemberPage({ params }: PageProps<"/jasen/[id]">) {
  const { id } = await params;

  return (
    <PagePlaceholder
      title="Jäsenprofiili"
      description="Jäsenen kaikki arviot, hänen keskiarvonsa vs. kerhon keskiarvo, suosikkitagit ja best girl/boy -valintojen historia."
    >
      <p className="text-sm text-foreground/60">
        Jäsenen tunniste: <code className="font-mono">{id}</code>
      </p>
    </PagePlaceholder>
  );
}
