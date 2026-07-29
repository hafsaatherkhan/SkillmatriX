
'use client';
import React, { useState } from 'react';

import { reportToHTML } from "@/features/skill-gap/utils/reportToHTML";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { BackendResponse, SkillGap } from '../types/skill-gap';
import Card from '@/components/resume-builder/Card';
import Button from '@/components/resume-builder/Button';

// ---- type guard to narrow "unknown" safely
function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === 'string');
}
function isSkillGap(x: unknown): x is SkillGap {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  const okStrong = o.strongSkills === undefined || isStringArray(o.strongSkills);
  const okWeak = o.weakSkills === undefined || isStringArray(o.weakSkills);
  const okMissing = o.missingSkills === undefined || isStringArray(o.missingSkills);
  const okMatch = o.matchPercentage === undefined || typeof o.matchPercentage === 'number';
  const okAdvice = o.improvementAdvice === undefined || typeof o.improvementAdvice === 'string';
  return okStrong && okWeak && okMissing && okMatch && okAdvice;
}


type ExportPdfResponse = {
  publicUrl: string;
  savedPath: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isExportPdfResponse(x: unknown): x is ExportPdfResponse {
  if (!isObject(x)) return false;
  const { publicUrl, savedPath } = x as { publicUrl?: unknown; savedPath?: unknown };
  return typeof publicUrl === 'string' && typeof savedPath === 'string';
}

function getAnalysisIdFromData(d: unknown): number | undefined {
  if (!isObject(d)) return undefined;
  const { analysisId } = d as { analysisId?: unknown };
  return typeof analysisId === 'number' ? analysisId : undefined;
}


function AdviceBlock({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const trimmed = text.trim();

  let parsed: unknown = null;
  let isJson = false;

  // 🔹 ONLY parse here (no JSX)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      parsed = JSON.parse(trimmed);
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  // 🔹 JSX happens OUTSIDE try/catch
  if (isJson) {
    if (Array.isArray(parsed)) {
      return (
        <ol className={`list-decimal list-inside space-y-1 ${className}`}>
          {(parsed as unknown[]).map((item, i) => (
            <li key={i}>{String(item)}</li>
          ))}
        </ol>
      );
    }

    if (parsed && typeof parsed === 'object') {
      return (
        <ul className={`list-disc list-inside space-y-1 ${className}`}>
          {Object.values(parsed as Record<string, unknown>).map((v, i) => (
            <li key={i}>{String(v)}</li>
          ))}
        </ul>
      );
    }
  }

  // 🔹 Fallback: Markdown rendering
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: (props) => <p className="mb-2 leading-relaxed" {...props} />,
        strong: (props) => <strong className="font-bold" {...props} />,
        ul: (props) => <ul className="list-disc list-inside space-y-1" {...props} />,
        ol: (props) => <ol className="list-decimal list-inside space-y-1" {...props} />,
        li: (props) => <li className="my-1" {...props} />,
      }}
    >
      {trimmed}
    </ReactMarkdown>
  );
}

export default function Report({ data, role }: { data: BackendResponse, role?: string; }) {
  const raw = data.skillGap;
  const [downloading, setDownloading] = useState(false); // ✅ loading state

  if (!raw || !isSkillGap(raw)) {
    return <p className="text-sm text-gray-600">No report data available.</p>;
  }

  const {
    strongSkills = [],
    weakSkills = [],
    missingSkills = [],
    matchPercentage,
    improvementAdvice = '',
  } = raw;
  
  // Reusable transparent Card class to avoid white blocks
  const transparentCard = 'bg-transparent border-0 shadow-none p-0'
  const roleFromProp = (role ?? '').trim();

async function exportPDF() {
  if (downloading) return;
  setDownloading(true);

  try {
    // 1️⃣ Generate HTML
    const html = reportToHTML({
      role: roleFromProp || "—",
      matchPercentage: matchPercentage ?? 0,
      improvementAdvice,
      strongSkills,
      weakSkills,
      missingSkills,
      userName: "HAFSA YOUSUF",
    });

    // 2️⃣ Generate file name
    const fileName = `${(roleFromProp || "role")
      .replace(/[^\w\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")}-skill-gap-report.pdf`;

    // 3️⃣ Call existing export endpoint
    const exportRes = await fetch("/api/skill-gap/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, fileName }),
    });

    if (!exportRes.ok) {
      const t = await exportRes.text().catch(() => "");
      throw new Error(t || "PDF export failed");
    }

    // 4️⃣ Parse response
    const { publicUrl } = (await exportRes.json()) as { publicUrl: string };

    if (!publicUrl) {
      throw new Error("PDF URL missing from response.");
    }

    // 5️⃣ Open PDF in new tab (no DB save)
    window.open(publicUrl, "_blank");
  } catch (err) {
    console.error("Export PDF error:", err);
    alert(err instanceof Error ? err.message : "PDF export failed");
  } finally {
    setDownloading(false);
  }
}




  return (
    <div className="space-y-6">
      {(typeof matchPercentage === 'number' || improvementAdvice) && (
        <Card className={transparentCard}>
          <div className="space-y-3">
            {typeof matchPercentage === 'number' && (
              <div>
                <div className="text-4xl font-bold">
                  <span className="text-[#c86ad6]">MATCH FOR </span>
                  {roleFromProp && (
                    <span className="bg-gradient-to-r from-[#991cac] via-[#6d71bb] to-[#991cac] bg-clip-text text-transparent italic">
                      {roleFromProp}
                    </span>
                  )}
                </div>
                <div className=" mt-5 mb-4 text-3xl font-bold" style={{ color: '#3D418A' }}>
                  {matchPercentage}% fit
                </div>
              </div>
            )}
            {improvementAdvice && (
              <div>
                <div className="text-2xl text-[#c86ad6] font-bold mb-1">Advice</div>
                <AdviceBlock className="whitespace-pre-line" text={decodeHtml(improvementAdvice)} />
              </div>
            )}
          </div>
        </Card>
      )}

      {strongSkills.length > 0 && (
        <Card className={transparentCard}>
          <h3 className="text-2xl font-bold mb-3" style={{ color: '#c86ad6' }}>
            STRONG SKILLS
          </h3>
          <div className="flex flex-wrap gap-2">
            {strongSkills.map((s) => (
              <span
                key={s}
                className="px-2 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200"
              >
                {s}
              </span>
            ))}
          </div>
        </Card>
      )}

      {weakSkills.length > 0 && (
        <Card className={transparentCard}>
          <h3 className="text-2xl font-bold mb-3" style={{ color: '#c86ad6' }}>
            WEAK SKILLS
          </h3>
          <div className="flex flex-wrap gap-2">
            {weakSkills.map((s) => (
              <span
                key={s}
                className="px-2 py-1 rounded-full text-sm bg-yellow-50 text-yellow-700 border border-yellow-200"
              >
                {s}
              </span>
            ))}
          </div>
        </Card>
      )}

      {missingSkills.length > 0 && (
        <Card className={transparentCard}>
          <h3 className="text-2xl font-bold mb-3" style={{ color: '#c86ad6' }}>
            MISSING SKILLS (PRIORITY)
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {missingSkills.map((s) => (
              <li key={s}>{decodeHtml(s)}</li>
            ))}
          </ul>
        </Card>
      )}

      
<div className="flex gap-2">
        <Button
          variant="primary"
          onClick={exportPDF}
          disabled={downloading}
          className="disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          aria-busy={downloading ? 'true' : 'false'}
        >
          {/* Optional tiny spinner */}
          {downloading && (
            <svg
              className="h-4 w-4 animate-spin text-current"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
              />
            </svg>
          )}
          {downloading ? 'Exporting…' : 'Download as PDF'}
        </Button>

      </div>
    </div>
  );
}

// Small helper to unescape things like &amp; in strings coming from backend
function decodeHtml(input: string) {
  if (!input) return input;
  const el = document.createElement('textarea');
  el.innerHTML = input;
  return el.value;
}
