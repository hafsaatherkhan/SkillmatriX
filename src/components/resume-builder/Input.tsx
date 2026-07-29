
'use client';
import React from 'react';
import clsx from 'clsx';

export default function Input({
  label,
  id,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; id?: string }) {
  return (
    <div>
      {label && <label htmlFor={id} className="ui-label">{label}</label>}
      <input id={id} className={clsx('ui-input', className)} {...props} />
    </div>
  );
}
