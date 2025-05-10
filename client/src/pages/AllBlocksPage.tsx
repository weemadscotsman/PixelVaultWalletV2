import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { 
  Blocks, 
  ArrowLeft,
  Filter,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBlockchain } from '@/hooks/use-blockchain';
import { Link } from 'wouter';
import { shortenAddress } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Pagination } from '@/components/ui/pagination';

export default function AllBlocksPage() {
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Get recent blocks
  const { getRecentBlocks } = useBlockchain();
  const { data: blocks, isLoading, refetch } = getRecentBlocks(limit);

  const filteredBlocks = blocks?.filter(block => 
    block.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    block.miner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    block.height.toString().includes(searchTerm)
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <PageLayout isConnected={true}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/blockchain">
              <Button variant="outline" size="icon" className="border-blue-900/50 text-blue-300">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-blue-300">All Blocks</h1>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="border-blue-900/50 text-blue-300"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>
        
        <Separator className="bg-blue-900/30" />
        
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-300/50" />
            <Input 
              placeholder="Search blocks..." 
              className="pl-8 border-blue-900/50 bg-black/50 text-blue-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2 items-center">
            <Button variant="outline" className="border-blue-900/50 text-blue-300">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        
        <Card className="bg-black/70 border-blue-900/50">
          <CardHeader className="border-b border-blue-900/30 bg-blue-900/10">
            <CardTitle className="text-blue-300">Block Explorer</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-300" />
              </div>
            ) : filteredBlocks && filteredBlocks.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-blue-900/30 hover:bg-blue-900/20">
                      <TableHead className="text-blue-300">Block Height</TableHead>
                      <TableHead className="text-blue-300">Hash</TableHead>
                      <TableHead className="text-blue-300">Mined By</TableHead>
                      <TableHead className="text-blue-300">Transactions</TableHead>
                      <TableHead className="text-blue-300">Timestamp</TableHead>
                      <TableHead className="text-blue-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBlocks.map((block) => (
                      <TableRow key={block.hash} className="border-b border-blue-900/30 hover:bg-blue-900/20">
                        <TableCell className="font-mono text-sm">
                          <span className="bg-blue-900/20 px-2 py-1 rounded-md">
                            {block.height}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {shortenAddress(block.hash)}
                        </TableCell>
                        <TableCell>
                          {block.miner ? shortenAddress(block.miner) : 'Genesis'}
                        </TableCell>
                        <TableCell>
                          <span className="bg-blue-900/20 px-2 py-1 rounded-md">
                            {block.transactions?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {block.timestamp ? (
                            formatDistanceToNow(new Date(block.timestamp), { addSuffix: true })
                          ) : 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-300 hover:text-blue-100 hover:bg-blue-900/30"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex justify-center items-center p-12">
                <p className="text-gray-400">No blocks found</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-blue-900/30 bg-blue-900/10 py-4 flex justify-between">
            <div className="text-sm text-blue-300">
              Showing {filteredBlocks?.length || 0} of {blocks?.length || 0} blocks
            </div>
            <Pagination 
              currentPage={page}
              totalPages={Math.ceil((blocks?.length || 0) / 10)}
              onPageChange={setPage}
            />
          </CardFooter>
        </Card>
      </div>
    </PageLayout>
  );
}