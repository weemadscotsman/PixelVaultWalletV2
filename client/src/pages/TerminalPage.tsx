import { useState, useEffect, useRef } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useWallet } from "@/hooks/use-wallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Terminal as TerminalIcon, AlertCircle, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTokenAmount } from "@/lib/format";

// Generate a random hash for simulation purposes
function generateHash(length = 64) {
  const characters = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

interface CommandResponse {
  command: string;
  response: string;
  status: "success" | "error" | "info" | "pending";
  timestamp: Date;
}

export default function TerminalPage() {
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [commandHistory, setCommandHistory] = useState<CommandResponse[]>([
    {
      command: "help",
      response: "Available commands:\n\nbalance - Check your PVX balance\nhelp - Show this help message\nwallet - Show wallet details\nblock <number> - Show block details\ntx <hash> - Show transaction details\nmint <amount> - Mint new PVX tokens (demo)\nstake <amount> - Stake PVX tokens\nunstake <amount> - Unstake PVX tokens\nvote <proposal_id> <yes|no> - Vote on a governance proposal\nnetwork - Show network stats\nclear - Clear terminal screen",
      status: "info",
      timestamp: new Date()
    }
  ]);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("command");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new commands are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commandHistory]);
  
  // Process commands
  const processCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    const parts = cmd.trim().toLowerCase().split(" ");
    const mainCommand = parts[0];
    const args = parts.slice(1);
    
    setIsProcessing(true);
    
    // Add command to history immediately
    setCommandHistory(prev => [
      ...prev,
      {
        command: cmd,
        response: "Processing...",
        status: "pending",
        timestamp: new Date()
      }
    ]);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let response: CommandResponse;
    
    switch (mainCommand) {
      case "help":
        response = {
          command: cmd,
          response: "Available commands:\n\nbalance - Check your PVX balance\nhelp - Show this help message\nwallet - Show wallet details\nblock <number> - Show block details\ntx <hash> - Show transaction details\nmint <amount> - Mint new PVX tokens (demo)\nstake <amount> - Stake PVX tokens\nunstake <amount> - Unstake PVX tokens\nvote <proposal_id> <yes|no> - Vote on a governance proposal\nnetwork - Show network stats\nclear - Clear terminal screen",
          status: "info",
          timestamp: new Date()
        };
        break;
        
      case "balance":
        if (!wallet) {
          response = {
            command: cmd,
            response: "Error: Wallet not connected. Please connect your wallet first.",
            status: "error",
            timestamp: new Date()
          };
        } else {
          response = {
            command: cmd,
            response: `Current balance: ${formatTokenAmount(wallet.balance, 6)} PVX`,
            status: "success",
            timestamp: new Date()
          };
        }
        break;
        
      case "wallet":
        if (!wallet) {
          response = {
            command: cmd,
            response: "Error: Wallet not connected. Please connect your wallet first.",
            status: "error",
            timestamp: new Date()
          };
        } else {
          response = {
            command: cmd,
            response: `Wallet Address: ${wallet.address}\nBalance: ${formatTokenAmount(wallet.balance, 6)} PVX\nNonce: ${Math.floor(Math.random() * 100)}\nTransactions: ${Math.floor(Math.random() * 200)}`,
            status: "success",
            timestamp: new Date()
          };
        }
        break;
        
      case "block":
        if (args.length === 0) {
          response = {
            command: cmd,
            response: "Error: Block number required. Usage: block <number>",
            status: "error",
            timestamp: new Date()
          };
        } else {
          const blockNum = parseInt(args[0]);
          if (isNaN(blockNum)) {
            response = {
              command: cmd,
              response: "Error: Invalid block number",
              status: "error",
              timestamp: new Date()
            };
          } else {
            const hash = generateHash();
            response = {
              command: cmd,
              response: `Block #${blockNum}\nHash: ${hash}\nTimestamp: ${new Date().toISOString()}\nTransactions: ${Math.floor(Math.random() * 20)}\nSize: ${Math.floor(Math.random() * 1000) + 500} bytes\nMiner: 0x${Math.random().toString(16).substring(2, 10)}...`,
              status: "success",
              timestamp: new Date()
            };
          }
        }
        break;
        
      case "tx":
        if (args.length === 0) {
          response = {
            command: cmd,
            response: "Error: Transaction hash required. Usage: tx <hash>",
            status: "error",
            timestamp: new Date()
          };
        } else {
          const txHash = args[0];
          response = {
            command: cmd,
            response: `Transaction: ${txHash}\nStatus: Confirmed\nBlock: #${Math.floor(Math.random() * 1000000)}\nFrom: 0x${Math.random().toString(16).substring(2, 10)}...\nTo: 0x${Math.random().toString(16).substring(2, 10)}...\nAmount: ${Math.floor(Math.random() * 1000)} PVX\nFee: 0.000042 PVX\nTimestamp: ${new Date().toISOString()}`,
            status: "success",
            timestamp: new Date()
          };
        }
        break;
        
      case "mint":
        if (args.length === 0) {
          response = {
            command: cmd,
            response: "Error: Amount required. Usage: mint <amount>",
            status: "error",
            timestamp: new Date()
          };
        } else {
          const amount = parseFloat(args[0]);
          if (isNaN(amount) || amount <= 0) {
            response = {
              command: cmd,
              response: "Error: Invalid amount",
              status: "error",
              timestamp: new Date()
            };
          } else {
            response = {
              command: cmd,
              response: `Successfully minted ${amount} PVX tokens for demonstration purposes.\nTransaction Hash: ${generateHash()}\nNote: This is a simulation and does not affect actual balances.`,
              status: "success",
              timestamp: new Date()
            };
          }
        }
        break;
        
      case "stake":
        if (args.length === 0) {
          response = {
            command: cmd,
            response: "Error: Amount required. Usage: stake <amount>",
            status: "error",
            timestamp: new Date()
          };
        } else {
          const amount = parseFloat(args[0]);
          if (isNaN(amount) || amount <= 0) {
            response = {
              command: cmd,
              response: "Error: Invalid amount",
              status: "error",
              timestamp: new Date()
            };
          } else if (!wallet) {
            response = {
              command: cmd,
              response: "Error: Wallet not connected. Please connect your wallet first.",
              status: "error",
              timestamp: new Date()
            };
          } else {
            response = {
              command: cmd,
              response: `Staking ${amount} PVX tokens\nTransaction Hash: ${generateHash()}\nExpected Annual Yield: ${(Math.random() * 5 + 5).toFixed(2)}%\nLock Period: 14 days\nNote: This is a simulation for demonstration purposes.`,
              status: "success",
              timestamp: new Date()
            };
          }
        }
        break;
        
      case "unstake":
        if (args.length === 0) {
          response = {
            command: cmd,
            response: "Error: Amount required. Usage: unstake <amount>",
            status: "error",
            timestamp: new Date()
          };
        } else {
          const amount = parseFloat(args[0]);
          if (isNaN(amount) || amount <= 0) {
            response = {
              command: cmd,
              response: "Error: Invalid amount",
              status: "error",
              timestamp: new Date()
            };
          } else if (!wallet) {
            response = {
              command: cmd,
              response: "Error: Wallet not connected. Please connect your wallet first.",
              status: "error",
              timestamp: new Date()
            };
          } else {
            response = {
              command: cmd,
              response: `Unstaking ${amount} PVX tokens\nTransaction Hash: ${generateHash()}\nRewards Claimed: ${(amount * Math.random() * 0.1).toFixed(6)} PVX\nNote: This is a simulation for demonstration purposes.`,
              status: "success",
              timestamp: new Date()
            };
          }
        }
        break;
        
      case "vote":
        if (args.length < 2) {
          response = {
            command: cmd,
            response: "Error: Proposal ID and vote choice required. Usage: vote <proposal_id> <yes|no>",
            status: "error",
            timestamp: new Date()
          };
        } else {
          const proposalId = args[0];
          const voteChoice = args[1];
          
          if (!['yes', 'no', 'abstain'].includes(voteChoice)) {
            response = {
              command: cmd,
              response: "Error: Vote choice must be 'yes', 'no', or 'abstain'.",
              status: "error",
              timestamp: new Date()
            };
          } else if (!wallet) {
            response = {
              command: cmd,
              response: "Error: Wallet not connected. Please connect your wallet first.",
              status: "error",
              timestamp: new Date()
            };
          } else {
            response = {
              command: cmd,
              response: `Vote cast on Proposal #${proposalId}: ${voteChoice.toUpperCase()}\nTransaction Hash: ${generateHash()}\nVoting Power: ${Math.floor(Math.random() * 1000)} PVX\nProposal Status: Active (70% participation so far)\nNote: This is a simulation for demonstration purposes.`,
              status: "success",
              timestamp: new Date()
            };
          }
        }
        break;
        
      case "network":
        response = {
          command: cmd,
          response: `Network Status: Online\nCurrent Block: #${Math.floor(Math.random() * 1000000 + 3000000)}\nActive Validators: ${Math.floor(Math.random() * 100 + 100)}\nTransactions Per Second: ${Math.floor(Math.random() * 1000 + 500)}\nNetwork Hash Rate: ${Math.floor(Math.random() * 100 + 50)} TH/s\nAverage Block Time: ${(Math.random() * 3 + 12).toFixed(1)} seconds\nActive Proposals: ${Math.floor(Math.random() * 10)}\nPVX Market Cap: $${Math.floor(Math.random() * 1000000000 + 500000000).toLocaleString()}`,
          status: "info",
          timestamp: new Date()
        };
        break;
        
      case "clear":
        setCommandHistory([]);
        response = {
          command: cmd,
          response: "Terminal cleared.",
          status: "info",
          timestamp: new Date()
        };
        break;
        
      default:
        response = {
          command: cmd,
          response: `Command not recognized: ${mainCommand}\nType 'help' to see available commands.`,
          status: "error",
          timestamp: new Date()
        };
    }
    
    // Update the last command with the final response
    setCommandHistory(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = response;
      return updated;
    });
    
    setIsProcessing(false);
    setCommand("");
  };
  
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    processCommand(command);
  };
  
  // Predefined commands
  const quickCommands = [
    { label: "Check Balance", command: "balance" },
    { label: "Network Stats", command: "network" },
    { label: "Wallet Details", command: "wallet" },
    { label: "Help", command: "help" },
  ];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-green-400";
      case "error": return "text-red-400";
      case "info": return "text-blue-400";
      case "pending": return "text-yellow-400";
      default: return "text-white";
    }
  };
  
  return (
    <PageLayout isConnected={!!wallet}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent pb-1">
            PVX Terminal
          </h1>
          <p className="text-muted-foreground">
            Interact with the PVX blockchain network through command-line interface
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <Card className="bg-black/90 backdrop-blur-lg border-slate-800 h-[calc(100vh-16rem)]">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <TerminalIcon className="h-5 w-5 mr-2" />
                    Command Terminal
                  </CardTitle>
                  <CardDescription>
                    Execute blockchain commands and view responses
                  </CardDescription>
                </div>
                <Badge variant="outline" className={wallet ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400"}>
                  {wallet ? "Wallet Connected" : "Wallet Disconnected"}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col h-[calc(100%-8rem)]">
                <ScrollArea className="flex-1 mb-4 font-mono text-sm" ref={scrollRef}>
                  <div className="space-y-4 p-1">
                    {commandHistory.map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-blue-400 mr-2">$</span>
                          <span className="font-semibold">{item.command}</span>
                        </div>
                        <div className={`pl-4 whitespace-pre-wrap ${getStatusColor(item.status)}`}>
                          {item.status === "pending" ? (
                            <div className="flex items-center">
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              Processing...
                            </div>
                          ) : (
                            item.response
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <form onSubmit={handleCommandSubmit} className="flex space-x-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-[11px] text-blue-400">$</span>
                    <Input
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      className="pl-6 bg-slate-900/70 border-slate-700/50 font-mono text-sm"
                      placeholder="Type a command..."
                      disabled={isProcessing}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Execute"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Commands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickCommands.map((cmd, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-sm"
                    onClick={() => processCommand(cmd.command)}
                    disabled={isProcessing}
                  >
                    <span className="text-blue-400 mr-2">$</span>
                    {cmd.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Terminal Help</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-baseline">
                    <span className="font-semibold mr-2">balance</span>
                    <span className="text-gray-400 text-xs">Check your PVX balance</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline">
                    <span className="font-semibold mr-2">stake</span>
                    <span className="text-gray-400 text-xs">Stake PVX tokens</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline">
                    <span className="font-semibold mr-2">block</span>
                    <span className="text-gray-400 text-xs">Show block details</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm text-blue-400"
                    onClick={() => processCommand("help")}
                  >
                    View all commands...
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 backdrop-blur-lg border-slate-800">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 inline-block mr-1 text-yellow-400" />
                  This terminal simulates blockchain interactions for educational purposes only. No actual transactions are executed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}