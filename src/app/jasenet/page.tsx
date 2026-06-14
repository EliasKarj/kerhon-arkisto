import type { Metadata } from "next";
import { MemberCard } from "@/components/member-card";
import { members } from "@/lib/data";

export const metadata: Metadata = {
  title: "Jäsenet",
};

export default function MembersIndexPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Jäsenet</h1>
        <p className="max-w-prose text-foreground/70">
          Kerhon arvioijat. Avaa jäsen nähdäksesi hänen arvionsa, keskiarvonsa
          ja best girl/boy -valintansa.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {members.map((member) => (
          <li key={member.id}>
            <MemberCard member={member} />
          </li>
        ))}
      </ul>
    </section>
  );
}
