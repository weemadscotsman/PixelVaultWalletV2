import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
  text?: string;
}

export function Spinner({
  size = "md",
  fullPage = false,
  text,
  className,
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  if (fullPage) {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        {...props}
      >
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
        {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export { Spinner as default };