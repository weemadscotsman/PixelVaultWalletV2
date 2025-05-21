import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export function Spinner({ 
  className, 
  size = 'md',
  fullPage = false,
  ...props 
}: SpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  }[size];

  const spinner = (
    <div 
      className={cn(
        "flex items-center justify-center", 
        className
      )} 
      {...props}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClass)} />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}