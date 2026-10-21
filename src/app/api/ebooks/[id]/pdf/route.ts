import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api";
import PDFDocument from "pdfkit";

type Params = { params: Promise<{ id: string }> };

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "ebook"
  );
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const { id } = await params;
  const ebook = await prisma.ebook.findUnique({ where: { id } });
  if (!ebook) return fail("Not found", 404);

  const chapters = Array.isArray(ebook.chapters)
    ? (ebook.chapters as { title?: string; content?: string }[])
    : [];

  const doc = new PDFDocument({ margin: 56, size: "A4", bufferPages: true });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  // --- Title page ---
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#94A3B8")
    .text("KANG NOVA", { align: "center", characterSpacing: 3 });
  doc.moveDown(4);
  doc.fontSize(30).fillColor("#0F172A").text(ebook.title, { align: "center" });
  if (ebook.subtitle) {
    doc.moveDown(0.6);
    doc
      .fontSize(14)
      .fillColor("#475569")
      .text(ebook.subtitle, { align: "center" });
  }
  doc.addPage();

  // --- Chapters ---
  chapters.forEach((c, i) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#0F172A")
      .text(`${i + 1}. ${c.title ?? ""}`);
    doc.moveDown(0.3);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#1F2937")
      .text(c.content ?? "", { lineGap: 4, align: "justify" });
    doc.moveDown(1.4);
  });

  doc.end();
  const buf = await done;

  const filename = `${slugify(ebook.title)}.pdf`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
