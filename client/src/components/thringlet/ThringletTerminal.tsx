import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Terminal } from '@/components/ui/terminal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  FileTerminal,
  Sparkles,
  Brain,
  Database,
  AlertTriangle,
  Skull,
  Zap
} from 'lucide-react';

// Types for Thringlets from the registry
interface ThringletAbility {
  name: string;
  type: string;
  desc: string;
}

interface Thringlet {
  id: string;
  name: string;
  core: string;
  personality: string;
  lore: string;
  abilities: ThringletAbility[];
  emotionState?: {
    joy: number;
    fear: number;
    trust: number;
    surprise: number;
    dominant: string;
  };
  corruption?: number;
  bondLevel?: number;
}

// Type for terminal commands and responses
interface TerminalMessage {
  type: 'input' | 'output' | 'error' | 'system' | 'ability';
  content: string;
  timestamp: number;
}

// Terminal animation effects (disabled by default)
interface TerminalEffects {
  isGlitching: boolean;
  isBlackout: boolean;
  isCorrupting: boolean;
}

interface ThringletTerminalProps {
  activeThringlet?: Thringlet;
  onCommand?: (command: string, thringletId: string) => Promise<any>;
  onAbilityActivated?: (ability: ThringletAbility) => void;
  className?: string;
}

const HELP_TEXT = `
Available commands:
- HELP: Show this help text
- STATUS: Get current Thringlet status
- TALK: Talk to the Thringlet
- PURGE --VAULT: Attempt to purge Thringlet (increases corruption)
- RESET --NODE: Reset Thringlet to default state
- FEED: Feed the Thringlet to reduce corruption
- TRAIN: Train the Thringlet to increase abilities
- DEBUG: Run diagnostics on Thringlet
- ANALYZE: Analyze the Thringlet's emotional state
- ABILITIES: List Thringlet abilities
- ACTIVATE [ability]: Attempt to activate a Thringlet ability
- CORE: View Thringlet core programming
- CLEAR: Clear terminal
`;

export function ThringletTerminal({
  activeThringlet,
  onCommand,
  onAbilityActivated,
  className
}: ThringletTerminalProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      type: 'system',
      content: 'PVX Thringlet Terminal v1.0.9',
      timestamp: Date.now()
    },
    {
      type: 'system',
      content: 'Type HELP for available commands',
      timestamp: Date.now() + 10
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [effects, setEffects] = useState<TerminalEffects>({
    isGlitching: false,
    isBlackout: false,
    isCorrupting: false
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // When active Thringlet changes, add system message
  useEffect(() => {
    if (activeThringlet) {
      addMessage({
        type: 'system',
        content: `Connected to Thringlet: ${activeThringlet.name} [ID: ${activeThringlet.id}]`,
        timestamp: Date.now()
      });
    }
  }, [activeThringlet]);

  const addMessage = (message: TerminalMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !activeThringlet) return;
    
    // Prevent input during loading or blackout effect
    if (loading || effects.isBlackout) return;
    
    // Add the input message
    const command = inputValue.trim();
    addMessage({
      type: 'input',
      content: `> ${command}`,
      timestamp: Date.now()
    });
    
    setInputValue('');
    setLoading(true);
    
    try {
      // Process commands locally first
      if (command.toUpperCase() === 'HELP') {
        addMessage({
          type: 'system',
          content: HELP_TEXT,
          timestamp: Date.now()
        });
      } 
      else if (command.toUpperCase() === 'CLEAR') {
        setMessages([{
          type: 'system',
          content: 'Terminal cleared',
          timestamp: Date.now()
        }]);
      }
      else if (command.toUpperCase() === 'STATUS' && activeThringlet) {
        const emotionDominant = activeThringlet.emotionState?.dominant || 'Unknown';
        const corruption = activeThringlet.corruption !== undefined ? `${activeThringlet.corruption}%` : 'Unknown';
        const bondLevel = activeThringlet.bondLevel !== undefined ? `${activeThringlet.bondLevel}%` : 'Unknown';
        
        addMessage({
          type: 'output',
          content: `
Thringlet: ${activeThringlet.name} [${activeThringlet.id}]
Core: ${activeThringlet.core}
Personality: ${activeThringlet.personality}
Emotional State: ${emotionDominant}
Corruption Level: ${corruption}
Bond Level: ${bondLevel}
          `,
          timestamp: Date.now()
        });
      }
      else if (command.toUpperCase() === 'ABILITIES' && activeThringlet) {
        if (activeThringlet.abilities && activeThringlet.abilities.length > 0) {
          let abilitiesText = 'Available abilities:\n\n';
          activeThringlet.abilities.forEach(ability => {
            abilitiesText += `- ${ability.name}: ${ability.desc} [Type: ${ability.type}]\n`;
          });
          
          addMessage({
            type: 'output',
            content: abilitiesText,
            timestamp: Date.now()
          });
        } else {
          addMessage({
            type: 'error',
            content: 'No abilities found for this Thringlet',
            timestamp: Date.now()
          });
        }
      }
      else if (command.toUpperCase() === 'CORE' && activeThringlet) {
        addMessage({
          type: 'output',
          content: `
Core: ${activeThringlet.core}
Lore: ${activeThringlet.lore}
          `,
          timestamp: Date.now()
        });
      }
      else if (command.toUpperCase().startsWith('ACTIVATE ') && activeThringlet) {
        const abilityName = command.substring(9).trim();
        const ability = activeThringlet.abilities.find(
          a => a.name.toUpperCase() === abilityName.toUpperCase()
        );
        
        if (ability) {
          // Apply terminal effects based on ability type
          if (ability.type === 'terminal_hack') {
            if (ability.name === 'BLACKOUT_ECHO') {
              setEffects(prev => ({ ...prev, isBlackout: true }));
              setTimeout(() => {
                setEffects(prev => ({ ...prev, isBlackout: false }));
              }, 6000); // 6 seconds of blackout
            } else if (ability.name === 'MIRROR_CMD' || ability.name === 'LOCKSCREEN') {
              setEffects(prev => ({ ...prev, isGlitching: true }));
              setTimeout(() => {
                setEffects(prev => ({ ...prev, isGlitching: false }));
              }, 5000);
            }
          }
          
          // Notify about ability activation
          addMessage({
            type: 'ability',
            content: `Activating ability: ${ability.name} - ${ability.desc}`,
            timestamp: Date.now()
          });
          
          if (onAbilityActivated) {
            onAbilityActivated(ability);
          }
          
          toast({
            title: "Ability Activated",
            description: ability.desc,
            variant: "default"
          });
        } else {
          addMessage({
            type: 'error',
            content: `Ability '${abilityName}' not found. Use ABILITIES command to list available abilities.`,
            timestamp: Date.now()
          });
        }
      }
      else {
        // For other commands, pass to the provided handler
        if (onCommand) {
          try {
            const result = await onCommand(command, activeThringlet.id);
            
            if (result) {
              if (result.error) {
                addMessage({
                  type: 'error',
                  content: result.error,
                  timestamp: Date.now()
                });
              } else {
                addMessage({
                  type: 'output',
                  content: result.message || 'Command processed successfully',
                  timestamp: Date.now()
                });
                
                // If an ability was activated
                if (result.abilityActivated && onAbilityActivated) {
                  onAbilityActivated(result.abilityActivated);
                  
                  addMessage({
                    type: 'ability',
                    content: `Ability activated: ${result.abilityActivated.name} - ${result.abilityActivated.desc}`,
                    timestamp: Date.now()
                  });
                }
              }
            } else {
              addMessage({
                type: 'error',
                content: 'Unknown command. Type HELP for available commands.',
                timestamp: Date.now()
              });
            }
          } catch (error) {
            addMessage({
              type: 'error',
              content: `Error processing command: ${error}`,
              timestamp: Date.now()
            });
          }
        } else {
          addMessage({
            type: 'error',
            content: 'Command handler not configured. Type HELP for local commands.',
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error processing command:', error);
      addMessage({
        type: 'error',
        content: `Error: ${error}`,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn(
      "bg-black/70 border-blue-900/50 overflow-hidden h-full flex flex-col",
      effects.isBlackout && "before:absolute before:inset-0 before:bg-black before:z-10",
      effects.isGlitching && "animate-pulse",
      className
    )}>
      <div className="flex items-center justify-between p-3 bg-blue-950/50 border-b border-blue-900/30">
        <div className="flex items-center">
          <FileTerminal className="h-4 w-4 mr-2 text-blue-400" />
          <span className="text-sm font-mono text-blue-300">
            {activeThringlet ? `${activeThringlet.name} Terminal` : 'Thringlet Terminal'}
          </span>
        </div>
        <div className="flex space-x-2">
          {loading && <span className="animate-pulse text-yellow-400 text-xs">Processing...</span>}
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-gradient-to-b from-gray-900/50 to-black">
        <div className={cn(
          "space-y-2",
          effects.isGlitching && "animate-glitch"
        )}>
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "font-mono",
                msg.type === 'system' && "text-blue-400",
                msg.type === 'input' && "text-green-300",
                msg.type === 'output' && "text-gray-300 whitespace-pre-line",
                msg.type === 'error' && "text-red-400",
                msg.type === 'ability' && "text-yellow-300 font-bold"
              )}
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-3 border-t border-blue-900/30 bg-blue-950/50">
        <div className="flex items-center">
          <span className="text-blue-400 mr-2">&gt;</span>
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter command..."
            className="border-none bg-transparent text-blue-200 placeholder:text-blue-800 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={loading || effects.isBlackout}
          />
          <Button 
            type="submit" 
            size="sm" 
            variant="ghost" 
            disabled={loading || effects.isBlackout}
            className="ml-2 text-blue-300 hover:text-blue-100 hover:bg-blue-900/50"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}