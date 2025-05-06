import { useEffect, useRef, useState } from "react";

interface TerminalProps {
  title?: string;
  output: string;
  className?: string;
  isRunning?: boolean;
  showControls?: boolean;
}

export function Terminal({ 
  title = "PIXELVAULT TERMINAL", 
  output, 
  className = "", 
  isRunning = false,
  showControls = true 
}: TerminalProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);
  
  // Cursor blink effect
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, [isRunning]);
  
  return (
    <div className={`terminal ${className}`}>
      {showControls && (
        <div className="terminal-header">
          <div className="terminal-title neon">
            {title}
          </div>
          <div className="terminal-controls">
            <span className="terminal-red"></span>
            <span className="terminal-yellow"></span>
            <span className="terminal-green"></span>
          </div>
        </div>
      )}
      
      <div className="terminal-content" ref={terminalRef}>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
          {output}
          {isRunning && (
            <span className="terminal-cursor" style={{ opacity: cursorVisible ? 1 : 0 }}>_</span>
          )}
        </pre>
      </div>
    </div>
  );
}