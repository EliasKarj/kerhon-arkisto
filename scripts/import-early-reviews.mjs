// Kertaluontoinen: kausien 1-6 jäsenkohtaiset arviot (vanha "ANIME DATA" -PDF)
// reviews-tauluun. Sarjat ovat jo kannassa (yhteisarvosanalla); tämä lisää
// puuttuvat per-jäsen-arviot. Idempotentti (upsert id:n perusteella).
// Aja: npm run import:early-reviews

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Puuttuu NEXT_PUBLIC_SUPABASE_URL tai SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// Nimien mäppäys jäsen-id:hin (PDF:n nimet -> kannan jäsenet).
const MEMBER = {
  aki: "aki", mikko: "mikko", jonni: "jonni", henri: "henri",
  benkku: "benkku", benjamin: "benkku", kossi: "benkku",
  eetu: "eetu-t", zonister: "jonni", timi: "timi",
};

// m = PDF:n nimi (lowercased), s = pisteet, b = best pick, p = bulletit
const DATA = [
  { id: "food-wars", reviews: [
    { m: "jonni", s: 3, b: "", p: ["Erittäin mielenkiintoinen ja pornograafinen", "Sankarityyppistä animegenreä, päähenkilö alussa ehkä liian hyvä", "Katottava, mutta ei herättänyt mielenkiintoa"] },
    { m: "mikko", s: 3, b: "", p: ["Ratatouille x hentai type of beat", "Ei mikään ihmeellinen anime", "Faktoja sisältävä kokkaaminen plussa"] },
    { m: "benkku", s: 3, b: "", p: ["Ekaa kautta katsoessa huomaa että animen tyyli muuttuu tulevissa kausissa", "Alkaa narutona ja loppuu boku no hero academiaan", "Hentai artistin tausta näkyy"] },
    { m: "aki", s: 4, b: "", p: ["Tykkäsi", "Hype kohtauksia paljon", "Akilla on kokki taustaa ja kertoo omista kokemuksista", "Samaistuttava"] },
    { m: "henri", s: 3, b: "", p: ["Ekassa seasonissa paljon hentaita", "Samastuin elintarviketieteisiin", "Simppeliä kokkausta"] },
  ]},
  { id: "tokyo-ghoul", reviews: [
    { m: "aki", s: 5, b: "Touka Kirishima", p: ["Season 1 & 2 katsottu"] },
    { m: "eetu", s: 4, b: "Rize Kamishiro", p: ["Päähenkilö vässykkä", "Sankaroituu lopussa", "Alotustheme banger", "Blood & gore"] },
    { m: "kossi", s: 2, b: "Touka Kirishima", p: ["Ei pitänyt", "Vässyköinti ja liialliset odotukset vei maun"] },
    { m: "mikko", s: 3, b: "Itori", p: ["Vässykkä päähahmo", "Päähahmo kehittyi hyvin", "Mid anime"] },
    { m: "zonister", s: 4, b: "Itori", p: ["Gore + verimässäily lisäsi hyvää makua", "Liikaa vässyköintiä", "Liian vähän tappelua"] },
    { m: "henri", s: 2, b: "Hinami", p: ["Vässyköinti"] },
  ]},
  { id: "mob-psycho-100", reviews: [
    { m: "benkku", s: 4.5, b: "Reigen Arataka", p: ["Hyvä artstyle", "Komedia", "Mob päähahmona ei ollut hänelle", "Reigen lempihahmo", "Hyvä opening"] },
    { m: "aki", s: 5, b: "Reigen Arataka", p: ["Hyviä muistoja animesta", "Seasonit paranee edetessä"] },
    { m: "eetu", s: 4.1, b: "Tome Kurata", p: ["Alku tylsä", "Parantu huomattavasti myöhemmin", "Hyvä fiilis", "Artstyle ei sytyttänyt"] },
    { m: "mikko", s: 4.3, b: "Dimple", p: ["Alussa iso skeptisyys", "Anime parani lopussa", "True and true aki anime", "Artstyle goat", "Dimple paras hahmo"] },
    { m: "jonni", s: 4.6, b: "Dimple", p: ["Artstyle mahtava", "Ekasta jaksosta hooked", "Aikoo katsoa muut seasonit"] },
    { m: "henri", s: 4, b: "Ichi Mezato", p: ["Hyvä artstyle", "Ekat kolme jaksoa hidasta"] },
  ]},
  { id: "kurokos-basketball", reviews: [
    { m: "eetu", s: 3.8, b: "Momoi", p: ["Nopea katselu", "Alku hidas", "Eka kerta kun katsoo urheiluanimea", "Solid experience"] },
    { m: "benkku", s: 4, b: "Riko", p: ["Paljon hypeä", "Perus sporttianime", "Komedia on hyvää", "Yks parhaimmin kirjotetuista hahmoista animessa"] },
    { m: "mikko", s: 2.8, b: "Momoi", p: ["Ei keskittynyt animee", "Sporttianimet ei ehkä mikolle", "Mid anime"] },
    { m: "jonni", s: 4.7, b: "Riko", p: ["Loistava anime", "Tykkää kun päähahmo on chill", "Osuu hyvin"] },
    { m: "henri", s: 4.9, b: "Momoi", p: ["Loistava anime", "Sports anime enjoyer"] },
  ]},
  { id: "serial-experiments-lain", reviews: [
    { m: "aki", s: 2.2, b: "Lainin äiti", p: ["Yksi animeista", "Mielenkiintoinen", "Tarina autistisesta tytöstä", "Ei ollut hänen tyyppiä"] },
    { m: "eetu", s: 3.4, b: "Arisu (vanhana)", p: ["Kiireesti katsottu", "Alku tylsä", "Hauskuus alko ku alko rakentaa konetta", "Vaikeaselkoinen", "Vastauksia lopussa", "Artstyle tykkään"] },
    { m: "benkku", s: 4.8, b: "Arisu (vanhana)", p: ["Alkoi nopeasti", "Lain ei ollut vässykkä", "Paljon oman itsensä etsimistä", "Lain on internetti"] },
    { m: "mikko", s: 4.2, b: "Alieni flanellilla", p: ["Erittäin huono anime", "Ehkä ei tajunnut asioista", "Selitysvideo auttoi paljon", "Intro goated", "Artstyle perus 90-luku", "Jokanen jakso uus plot pointti"] },
    { m: "jonni", s: 2.5, b: "Alieni", p: ["Työläs katsottava", "Liian monimutkainen", "Tapahtuu liikaa asioita", "Ei Jonnin tyyppinen anime"] },
    { m: "henri", s: 3.5, b: "Alieni", p: [] },
  ]},
  { id: "berserk", reviews: [
    { m: "aki", s: 4, b: "Casca", p: ["Masentava", "RIP Guts", "Dub oli parempi"] },
    { m: "eetu", s: 4.7, b: "Casca", p: ["Hyvä anime", "Vaikutti möyhöltä", "Boss päähahmo", "Loppui ikävästi", "Artstyle hyvä"] },
    { m: "benkku", s: 3.6, b: "Casca", p: ["Hyi vittu", "Viimeiset 4 jaksoo ihan perseestä", "Jatkoi mangalla"] },
    { m: "mikko", s: 3.7, b: "Casca", p: ["23 jaksoo iha jees", "Loput ihan mitä vittuu", "Päähahmo ei vässykkä", "Musiikki hyvää, mutta huutomusiikkia"] },
    { m: "jonni", s: 4, b: "Casca", p: ["Ensimmäinen jakso oli ihmeellinen", "Kesti lämmetä", "Lopussa tosi hyvää", "Ei harmita että on katsonut"] },
    { m: "henri", s: 4.1, b: "Casca", p: ["Pidin", "Str build päähahmo", "Paljon character developmenttia"] },
  ]},
  { id: "solo-leveling", reviews: [
    { m: "aki", s: 4.2, b: "Healer", p: ["Hauskoja tappelukohtaukset", "Animaatio yes", "Maldaus lisäsi kokemusta"] },
    { m: "eetu", s: 4.6, b: "Päähahmon sisko", p: ["Kiva", "Sword art online viba", "Äijä meni sekasi lowkey"] },
    { m: "benkku", s: 4.2, b: "Haein Cha", p: ["Web novel luettu", "Tarinallisesti sarja helvetin hyvä", "Saanu inspiraatiota DnD:n", "Anime adaptaatio hyvä tapa tuoda tarinaa lyhyessä formaatissa", "Sung Jinwoo tulee vähän tyhmempänä animessa"] },
    { m: "mikko", s: 2.6, b: "Lee Bora", p: ["Ei hitannu", "Pirkka isekai x sword art online", "Paljon möyhöö", "Ei napannu", "Aluks vässykkä sitten hikkyynty"] },
    { m: "jonni", s: 5, b: "Päähahmon sisko", p: ["Paras kaikista", "Yhdistää anime + videopelit", "Grindset iso plussa", "Loistavaan kohtaan jäi kesken"] },
    { m: "henri", s: 4.3, b: "Haein Cha", p: ["Str build", "Maldasin kun Sung Jinwoo ei depictoitu oikein", "Hyvä animaatio", "Melkein pysyi original storyssa", "Overall hyvä experience"] },
  ]},
  { id: "komi-cant-communicate", reviews: [
    { m: "jonni", s: 2.5, b: "Nakanaka Omoharu", p: ["Ei Jonnin tyylinen", "Tykkäsi artstyle", "Hieman mukavampi katsottava (Hyokaan verrattuna)", "Päähahmot eivät onnistuneet pussaamaan", "Hauskat hahmot", "Monipuolista ihmistyyppiä", "Häiritsi yhden mimmin pervoilu/obsessio"] },
    { m: "mikko", s: 3.2, b: "Najimi", p: ["Ei ollut samanlainen mitä on katsonut", "Silti tykkäsi", "2 season deepinpi", "Perushommat"] },
    { m: "benkku", s: 3.8, b: "Komin äiti", p: ["Ei huomannut pervoilua", "Luki mangan", "Suosittelen kaikille", "Ihana tarina", "Positive vibes"] },
    { m: "eetu", s: 1.5, b: "Himiko Agari", p: ["Vaikeata oli katsoa", "Edustaa slice of dogshit genre", "Samaa kastii kun Hyoka", "Vähän kevyempi", "Päähenkilö vitunmoinen pillu"] },
    { m: "aki", s: 4.5, b: "Komi", p: ["Tykkäsin helvetin paljon", "Hauska", "Iso muskelikas blondiäijä goat"] },
    { m: "henri", s: 3, b: "Komin äiti", p: ["Tykkäsin", "Ei olla niin syvällinen", "Basic"] },
  ]},
  { id: "konosuba", reviews: [
    { m: "jonni", s: 3.3, b: "Darkness", p: ["Pervo anime", "Mielenkiintoinen konsepti"] },
    { m: "mikko", s: 4, b: "Aqua", p: ["Pervo anime"] },
    { m: "benjamin", s: 4, b: "Liz", p: ["Animessa ei skipata mitään kirjoihin verrattuna", "Isekai parodia", "Tunnettu komediastaan", "Pervo", "Artstyle ihana", "Ei ole benkun tyylinen anime"] },
    { m: "eetu", s: 3.4, b: "Darkness", p: ["Nopeasti katsottu", "Komedia ja vitun pervo"] },
    { m: "aki", s: 3.8, b: "Darkness", p: ["Kaikki on jo sanottu"] },
    { m: "henri", s: 1.8, b: "Darkness", p: ["En tykännyt", "Cringesin liikaa", "Vihasin päähahmoa ja sen asennetta", "Komedia ei vain osunut muhun"] },
  ]},
  { id: "kaiju-no-8", reviews: [
    { m: "eetu", s: 4.5, b: "Rouva kapteeni", p: ["Artstyle crisp", "Musiikki no comment", "Möyhöö ja monstereita", "Nautinto", "Homma jäi kesken", "Kivan lyhyt"] },
    { m: "benjamin", s: 3.8, b: "Kikoru", p: ["Artstyle mangassa OK", "Artstyle siisti", "Tarina totinen/perus shonen", "Oletti olevan Parasyten kaltainen, mutta ei ollut", "Positiivisesti yllättynyt", "Tykkäsi hahmoista"] },
    { m: "mikko", s: 4.3, b: "Akari Minase", p: ["Tykkäsi", "Death paradise vibes", "Dragon ball + attack on titan vibat", "Ei vässyköintiä", "Intro hieno", "Kunnon EDM visuaalit", "Musiikki hyvää"] },
    { m: "jonni", s: 4.2, b: "Tae Nakanoshima", p: ["Ei niin totinen", "Hauskat kohtaukset iso +", "Mob psychon hieno huumori", "Hyvä suspension"] },
    { m: "aki", s: 4.4, b: "Rouva kapteeni", p: ["Hauska hyvä mähinä", "Jännä", "Siivojasta tappelijaksi aika kova"] },
    { m: "henri", s: 4.2, b: "Rouva kapteeni", p: ["Hyvä shonen", "Tykkäsin huumorista", "Tank status"] },
  ]},
  { id: "rising-impact", reviews: [
    { m: "mikko", s: 3, b: "Aria", p: ["Ihan jees", "Redeemas urheiluanimegenreä", "Simppeli", "Haluaa olla paras", "Yliluonnollisii voimii ei tarviis olla", "Musiikki ja artstyle"] },
    { m: "eetu", s: 3.7, b: "Pro golfer", p: ["Maldasi alussa", "Yllättävän hyvä", "Pallo mahollisimman pitkälle", "Vähän jäi auki", "Artstyle erilainen"] },
    { m: "henri", s: 4.2, b: "Aria", p: ["Maldasin alussa", "Hyvä development"] },
    { m: "benkku", s: 3.2, b: "Kirya", p: ["Anime itsessään OK", "Sporttianime", "Ei tykännyt päähenkilöstä", "Kiinnostus vähissä alussa ja parani lopussa"] },
    { m: "aki", s: 3.8, b: "Kirya", p: ["Alku oli hidas", "Parani camelot cupissa", "Kiva sporttianime", "Hyvin kuvailtuja supervoimia"] },
  ]},
  { id: "viral-hit", reviews: [
    { m: "aki", s: 4.6, b: "", p: ["Hyvä artstyle", "Hauska", "Mähinää"] },
    { m: "henri", s: 4.2, b: "", p: ["Tykkäsin", "Mähinää"] },
    { m: "benkku", s: 2.8, b: "", p: ["Ei tykänny", "Haluaa katsoa fantasiaa"] },
    { m: "eetu", s: 3.9, b: "", p: [] },
    { m: "mikko", s: 3.8, b: "", p: [] },
  ]},
  { id: "punch-line", reviews: [
    { m: "jonni", s: 2.5, b: "Rabuda", p: ["Shokki katsoa ensimmäinen jakso", "Pantsuja vitusti", "Pervohtava", "All around tosi tylsä"] },
    { m: "mikko", s: 3.2, b: "Rabuda", p: ["Pervoa animea", "Deadpoolin kaltaista huumoria", "Pantsuja oli", "Tarina ei niin kovin ihmeellinen"] },
    { m: "eetu", s: 1.7, b: "Rabuda", p: ["Diffas Hyoka", "Huonoin anime mitä katsottu", "Artstyle Ok", "Vitusti alushousuja", "Fyysinen cringe"] },
    { m: "henri", s: 3.5, b: "Rabuda", p: ["Artstyle", "Tarina", "Tykkäsin"] },
    { m: "benkku", s: 2.3, b: "Pine", p: ["Ei oo ollu semmosta kunnon ecchia", "Benkun eka ecchi anime", "Punchline tulee videopelistä", "Anime adaptaatiot yleisesti paskaa", "Tarina itsessään hyvä jos otettu pelistä", "Meh"] },
  ]},
  { id: "blood-blockade-battlefront", reviews: [
    { m: "jonni", s: 2.5, b: "Sniper muija", p: ["Ei ollut erikoinen anime", "Ei hyvä ei huono", "Ei hulluu mähinää", "Ei päässyt storyyn"] },
    { m: "mikko", s: 2.3, b: "Hound muija", p: ["Niin aki anime", "Möyhöö oli", "Hahmo oli vässykkä", "Maailma oli hieno"] },
    { m: "benkku", s: 3.7, b: "Aliqura", p: ["Toinen kerta katsottu", "Ihan yhtä sekasin tarinasta", "Animaatio hyvä", "Hahmot mielenkiintoisia", "Tarina sekava", "Tarpeeks mähinää"] },
    { m: "eetu", s: 1.6, b: "Chain Sumeragi", p: ["Hyokassa eetu ymmärsi mitä tapahtu", "Kekkai sensenissä eetu ei tajunnu mitää", "En tykännyt", "Animaatiot kivaa"] },
    { m: "aki", s: 2.5, b: "Kahvilamuija", p: ["Vaikea seurata tarinaa"] },
    { m: "henri", s: 5, b: "Chain Sumeragi", p: ["Tarina mahtava", "Hahmot uniikkeja", "Ympäristö hyvä"] },
  ]},
  { id: "made-in-abyss", reviews: [
    { m: "jonni", s: 3.8, b: "Nanachi", p: ["Yappaamista liikaa", "Seittemännestä jaksosta alko käyntii", "Oli miellyttävä katottava", "Ei lempparigenre että lapsia", "Päähahmo vässykkä", "Mielikuvituksellinen sarja"] },
    { m: "henri", s: 4.3, b: "Ozen", p: ["Artstyle", "Tarinasta"] },
    { m: "mikko", s: 4.5, b: "Nanachi", p: ["Maailma on älyttömän hieno", "Kiinnyit hahmoihin", "Kyyneleitä", "Tarina, hahmot ja MAAILMA"] },
    { m: "benkku", s: 4.2, b: "Nanachi", p: [] },
  ]},
  { id: "cowboy-bebop", reviews: [
    { m: "mikko", s: 3.7, b: "Miss Valentine", p: ["Artstyle ja musiikki priimaa", "Pikkutarinaa taustalla", "Atmosphere oli ihana", "Hahmot ja tarina ei lämmittänyt"] },
    { m: "jonni", s: 2.8, b: "Miss Valentine", p: ["Artstyle off putting", "Tarinallisesti mitäänsanomaton", "OK viihdyttävä"] },
    { m: "henri", s: 3, b: "Faye Valentine", p: ["Artstyle mahtava", "Lämpenin"] },
    { m: "aki", s: 4.5, b: "Miss Valentine", p: ["Tarina mahtava", "Musiikki helvetin hyvää"] },
  ]},
  { id: "parasyte-the-maxim", reviews: [
    { m: "aki", s: 3.1, b: "Tamaki", p: ["Perus möyhä hidas anime", "Alussa oli erittäin hidasta", "Lopussa parani huomattavasti"] },
    { m: "eetu", s: 4, b: "Kana", p: ["12/24 katsottu (ei tule katsomaan loppuun)", "Pitkästä aikaa ei ripuli anime", "Artstyle yes"] },
    { m: "benkku", s: 3.3, b: "Migi", p: ["Anime itsessään paskempi kuin mitä muisti", "Tarina mielenkiintoinen", "Toisella katselukerralla shokkifaktorit eivät iskeneet", "Not rewatchable", "Character development refreshing", "Fake end parempi end"] },
    { m: "mikko", s: 2.6, b: "Kana", p: ["Kiinnostunut enemmän hahmojen suhteista kuin parasytesta", "Musiikki outoa, dubsteppia surullisista kohdissa", "Tarina loppua kohden parani", "Loppu hyvin"] },
    { m: "zonister", s: 4.2, b: "Migi", p: ["Tykkäsi", "Lähti hitaasti", "Vässyköintiä", "Artstyle näytti halvalta", "Lopusta ei tykännyt"] },
    { m: "henri", s: 2.4, b: "Migi", p: ["Perushyvä anime"] },
  ]},
  { id: "ossan-newbie-adventurer", reviews: [
    { m: "jonni", s: 4.4, b: "Rellana Elfelt", p: ["Erittäin hyvä", "Meni nopeasti", "Lempikategoria", "Haluan katsoa seuraavan kauden"] },
    { m: "aki", s: 4.7, b: "Rellana Elfelt", p: ["Katsoi kun oli tulossa", "Hauska ja huvittava", "Intro hauska"] },
    { m: "benkku", s: 3.8, b: "Angelica", p: ["Lukenut kirjasarjan", "Tykkäsi animesta enemmän kuin kirjasta", "Isoin syy Half-elf half-dwarf hauska", "Huumori oli hyvää isekai-genreen nähtynä"] },
    { m: "eetu", s: 4.1, b: "Rellana Elfelt", p: ["Klassinen sunnuntaikatselu", "Anime kiinnosti", "Alku hidas", "Vittu oli möyhöö", "Giga örkki"] },
    { m: "mikko", s: 3.2, b: "Midicia", p: ["Hyvä anime MUTTA", "Ei tykkää OP hahmoista", "Ei pystynyt hypee fightteja", "Intro hyvä"] },
    { m: "henri", s: 4.6, b: "Rellana Elfelt", p: ["Nautin erittäin paljon", "SMOrc", "Tykkään aina mähinästä", "Hyvä character development", "Feel good anime"] },
  ]},
  { id: "takt-op-destiny", reviews: [
    { m: "mikko", s: 2.9, b: "Heaven", p: ["Mitä ihmettä mä katon", "Miksi musiikkia?", "Lopussa alkoi lämpenemään", "Lenny ja Titan hyvä", "Artstyle helvetin hyvä", "Tarina decent", "Parani loppua kohden"] },
    { m: "eetu", s: 2.3, b: "Anna", p: ["Kädenlämpönen", "Vetosi aika paljon peliin", "Ei puhunu", "Artstyle hyvä", "Hyvä möyhö", "Musa hyvä"] },
    { m: "benkku", s: 2.8, b: "Destiny", p: ["Teema / maailma oli siistiä", "Hahmot kivan näkösii", "Ei jaksanu välittää", "Meh"] },
    { m: "jonni", s: 3, b: "Titan", p: ["1 jakso helvetin hyvä", "Möyhö jees", "Teema ok", "Yapping 11 jaksoa", "Hype kuoli", "Artstyle yes", "Musiikki yes"] },
    { m: "henri", s: 3, b: "Orpheus", p: [] },
  ]},
];

async function main() {
  const rows = [];
  const seen = new Set();
  for (const s of DATA) {
    for (const r of s.reviews) {
      const memberId = MEMBER[r.m];
      if (!memberId) throw new Error(`Tuntematon jäsen: ${r.m} (${s.id})`);
      const id = `${s.id}-${memberId}`;
      if (seen.has(id)) throw new Error(`Duplikaatti review-id: ${id}`);
      seen.add(id);
      rows.push({
        id, series_id: s.id, member_id: memberId,
        score: r.s, bullet_points: r.p, best_pick: r.b ?? "", tags: [],
      });
    }
  }
  const { error } = await db.from("reviews").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
  console.log(`Tuotu ${rows.length} arviota ${DATA.length} sarjaan.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
