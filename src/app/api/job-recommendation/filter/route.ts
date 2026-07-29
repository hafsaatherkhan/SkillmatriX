
// src/app/api/job-recommendation/filter/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recId = searchParams.get('recId');
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'scoreDesc';

  if (!recId) return new Response(JSON.stringify({ error: 'recId required' }), { status: 400 });

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE!;
  const upstream = await fetch(`${base}/api/jobs/filter?recId=${encodeURIComponent(recId)}&q=${encodeURIComponent(q)}&sort=${encodeURIComponent(sort)}`, { cache: 'no-store' });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
}
