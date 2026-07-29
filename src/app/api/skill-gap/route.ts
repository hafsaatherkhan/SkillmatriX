import { NextResponse } from "next/server";
import { cookies } from "next/headers";



/** ------------ Types ------------ */
type AnalyzeBackendRaw = {
  analysisId?: number;
  targetRole?: string;
  strongSkills?: unknown;
  weakSkills?: unknown;
  missingSkills?: unknown;
  improvementAdvice?: string;
  matchPercentage?: number;
  pdfUrl?: string | null;
  createdAt?: string | null;
  error?: string;
  requiresConfirmation?: boolean;
  message?: string;
  reuseAnalysisId?: number;
  similarity?: number;
  [k: string]: unknown;
};

type AdaptedSkillGap = {
  strongSkills: string[];
  weakSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  improvementAdvice: string;
};

type AdaptedResponse =
  | {
      requiresConfirmation: true;
      message: string;
      reuseAnalysisId: number;
      similarity: number;
    }
  | {
      requiresConfirmation?: false;
      skillGap: AdaptedSkillGap;
      analysisId?: number;
      targetRole?: string;
      pdfUrl?: string | null;
      createdAt?: string | null;
    };

/** ------------ Helpers ------------ */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return t.includes(",")
        ? t.split(",").map((s) => s.trim()).filter(Boolean)
        : [t];
    }
  }
  return [];
}

function computeMatchPercentage(matched: string[], missing: string[], fallback = 0) {
  const denom = Math.max(1, matched.length + missing.length);
  const pct = Math.round((matched.length / denom) * 100);
  return Number.isFinite(pct) ? pct : fallback;
}



/** ------------ Helpers ------------ */
async function getTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_id")?.value;
  return token ? `Bearer ${token}` : undefined;
}


export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const backend =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!backend) {
      return NextResponse.json(
        { error: "Backend URL missing. Set NEXT_PUBLIC_BACKEND_URL in .env.local" },
        { status: 500 }
      );
    }

    // ✅ Await auth token
    const auth = await getTokenFromCookies();

    const res = await fetch(`${backend}/api/resume/skill_gap`, {
      method: "POST",
      body: formData,
      headers: auth ? { Authorization: auth } : undefined,
    });

    const text = await res.text();

    let rawUnknown: unknown = {};
    try {
      rawUnknown = text ? JSON.parse(text) : {};
    } catch {
      rawUnknown = { raw: text };
    }

    if (!isRecord(rawUnknown)) {
      return NextResponse.json(
        { error: "Unexpected backend response shape", raw: rawUnknown },
        { status: 502 }
      );
    }

    const raw = rawUnknown as AnalyzeBackendRaw;

    if (raw.requiresConfirmation) {
      return NextResponse.json(
        {
          requiresConfirmation: true,
          message: String(raw.message || "This CV looks very similar. Reuse previous or Continue?"),
          reuseAnalysisId: Number(raw.reuseAnalysisId || 0),
          similarity: Number(raw.similarity || 0),
        },
        { status: 200 }
      );
    }

    if (raw.error) {
      return NextResponse.json(
        { error: String(raw.error) },
        { status: res.status || 400 }
      );
    }

    const strong = toArray(raw.strongSkills);
    const weak = toArray(raw.weakSkills);
    const missing = toArray(raw.missingSkills);

    const matchPercentage =
      typeof raw.matchPercentage === "number"
        ? raw.matchPercentage
        : computeMatchPercentage(strong, missing, 0);

    const improvementAdvice =
      typeof raw.improvementAdvice === "string" && raw.improvementAdvice.trim()
        ? raw.improvementAdvice
        : "Focus on the missing skills shown below.";

    const adapted: AdaptedResponse = {
      skillGap: {
        strongSkills: strong,
        weakSkills: weak,
        missingSkills: missing,
        matchPercentage,
        improvementAdvice,
      },
      analysisId: raw.analysisId,
      targetRole: raw.targetRole,
      pdfUrl: raw.pdfUrl ?? null,
      createdAt: raw.createdAt ?? null,
    };

    return NextResponse.json(adapted, { status: res.status || 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
