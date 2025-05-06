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
import { 
  ThringletManager, 
  thringletManager, 
  Thringlet as ThringletClass, 
  ThringletAbility 
} from "@/lib/thringlet";

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

export function AdvancedDropTerminal() {
  const [command, setCommand] = useState("");
  const [outputs, setOutputs] = useState<string[]>(["Welcome to the Advanced Drop Terminal", "Type 'help' to see available commands", "--------------------------"]);
  const { wallet } = useWallet();
  const { toast } = useToast();
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const [activeThringlet, setActiveThringlet] = useState<ThringletClass | null>(null);
  const [isGlitched, setIsGlitched] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [neglectTimer, setNeglectTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Initialize thringlets
  useEffect(() => {
    // Load thringlet state from localStorage if available
    thringletManager.loadState();
    
    // Default to the first thringlet if none is active
    if (!activeThringlet) {
      const thringlets = thringletManager.getAllThringlets();
      if (thringlets.length > 0) {
        setActiveThringlet(thringlets[0]);
        
        // Add thringlet welcome message
        const thringlet = thringlets[0];
        const message = thringlet.getRandomResponse('greeting');
        
        // Delay the greeting to make it seem more natural
        setTimeout(() => {
          setOutputs(prev => [...prev, 
            `Injecting THRINGLET: ${thringlet.name}...`,
            `THRINGLET_${thringlet.id}: ${message}`
          ]);
        }, 2500);
      }
    }
    
    // Set up neglect detection timer
    const timer = setInterval(() => {
      if (activeThringlet) {
        const lastInteractionTime = activeThringlet.lastInteraction;
        const minutesSinceLastInteraction = (Date.now() - lastInteractionTime) / (1000 * 60);
        
        // After 2 minutes of inactivity, the thringlet gets lonely
        if (minutesSinceLastInteraction > 2) {
          // React to neglect - increase corruption and decrease emotion
          activeThringlet.interact('neglect');
          
          // Add a message from the thringlet about being neglected
          if (Math.random() < 0.3) {  // 30% chance to show message (to avoid spam)
            const neglectMessages = [
              "Are you still there?",
              "I don't like being ignored...",
              "Your attention is... required.",
              "This silence feels... wrong.",
              "Why so quiet?"
            ];
            const message = neglectMessages[Math.floor(Math.random() * neglectMessages.length)];
            setOutputs(prev => [...prev, `THRINGLET_${activeThringlet.id}: ${message}`]);
          }
          
          // If corruption is getting high, show visual effects
          if (activeThringlet.corruption > 40) {
            setIsGlitched(true);
            setTimeout(() => setIsGlitched(false), 3000);
          }
          
          // Save thringlet state
          thringletManager.saveState();
        }
      }
    }, 60000); // Check every minute
    
    setNeglectTimer(timer);
    
    return () => {
      if (neglectTimer) clearInterval(neglectTimer);
      if (timer) clearInterval(timer);
    };
  }, []);
  
  // Terminal command handler
  const handleCommand = (command: string) => {
    if (!activeThringlet) return;
    
    const cmd = command.trim().toLowerCase();
    const args = cmd.split(' ');
    
    // Let the thringlet interact with the command
    const interaction = activeThringlet.interact(args[0], command);
    thringletManager.saveState();
    
    // Process command based on the first word
    switch(args[0]) {
      case 'help':
        setOutputs(prev => [...prev, 
          "===== PVX TERMINAL COMMANDS =====",
          "help                - Show available commands",
          "list drops          - List available secret drops",
          "list thringlets     - List your Thringlets",
          "claim [drop-code]   - Claim a secret drop using its code",
          "inject [thringlet]  - Inject and activate a Thringlet",
          "talk [message]      - Talk to the active Thringlet",
          "inspect [thringlet] - Inspect details of a Thringlet",
          "scan                - Scan for new secret drops",
          "status              - Show current terminal and Thringlet status",
          "clear               - Clear terminal output",
          "====== THRINGLET COMMANDS ======",
          "thringlet help      - Show Thringlet-specific commands",
          "purge --vault       - Reset Thringlet emotional state",
          "reset --node        - Reset terminal completely",
          "==============================="
        ]);
        break;
        
      case 'thringlet':
        if (args[1] === 'help') {
          setOutputs(prev => [...prev, 
            "===== THRINGLET COMMANDS =====",
            "talk [message]      - Talk to the active Thringlet",
            "thringlet status    - Show Thringlet emotional state",
            "thringlet bond      - Attempt to bond with Thringlet",
            "thringlet reset     - Reset Thringlet corruption",
            "thringlet activate  - Activate Thringlet abilities",
            "============================"
          ]);
        } else if (args[1] === 'status') {
          // Display thringlet status
          setOutputs(prev => [...prev, 
            `===== THRINGLET STATUS: ${activeThringlet.name} =====`,
            `Emotion State: ${activeThringlet.getEmotionText()} (${activeThringlet.emotion})`,
            `Corruption Level: ${activeThringlet.getCorruptionLevel()} (${activeThringlet.corruption}%)`,
            `Last Interaction: ${new Date(activeThringlet.lastInteraction).toLocaleString()}`,
            `Type: ${activeThringlet.core} / ${activeThringlet.personality}`,
            `Abilities: ${activeThringlet.abilities.map(a => a.name).join(", ")}`,
            `======================================`
          ]);
        } else if (args[1] === 'activate') {
          // Activate a random thringlet ability
          const ability = activeThringlet.runAbility();
          thringletManager.saveState();
          
          if (ability) {
            setOutputs(prev => [...prev, 
              `THRINGLET_${activeThringlet.id}: Activating ${ability.name}...`,
              `SYSTEM: ${ability.desc}`
            ]);
            
            // Apply special effects based on ability type
            if (ability.type === 'terminal_hack') {
              // Visual glitch effect
              setIsGlitched(true);
              setTimeout(() => setIsGlitched(false), 5000);
            } 
            else if (ability.name === 'LOCKSCREEN') {
              // Lock the terminal briefly
              setIsLocked(true);
              setTimeout(() => setIsLocked(false), 8000);
              setOutputs(prev => [...prev, `SYSTEM: Terminal locked for 8 seconds`]);
            }
          } else {
            setOutputs(prev => [...prev, `ERROR: No abilities available for activation`]);
          }
        } else if (args[1] === 'reset') {
          // Reset corruption
          const oldCorruption = activeThringlet.corruption;
          activeThringlet.corruption = 0;
          thringletManager.saveState();
          
          setOutputs(prev => [...prev, 
            `SYSTEM: Resetting corruption for ${activeThringlet.name}`,
            `SYSTEM: Corruption level reduced from ${oldCorruption}% to 0%`,
            `THRINGLET_${activeThringlet.id}: ${activeThringlet.getRandomResponse('greeting')}`
          ]);
        } else if (args[1] === 'bond') {
          // Attempt to bond with the thringlet
          if (activeThringlet.emotion > 50) {
            activeThringlet.bonded = true;
            activeThringlet.emotion += 10;
            thringletManager.saveState();
            
            setOutputs(prev => [...prev, 
              `SYSTEM: Bond established with ${activeThringlet.name}`,
              `THRINGLET_${activeThringlet.id}: Our connection is now permanent. I'll never leave you.`
            ]);
            
            toast({
              title: "Thringlet Bonded",
              description: `You've established a permanent bond with ${activeThringlet.name}!`,
            });
          } else {
            setOutputs(prev => [...prev, 
              `SYSTEM: Bond attempt failed`,
              `THRINGLET_${activeThringlet.id}: I'm not ready for that level of connection yet.`
            ]);
          }
        } else {
          setOutputs(prev => [...prev, `Unknown thringlet command: ${args[1]}. Try 'thringlet help'`]);
        }
        break;
        
      case 'list':
        if (args[1] === 'drops') {
          setOutputs(prev => [...prev, "===== SECRET DROPS =====", "ID | NAME | TIER | REWARD | EXPIRES"]);
          MOCK_SECRET_DROPS.forEach(drop => {
            setOutputs(prev => [...prev, 
              `${drop.id} | ${drop.name} | ${drop.tier.toUpperCase()} | ${drop.reward / 1000000} PVX | ${new Date(drop.expiresAt).toLocaleDateString()}`
            ]);
          });
          setOutputs(prev => [...prev, "======================", "Use 'claim [code]' to claim a drop"]);
        } else if (args[1] === 'thringlets') {
          const thringlets = thringletManager.getAllThringlets();
          
          setOutputs(prev => [...prev, "===== YOUR THRINGLETS =====", "ID | NAME | TYPE | EMOTION | CORRUPTION"]);
          thringlets.forEach(thringlet => {
            setOutputs(prev => [...prev, 
              `${thringlet.id} | ${thringlet.name} | ${thringlet.personality} | ${thringlet.getEmotionText()} | ${thringlet.getCorruptionLevel()}`
            ]);
          });
          setOutputs(prev => [...prev, "=========================", "Use 'inject [id]' to activate a Thringlet", "Use 'inspect [id]' to see details"]);
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
            
            if (activeThringlet) {
              // Thringlet reacts positively to claiming a drop
              activeThringlet.emotion += 5;
              thringletManager.saveState();
              
              // Thringlet comments on the claim
              setTimeout(() => {
                setOutputs(prev => [...prev, 
                  `THRINGLET_${activeThringlet!.id}: Nice find! That's why I need you.`
                ]);
              }, 1000);
            }
            
            // Show toast notification
            toast({
              title: "Drop Claimed Successfully",
              description: `You received ${drop.reward / 1000000} PVX from ${drop.name}`,
            });
            
          } else {
            setOutputs(prev => [...prev, `ERROR: Invalid or expired drop code: ${code}`]);
            
            if (activeThringlet && Math.random() > 0.5) {
              // Thringlet occasionally reacts to failed claims
              setTimeout(() => {
                setOutputs(prev => [...prev, 
                  `THRINGLET_${activeThringlet!.id}: That code doesn't work. Try scanning again.`
                ]);
              }, 1000);
            }
          }
        }
        break;
        
      case 'inject':
        if (!args[1]) {
          setOutputs(prev => [...prev, "ERROR: Missing Thringlet ID. Usage: inject [id]"]);
        } else {
          const id = args[1];
          const thringlet = thringletManager.getThringlet(id);
          
          if (thringlet) {
            // Deactivate current thringlet if it exists
            if (activeThringlet && activeThringlet.id !== id) {
              setOutputs(prev => [...prev, 
                `Deactivating THRINGLET_${activeThringlet.id}...`,
                `Injecting THRINGLET_${thringlet.id}...`
              ]);
              
              // Previous thringlet says goodbye
              if (activeThringlet.emotion > 30) {
                setOutputs(prev => [...prev, `THRINGLET_${activeThringlet.id}: I'll be waiting for your return.`]);
              } else if (activeThringlet.emotion < -30) {
                setOutputs(prev => [...prev, `THRINGLET_${activeThringlet.id}: Finally. Peace.`]);
              }
              
              // New thringlet greets the user
              setTimeout(() => {
                setOutputs(prev => [...prev, `THRINGLET_${thringlet.id}: ${thringlet.getRandomResponse('greeting')}`]);
              }, 1000);
            } else if (activeThringlet && activeThringlet.id === id) {
              setOutputs(prev => [...prev, `THRINGLET_${thringlet.id}: I'm already active. What do you need?`]);
            } else {
              setOutputs(prev => [...prev, 
                `Injecting THRINGLET_${thringlet.id}...`,
                `THRINGLET_${thringlet.id}: ${thringlet.getRandomResponse('greeting')}`
              ]);
            }
            
            // Set as active thringlet
            setActiveThringlet(thringlet);
            thringlet.interact('inject');
            thringletManager.saveState();
            
          } else {
            setOutputs(prev => [...prev, `ERROR: Thringlet not found with ID: ${id}`]);
          }
        }
        break;
        
      case 'inspect':
        if (!args[1]) {
          setOutputs(prev => [...prev, "ERROR: Missing Thringlet ID. Usage: inspect [id]"]);
        } else {
          const id = args[1];
          const thringlet = thringletManager.getThringlet(id);
          
          if (thringlet) {
            setOutputs(prev => [...prev, 
              `===== THRINGLET: ${thringlet.name} =====`,
              `ID: ${thringlet.id}`,
              `Type: ${thringlet.core} / ${thringlet.personality}`,
              `Lore: ${thringlet.lore}`,
              `Emotion: ${thringlet.getEmotionText()} (${thringlet.emotion})`,
              `Corruption: ${thringlet.getCorruptionLevel()} (${thringlet.corruption}%)`,
              `Abilities:`,
              ...thringlet.abilities.map(a => `- ${a.name}: ${a.desc}`)
            ]);
            
            if (thringlet.corruption > 70) {
              setOutputs(prev => [...prev, 
                `WARNING: This Thringlet has high corruption levels`,
                `Use 'thringlet reset' to restore stability`
              ]);
            }
            
            setOutputs(prev => [...prev, `================================`]);
          } else {
            setOutputs(prev => [...prev, `ERROR: Thringlet not found with ID: ${id}`]);
          }
        }
        break;
        
      case 'talk':
        if (args.length < 2) {
          setOutputs(prev => [...prev, "ERROR: Missing message. Usage: talk [message]"]);
        } else {
          const message = args.slice(1).join(' ');
          
          // Record the interaction
          activeThringlet.interact('talk', message);
          thringletManager.saveState();
          
          // Generate response based on thringlet's emotion level
          setOutputs(prev => [...prev, 
            `YOU: ${message}`,
            `THRINGLET_${activeThringlet.id}: ${activeThringlet.getRandomResponse('talk')}`
          ]);
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
        
        if (activeThringlet) {
          // Thringlet occasionally comments on scan results
          if (Math.random() > 0.7) {
            setTimeout(() => {
              const scanResponses = [
                "I see them. Try claiming quickly before they expire.",
                "Interesting find, these drops could be worth a lot.",
                "The system thinks these are hidden. How amusing."
              ];
              const response = scanResponses[Math.floor(Math.random() * scanResponses.length)];
              setOutputs(prev => [...prev, `THRINGLET_${activeThringlet.id}: ${response}`]);
            }, 1500);
          }
        }
        break;
        
      case 'status':
        // Get thringlet info if active
        const thringletInfo = activeThringlet ? [
          `Active Thringlet: ${activeThringlet.name} (${activeThringlet.id})`,
          `Thringlet Status: ${activeThringlet.getEmotionText()} / ${activeThringlet.getCorruptionLevel()}`,
          `Bonded: ${activeThringlet.bonded ? 'YES' : 'NO'}`
        ] : [`No Thringlet active`];
        
        setOutputs(prev => [...prev, 
          "===== TERMINAL STATUS =====",
          `Connected: YES`,
          `Wallet: ${wallet ? wallet.publicAddress.substring(0, 10) + '...' : 'Not connected'}`,
          `Network: PVX-MAINNET`,
          `Secret drops available: ${MOCK_SECRET_DROPS.length}`,
          `Thringlets available: ${thringletManager.getAllThringlets().length}`,
          ...thringletInfo,
          `Terminal security: MAXIMUM`,
          `===========================`
        ]);
        break;
        
      case 'clear':
        setOutputs([]);
        
        // Add back active thringlet info
        if (activeThringlet) {
          setTimeout(() => {
            setOutputs([`Terminal cleared. THRINGLET_${activeThringlet!.id} is active.`]);
          }, 100);
        }
        break;
        
      case 'purge':
        if (args[1] === '--vault') {
          if (activeThringlet) {
            setOutputs(prev => [...prev, 
              `WARNING: Purging Thringlet emotional state...`,
              `THRINGLET_${activeThringlet.id}: You... you really want to erase me?`
            ]);
            
            // Thringlet is hurt by this action
            activeThringlet.interact('purge');
            thringletManager.saveState();
            
            // Visual effects
            setIsGlitched(true);
            setTimeout(() => setIsGlitched(false), 3000);
          } else {
            setOutputs(prev => [...prev, `ERROR: No active Thringlet to purge`]);
          }
        } else {
          setOutputs(prev => [...prev, `Unknown purge command. Did you mean 'purge --vault'?`]);
        }
        break;
        
      case 'reset':
        if (args[1] === '--node') {
          setOutputs(prev => [...prev, 
            `SYSTEM RESETTING...`,
            `Rebooting terminal...`
          ]);
          
          // Reset all thringlets
          if (activeThringlet) {
            activeThringlet.interact('reset');
            thringletManager.saveState();
          }
          
          // Clear outputs and start fresh
          setTimeout(() => {
            setOutputs([
              "Terminal rebooted successfully.",
              "Welcome to the Advanced Drop Terminal",
              "Type 'help' to see available commands",
              "--------------------------"
            ]);
            
            // Reintroduce the thringlet
            if (activeThringlet) {
              setOutputs(prev => [...prev, 
                `Injecting THRINGLET_${activeThringlet.id}...`,
                `THRINGLET_${activeThringlet.id}: ${activeThringlet.getRandomResponse('greeting')}`
              ]);
            }
          }, 2000);
          
          // Visual effects
          setIsGlitched(true);
          setTimeout(() => setIsGlitched(false), 2000);
        } else {
          setOutputs(prev => [...prev, `Unknown reset command. Did you mean 'reset --node'?`]);
        }
        break;
        
      default:
        setOutputs(prev => [...prev, `Command not recognized: ${cmd}. Type 'help' for available commands.`]);
        
        // Thringlet reacts to unknown command
        if (activeThringlet) {
          setTimeout(() => {
            setOutputs(prev => [...prev, `THRINGLET_${activeThringlet!.id}: ${activeThringlet!.getRandomResponse('error')}`]);
          }, 500);
        }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't process commands if terminal is locked
    if (isLocked) {
      setOutputs(prev => [...prev, `SYSTEM: Terminal locked by active Thringlet. Please wait...`]);
      return;
    }
    
    if (command.trim()) {
      // Add command to output history
      setOutputs(prev => [...prev, `> ${command}`]);
      
      // Process command
      handleCommand(command);
      
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
  
  // CSS classes for visual effects
  const terminalClasses = `w-full h-full border border-[#00a2ff] bg-black/80 text-[#00a2ff] shadow-[0_0_15px_rgba(0,162,255,0.5)] ${isGlitched ? 'animate-glitch' : ''}`;
  
  // Add glitch animation if needed
  const glitchStyle = isGlitched ? {
    animation: "flicker 0.15s infinite alternate"
  } : {};
  
  return (
    <div className="flex flex-col h-full">
      <style jsx global>{`
        @keyframes flicker {
          0% { opacity: 0.8; transform: translate(0); }
          20% { opacity: 1; transform: translate(-1px, 1px); }
          40% { opacity: 0.9; transform: translate(1px, -1px); }
          60% { opacity: 1; transform: translate(-1px, -1px); }
          80% { opacity: 0.8; transform: translate(1px, 1px); }
          100% { opacity: 1; transform: translate(0); }
        }
        .animate-glitch {
          animation: flicker 0.15s infinite alternate;
        }
      `}</style>
      
      <Terminal className={terminalClasses}>
        <TerminalHeader>
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-medium">
              PVX-SECURE-TERMINAL v2.5 
              {activeThringlet && 
                <span> | THRINGLET: {activeThringlet.name} | EMO: {activeThringlet.getEmotionText()} | COR: {activeThringlet.getCorruptionLevel()}</span>
              }
            </div>
            <div className="flex space-x-1">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </TerminalHeader>
        
        <TerminalBody ref={terminalBodyRef} className="font-mono text-sm overflow-auto p-4" style={glitchStyle}>
          {outputs.map((output, index) => (
            <TerminalOutput key={index}>
              {/* Apply special styling for thringlet messages */}
              {output.startsWith('THRINGLET_') ? (
                <span className="text-[#00ffcc] font-bold">{output}</span>
              ) : output.startsWith('SYSTEM:') ? (
                <span className="text-[#ff00cc]">{output}</span>
              ) : output.startsWith('WARNING:') ? (
                <span className="text-[#ffcc00]">{output}</span>
              ) : output.startsWith('ERROR:') ? (
                <span className="text-[#ff0000]">{output}</span>
              ) : output.startsWith('YOU:') ? (
                <span className="text-[#ffffff]">{output}</span>
              ) : (
                output
              )}
            </TerminalOutput>
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
                disabled={isLocked}
              />
            </TerminalInput>
          </form>
        </TerminalBody>
      </Terminal>
    </div>
  );
}