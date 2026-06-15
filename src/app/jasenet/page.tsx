import type { Metadata } from "next";
import { MemberCard } from "@/components/member-card";
import { members } from "@/lib/data";

export const metadata: Metadata = {
  title: "Jäsenet",
};

export default function MembersIndexPage() {
  const official = members.filter((member) => !member.guest);
  const guests = members.filter((member) => member.guest);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Jäsenet</h1>
        <p className="max-w-prose text-muted">
          Kerhon arvioijat. Avaa jäsen nähdäksesi hänen ehdotuksensa, arvionsa ja Best character
          -valintansa.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Viralliset jäsenet</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {official.map((member) => (
            <li key={member.id}>
              <MemberCard member={member} />
            </li>
          ))}
        </ul>
      </div>

      {guests.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="sec-title w-fit text-lg">Vieraat</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {guests.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
