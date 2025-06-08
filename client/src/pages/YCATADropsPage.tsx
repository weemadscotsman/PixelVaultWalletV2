import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export function YCATADropsPage() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [showDropPanel, setShowDropPanel] = useState(false);
  const [bootComplete, setBootComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Matrix rain effect for terminal area
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match terminal content area
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateCanvasSize();

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$&+,:;=?@#|<>[]^_~%';
    const fontSize = 10;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const matrixInterval = setInterval(drawMatrix, 33);

    // Boot sequence
    const bootSequence = `
██████╗ ██╗██╗  ██╗███████╗██╗    ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗
██╔══██╗██║╚██╗██╔╝██╔════╝██║    ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝
██████╔╝██║ ╚███╔╝ █████╗  ██║    ██║   ██║███████║██║   ██║██║     ██║   
██╔═══╝ ██║ ██╔██╗ ██╔══╝  ██║    ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   
██║     ██║██╔╝ ██╗███████╗███████╗╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   
╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝ ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   

Initializing PIXELVAULT Core Terminal...
ZkSNARK Protocol: ACTIVE
XRP Bridge: CONNECTED
Privacy: ENABLED
Equalized Mining: ENABLED

YCATA ACCESS TERMINAL LOADED
Type 'help' to see available commands.
Type 'drop --ycata' for secret access.
`;

    setTimeout(() => {
      setCommandHistory([bootSequence]);
      setBootComplete(true);
    }, 1000);

    return () => {
      clearInterval(matrixInterval);
    };
  }, []);

  const commands: Record<string, string> = {
    'help': `
Available commands:
  help           - Display this help message
  info           - Show system information
  wallet         - Manage wallet
  balance        - Check wallet balance
  drop --ycata   - Access secret YCATA drops
  clear          - Clear terminal
  exit           - Return to dashboard
`,
    'info': `
PIXELVAULT YCATA Terminal
Version: 1.0.0 (Secret Access)
Status: LIVE
Drop Status: ACTIVE
YCATA Units Available: 10
Price: $69,420
Access Level: AUTHENTICATED
`,
    'wallet': `
Wallet Management
Address: 0x7a3F9d6f38a2FE3d4efc91c8bd35fE6931Dd37C2
Balance: 438.12 PIXV
YCATA Eligible: YES
Security: zkSNARK privacy enabled
`,
    'balance': `
Current balance: 438.12 PIXV
YCATA Fund: 69,420.00 USD
Available for drops: YES
Status: QUALIFIED WHALE
`,
    'clear': '[CLEAR]',
    'exit': 'Exiting terminal...'
  };

  const processCommand = (command: string) => {
    const cmd = command.trim().toLowerCase();
    
    // Add command to history
    const newEntry = `PIXELVAULT$ ${command}`;
    
    let response = '';
    
    if (cmd === '') {
      setCommandHistory(prev => [...prev, newEntry]);
      return;
    }
    
    if (cmd === 'clear') {
      setCommandHistory([]);
      return;
    }
    
    if (cmd === 'exit') {
      response = commands[cmd];
      setTimeout(() => setLocation('/dashboard'), 1000);
    } else if (cmd === 'drop --ycata') {
      response = `> DROP_ACCESS_GRANTED
> Unsealing YCATA.EXE...
> This hoodie costs more than your GPU.
> Welcome to the YCATA Drop Terminal.`;
      setShowDropPanel(true);
    } else if (commands[cmd]) {
      response = commands[cmd];
    } else {
      response = `Command not found: ${cmd}
Type 'help' for available commands.`;
    }
    
    setCommandHistory(prev => [...prev, newEntry, response]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      processCommand(currentInput);
      setCurrentInput('');
    }
  };

  const returnToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black text-green-400 font-mono overflow-hidden">
      {/* CRT Frame Background */}
      <div className="absolute inset-0">
        <img 
          src="/tv_skins/exodus_Samsung_Night.png"
          alt="CRT Frame"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Matrix Background - confined to terminal area */}
      <div 
        className="absolute opacity-30"
        style={{
          top: '16.1%',
          left: '22%',
          width: '54.2%',
          height: '56.5%',
          overflow: 'hidden'
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Terminal Content Area */}
      <div 
        className="absolute bg-black/85 border border-green-400 rounded-md p-4 overflow-hidden"
        style={{
          top: '16.1%',
          left: '22%',
          width: '54.2%',
          height: '56.5%',
          fontSize: '0.8rem'
        }}
      >
        {/* Command History */}
        <div className="h-full overflow-y-auto mb-4 whitespace-pre-wrap">
          {commandHistory.map((entry, index) => (
            <div key={index} className="text-green-400" style={{ textShadow: '0 0 5px #00FF00' }}>
              {entry}
            </div>
          ))}
          
          {/* YCATA Drop Panel */}
          {showDropPanel && (
            <div className="bg-black border-2 border-green-300 p-4 mt-4 rounded">
              <h2 className="text-pink-400 text-lg mb-2">✅ DROP ACCESS GRANTED</h2>
              <p className="text-green-300 mb-2">Welcome to the <strong>YCATA</strong> Drop Terminal.</p>
              <div className="text-green-400 mb-4">
                <p><em>You Can't Afford This Anyway</em> — Hoodie + Tee Bundle</p>
                <p>Price: <strong className="text-yellow-400">$69,420</strong></p>
                <p>Units: <strong className="text-red-400">Only 10 exist</strong></p>
                <p>Flex: <strong className="text-blue-400">Verified on-chain</strong></p>
              </div>
              <Button 
                className="bg-green-400 text-black border-2 border-green-400 hover:bg-black hover:text-green-400 font-mono font-bold"
                style={{ textShadow: 'none' }}
              >
                [ INITIATE PURCHASE ]
              </Button>
            </div>
          )}
        </div>

        {/* Terminal Input */}
        {bootComplete && (
          <div className="flex items-center mt-auto">
            <span className="text-green-400 mr-2">PIXELVAULT$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none text-green-400 font-mono text-sm outline-none flex-1"
              style={{ textShadow: '0 0 5px #00FF00' }}
              autoFocus
            />
            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />
          </div>
        )}
      </div>

      {/* Scanlines Effect */}
      <div 
        className="absolute pointer-events-none opacity-30"
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
          backgroundSize: '100% 4px',
          zIndex: 150
        }}
      />

      {/* Return Button */}
      <Button
        onClick={returnToDashboard}
        className="absolute bg-red-600 text-white border-none rounded-md px-4 py-2 font-mono font-bold cursor-pointer animate-pulse"
        style={{
          bottom: '20.5%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 200,
          textShadow: '0 0 5px #FF0000',
          boxShadow: '0 0 10px #FF0000'
        }}
      >
        RETURN
      </Button>
    </div>
  );
}