import { jsPDF } from "jspdf";

type ResumeAnalysis = {
  file_name?: string | null;
  overall_score?: number | null;
  ats_score?: number | null;
  summary?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  suggestions?: string[] | null;
  detected_skills?: string[] | null;
};

const INDIGO = "#4f46e5";
const PURPLE = "#a78bfa";

function header(doc: jsPDF, title: string) {
  doc.setFillColor(INDIGO);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PlacementPilot AI", 14, 14);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 22);
  doc.setTextColor("#111827");
}

function section(doc: jsPDF, y: number, title: string, items: string[] | string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(INDIGO);
  doc.text(title, 14, y);
  doc.setTextColor("#1f2937");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const arr = Array.isArray(items) ? items : [items];
  let cursor = y + 6;
  for (const it of arr) {
    const lines = doc.splitTextToSize(`• ${it}`, 180);
    if (cursor + lines.length * 5 > 280) {
      doc.addPage();
      cursor = 20;
    }
    doc.text(lines, 16, cursor);
    cursor += lines.length * 5 + 1;
  }
  return cursor + 4;
}

export function downloadResumeReport(a: ResumeAnalysis) {
  const doc = new jsPDF();
  header(doc, "Resume Analysis Report");

  doc.setFontSize(12);
  doc.text(`File: ${a.file_name ?? "resume"}`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);

  // Score cards
  doc.setFillColor(PURPLE);
  doc.roundedRect(14, 50, 85, 30, 4, 4, "F");
  doc.setTextColor("#ffffff");
  doc.setFontSize(11);
  doc.text("Overall Score", 18, 58);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(`${a.overall_score ?? 0}/100`, 18, 72);

  doc.setFillColor(INDIGO);
  doc.roundedRect(110, 50, 85, 30, 4, 4, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("ATS Compatibility", 114, 58);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(`${a.ats_score ?? 0}/100`, 114, 72);

  doc.setTextColor("#1f2937");
  let y = 92;
  if (a.summary) y = section(doc, y, "Summary", a.summary);
  if (a.detected_skills?.length) y = section(doc, y, "Detected Skills", a.detected_skills.join(", "));
  if (a.strengths?.length) y = section(doc, y, "Strengths", a.strengths);
  if (a.weaknesses?.length) y = section(doc, y, "Weaknesses", a.weaknesses);
  if (a.suggestions?.length) y = section(doc, y, "Improvement Suggestions", a.suggestions);

  doc.save(`PlacementPilot-Resume-${Date.now()}.pdf`);
}

type Roadmap = {
  goal?: string | null;
  duration_days?: number | null;
  plan?: { overview?: string; days?: Array<{ day: number; theme: string; tasks: string[]; resources: string[]; time_hours: number }> } | null;
};

export function downloadRoadmapReport(r: Roadmap) {
  const doc = new jsPDF();
  header(doc, `${r.duration_days ?? ""}-Day Preparation Roadmap`);

  doc.setFontSize(12);
  doc.text(`Goal: ${r.goal ?? ""}`, 14, 38);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);

  let y = 54;
  if (r.plan?.overview) y = section(doc, y, "Overview", r.plan.overview);

  for (const d of r.plan?.days ?? []) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(INDIGO);
    doc.roundedRect(14, y, 182, 8, 2, 2, "F");
    doc.setTextColor("#ffffff");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Day ${d.day} · ${d.theme} · ${d.time_hours}h`, 17, y + 6);
    doc.setTextColor("#1f2937");
    y += 12;
    y = section(doc, y, "Tasks", d.tasks);
    if (d.resources?.length) y = section(doc, y, "Resources", d.resources);
  }

  doc.save(`PlacementPilot-Roadmap-${Date.now()}.pdf`);
}
