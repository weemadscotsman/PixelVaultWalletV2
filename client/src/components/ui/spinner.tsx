import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  text?: string;
  className?: string;
}

/**
 * Spinner component for loading states.
 * Can be used inline or as a full-page overlay.
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  fullPage = false,
  text,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
        {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

export { Spinner };
export default Spinner;