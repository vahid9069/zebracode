import React from 'react';
import * as Icons from 'lucide-react';

export function DynamicIcon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  // @ts-expect-error dynamic access
  const IconComponent = Icons[name] || Icons.Wrench;
  return <IconComponent className={className} />;
}
