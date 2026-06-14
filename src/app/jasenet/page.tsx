import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Jäsenet",
};

export default function MembersIndexPage() {
  return (
    <PagePlaceholder
      title="Jäsenet"
      description="Kerhon jäsenet. Jokainen jäsen linkittää omalle profiilisivulleen, jossa näkyvät hänen arvionsa ja tilastonsa."
    />
  );
}
