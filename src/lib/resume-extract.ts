// Client-side resume text extraction for PDF / DOCX / TXT.

export type ExtractResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

const INVALID_MSG = "Please upload a valid resume PDF or DOCX.";

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ") + "\n";
  }
  return text;
}

async function extractDocx(file: File): Promise<string> {
  // @ts-expect-error - no bundled types for the browser entry
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
}

function looksLikeResume(text: string): boolean {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 200) return false;
  const lower = cleaned.toLowerCase();
  const keywords = [
    "experience", "education", "skills", "project", "internship",
    "university", "college", "bachelor", "degree", "certification",
    "summary", "objective", "email", "linkedin", "github",
    "responsibilities", "achievements", "developer", "engineer",
  ];
  const hits = keywords.filter((k) => lower.includes(k)).length;
  return hits >= 2;
}

export async function extractResumeText(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx");
  const isTxt = file.type === "text/plain" || name.endsWith(".txt");

  if (!isPdf && !isDocx && !isTxt) return { ok: false, error: INVALID_MSG };

  try {
    let text = "";
    if (isPdf) text = await extractPdf(file);
    else if (isDocx) text = await extractDocx(file);
    else text = await file.text();

    text = text.replace(/\u0000/g, "").trim();
    if (!looksLikeResume(text)) return { ok: false, error: INVALID_MSG };
    return { ok: true, text };
  } catch {
    return { ok: false, error: INVALID_MSG };
  }
}
