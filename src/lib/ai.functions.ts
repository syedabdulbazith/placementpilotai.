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
const ResumeSchema = z.object({
  overall_score: z.number().min(0).max(100),
  ats_score: z.number().min(0).max(100),
  summary: z.string(),
  detected_skills: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ fileName: z.string(), text: z.string().min(20) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { output } = await generateText({
      model: gw(),
      output: Output.object({ schema: ResumeSchema }),
      system:
        "You are an expert technical recruiter and ATS resume analyzer. Be strict but constructive. Detect technical skills, projects, and experience accurately.",
      prompt: `Analyze this resume and produce a structured JSON evaluation.

Resume text:
"""
${data.text.slice(0, 12000)}
"""`,
    });

    const { data: row, error } = await context.supabase
      .from("resume_analyses")
      .insert({
        user_id: context.userId,
        file_name: data.fileName,
        overall_score: output.overall_score,
        ats_score: output.ats_score,
        strengths: output.strengths,
        weaknesses: output.weaknesses,
        suggestions: output.suggestions,
        detected_skills: output.detected_skills,
        summary: output.summary,
        raw_text: data.text.slice(0, 20000),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Update readiness score (rolling avg with resume)
    await context.supabase
      .from("profiles")
      .update({ readiness_score: Math.round((output.overall_score + output.ats_score) / 2) })
      .eq("id", context.userId);

    return row;
  });

/* ---------- SKILL GAP ---------- */
const SkillGapSchema = z.object({
  match_percent: z.number().min(0).max(100),
  matched_skills: z.array(z.string()),
  missing_skills: z.array(
    z.object({ skill: z.string(), priority: z.enum(["high", "medium", "low"]), reason: z.string() }),
  ),
  recommendations: z.array(
    z.object({ topic: z.string(), resource: z.string(), duration_weeks: z.number() }),
  ),
});

export const analyzeSkillGap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({ targetRole: z.string().min(2), currentSkills: z.array(z.string()) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { output } = await generateText({
      model: gw(),
      output: Output.object({ schema: SkillGapSchema }),
      system: "You are a senior career coach for engineering placements in India.",
      prompt: `Target role: ${data.targetRole}
Current skills: ${data.currentSkills.join(", ") || "(none provided)"}

Compare against the typical industry requirements for this role. Output JSON.`,
    });

    const { data: row, error } = await context.supabase
      .from("skill_assessments")
      .insert({
        user_id: context.userId,
        target_role: data.targetRole,
        current_skills: data.currentSkills,
        missing_skills: output.missing_skills,
        recommendations: output.recommendations,
        match_percent: output.match_percent,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...row, matched_skills: output.matched_skills };
  });

/* ---------- ELIGIBILITY ---------- */
const EligibilitySchema = z.object({
  companies: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      package_lpa: z.string(),
      eligibility_percent: z.number().min(0).max(100),
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
        department: z.string(),
        skills: z.array(z.string()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { output } = await generateText({
      model: gw(),
      output: Output.object({ schema: EligibilitySchema }),
      system:
        "You are an expert on Indian campus placements. Use realistic data on top Indian recruiters (TCS, Infosys, Wipro, Cognizant, Capgemini, Accenture, Amazon, Microsoft, Google, Flipkart, Walmart, Zoho, Freshworks, Goldman Sachs, JPMC, Deloitte).",
      prompt: `Given a final-year ${data.department} student with CGPA ${data.cgpa} and skills [${data.skills.join(", ")}], list 8 realistic companies that could recruit them, eligibility %, gaps and action items.`,
    });

    const { data: row, error } = await context.supabase
      .from("eligibility_checks")
      .insert({
        user_id: context.userId,
        cgpa: data.cgpa,
        department: data.department,
        skills: data.skills,
        results: output.companies,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
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
        role: z.string().default("Software Engineer"),
        count: z.number().min(3).max(15).default(8),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { output } = await generateText({
      model: gw(),
      output: Output.object({ schema: InterviewSchema }),
      system: "You are an interview coach creating high-quality, realistic interview questions for campus placements.",
      prompt: `Generate ${data.count} ${data.type} interview questions for a ${data.role} role. Each must include an ideal answer (3-5 sentences) and 2-3 tips.`,
    });

    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        user_id: context.userId,
        session_type: data.type,
        role: data.role,
        questions: output.questions,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ---------- EVALUATE MOCK INTERVIEW ANSWER ---------- */
const EvalSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string(),
  improvements: z.array(z.string()),
});

export const evaluateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ question: z.string(), answer: z.string(), idealAnswer: z.string().optional() }).parse(d),
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
        goal: z.string().min(2),
        durationDays: z.union([z.literal(15), z.literal(30), z.literal(60)]),
        currentSkills: z.array(z.string()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { output } = await generateText({
      model: gw(),
      output: Output.object({ schema: RoadmapSchema }),
      system: "You create realistic day-by-day placement prep plans for Indian engineering students.",
      prompt: `Goal: ${data.goal}
Duration: ${data.durationDays} days
Current skills: ${data.currentSkills.join(", ") || "beginner"}

Build a day-by-day plan covering DSA, system design (if relevant), aptitude, communication, projects, and mock interviews. Each day: theme, 3-5 concrete tasks, 2-3 resources, hours required.`,
    });

    const { data: row, error } = await context.supabase
      .from("roadmaps")
      .insert({
        user_id: context.userId,
        goal: data.goal,
        duration_days: data.durationDays,
        plan: output,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
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
      ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
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
