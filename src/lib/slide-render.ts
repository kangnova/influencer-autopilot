import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "./prisma";

const W = 1080;
const H = 1350;

interface Theme {
  from: string; // gradient start color
  to: string; // gradient end color
  circle: string; // decorative circle fill
  heading: string; // heading text color
  body: string; // body text color
  label: string; // brand + slide-number color
}

// Six dark gradients, cycled per day so each carousel has its own look while
// every slide within one carousel stays consistent.
const THEMES: Theme[] = [
  { from: "#0F172A", to: "#4338CA", circle: "#1E293B", heading: "#F8FAFC", body: "#C7D2FE", label: "#94A3B8" }, // navy -> indigo
  { from: "#312E81", to: "#7E22CE", circle: "#1E1B4B", heading: "#F8FAFC", body: "#E9D5FF", label: "#A5B4FC" }, // indigo -> purple
  { from: "#134E4A", to: "#0E7490", circle: "#042F2E", heading: "#F0FDFA", body: "#A5F3FC", label: "#5EEAD4" }, // teal -> cyan
  { from: "#1E293B", to: "#1D4ED8", circle: "#0F172A", heading: "#F8FAFC", body: "#BFDBFE", label: "#93C5FD" }, // slate -> blue
  { from: "#4C0519", to: "#BE123C", circle: "#2D0A16", heading: "#FFF1F2", body: "#FECDD3", label: "#FDA4AF" }, // burgundy -> rose
  { from: "#14532D", to: "#059669", circle: "#052E16", heading: "#F0FDF4", body: "#A7F3D0", label: "#6EE7B7" }, // forest -> emerald
];

// CTA slide: always bright green so the call-to-action is instantly recognizable.
const CTA_THEME: Theme = {
  from: "#10B981",
  to: "#059669",
  circle: "#059669",
  heading: "#FFFFFF",
  body: "#F0FDF4",
  label: "#064E3B",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap text into lines of at most `maxChars` characters (word-aware). */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (candidate.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export interface Slide {
  heading: string;
  body: string;
}

function slideSvg(
  slide: Slide,
  index: number,
  total: number,
  theme: Theme,
  isCta: boolean
): string {
  const headingLines = wrap(slide.heading, isCta ? 20 : 24);
  const bodyLines = wrap(slide.body, isCta ? 28 : 40);

  const headingSize = isCta ? 92 : 60;
  const bodySize = isCta ? 56 : 42;
  const headingLineH = headingSize * 1.25;
  const bodyLineH = bodySize * 1.5;
  const gap = isCta ? 40 : 60;

  const headingBlockH = headingLines.length * headingLineH;
  const bodyBlockH = bodyLines.length * bodyLineH;
  const totalH =
    headingBlockH + (bodyLines.length > 0 ? gap : 0) + bodyBlockH;

  // Vertically center the heading+body block. SVG `y` is the text BASELINE, so
  // glyphs render above it — add half a heading-height to center the visible
  // block, not the baseline.
  const startY = Math.round((H - totalH) / 2 + headingSize * 0.5);

  const pad = 88;

  const headingTspan = headingLines
    .map(
      (line, i) =>
        `<tspan x="${W / 2}" y="${startY + i * headingLineH}">${esc(line)}</tspan>`
    )
    .join("");

  const bodyY = startY + headingBlockH + (bodyLines.length > 0 ? gap : 0);
  const bodyTspan = bodyLines
    .map(
      (line, i) =>
        `<tspan x="${W / 2}" y="${bodyY + i * bodyLineH}">${esc(line)}</tspan>`
    )
    .join("");

  const slideNo = `${index + 1}/${total}`;
  const brand = "KANG NOVA";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.from}"/>
      <stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W - 120}" cy="120" r="260" fill="${theme.circle}" opacity="0.6"/>
  <text x="${pad}" y="120" font-family="DejaVu Sans, sans-serif" font-size="30" font-weight="700" letter-spacing="4" fill="${theme.label}">${brand}</text>
  <text x="${W - pad}" y="120" text-anchor="end" font-family="DejaVu Sans, sans-serif" font-size="30" fill="${theme.label}">${slideNo}</text>
  <text text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="${headingSize}" font-weight="700" fill="${theme.heading}">
    ${headingTspan}
  </text>
  <text text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="${bodySize}" fill="${theme.body}">
    ${bodyTspan}
  </text>
</svg>`;
}

async function renderItem(
  planId: string,
  dayIndex: number,
  slides: Slide[],
  cta: string | null,
  outDir: string
): Promise<string[]> {
  // One theme per day (per carousel), cycled from the palette.
  const theme = THEMES[(dayIndex - 1) % THEMES.length];
  const urls: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const isCta = i === slides.length - 1 && Boolean(cta);
    const slide: Slide = isCta
      ? { heading: cta!, body: "" }
      : { heading: s.heading || "", body: s.body || "" };
    const svg = slideSvg(slide, i, slides.length, isCta ? CTA_THEME : theme, isCta);
    const file = path.join(outDir, `day${dayIndex}-${i + 1}.png`);
    await sharp(Buffer.from(svg), { density: 72 }).png().toFile(file);
    urls.push(`/uploads/slides/${planId}/day${dayIndex}-${i + 1}.png`);
  }
  return urls;
}

/**
 * Render every carousel slide of a content plan to a branded PNG (1080x1350).
 * Saves to public/uploads/slides/<planId>/ and returns the count of images.
 */
export async function renderPlanSlides(planId: string): Promise<number> {
  const plan = await prisma.contentPlan.findUnique({
    where: { id: planId },
    include: { items: { orderBy: { dayIndex: "asc" } } },
  });
  if (!plan) throw new Error(`Content plan ${planId} not found`);

  const outDir = path.join(process.cwd(), "public", "uploads", "slides", planId);
  await fs.mkdir(outDir, { recursive: true });

  let rendered = 0;
  for (const item of plan.items) {
    const slides = Array.isArray(item.slides)
      ? (item.slides as unknown as Slide[])
      : [];
    if (slides.length === 0) continue;
    await renderItem(planId, item.dayIndex + 1, slides, item.cta, outDir);
    rendered += slides.length;
  }
  return rendered;
}
