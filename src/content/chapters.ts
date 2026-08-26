export type ChapterKind = "drawing" | "letter";

export interface Chapter {
  id: string;
  date: string;
  title: string;
  kind: ChapterKind;
  /** Path to the scanned drawing/letter once it's dropped into content/assets. */
  image?: string;
  /** Short quote in her own words, shown alongside the scan. */
  excerpt?: string;
  /** The narration in our voice, giving context around the piece. */
  narration?: string;
}

// Placeholder chapters — replace as real scans/letters and their context
// come in. The engine (Book/Page/App) doesn't need to change when this does.
export const chapters: Chapter[] = [
  {
    id: "prolog",
    date: "",
    title: "Bevor alles anfing",
    kind: "letter",
    narration: "Platzhalter: Prolog-Text kommt hier hin.",
  },
  {
    id: "kapitel-1",
    date: "Platzhalter-Datum",
    title: "Platzhalter-Titel",
    kind: "drawing",
    narration: "Platzhalter: Kontext zu dieser Zeichnung.",
  },
  {
    id: "kapitel-2",
    date: "Platzhalter-Datum",
    title: "Platzhalter-Titel",
    kind: "letter",
    excerpt: "Platzhalter: Zitat aus dem Brief.",
    narration: "Platzhalter: Kontext zu diesem Brief.",
  },
  {
    id: "finale",
    date: "",
    title: "Alles Gute, Julia",
    kind: "letter",
    narration: "Platzhalter: die eigentliche Geburtstagsbotschaft.",
  },
];
