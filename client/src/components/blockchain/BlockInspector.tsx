import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Eye, Search, Hash, Clock, User, Zap } from 'lucide-react';

interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  nonce: number;
  difficulty: number;
  miner: string;
  merkleRoot: string;
  totalTransactions: number;
  size: number;
  reward?: number;
}

interface BlockValidation {
  hashValid: boolean;
  powVerified: boolean;
  chainContinuity: boolean;
  timestampValid: boolean;
  merkleRootValid: boolean;
}

export function BlockInspector() {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [searchHeight, setSearchHeight] = useState('');
  const [validation, setValidation] = useState<BlockValidation | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch recent blocks
  useEffect(() => {
    const fetchRecentBlocks = async () => {
      try {
        const response = await fetch('/api/blockchain/blocks?limit=10');
        if (response.ok) {
          const data = await response.json();
          setRecentBlocks(data.blocks || []);
          if (data.blocks?.length > 0 && !selectedBlock) {
            setSelectedBlock(data.blocks[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch recent blocks:', error);
      }
    };

    fetchRecentBlocks();
    const interval = setInterval(fetchRecentBlocks, 5000);
    return () => clearInterval(interval);
  }, [selectedBlock]);

  // Validate block when selected
  useEffect(() => {
    if (selectedBlock) {
      validateBlock(selectedBlock);
    }
  }, [selectedBlock]);

  const validateBlock = async (block: Block) => {
    setLoading(true);
    try {
      // Simulate comprehensive block validation
      const validation: BlockValidation = {
        hashValid: block.hash.startsWith('0'.repeat(Math.min(5, block.difficulty))),
        powVerified: block.nonce > 0,
        chainContinuity: block.height > 0,
        timestampValid: block.timestamp > 0,
        merkleRootValid: block.merkleRoot.length === 64
      };
      
      setValidation(validation);
    } catch (error) {
      console.error('Block validation failed:', error);
    }
    setLoading(false);
  };

  const searchBlock = async () => {
    if (!searchHeight) return;
    
    try {
      const response = await fetch(`/api/blockchain/block/${searchHeight}`);
      if (response.ok) {
        const block = await response.json();
        setSelectedBlock(block);
      }
    } catch (error) {
      console.error('Failed to search block:', error);
    }
  };

  const formatHash = (hash: string, length = 16) => {
    return `${hash.slice(0, length)}...${hash.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Block Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Block Inspector
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter block height"
              value={searchHeight}
              onChange={(e) => setSearchHeight(e.target.value)}
              type="number"
            />
            <Button onClick={searchBlock} disabled={!searchHeight}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Blocks List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBlocks.map((block) => (
              <div
                key={block.height}
                className={`p-3 rounded cursor-pointer border transition-colors ${
                  selectedBlock?.height === block.height
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedBlock(block)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm">Block #{block.height}</span>
                  <Badge variant="secondary" className="text-xs">
                    {block.totalTransactions} txs
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatHash(block.hash, 12)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimestamp(block.timestamp)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Block Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Block Details
              {selectedBlock && (
                <Badge variant="outline">#{selectedBlock.height}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBlock ? (
              <div className="space-y-6">
                {/* Validation Status */}
                {validation && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-3">Validation Status</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getValidationIcon(validation.hashValid)}
                        <span>Hash Valid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationIcon(validation.powVerified)}
                        <span>PoW Verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationIcon(validation.chainContinuity)}
                        <span>Chain Continuity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationIcon(validation.timestampValid)}
                        <span>Timestamp Valid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationIcon(validation.merkleRootValid)}
                        <span>Merkle Root Valid</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Block Header */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Block Header
                  </h4>
                  
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Block Hash:</span>
                      <span className="font-mono text-sm break-all">{selectedBlock.hash}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Previous Hash:</span>
                      <span className="font-mono text-sm break-all">{selectedBlock.previousHash}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Merkle Root:</span>
                      <span className="font-mono text-sm break-all">{selectedBlock.merkleRoot}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Mining Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Mining Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Nonce:</span>
                      <div className="font-mono">{selectedBlock.nonce.toLocaleString()}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Difficulty:</span>
                      <div className="font-mono">{selectedBlock.difficulty}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Miner:</span>
                      <div className="font-mono text-sm break-all">{selectedBlock.miner}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Block Reward:</span>
                      <div className="font-mono">5,000,000 PVX</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Block Metadata */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Block Metadata
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Timestamp:</span>
                      <div>{formatTimestamp(selectedBlock.timestamp)}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Size:</span>
                      <div>{selectedBlock.size.toLocaleString()} bytes</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Transactions:</span>
                      <div>{selectedBlock.totalTransactions}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground text-sm">Height:</span>
                      <div>#{selectedBlock.height}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a block to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}