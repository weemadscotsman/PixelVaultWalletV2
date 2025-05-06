import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps {
  value: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function ProgressCircle({
  value,
  className,
  size = 'md',
  strokeWidth = 6,
  children,
}: ProgressCircleProps) {
  const sizeMap = {
    sm: 50,
    md: 60,
    lg: 80,
    xl: 100
  };
  
  const circleSize = sizeMap[size];
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: circleSize, height: circleSize }}
    >
      <svg 
        className="absolute top-0 left-0 transform -rotate-90" 
        width={circleSize}
        height={circleSize}
      >
        {/* Background circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          className="stroke-blue-950/50"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          fill="none"
          className="stroke-current"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ 
            transition: "stroke-dashoffset 0.6s ease", 
          }}
        />
      </svg>
      
      {children && (
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          {children}
        </div>
      )}
    </div>
  );
}