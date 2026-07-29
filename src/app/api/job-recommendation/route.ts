
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');

  if (!file || !(file instanceof Blob)) {
    return new Response(JSON.stringify({ error: 'file is required' }), { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE;
  if (!base) {
    return new Response(JSON.stringify({ error: 'BACKEND URL not configured' }), { status: 500 });
  }

  const namedFile = file as File;
  const name = typeof namedFile.name === 'string' ? namedFile.name : 'resume';
  const fd = new FormData();
  fd.append('file', namedFile, name);

  const upstream = await fetch(`${base}/api/jobs/recommend`, { method: 'POST', body: fd });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });
}
