import React, { useEffect, useRef, useState } from 'react';

interface LearningTerminalProps {
  x: {
    command: string;
    history: string[];
    output: string;
    isProcessing: boolean;
    isMining: boolean;
    miningStatus: string;
    onExecuteCommand: (command: string) => void;
  }
}

export function LearningTerminal({ x }: LearningTerminalProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState('');
  
  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [x.output, x.history]);
  
  // Focus input field on mount and when processing finishes
  useEffect(() => {
    if (!x.isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [x.isProcessing]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && command.trim() && !x.isProcessing) {
      x.onExecuteCommand(command);
      setCommand('');
    }
  };
  
  return (
    <div className="terminal-panel h-full flex flex-col">
      <div className="terminal-header flex justify-between items-center mb-3 border-b border-blue-900/50 pb-2">
        <div className="terminal-title text-blue-400 text-sm uppercase tracking-wider">
          PVX Blockchain Terminal
        </div>
        <div className="terminal-controls flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
        </div>
      </div>
      
      <div 
        ref={outputRef}
        className="terminal-output flex-1 overflow-y-auto text-sm font-mono mb-4"
        style={{ maxHeight: '300px' }}
      >
        {/* Terminal welcome */}
        <div className="text-green-400 mb-4">
          <div>===================================</div>
          <div>PVX Network Terminal v0.9.0</div>
          <div>Secure Blockchain Interface</div>
          <div>===================================</div>
          <div className="text-gray-400 text-xs mt-1">Type 'help' for available commands</div>
        </div>
        
        {/* Command history */}
        {x.history.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="terminal-prompt text-blue-400 flex gap-2">
              <span className="text-blue-600">$</span>
              <span>{item}</span>
            </div>
          </div>
        ))}
        
        {/* Current output */}
        {x.output && (
          <div className="text-gray-300 mb-2 whitespace-pre-wrap">
            {x.output}
          </div>
        )}
        
        {/* Mining status */}
        {x.isMining && (
          <div className="my-2">
            <div className="text-yellow-400">[MINING OPERATION ACTIVE]</div>
            <div className="text-gray-400 text-xs">{x.miningStatus}</div>
          </div>
        )}
        
        {/* Processing indicator */}
        {x.isProcessing && (
          <div className="flex items-center text-cyan-500 mt-2">
            <span>Processing</span>
            <span className="animate-pulse ml-1">...</span>
          </div>
        )}
      </div>
      
      {/* Command input */}
      <div className="terminal-input-line flex items-center">
        <div className="text-blue-600 mr-2">$</div>
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent border-none outline-none flex-1 text-sm font-mono text-blue-300"
          placeholder="Enter command..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={x.isProcessing}
        />
      </div>
    </div>
  );
}