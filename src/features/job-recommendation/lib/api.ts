
import type { RecommendBundle } from '../types';

export async function recommendByFile(file: File): Promise<RecommendBundle> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/job-recommendation', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to recommend');
  return data as RecommendBundle;
}

export async function recommendBySkills(skills: { strong: string[]; weak: string[]; missing: string[] }): Promise<RecommendBundle> {
  const res = await fetch('/api/job-recommendation/by-skills', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(skills),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to recommend by skills');
  return data as RecommendBundle;
}

export async function filterBundle(recId: string, q: string, sort: string): Promise<RecommendBundle> {
  const url = `/api/job-recommendation/filter?recId=${encodeURIComponent(recId)}&q=${encodeURIComponent(q)}&sort=${encodeURIComponent(sort)}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Filter failed');
  return data as RecommendBundle;
}
