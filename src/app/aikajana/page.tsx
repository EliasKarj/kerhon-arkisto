import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Aikajana",
};

export default function TimelinePage() {
  return (
    <PagePlaceholder
      title="Aikajana"
      description="Kronologinen lista katsotuista sarjoista, linkit sarjojen omille sivuille."
    />
  );
}
