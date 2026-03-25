/**
 * FormSection
 *
 * Reusable card wrapper for edit business form sections.
 */

import type { ReactNode } from 'react';
import { SECTION_CLASS_NAME } from './constants';

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className={SECTION_CLASS_NAME}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}
