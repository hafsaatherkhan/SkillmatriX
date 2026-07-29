
'use client';

import React from 'react';
import  Input  from '@/components/resume-builder/Input';

export default function RoleInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const QUICK = [
    'Frontend Developer',
    'Backend Developer',
    'Full-Stack Developer',
    'Data Analyst',
    'Machine Learning Engineer',
    'QA Engineer',
    'Mobile Developer',
    'DevOps Engineer',
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Target Role</label>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Frontend Developer"
      />

      <div className="flex flex-wrap gap-2 mt-2">
        {QUICK.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={`px-3 py-1 rounded-full border text-sm ${
              role === value ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
}
