import React from 'react';
import { Helmet } from 'react-helmet';
import { useWallet } from '@/hooks/use-wallet';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timeAgo } from '@/lib/formatters';
import { PageLayout } from '@/components/layout/PageLayout';

export default function TransactionsPage() {
  const { 
    transactions, 
    isLoading, 
    wallet 
  } = useWallet();

  // Filter transactions by type
  const incomingTransactions = transactions.filter(tx => 
    tx.recipientAddress === wallet?.address && tx.status === 'confirmed'
  );
  
  const outgoingTransactions = transactions.filter(tx => 
    tx.senderAddress === wallet?.address && tx.status === 'confirmed'
  );
  
  const pendingTransactions = transactions.filter(tx => 
    tx.status === 'pending'
  );

  return (
    <PageLayout isConnected={true}>
      <Helmet>
        <title>Transactions | PixelVault</title>
        <meta name="description" content="View your transaction history on the PVX blockchain" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Transaction History</h1>
            <p className="text-muted-foreground">Track all your PVX transactions</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <i className="ri-arrow-left-line mr-2"></i>
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="flex flex-col items-center">
              <i className="ri-loader-4-line animate-spin text-primary text-4xl mb-4"></i>
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="bg-card border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <i className="ri-exchange-funds-line text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-medium text-white mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't made any transactions yet. Send or receive PVX to start building your transaction history.
              </p>
              <Button variant="secondary">
                <i className="ri-send-plane-line mr-2"></i>
                Send PVX
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
              <TabsTrigger value="incoming">Received ({incomingTransactions.length})</TabsTrigger>
              <TabsTrigger value="outgoing">Sent ({outgoingTransactions.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingTransactions.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="space-y-4">
                {transactions.map(transaction => (
                  <TransactionItem key={transaction.hash} transaction={transaction} walletAddress={wallet?.address} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="incoming">
              <div className="space-y-4">
                {incomingTransactions.length > 0 ? (
                  incomingTransactions.map(transaction => (
                    <TransactionItem key={transaction.hash} transaction={transaction} walletAddress={wallet?.address} />
                  ))
                ) : (
                  <EmptyState message="No incoming transactions found" />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="outgoing">
              <div className="space-y-4">
                {outgoingTransactions.length > 0 ? (
                  outgoingTransactions.map(transaction => (
                    <TransactionItem key={transaction.hash} transaction={transaction} walletAddress={wallet?.address} />
                  ))
                ) : (
                  <EmptyState message="No outgoing transactions found" />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pending">
              <div className="space-y-4">
                {pendingTransactions.length > 0 ? (
                  pendingTransactions.map(transaction => (
                    <TransactionItem key={transaction.hash} transaction={transaction} walletAddress={wallet?.address} />
                  ))
                ) : (
                  <EmptyState message="No pending transactions" />
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </PageLayout>
  );
}

function TransactionItem({ transaction, walletAddress }) {
  const isIncoming = transaction.recipientAddress === walletAddress;
  
  // Format transaction amount with μPVX symbol
  const formattedAmount = (Number(transaction.amount).toLocaleString() || '0') + ' μPVX';
  
  // Determine icon and color
  const getIcon = () => {
    if (transaction.status === 'pending') return 'ri-time-line';
    return isIncoming ? 'ri-arrow-down-circle-line' : 'ri-arrow-up-circle-line';
  }
  
  // Get transaction status badge
  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-green-950/30 text-green-400 border-green-600/30">
            <i className="ri-checkbox-circle-line mr-1"></i>
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-950/30 text-yellow-400 border-yellow-600/30">
            <i className="ri-time-line mr-1"></i>
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-950/30 text-red-400 border-red-600/30">
            <i className="ri-close-circle-line mr-1"></i>
            Failed
          </Badge>
        );
      default:
        return null;
    }
  }
  
  return (
    <Card className="bg-card border-gray-800">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isIncoming ? 'bg-green-900/20 text-green-400' : 'bg-blue-900/20 text-blue-400'
            }`}>
              <i className={`${getIcon()} text-xl`}></i>
            </div>
            <div>
              <div className="font-medium text-white">
                {isIncoming ? 'Received' : 'Sent'} {formattedAmount}
              </div>
              <div className="text-xs text-muted-foreground">
                {timeAgo(transaction.timestamp)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge()}
            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
              {isIncoming ? `From: ${transaction.senderAddress}` : `To: ${transaction.recipientAddress}`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-background/50 rounded-md border border-gray-800">
      <i className="ri-inbox-line text-4xl text-muted-foreground mb-2"></i>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}