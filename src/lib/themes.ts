/**
 * Sivuston väriteemat. Itse paletit elävät CSS:ssä (`globals.css`,
 * `[data-theme="..."]`); tässä on vain metatieto valikkoa ja esikatselu-
 * paletteja varten. Teema tallennetaan localStorageen ja asetetaan
 * <html data-theme> -attribuuttiin (anti-FOUC-skripti layoutissa).
 */

export type ThemeId = "yo" | "amber" | "meri" | "synth" | "paperi" | "terminaali";

export type ThemeDef = {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Esikatselun värit valikkoa varten (vastaavat CSS-palettia). */
  swatch: { bg: string; fg: string; accent: string; accent2: string };
};

export const THEMES: ThemeDef[] = [
  {
    id: "yo",
    name: "Yö",
    blurb: "Tumma + lime",
    swatch: { bg: "#0f0f12", fg: "#f3efe2", accent: "#c6f000", accent2: "#5b8cff" },
  },
  {
    id: "amber",
    name: "Amber",
    blurb: "Tumma + kulta",
    swatch: { bg: "#14110b", fg: "#f4ecdc", accent: "#f2b134", accent2: "#ff7a66" },
  },
  {
    id: "meri",
    name: "Meri",
    blurb: "Tumma + turkoosi",
    swatch: { bg: "#0a1414", fg: "#e6f2ee", accent: "#34d8c0", accent2: "#6db6ff" },
  },
  {
    id: "synth",
    name: "Synth",
    blurb: "Tumma + violetti",
    swatch: { bg: "#120e18", fg: "#f1e9f7", accent: "#c08bff", accent2: "#ff6ad5" },
  },
  {
    id: "paperi",
    name: "Paperi",
    blurb: "Vaalea + puna",
    swatch: { bg: "#efe9da", fg: "#16130c", accent: "#e5482f", accent2: "#2b6cff" },
  },
  {
    id: "terminaali",
    name: "Terminaali",
    blurb: "Musta + fosfori",
    swatch: { bg: "#08100a", fg: "#cdeccd", accent: "#3ef07a", accent2: "#7fe0a8" },
  },
];

export const DEFAULT_THEME: ThemeId = "yo";
export const THEME_STORAGE_KEY = "ka-theme";
export const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id);
