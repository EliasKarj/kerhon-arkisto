import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Sarjat",
};

export default function SeriesIndexPage() {
  return (
    <PagePlaceholder
      title="Sarjat"
      description="Lista kaikista arvioiduista sarjoista ja elokuvista. Jokainen kortti linkittää sarjan omalle sivulle."
    />
  );
}
