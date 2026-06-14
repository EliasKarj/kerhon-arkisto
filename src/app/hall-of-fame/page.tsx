import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = {
  title: "Hall of Fame",
};

export default function HallOfFamePage() {
  return (
    <PagePlaceholder
      title="Hall of Fame"
      description="Kaikkien aikojen best girl/boy -leaderboard äänimäärien mukaan, sekä tilastokulma tiukimmasta ja löysimmästä arvioijasta."
    />
  );
}
