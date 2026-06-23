import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL_ID = "google/gemini-3-flash-preview";

function gw() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(MODEL_ID);
}

/* ---------- RESUME ANALYZER ---------- */
const ResumeAnalysisSchema = z.object({
  score: z.coerce.number().catch(0),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  missingKeywords: z.array(z.string()).catch([]),
});

const fallbackResumeAnalysis = {
  score: 0,
  strengths: [] as string[],
  weaknesses: [] as string[],
  suggestions: [] as string[],
  missingKeywords: [] as string[],
};

function extractJson(raw: string) {
  let cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No valid JSON object found");
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned);
}

function normalizeResumeAnalysis(raw: unknown) {
  const parsed = ResumeAnalysisSchema.safeParse(raw);
  if (!parsed.success) throw new Error("AI response did not match the expected resume schema");

  const score = Math.max(0, Math.min(100, Math.round(parsed.data.score)));
  return {
    score,
    strengths: parsed.data.strengths,
    weaknesses: parsed.data.weaknesses,
    suggestions: parsed.data.suggestions,
    missingKeywords: parsed.data.missingKeywords ?? [],
  };
}

function databaseErrorDetails(error: unknown) {
  if (error && typeof error === "object") {
    const err = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown; name?: unknown };
    return {
      name: typeof err.name === "string" ? err.name : undefined,
      message: typeof err.message === "string" ? err.message : String(error),
      code: typeof err.code === "string" ? err.code : undefined,
      details: typeof err.details === "string" ? err.details : undefined,
      hint: typeof err.hint === "string" ? err.hint : undefined,
    };
  }

  return { message: String(error) };
}

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        fileName: z.string().min(1).max(255),
        text: z.string().min(20).max(15000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let analysis = fallbackResumeAnalysis;

    try {
      const { text, finishReason } = await generateText({
        model: gw(),
        system:
          "You are an expert technical recruiter and ATS resume analyzer. Return only raw JSON. Do not include markdown, comments, extra keys, or prose.",
        prompt: `Analyze this resume and return exactly this JSON shape with no extra keys:
{
  "score": 0,
  "strengths": [],
  "weaknesses": [],
  "suggestions": [],
  "missingKeywords": []
}

Rules:
- score must be a raw number from 0 to 100 representing ATS compatibility, with no percent sign and no separators.
- strengths, weaknesses, suggestions: arrays of concise strings.
- missingKeywords: array of important keywords/skills the resume is missing for typical software/engineering roles (e.g. "Docker", "REST API", "Unit testing").
- Return valid JSON only.

Resume text:
"""
${data.text.slice(0, 12000)}
"""`,
      });

      if (finishReason === "length") throw new Error("AI response was truncated");
      analysis = normalizeResumeAnalysis(extractJson(text));
    } catch (error) {
      console.error("Resume AI analysis failed", error);
    }

    let row = null;

    try {
      const { data: savedRow, error } = await context.supabase
        .from("resume_analyses")
        .insert({
          user_id: context.userId,
          file_name: data.fileName,
          overall_score: analysis.score,
          ats_score: analysis.score,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          suggestions: analysis.suggestions,
          detected_skills: analysis.missingKeywords,
          summary:
            analysis.score === 0
              ? "The AI analysis could not be completed safely, so we saved a fallback result instead of crashing."
              : "AI resume analysis completed successfully.",
          raw_text: data.text.slice(0, 20000),
        })
        .select()
        .single();

      if (error) throw error;
      row = savedRow;
    } catch (error) {
      const saveError = databaseErrorDetails(error);
      console.error("Resume history save failed", {
        ...saveError,
        userId: context.userId,
        fileName: data.fileName,
      });
      return {
        id: null,
        user_id: context.userId,
        file_name: data.fileName,
        overall_score: analysis.score,
        ats_score: analysis.score,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        detected_skills: analysis.missingKeywords,
        summary:
          "We analyzed your resume but couldn't save the result. You can still view it below.",
        created_at: new Date().toISOString(),
        atsScore: analysis.score,
        missingKeywords: analysis.missingKeywords,
        analysis,
        saveError,
      };
    }

    // Best-effort readiness update — never fail the request if this errors.
    try {
      await context.supabase
        .from("profiles")
        .update({ readiness_score: analysis.score })
        .eq("id", context.userId);
    } catch (e) {
      console.error("Failed to update readiness score", e);
    }

    return {
      ...row,
      atsScore: analysis.score,
      missingKeywords: analysis.missingKeywords,
      analysis,
    };
  });

/* ---------- SKILL GAP ---------- */
const SkillGapSchema = z.object({
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  recommendations: z.array(z.string()),
  overallScore: z.coerce.number().catch(0),
});

const fallbackSkillGap = {
  matchedSkills: [] as string[],
  missingSkills: [] as string[],
  recommendations: [] as string[],
  overallScore: 0,
};

export const analyzeSkillGap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        targetRole: z.string().min(2).max(120),
        currentSkills: z.array(z.string().max(100)).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let analysis = fallbackSkillGap;

    try {
      const { text, finishReason } = await generateText({
        model: gw(),
        system:
          "You are a senior career coach for engineering placements in India. Return only raw JSON. No markdown, no prose, no extra keys.",
        prompt: `Target role: ${data.targetRole}
Current skills: ${data.currentSkills.join(", ") || "(none provided)"}

Compare the candidate's skills to typical industry requirements for this role.

Return EXACTLY this JSON shape and nothing else:
{
  "matchedSkills": ["JavaScript", "React", "SQL"],
  "missingSkills": ["Node.js", "System Design", "Docker"],
  "recommendations": [
    "Learn Node.js fundamentals",
    "Practice System Design",
    "Build Docker-based projects"
  ],
  "overallScore": 75
}

Rules:
- overallScore: integer 0-100, no % sign.
- matchedSkills, missingSkills, recommendations: arrays of concise strings.
- Always include every key.
- Return valid JSON only.`,
      });
      if (finishReason === "length") throw new Error("AI response was truncated");
      const parsed = SkillGapSchema.safeParse(extractJson(text));
      if (parsed.success) {
        analysis = {
          matchedSkills: parsed.data.matchedSkills,
          missingSkills: parsed.data.missingSkills,
          recommendations: parsed.data.recommendations,
          overallScore: Math.max(0, Math.min(100, Math.round(parsed.data.overallScore))),
        };
      } else {
        throw new Error("AI response did not match skill-gap schema");
      }
    } catch (error) {
      console.error("Skill gap AI failed", error);
    }

    const { data: row, error } = await context.supabase
      .from("skill_assessments")
      .insert({
        user_id: context.userId,
        target_role: data.targetRole,
        current_skills: data.currentSkills,
        missing_skills: analysis.missingSkills,
        recommendations: analysis.recommendations,
        match_percent: analysis.overallScore,
      })
      .select()
      .single();
    if (error) { console.error(error); throw new Error("Could not save results. Please try again."); }
    return { ...row, ...analysis };
  });


/* ---------- ELIGIBILITY ---------- */
const EligibilitySchema = z.object({
  companies: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      package_lpa: z.string(),
      eligibility_percent: z.number(),
      matched: z.array(z.string()),
      gaps: z.array(z.string()),
      action: z.string(),
    }),
  ),
});

export const checkEligibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        cgpa: z.number().min(0).max(10),
        department: z.string().min(1).max(120),
        skills: z.array(z.string().max(100)).max(50),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let companies: z.infer<typeof EligibilitySchema>["companies"] = [];

    try {
      const { text, finishReason } = await generateText({
        model: gw(),
        system:
          "You are an expert on Indian campus placements. Return only raw JSON. No markdown, no prose, no extra keys.",
        prompt: `Given a final-year ${data.department} student with CGPA ${data.cgpa} and skills [${data.skills.join(", ")}], list 8 realistic companies (from top Indian recruiters such as TCS, Infosys, Wipro, Cognizant, Capgemini, Accenture, Amazon, Microsoft, Google, Flipkart, Walmart, Zoho, Freshworks, Goldman Sachs, JPMC, Deloitte) that could recruit them.

Return EXACTLY this JSON shape and nothing else:
{
  "companies": [
    {
      "name": "TCS",
      "role": "Systems Engineer",
      "package_lpa": "3.5 LPA",
      "eligibility_percent": 85,
      "matched": ["Java", "SQL"],
      "gaps": ["Cloud"],
      "action": "Practice aptitude and SQL queries"
    }
  ]
}

Rules:
- eligibility_percent: integer 0-100, no % sign.
- matched, gaps: arrays of short skill strings.
- Always include all keys for every company.
- Return valid JSON only.`,
      });
      if (finishReason === "length") throw new Error("AI response was truncated");
      const parsed = EligibilitySchema.safeParse(extractJson(text));
      if (parsed.success) companies = parsed.data.companies;
      else throw new Error("AI response did not match eligibility schema");
    } catch (error) {
      console.error("Eligibility AI failed", error);
    }

    const { data: row, error } = await context.supabase
      .from("eligibility_checks")
      .insert({
        user_id: context.userId,
        cgpa: data.cgpa,
        department: data.department,
        skills: data.skills,
        results: companies,
      })
      .select()
      .single();
    if (error) { console.error(error); throw new Error("Could not save results. Please try again."); }
    return row;
  });

/* ---------- INTERVIEW Q GENERATOR ---------- */
const InterviewSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      category: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      ideal_answer: z.string(),
      tips: z.array(z.string()),
    }),
  ),
});

export const generateInterviewQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        type: z.enum(["technical", "hr", "aptitude", "mock"]),
        role: z.string().min(1).max(120).default("Software Engineer"),
        count: z.number().int().min(1).max(20).default(8),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let questions: z.infer<typeof InterviewSchema>["questions"] = [];

    try {
      const { text, finishReason } = await generateText({
        model: gw(),
        system:
          "You are an interview coach for Indian campus placements. Return only raw JSON. No markdown, no prose, no extra keys.",
        prompt: `Generate ${data.count} ${data.type} interview questions for a ${data.role} role.

Return EXACTLY this JSON shape and nothing else:
{
  "questions": [
    {
      "question": "What is OOP?",
      "category": "Core CS",
      "difficulty": "easy",
      "ideal_answer": "A 3-5 sentence ideal answer.",
      "tips": ["tip 1", "tip 2"]
    }
  ]
}

Rules:
- difficulty must be exactly one of: "easy", "medium", "hard".
- tips: array of 2-3 short strings.
- Always include every key for every question.
- Return valid JSON only.`,
      });
      if (finishReason === "length") throw new Error("AI response was truncated");
      const parsed = InterviewSchema.safeParse(extractJson(text));
      if (parsed.success) questions = parsed.data.questions;
      else throw new Error("AI response did not match interview schema");
    } catch (error) {
      console.error("Interview AI failed", error);
    }

    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        user_id: context.userId,
        session_type: data.type,
        role: data.role,
        questions,
      })
      .select()
      .single();
    if (error) { console.error(error); throw new Error("Could not save results. Please try again."); }
    return row;
  });


/* ---------- EVALUATE MOCK INTERVIEW ANSWER ---------- */
const EvalSchema = z.object({
  score: z.number(),
  feedback: z.string(),
  improvements: z.array(z.string()),
});

export const evaluateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        question: z.string().min(1).max(2000),
        answer: z.string().min(1).max(5000),
        idealAnswer: z.string().max(5000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: gw(),
      output: Output.object({ schema: EvalSchema }),
      system: "You are a strict but encouraging interview coach.",
      prompt: `Question: ${data.question}
Candidate answer: ${data.answer}
Ideal answer: ${data.idealAnswer ?? "(use your best judgment)"}

Score 0-10, give 2-3 sentences feedback and 2-3 concrete improvements.`,
    });
    return output;
  });

/* ---------- ROADMAP ---------- */
const RoadmapSchema = z.object({
  overview: z.string(),
  days: z.array(
    z.object({
      day: z.number(),
      theme: z.string(),
      tasks: z.array(z.string()),
      resources: z.array(z.string()),
      time_hours: z.number(),
    }),
  ),
});

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        goal: z.string().min(2).max(200),
        durationDays: z.union([z.literal(15), z.literal(30), z.literal(60)]),
        currentSkills: z.array(z.string().max(100)).max(50).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let plan: z.infer<typeof RoadmapSchema> = { overview: "", days: [] };

    try {
      const { text, finishReason } = await generateText({
        model: gw(),
        system:
          "You create realistic day-by-day placement prep plans for Indian engineering students. Return only raw JSON. No markdown, no prose, no extra keys.",
        prompt: `Goal: ${data.goal}
Duration: ${data.durationDays} days
Current skills: ${data.currentSkills.join(", ") || "beginner"}

Build a ${data.durationDays}-day plan covering DSA, system design (if relevant), aptitude, communication, projects, and mock interviews.

Return EXACTLY this JSON shape and nothing else:
{
  "overview": "Short 2-3 sentence summary of the plan.",
  "days": [
    {
      "day": 1,
      "theme": "DSA basics",
      "tasks": ["Learn arrays", "Solve 5 easy problems"],
      "resources": ["NeetCode", "GFG"],
      "time_hours": 3
    }
  ]
}

Rules:
- "days" must have exactly ${data.durationDays} entries, day 1..${data.durationDays}.
- day and time_hours are raw numbers (no units, no quotes).
- tasks (3-5) and resources (2-3) are arrays of short strings.
- Always include every key for every day.
- Return valid JSON only.`,
      });
      if (finishReason === "length") throw new Error("AI response was truncated");
      const parsed = RoadmapSchema.safeParse(extractJson(text));
      if (parsed.success) plan = parsed.data;
      else throw new Error("AI response did not match roadmap schema");
    } catch (error) {
      console.error("Roadmap AI failed", error);
    }

    const { data: row, error } = await context.supabase
      .from("roadmaps")
      .insert({
        user_id: context.userId,
        goal: data.goal,
        duration_days: data.durationDays,
        plan,
      })
      .select()
      .single();
    if (error) { console.error(error); throw new Error("Could not save results. Please try again."); }
    return row;
  });


/* ---------- CHAT (non-streaming, simple) ---------- */
export const chatAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        message: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // verify thread ownership
    const { data: thread } = await context.supabase
      .from("chat_threads")
      .select("id")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .single();
    if (!thread) throw new Error("Thread not found");

    // history
    const { data: history } = await context.supabase
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(40);

    // store user msg
    await context.supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: "user",
      content: data.message,
    });

    const messages = [
      ...(history ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: data.message },
    ];

    const { text } = await generateText({
      model: gw(),
      system:
        "You are PlacementPilot AI — a warm, expert placement officer helping Indian college students prepare for campus placements. Give clear, actionable, encouraging advice. Use markdown formatting (bold, lists). Keep answers concise unless asked for depth.",
      messages,
    });

    await context.supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: "assistant",
      content: text,
    });

    // update title if first exchange
    if ((history ?? []).length === 0) {
      const title = data.message.slice(0, 60);
      await context.supabase.from("chat_threads").update({ title }).eq("id", data.threadId);
    }

    return { reply: text };
  });
