import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Terminal, 
  TerminalHeader, 
  TerminalBody, 
  TerminalOutput, 
  TerminalInput 
} from "@/components/ui/terminal";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";

// Types for secret drops and Thringlets
interface SecretDrop {
  id: string;
  name: string;
  code: string;
  description: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
  reward: number; // in μPVX
  claimable: boolean;
  expiresAt: Date;
}

interface Thringlet {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  properties: {
    [key: string]: string | number | boolean;
  };
  imageUrl?: string;
}

// Mock data for testing (will be replaced with API calls)
const MOCK_SECRET_DROPS: SecretDrop[] = [
  {
    id: "drop-001",
    name: "Genesis Drop",
    code: "ZKVAULT2025",
    description: "The first secret drop on PVX network",
    tier: 'legendary',
    reward: 69420000, // 69.42 PVX
    claimable: true,
    expiresAt: new Date(Date.now() + 86400000 * 7) // 7 days from now
  },
  {
    id: "drop-002",
    name: "Early Adopter",
    code: "PIXELEARLY",
    description: "Reward for early PVX adopters",
    tier: 'epic',
    reward: 5000000, // 5 PVX
    claimable: true,
    expiresAt: new Date(Date.now() + 86400000 * 3) // 3 days from now
  }
];

const MOCK_THRINGLETS: Thringlet[] = [
  {
    id: "thring-001",
    name: "Matrix Hacker",
    rarity: 'legendary',
    properties: {
      speed: 95,
      hack: 85,
      stealth: 90,
      special: "Can access hidden terminals"
    }
  },
  {
    id: "thring-002",
    name: "Crypto Ghost",
    rarity: 'epic',
    properties: {
      speed: 80,
      hack: 75,
      stealth: 100,
      special: "Invisible to tracking systems"
    }
  }
];

// Terminal command handler
const handleCommand = (
  command: string, 
  setOutputs: React.Dispatch<React.SetStateAction<string[]>>,
  wallet: any,
  toast: any
): void => {
  const cmd = command.trim().toLowerCase();
  const args = cmd.split(' ');
  
  // Process command based on the first word
  switch(args[0]) {
    case 'help':
      setOutputs(prev => [...prev, 
        "Available commands:",
        "help                - Show this help message",
        "list drops          - List all available secret drops",
        "list thringlets     - List all your Thringlets",
        "claim [drop-code]   - Claim a secret drop using its code",
        "inspect [thringlet] - Inspect details of a Thringlet",
        "scan               - Scan for new secret drops",
        "status             - Show current terminal status",
        "clear              - Clear terminal output"
      ]);
      break;
      
    case 'list':
      if (args[1] === 'drops') {
        setOutputs(prev => [...prev, "===== SECRET DROPS =====", "ID | NAME | TIER | REWARD | EXPIRES"]);
        MOCK_SECRET_DROPS.forEach(drop => {
          setOutputs(prev => [...prev, 
            `${drop.id} | ${drop.name} | ${drop.tier.toUpperCase()} | ${drop.reward / 1000000} PVX | ${drop.expiresAt.toLocaleDateString()}`
          ]);
        });
        setOutputs(prev => [...prev, "======================", "Use 'claim [code]' to claim a drop"]);
      } else if (args[1] === 'thringlets') {
        setOutputs(prev => [...prev, "===== YOUR THRINGLETS =====", "ID | NAME | RARITY"]);
        MOCK_THRINGLETS.forEach(thringlet => {
          setOutputs(prev => [...prev, 
            `${thringlet.id} | ${thringlet.name} | ${thringlet.rarity.toUpperCase()}`
          ]);
        });
        setOutputs(prev => [...prev, "=========================", "Use 'inspect [id]' to see details"]);
      } else {
        setOutputs(prev => [...prev, "Unknown list command. Try 'list drops' or 'list thringlets'"]);
      }
      break;
      
    case 'claim':
      if (!args[1]) {
        setOutputs(prev => [...prev, "ERROR: Missing drop code. Usage: claim [code]"]);
      } else {
        const code = args[1].toUpperCase();
        const drop = MOCK_SECRET_DROPS.find(d => d.code === code);
        
        if (drop && drop.claimable) {
          setOutputs(prev => [...prev, 
            `Claiming drop: ${drop.name}`,
            `Processing...`,
            `SUCCESS! You received ${drop.reward / 1000000} PVX as reward!`
          ]);
          
          // Show toast notification
          toast({
            title: "Drop Claimed Successfully",
            description: `You received ${drop.reward / 1000000} PVX from ${drop.name}`,
          });
          
        } else {
          setOutputs(prev => [...prev, `ERROR: Invalid or expired drop code: ${code}`]);
        }
      }
      break;
      
    case 'inspect':
      if (!args[1]) {
        setOutputs(prev => [...prev, "ERROR: Missing Thringlet ID. Usage: inspect [id]"]);
      } else {
        const id = args[1];
        const thringlet = MOCK_THRINGLETS.find(t => t.id === id);
        
        if (thringlet) {
          setOutputs(prev => [...prev, 
            `===== THRINGLET: ${thringlet.name} =====`,
            `ID: ${thringlet.id}`,
            `Rarity: ${thringlet.rarity.toUpperCase()}`,
            `Properties:`,
            `- Speed: ${thringlet.properties.speed}`,
            `- Hack: ${thringlet.properties.hack}`,
            `- Stealth: ${thringlet.properties.stealth}`,
            `- Special: ${thringlet.properties.special}`,
            `================================`
          ]);
        } else {
          setOutputs(prev => [...prev, `ERROR: Thringlet not found with ID: ${id}`]);
        }
      }
      break;
      
    case 'scan':
      setOutputs(prev => [...prev, 
        "Scanning network for secret drops...",
        "...",
        "...",
        "Scan complete. Found 2 active drops.",
        "Use 'list drops' to see available drops"
      ]);
      break;
      
    case 'status':
      setOutputs(prev => [...prev, 
        "===== TERMINAL STATUS =====",
        `Connected: YES`,
        `Wallet: ${wallet ? wallet.publicAddress.substring(0, 10) + '...' : 'Not connected'}`,
        `Network: PVX-MAINNET`,
        `Secret drops available: ${MOCK_SECRET_DROPS.length}`,
        `Thringlets owned: ${MOCK_THRINGLETS.length}`,
        `Terminal security: MAXIMUM`,
        `===========================`
      ]);
      break;
      
    case 'clear':
      setOutputs([]);
      break;
      
    default:
      setOutputs(prev => [...prev, `Command not recognized: ${cmd}. Type 'help' for available commands.`]);
  }
};

export function AdvancedDropTerminal() {
  const [command, setCommand] = useState("");
  const [outputs, setOutputs] = useState<string[]>(["Welcome to the Advanced Drop Terminal", "Type 'help' to see available commands", "--------------------------"]);
  const { wallet } = useWallet();
  const { toast } = useToast();
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (command.trim()) {
      // Add command to output history
      setOutputs(prev => [...prev, `> ${command}`]);
      
      // Process command
      handleCommand(command, setOutputs, wallet, toast);
      
      // Clear command input
      setCommand("");
    }
  };
  
  // Auto scroll to bottom when outputs change
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [outputs]);
  
  // Initial boot message
  useEffect(() => {
    const timer = setTimeout(() => {
      setOutputs(prev => [...prev, 
        "Terminal ready. Secure connection established.",
        `Current time: ${new Date().toLocaleString()}`,
        "Type 'scan' to search for secret drops"
      ]);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="flex flex-col h-full">
      <Terminal className="w-full h-full border border-[#00a2ff] bg-black/80 text-[#00a2ff] shadow-[0_0_15px_rgba(0,162,255,0.5)]">
        <TerminalHeader>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-medium">PVX-SECURE-TERMINAL v2.5</div>
            <div className="flex space-x-1">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </TerminalHeader>
        
        <TerminalBody ref={terminalBodyRef} className="font-mono text-sm overflow-auto p-4">
          {outputs.map((output, index) => (
            <TerminalOutput key={index}>{output}</TerminalOutput>
          ))}
          
          <form onSubmit={handleSubmit} className="mt-2">
            <TerminalInput>
              <span className="text-[#00a2ff] mr-2">&gt;</span>
              <Input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="bg-transparent border-none text-[#00a2ff] focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                autoFocus
              />
            </TerminalInput>
          </form>
        </TerminalBody>
      </Terminal>
    </div>
  );
}