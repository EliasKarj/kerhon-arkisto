import { notFound } from "next/navigation";
import { getRoomState } from "@/lib/session/session-actions";
import { getCoverUrl, getRoomData, seriesById } from "@/lib/data";
import { LiveRoom } from "@/components/session/live-room";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: PageProps<"/kerhoilta/[id]">) {
  const { id } = await params;
  const initial = await getRoomState(id);
  if (!initial.session) notFound();
  const { members, series } = await getRoomData();
  const roomSeries = seriesById(series, initial.session.seriesId);
  const seriesTitle = roomSeries?.title ?? "Kerhoilta";
  return (
    <div className="flex flex-col gap-6">
      <LiveRoom sessionId={id} initial={initial} seriesTitle={seriesTitle} members={members} anilistId={roomSeries?.anilistId ?? null} coverUrl={roomSeries ? getCoverUrl(roomSeries) : null} />
    </div>
  );
}
