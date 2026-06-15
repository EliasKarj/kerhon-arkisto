import type { Metadata } from "next";
import Link from "next/link";
import { CountBarChart } from "@/components/charts/count-bar-chart";
import { ConnectionsGraph } from "@/components/stats/connections-graph";
import { FunFactCard, PairCard, StatHero } from "@/components/stats/stat-cards";
import { getMeta, graph } from "@/lib/data";
import {
  getDecadeDistribution,
  getGenreDistribution,
  getHottestTake,
  getMostAgreed,
  getMostConnectedAnime,
  getMostControversial,
  getMostIsolatedAnime,
  getNewestSeries,
  getOldestSeries,
  getOpposites,
  getSoulmates,
  getSourceDistribution,
  getStudioCounts,
  getTopCharacter,
  getTotalWatchTime,
} from "@/lib/fun-stats";
import { formatScore } from "@/lib/stats";

export const metadata: Metadata = { title: "Tilastot" };

function seriesLink(id: string, title: string) {
  return (
    <Link href={`/sarja/${id}`} className="underline decoration-accent decoration-2 underline-offset-2">
      {title}
    </Link>
  );
}

export default function StatsPage() {
  const watch = getTotalWatchTime();
  const controversial = getMostControversial();
  const agreed = getMostAgreed();
  const mostConnected = getMostConnectedAnime();
  const isolated = getMostIsolatedAnime();
  const genres = getGenreDistribution().slice(0, 8);
  const decades = getDecadeDistribution();
  const sources = getSourceDistribution();
  const studios = getStudioCounts().slice(0, 6);
  const oldest = getOldestSeries();
  const newest = getNewestSeries();
  const soulmates = getSoulmates();
  const opposites = getOpposites();
  const hottest = getHottestTake();
  const topCharacter = getTopCharacter();

  const sampleNote = "Perustuu sarjoihin, joissa on jäsenkohtaiset arviot.";

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Tilastot</h1>
        <p className="max-w-prose text-muted">
          Turhaa ja hauskaa dataa kerhon animeista ja niiden yhteyksistä.
        </p>
      </section>

      {/* Hero */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatHero
          value={`${watch.hours} h`}
          label="Kokonaiskatseluaika"
          sub={`≈ ${watch.days} päivää putkeen`}
        />
        {controversial ? (
          <FunFactCard title="Kiistellyin anime">
            {seriesLink(controversial.series.id, controversial.series.title)}{" "}
            <span className="text-muted">
              (hajonta {formatScore(controversial.spread)})
            </span>
          </FunFactCard>
        ) : null}
        {mostConnected ? (
          <FunFactCard title="Eniten yhteyksiä">
            {seriesLink(mostConnected.id, mostConnected.title)}{" "}
            <span className="text-muted">({mostConnected.degree})</span>
          </FunFactCard>
        ) : null}
      </section>

      {/* Yhteyksien verkko */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Yhteyksien verkko</h2>
        <ConnectionsGraph data={graph} />
        <div className="grid gap-4 sm:grid-cols-2">
          {mostConnected ? (
            <FunFactCard title="Verkostoitunein">
              {seriesLink(mostConnected.id, mostConnected.title)} — {mostConnected.degree} yhteyttä
            </FunFactCard>
          ) : null}
          {isolated ? (
            <FunFactCard title="Eristäytynein">
              {seriesLink(isolated.id, isolated.title)} — {isolated.degree} yhteyttä
            </FunFactCard>
          ) : null}
        </div>
      </section>

      {/* Animet numeroina */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Animet numeroina</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="surface-flat p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-tight">Genret</h3>
            <CountBarChart data={genres} caption={`Genret: ${genres.map((g) => `${g.label} ${g.count}`).join(", ")}.`} valueLabel="Sarjoja" />
          </div>
          <div className="surface-flat p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-tight">Vuosikymmenet</h3>
            <CountBarChart data={decades} caption={`Vuosikymmenet: ${decades.map((d) => `${d.label} ${d.count}`).join(", ")}.`} valueLabel="Sarjoja" />
          </div>
          <div className="surface-flat p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-tight">Lähde</h3>
            <CountBarChart data={sources} caption={`Lähteet: ${sources.map((s) => `${s.label} ${s.count}`).join(", ")}.`} valueLabel="Sarjoja" />
          </div>
          <div className="surface-flat flex flex-col gap-2 p-4">
            <h3 className="text-sm font-bold uppercase tracking-tight">Studiot</h3>
            <ul className="flex flex-col divide-y-2 divide-foreground/15">
              {studios.map((s) => (
                <li key={s.label} className="flex items-center justify-between py-1.5">
                  <span className="font-bold uppercase tracking-tight">{s.label}</span>
                  <span className="font-mono font-bold text-accent">{s.count}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
              {oldest ? <span>Vanhin: {seriesLink(oldest.id, oldest.title)} ({getMeta(oldest.id)?.year})</span> : null}
              {newest ? <span>Uusin: {seriesLink(newest.id, newest.title)} ({getMeta(newest.id)?.year})</span> : null}
            </div>
          </div>
        </div>
      </section>

      {/* Kerho erimielisinä */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Kerho erimielisinä</h2>
        <p className="text-xs text-muted">{sampleNote}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {soulmates ? (
            <PairCard
              title="Sielunkumppanit"
              nameA={soulmates.a.name}
              nameB={soulmates.b.name}
              detail={`Keskim. pistero ${formatScore(soulmates.meanDiff)} (${soulmates.shared} yhteistä sarjaa)`}
            />
          ) : null}
          {opposites ? (
            <PairCard
              title="Vastakohdat"
              nameA={opposites.a.name}
              nameB={opposites.b.name}
              detail={`Keskim. pistero ${formatScore(opposites.meanDiff)} (${opposites.shared} yhteistä sarjaa)`}
            />
          ) : null}
          {controversial ? (
            <FunFactCard title="Kiistellyin">
              {seriesLink(controversial.series.id, controversial.series.title)} — pisteet {formatScore(controversial.low)}–{formatScore(controversial.high)}
            </FunFactCard>
          ) : null}
          {agreed ? (
            <FunFactCard title="Yksimielisin">
              {seriesLink(agreed.series.id, agreed.series.title)} — hajonta {formatScore(agreed.spread)}
            </FunFactCard>
          ) : null}
          {hottest ? (
            <FunFactCard title="Rohkein mielipide">
              {hottest.member.name} antoi {seriesLink(hottest.series.id, hottest.series.title)}: {formatScore(hottest.review.score)} (kerho {formatScore(hottest.clubScore)})
            </FunFactCard>
          ) : null}
        </div>
      </section>

      {/* Best character */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Best character</h2>
        {topCharacter ? (
          <FunFactCard title="Eniten ääniä kerännyt hahmo">
            {topCharacter.label} — {topCharacter.count} ääntä
          </FunFactCard>
        ) : (
          <p className="text-muted">Ei vielä valintoja.</p>
        )}
      </section>
    </div>
  );
}
