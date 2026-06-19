import type { Metadata } from "next";
import { MemberCard, type MemberCardVM } from "@/components/member-card";
import { getRoomData, seriesProposedBy } from "@/lib/data";
import { getMemberProposedAverage } from "@/lib/stats";
import type { Member, Series } from "@/lib/types";

export const metadata: Metadata = {
  title: "Jäsenet",
};

function memberVM(member: Member, series: Series[]): MemberCardVM {
  return {
    id: member.id,
    name: member.name,
    avatarUrl: member.avatarUrl,
    guest: member.guest,
    proposedCount: seriesProposedBy(series, member.id).length,
    proposedAverage: getMemberProposedAverage(series, member.id),
  };
}

export default async function MembersIndexPage() {
  const { members, series } = await getRoomData();
  const official = members.filter((member) => !member.guest);
  const guests = members.filter((member) => member.guest);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Jäsenet</h1>
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
              <MemberCard item={memberVM(member, series)} />
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
                <MemberCard item={memberVM(member, series)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
