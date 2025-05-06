import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  FileTerminal, 
  Sparkles, 
  Lock, 
  Unlock, 
  KeyRound, 
  GiftIcon, 
  AlertTriangle,
  ShieldAlert,
  Brain,
  Database,
} from 'lucide-react';
import { Terminal } from '@/components/ui/Terminal';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/lib/utils';
import { TransactionFlow, TransactionStatus } from '@/components/ui/TransactionFlow';

// Define the interface for drop data
interface SecretDrop {
  id: string;
  code: string;
  title: string;
  description: string;
  rewards: string[];
  creatorAddress: string;
  claimedCount: number;
  maxClaims: number;
  isActive: boolean;
  expiration?: Date;
  emotionalProfile?: {
    joy: number;
    fear: number;
    trust: number;
    surprise: number;
  };
}

// Define the Thringlet type
interface Thringlet {
  id: string;
  name: string;
  type: string;
  level: number;
  attributes: {
    intellect: number;
    resilience: number;
    empathy: number;
    chaos: number;
  };
  abilities: string[];
  ownerAddress: string;
  bondingDate: Date;
  emotionalState: {
    joy: number;
    fear: number;
    trust: number;
    surprise: number;
    dominant: string;
  };
}

// Define props for the terminal component
interface AdvancedDropTerminalProps {
  onDropClaimed?: (dropId: string) => void;
  onThringletInteraction?: (thringletId: string, interaction: string) => void;
  className?: string;
}

export function AdvancedDropTerminal({ 
  onDropClaimed, 
  onThringletInteraction,
  className 
}: AdvancedDropTerminalProps) {
  // State for the terminal
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [accessLevel, setAccessLevel] = useState<number>(0);
  const [secretCode, setSecretCode] = useState<string>('');
  const [secretDrops, setSecretDrops] = useState<SecretDrop[]>([]);
  const [thringlets, setThringlets] = useState<Thringlet[]>([]);
  const [selectedThringlet, setSelectedThringlet] = useState<Thringlet | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // References
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { wallet } = useWallet();
  
  // Fetch secret drops and thringlets on component mount
  useEffect(() => {
    const fetchDropsAndThringlets = async () => {
      try {
        setLoading(true);
        
        // Fetch secret drops from API
        const dropsResponse = await fetch('/api/drops/secret');
        if (dropsResponse.ok) {
          const dropsData = await dropsResponse.json();
          setSecretDrops(dropsData);
        }
        
        // Fetch thringlets if wallet is connected
        if (wallet?.address) {
          const thringlentsResponse = await fetch(`/api/thringlets/owner/${wallet.address}`);
          if (thringlentsResponse.ok) {
            const thringletsData = await thringlentsResponse.json();
            setThringlets(thringletsData);
          }
        }
        
        setLoading(false);
        
        // Add welcome message to terminal
        addToCommandHistory('> Terminal v3.8.6 - PVX SecureDrop™ Protocol');
        addToCommandHistory('> Type "help" for available commands');
        
      } catch (error) {
        console.error('Error fetching drops and thringlets:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to establish secure connection to PVX network.',
          variant: 'destructive',
        });
        setLoading(false);
        
        // Add error message to terminal
        addToCommandHistory('> ERROR: Failed to establish secure connection');
        addToCommandHistory('> Type "reconnect" to retry');
      }
    };
    
    fetchDropsAndThringlets();
  }, [wallet?.address, toast]);
  
  // Auto-scroll to the bottom of the terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [commandHistory]);
  
  // Add a line to the command history
  const addToCommandHistory = (line: string) => {
    setCommandHistory(prev => [...prev, line]);
  };
  
  // Handle command submission
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCommand.trim() || isProcessing) return;
    
    // Add the command to history
    addToCommandHistory(`> ${currentCommand}`);
    
    // Process command
    await processCommand(currentCommand);
    
    // Clear current command
    setCurrentCommand('');
  };
  
  // Process the command
  const processCommand = async (command: string) => {
    const cmd = command.toLowerCase().trim();
    const args = cmd.split(' ').filter(arg => arg);
    
    setIsProcessing(true);
    
    // Simulate thinking time for a more realistic terminal experience
    await new Promise(resolve => setTimeout(resolve, 300));
    
    switch (args[0]) {
      case 'help':
        showHelp();
        break;
      case 'list':
        if (args[1] === 'drops') {
          listDrops();
        } else if (args[1] === 'thringlets') {
          listThringlets();
        } else {
          addToCommandHistory('> Usage: list [drops|thringlets]');
        }
        break;
      case 'access':
        if (args.length < 2) {
          addToCommandHistory('> Usage: access [level] [auth-code]');
        } else {
          await upgradeAccess(args[1], args[2]);
        }
        break;
      case 'claim':
        if (args.length < 2) {
          addToCommandHistory('> Usage: claim [drop-code]');
        } else {
          await claimDrop(args[1]);
        }
        break;
      case 'bond':
        if (args.length < 2) {
          addToCommandHistory('> Usage: bond [thringlet-id]');
        } else {
          await bondThringlet(args[1]);
        }
        break;
      case 'interact':
        if (args.length < 3) {
          addToCommandHistory('> Usage: interact [thringlet-id] [interaction-type]');
          addToCommandHistory('> Available interactions: stimulate, calm, challenge, reward');
        } else {
          await interactWithThringlet(args[1], args[2]);
        }
        break;
      case 'show':
        if (args.length < 2) {
          addToCommandHistory('> Usage: show [thringlet-id]');
        } else {
          showThringlet(args[1]);
        }
        break;
      case 'scan':
        if (args.length < 2) {
          addToCommandHistory('> Usage: scan [drop-code|address]');
        } else {
          await scanTarget(args[1]);
        }
        break;
      case 'status':
        showStatus();
        break;
      case 'clear':
        setCommandHistory([
          '> Terminal v3.8.6 - PVX SecureDrop™ Protocol',
          '> Type "help" for available commands'
        ]);
        break;
      case 'reconnect':
        await reconnect();
        break;
      case 'exit':
        addToCommandHistory('> Closing secure connection...');
        setTimeout(() => {
          addToCommandHistory('> Connection terminated');
        }, 1000);
        break;
      default:
        addToCommandHistory(`> Unknown command: ${args[0]}`);
        addToCommandHistory('> Type "help" for available commands');
    }
    
    setIsProcessing(false);
  };
  
  // Show help menu
  const showHelp = () => {
    addToCommandHistory('> Available commands:');
    addToCommandHistory('>   help - Show this help menu');
    addToCommandHistory('>   list [drops|thringlets] - List available secret drops or your thringlets');
    addToCommandHistory('>   access [level] [auth-code] - Upgrade access level with authorization code');
    addToCommandHistory('>   claim [drop-code] - Claim a secret drop with its code');
    addToCommandHistory('>   bond [thringlet-id] - Bond with a thringlet to create emotional link');
    addToCommandHistory('>   interact [thringlet-id] [interaction-type] - Interact with a thringlet');
    addToCommandHistory('>   show [thringlet-id] - Show detailed info about a thringlet');
    addToCommandHistory('>   scan [drop-code|address] - Scan a drop code or address for security');
    addToCommandHistory('>   status - Show your current access level and wallet status');
    addToCommandHistory('>   clear - Clear terminal history');
    addToCommandHistory('>   reconnect - Reconnect to PVX SecureDrop™ network');
    addToCommandHistory('>   exit - Close the terminal');
  };
  
  // List available drops based on access level
  const listDrops = () => {
    if (accessLevel < 1) {
      addToCommandHistory('> Access Denied: Insufficient access level');
      addToCommandHistory('> Required: Level 1 | Current: Level 0');
      addToCommandHistory('> Use "access 1 [auth-code]" to upgrade access');
      return;
    }
    
    if (secretDrops.length === 0) {
      addToCommandHistory('> No active secret drops found');
      return;
    }
    
    addToCommandHistory('> Available Secret Drops:');
    
    // Only show drops appropriate for the current access level
    const accessibleDrops = secretDrops.filter(drop => {
      // Show all drops for level 3, most for level 2, and few for level 1
      if (accessLevel === 3) return true;
      if (accessLevel === 2) return drop.claimedCount < (drop.maxClaims * 0.8);
      return drop.claimedCount < (drop.maxClaims * 0.5);
    });
    
    accessibleDrops.forEach(drop => {
      addToCommandHistory(`>   ${drop.id} - ${drop.title} - Claims: ${drop.claimedCount}/${drop.maxClaims}`);
    });
    
    addToCommandHistory('> Use "claim [drop-code]" to claim a drop');
  };
  
  // List owned thringlets
  const listThringlets = () => {
    if (!wallet?.address) {
      addToCommandHistory('> Error: Wallet not connected');
      addToCommandHistory('> Connect your wallet to view your thringlets');
      return;
    }
    
    if (thringlets.length === 0) {
      addToCommandHistory('> No thringlets found for your wallet');
      addToCommandHistory('> Claim secret drops to receive thringlets');
      return;
    }
    
    addToCommandHistory('> Your Thringlets:');
    thringlets.forEach(thringlet => {
      addToCommandHistory(`>   ${thringlet.id} - ${thringlet.name} (Lvl ${thringlet.level}) - Dominant Emotion: ${thringlet.emotionalState.dominant}`);
    });
    
    addToCommandHistory('> Use "show [thringlet-id]" for details');
    addToCommandHistory('> Use "interact [thringlet-id] [interaction-type]" to interact');
  };
  
  // Upgrade access level with authorization code
  const upgradeAccess = async (levelStr: string, authCode: string) => {
    const level = parseInt(levelStr);
    
    if (isNaN(level) || level < 0 || level > 3) {
      addToCommandHistory('> Error: Invalid access level');
      addToCommandHistory('> Valid access levels: 1, 2, 3');
      return;
    }
    
    if (level <= accessLevel) {
      addToCommandHistory(`> Already at level ${accessLevel}`);
      return;
    }
    
    if (!authCode) {
      addToCommandHistory('> Error: Authorization code required');
      addToCommandHistory('> Usage: access [level] [auth-code]');
      return;
    }
    
    addToCommandHistory('> Verifying authorization code...');
    
    // Simulate processing...
    setTransactionStatus('encrypting');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Validate auth code against API
      const response = await fetch('/api/verify-auth-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          requestedLevel: level,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.valid) {
          setTransactionStatus('success');
          await new Promise(resolve => setTimeout(resolve, 1500));
          setTransactionStatus(null);
          
          setAccessLevel(level);
          addToCommandHistory(`> Access granted: Level ${level}`);
          addToCommandHistory('> New permissions unlocked');
          
          // Show new capabilities
          if (level === 2) {
            addToCommandHistory('> Level 2 grants access to limited-edition drops');
          } else if (level === 3) {
            addToCommandHistory('> Level 3 grants access to all drops and advanced thringlet interactions');
          }
        } else {
          setTransactionStatus('failed');
          await new Promise(resolve => setTimeout(resolve, 1500));
          setTransactionStatus(null);
          
          addToCommandHistory('> Access denied: Invalid authorization code');
        }
      } else {
        setTransactionStatus('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        addToCommandHistory('> Error: Could not verify authorization code');
        addToCommandHistory('> Check your connection and try again');
      }
    } catch (error) {
      console.error('Error verifying auth code:', error);
      
      setTransactionStatus('failed');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransactionStatus(null);
      
      addToCommandHistory('> Error: Connection failed during verification');
    }
  };
  
  // Claim a secret drop with code
  const claimDrop = async (code: string) => {
    if (!wallet?.address) {
      addToCommandHistory('> Error: Wallet not connected');
      addToCommandHistory('> Connect your wallet to claim drops');
      return;
    }
    
    addToCommandHistory('> Validating drop code...');
    
    setTransactionStatus('pending');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Validate drop code
      const drop = secretDrops.find(d => d.code === code);
      
      if (!drop) {
        setTransactionStatus('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        addToCommandHistory('> Error: Invalid drop code');
        return;
      }
      
      if (!drop.isActive) {
        setTransactionStatus('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        addToCommandHistory('> Error: This drop is no longer active');
        return;
      }
      
      if (drop.claimedCount >= drop.maxClaims) {
        setTransactionStatus('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        addToCommandHistory('> Error: All claims for this drop have been exhausted');
        return;
      }
      
      // Process claim
      setTransactionStatus('processing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await fetch('/api/drops/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dropCode: code,
          address: wallet.address,
        }),
      });
      
      if (response.ok) {
        const claimResult = await response.json();
        
        setTransactionStatus('broadcasting');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setTransactionStatus('success');
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTransactionStatus(null);
        
        // Update the drop's claimed count
        setSecretDrops(prev => 
          prev.map(d => d.id === drop.id ? { ...d, claimedCount: d.claimedCount + 1 } : d)
        );
        
        // Add new thringlet if received
        if (claimResult.thringlet) {
          setThringlets(prev => [...prev, claimResult.thringlet]);
          setSelectedThringlet(claimResult.thringlet);
          
          addToCommandHistory('> Drop claimed successfully!');
          addToCommandHistory(`> Received new Thringlet: ${claimResult.thringlet.name} (ID: ${claimResult.thringlet.id})`);
          addToCommandHistory('> Type "show [thringlet-id]" to view details');
          
          onDropClaimed?.(drop.id);
        } else if (claimResult.rewards) {
          addToCommandHistory('> Drop claimed successfully!');
          addToCommandHistory('> Rewards received:');
          claimResult.rewards.forEach((reward: string) => {
            addToCommandHistory(`>   - ${reward}`);
          });
          
          onDropClaimed?.(drop.id);
        }
      } else {
        const errorData = await response.json();
        
        setTransactionStatus('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        addToCommandHistory(`> Error: ${errorData.message || 'Failed to claim drop'}`);
      }
    } catch (error) {
      console.error('Error claiming drop:', error);
      
      setTransactionStatus('failed');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransactionStatus(null);
      
      addToCommandHistory('> Error: Connection failed during claim process');
    }
  };
  
  // Bond with a thringlet
  const bondThringlet = async (thringletId: string) => {
    if (!wallet?.address) {
      addToCommandHistory('> Error: Wallet not connected');
      return;
    }
    
    const thringlet = thringlets.find(t => t.id === thringletId);
    
    if (!thringlet) {
      addToCommandHistory(`> Error: Thringlet ${thringletId} not found`);
      return;
    }
    
    addToCommandHistory(`> Initiating bond with Thringlet ${thringlet.name}...`);
    
    setTransactionStatus('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await fetch('/api/thringlets/bond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thringletId,
          address: wallet.address,
        }),
      });
      
      if (response.ok) {
        setTransactionStatus('encrypting');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setTransactionStatus('broadcasting');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setTransactionStatus('success');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        const result = await response.json();
        
        // Update thringlet with new bonding status
        setThringlets(prev => 
          prev.map(t => t.id === thringletId ? { ...t, ...result.thringlet } : t)
        );
        
        addToCommandHistory(`> Successfully bonded with ${thringlet.name}`);
        addToCommandHistory('> Emotional link established!');
        addToCommandHistory('> Thringlet will now respond to your emotional patterns');
        addToCommandHistory('> Use "interact [thringlet-id] [interaction-type]" to deepen your bond');
      } else {
        setTransactionStatus('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        const errorData = await response.json();
        addToCommandHistory(`> Error: ${errorData.message || 'Failed to bond with thringlet'}`);
      }
    } catch (error) {
      console.error('Error bonding with thringlet:', error);
      
      setTransactionStatus('failed');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransactionStatus(null);
      
      addToCommandHistory('> Error: Connection failed during bonding process');
    }
  };
  
  // Interact with a thringlet
  const interactWithThringlet = async (thringletId: string, interactionType: string) => {
    if (!wallet?.address) {
      addToCommandHistory('> Error: Wallet not connected');
      return;
    }
    
    const thringlet = thringlets.find(t => t.id === thringletId);
    
    if (!thringlet) {
      addToCommandHistory(`> Error: Thringlet ${thringletId} not found`);
      return;
    }
    
    const validInteractions = ['stimulate', 'calm', 'challenge', 'reward'];
    if (!validInteractions.includes(interactionType)) {
      addToCommandHistory('> Error: Invalid interaction type');
      addToCommandHistory('> Valid interactions: stimulate, calm, challenge, reward');
      return;
    }
    
    addToCommandHistory(`> Interacting with ${thringlet.name}... [${interactionType}]`);
    
    try {
      const response = await fetch('/api/thringlets/interact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thringletId,
          address: wallet.address,
          interactionType,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update thringlet with new emotional state
        setThringlets(prev => 
          prev.map(t => t.id === thringletId ? { ...t, emotionalState: result.emotionalState } : t)
        );
        
        addToCommandHistory(`> ${thringlet.name} reacted to your ${interactionType}`);
        addToCommandHistory(`> New dominant emotion: ${result.emotionalState.dominant}`);
        
        // Show thringlet's reaction
        switch (interactionType) {
          case 'stimulate':
            addToCommandHistory(`> ${thringlet.name} appears more energetic and alert!`);
            break;
          case 'calm':
            addToCommandHistory(`> ${thringlet.name} relaxes and seems more balanced.`);
            break;
          case 'challenge':
            addToCommandHistory(`> ${thringlet.name} becomes focused and determined!`);
            break;
          case 'reward':
            addToCommandHistory(`> ${thringlet.name} is delighted and grateful!`);
            break;
        }
        
        if (result.ability) {
          addToCommandHistory('> A new ability has been unlocked!');
          addToCommandHistory(`> ${result.ability.name}: ${result.ability.description}`);
        }
        
        // Notify parent component
        onThringletInteraction?.(thringletId, interactionType);
      } else {
        const errorData = await response.json();
        addToCommandHistory(`> Error: ${errorData.message || 'Failed to interact with thringlet'}`);
      }
    } catch (error) {
      console.error('Error interacting with thringlet:', error);
      addToCommandHistory('> Error: Connection failed during interaction');
    }
  };
  
  // Show detailed information about a thringlet
  const showThringlet = (thringletId: string) => {
    const thringlet = thringlets.find(t => t.id === thringletId);
    
    if (!thringlet) {
      addToCommandHistory(`> Error: Thringlet ${thringletId} not found`);
      return;
    }
    
    setSelectedThringlet(thringlet);
    
    addToCommandHistory(`> Thringlet Profile: ${thringlet.name}`);
    addToCommandHistory(`> ID: ${thringlet.id}`);
    addToCommandHistory(`> Type: ${thringlet.type}`);
    addToCommandHistory(`> Level: ${thringlet.level}`);
    addToCommandHistory('> Attributes:');
    addToCommandHistory(`>   Intellect: ${thringlet.attributes.intellect}`);
    addToCommandHistory(`>   Resilience: ${thringlet.attributes.resilience}`);
    addToCommandHistory(`>   Empathy: ${thringlet.attributes.empathy}`);
    addToCommandHistory(`>   Chaos: ${thringlet.attributes.chaos}`);
    addToCommandHistory('> Emotional State:');
    addToCommandHistory(`>   Dominant: ${thringlet.emotionalState.dominant}`);
    addToCommandHistory(`>   Joy: ${thringlet.emotionalState.joy}`);
    addToCommandHistory(`>   Fear: ${thringlet.emotionalState.fear}`);
    addToCommandHistory(`>   Trust: ${thringlet.emotionalState.trust}`);
    addToCommandHistory(`>   Surprise: ${thringlet.emotionalState.surprise}`);
    
    if (thringlet.abilities.length > 0) {
      addToCommandHistory('> Abilities:');
      thringlet.abilities.forEach(ability => {
        addToCommandHistory(`>   - ${ability}`);
      });
    } else {
      addToCommandHistory('> No abilities unlocked yet');
      addToCommandHistory('> Interact with your thringlet to unlock abilities');
    }
    
    // Format bonding date
    const bondingDate = new Date(thringlet.bondingDate);
    addToCommandHistory(`> Bonded since: ${bondingDate.toLocaleDateString()}`);
  };
  
  // Scan a drop code or address for security
  const scanTarget = async (target: string) => {
    addToCommandHistory(`> Scanning target: ${target}`);
    addToCommandHistory('> Running security analysis...');
    
    // Simulate scanning progress
    setTransactionStatus('encrypting');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await fetch('/api/security/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        setTransactionStatus('validated');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        addToCommandHistory('> Scan complete!');
        
        if (result.type === 'drop') {
          addToCommandHistory('> Target identified as: Secret Drop');
          addToCommandHistory(`> Security Score: ${result.securityScore}/100`);
          
          if (result.securityScore >= 80) {
            addToCommandHistory('> Status: Safe');
          } else if (result.securityScore >= 50) {
            addToCommandHistory('> Status: Caution Advised');
          } else {
            addToCommandHistory('> Status: Potentially Unsafe');
          }
          
          if (result.createdBy) {
            addToCommandHistory(`> Created by: ${result.createdBy}`);
          }
        } else if (result.type === 'address') {
          addToCommandHistory('> Target identified as: Wallet Address');
          addToCommandHistory(`> Reputation Score: ${result.reputationScore}/100`);
          addToCommandHistory(`> Transaction History: ${result.transactionCount} transactions`);
          
          if (result.knownEntity) {
            addToCommandHistory(`> Known Entity: Yes (${result.entityName})`);
          } else {
            addToCommandHistory('> Known Entity: No');
          }
        }
      } else {
        setTransactionStatus('failed');
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTransactionStatus(null);
        
        const errorData = await response.json();
        addToCommandHistory(`> Error: ${errorData.message || 'Failed to scan target'}`);
      }
    } catch (error) {
      console.error('Error scanning target:', error);
      
      setTransactionStatus('failed');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTransactionStatus(null);
      
      addToCommandHistory('> Error: Connection failed during scan');
    }
  };
  
  // Show current status
  const showStatus = () => {
    addToCommandHistory('> System Status:');
    addToCommandHistory(`> Access Level: ${accessLevel}`);
    
    if (wallet?.address) {
      const truncatedAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
      addToCommandHistory(`> Wallet Connected: ${truncatedAddress}`);
      addToCommandHistory(`> Balance: ${wallet.balance.toLocaleString()} μPVX`);
      addToCommandHistory(`> Thringlets Owned: ${thringlets.length}`);
    } else {
      addToCommandHistory('> Wallet: Not Connected');
      addToCommandHistory('> Connect your wallet to access full functionality');
    }
    
    addToCommandHistory(`> Network: PVX SecureDrop™ Protocol v3.8.6`);
    addToCommandHistory(`> Connection: Secure (${Math.floor(Math.random() * 50) + 50}ms latency)`);
  };
  
  // Reconnect to the network
  const reconnect = async () => {
    addToCommandHistory('> Attempting to reconnect to PVX network...');
    setLoading(true);
    
    // Simulate reconnection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Refetch secret drops
      const dropsResponse = await fetch('/api/drops/secret');
      if (dropsResponse.ok) {
        const dropsData = await dropsResponse.json();
        setSecretDrops(dropsData);
      }
      
      // Refetch thringlets if wallet is connected
      if (wallet?.address) {
        const thringlentsResponse = await fetch(`/api/thringlets/owner/${wallet.address}`);
        if (thringlentsResponse.ok) {
          const thringletsData = await thringlentsResponse.json();
          setThringlets(thringletsData);
        }
      }
      
      setLoading(false);
      addToCommandHistory('> Connection re-established successfully!');
      addToCommandHistory('> System is online and secure');
    } catch (error) {
      console.error('Error reconnecting:', error);
      setLoading(false);
      addToCommandHistory('> Reconnection failed');
      addToCommandHistory('> Check your connection and try again');
    }
  };
  
  return (
    <Card className={cn(
      "bg-black/90 bg-opacity-78 border-blue-800 shadow-blue-900/30 overflow-hidden",
      className
    )}>
      <AnimatePresence mode="wait">
        {transactionStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <TransactionFlow
              status={transactionStatus}
              className="max-w-md"
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="border-b border-blue-900/50 bg-black bg-opacity-50 flex items-center justify-between p-2">
        <div className="flex items-center space-x-2">
          <FileTerminal className="h-5 w-5 text-blue-400" />
          <h3 className="text-blue-400 font-mono text-sm text-shadow-neon">PVX TERMINAL [SecureDrop™]</h3>
        </div>
        <div className="flex space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      
      <div className="p-4 font-mono text-sm">
        <div className="bg-black/90 border border-blue-900/50 p-3 rounded-md h-[350px] overflow-y-auto">
          {/* Terminal output */}
          {commandHistory.map((line, index) => (
            <div key={index} className="mb-1 text-blue-300">
              {line.startsWith('> ') ? (
                <div>
                  <span className="text-blue-500">{line.substring(0, 2)}</span>
                  <span>{line.substring(2)}</span>
                </div>
              ) : (
                <div>{line}</div>
              )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-center text-blue-300 mb-1">
              <span className="text-blue-500">&gt; </span>
              <span className="terminal-cursor"></span>
            </div>
          )}
          
          <div ref={terminalEndRef} />
        </div>
        
        {/* Command input */}
        <form onSubmit={handleCommandSubmit} className="mt-3 flex space-x-2">
          <div className="flex-1 flex items-center bg-black border border-blue-900/50 rounded-md px-2">
            <span className="text-blue-500 mr-2">&gt;</span>
            <Input
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              className="flex-1 border-0 bg-transparent text-blue-300 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              placeholder="Enter command..."
              disabled={isProcessing}
            />
          </div>
          <Button 
            type="submit"
            className="bg-blue-900/70 hover:bg-blue-800 text-blue-100 border border-blue-700/50"
            disabled={isProcessing}
          >
            <span className="sr-only">Execute</span>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Access level indicator */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-blue-400">
              Access Level: 
              <span className="ml-1 font-bold text-shadow-neon">
                {accessLevel}
              </span>
            </div>
            {accessLevel === 0 && <Lock className="h-3 w-3 text-blue-500" />}
            {accessLevel === 1 && <KeyRound className="h-3 w-3 text-blue-500" />}
            {accessLevel === 2 && <ShieldAlert className="h-3 w-3 text-blue-500" />}
            {accessLevel === 3 && <Database className="h-3 w-3 text-blue-500" />}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              wallet?.address ? "bg-green-500" : "bg-red-500"
            )}></div>
            <div className="text-xs text-blue-400">
              {wallet?.address ? (
                `Wallet Connected: ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`
              ) : (
                "No Wallet Connected"
              )}
            </div>
          </div>
        </div>
        
        {/* Selected Thringlet Visualization (if any) */}
        {selectedThringlet && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-3 bg-black/80 border border-blue-900/50 rounded-md"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-blue-400 text-sm font-semibold flex items-center gap-1">
                <Brain className="h-4 w-4" />
                Thringlet Profile: {selectedThringlet.name}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-blue-400"
                onClick={() => setSelectedThringlet(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-blue-300 mb-1">Attributes</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Intellect</span>
                    <span className="text-blue-300">{selectedThringlet.attributes.intellect}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Resilience</span>
                    <span className="text-blue-300">{selectedThringlet.attributes.resilience}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Empathy</span>
                    <span className="text-blue-300">{selectedThringlet.attributes.empathy}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Chaos</span>
                    <span className="text-blue-300">{selectedThringlet.attributes.chaos}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-blue-300 mb-1">Emotional State</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Joy</span>
                    <div className="w-16 bg-black/80 h-2 rounded-full">
                      <div 
                        className="bg-yellow-500 h-full rounded-full" 
                        style={{ width: `${selectedThringlet.emotionalState.joy}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Fear</span>
                    <div className="w-16 bg-black/80 h-2 rounded-full">
                      <div 
                        className="bg-purple-500 h-full rounded-full" 
                        style={{ width: `${selectedThringlet.emotionalState.fear}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Trust</span>
                    <div className="w-16 bg-black/80 h-2 rounded-full">
                      <div 
                        className="bg-green-500 h-full rounded-full" 
                        style={{ width: `${selectedThringlet.emotionalState.trust}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-400/70">Surprise</span>
                    <div className="w-16 bg-black/80 h-2 rounded-full">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ width: `${selectedThringlet.emotionalState.surprise}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-2">
              <div className="text-xs text-blue-300 mb-1">Abilities</div>
              {selectedThringlet.abilities.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedThringlet.abilities.map((ability, idx) => (
                    <div 
                      key={idx}
                      className="text-[10px] bg-blue-950/50 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/60"
                    >
                      {ability}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-blue-400/70 italic">
                  No abilities unlocked yet
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      <style jsx global>{`
        .terminal-cursor {
          display: inline-block;
          width: 0.6em;
          height: 1em;
          background-color: #60a5fa;
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </Card>
  );
}