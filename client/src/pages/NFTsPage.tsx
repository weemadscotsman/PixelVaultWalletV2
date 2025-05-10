import React from 'react';
import { Helmet } from 'react-helmet';
import { useNFT } from '@/hooks/use-nft';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { timeAgo } from '@/lib/formatters';
import { PageLayout } from '@/components/layout/PageLayout';

export default function NFTsPage() {
  const { nfts, isLoading } = useNFT();

  return (
    <PageLayout isConnected={true}>
      <Helmet>
        <title>NFT Collection | PixelVault</title>
        <meta name="description" content="View and manage your NFT collection on the PVX blockchain" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">NFT Collection</h1>
            <p className="text-muted-foreground">Manage your digital assets on PVX blockchain</p>
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
              <p className="text-muted-foreground">Loading NFT collection...</p>
            </div>
          </div>
        ) : nfts.length === 0 ? (
          <Card className="bg-card border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <i className="ri-gallery-line text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-medium text-white mb-2">No NFTs Found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Your NFT collection is empty. Mint new NFTs or import existing ones to begin building your collection.
              </p>
              <Button variant="secondary">
                <i className="ri-add-line mr-2"></i>
                Mint New NFT
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nfts.map(nft => (
              <Dialog key={nft.id}>
                <DialogTrigger asChild>
                  <Card className="bg-card border-gray-800 hover:border-primary/50 transition cursor-pointer">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {nft.imageUrl ? (
                        <img 
                          src={nft.imageUrl} 
                          alt={nft.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <i className="ri-image-line text-6xl text-gray-400"></i>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md">{nft.name}</CardTitle>
                        {nft.enableZkVerification && (
                          <Badge variant="outline" className="bg-primary-dark/30 text-primary-light border-primary/30">
                            <i className="ri-shield-check-line mr-1"></i>
                            ZK
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 text-xs text-muted-foreground">
                      Minted {timeAgo(nft.createdAt)}
                    </CardFooter>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{nft.name}</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col space-y-3">
                    <div className="bg-muted rounded-md overflow-hidden aspect-square">
                      {nft.imageUrl ? (
                        <img 
                          src={nft.imageUrl} 
                          alt={nft.name} 
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <i className="ri-image-line text-6xl text-gray-400"></i>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{nft.description}</p>
                    <div className="bg-background p-3 rounded-md text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Token ID:</span>
                        <span className="text-gray-200">{nft.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-gray-200">
                          {new Date(nft.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!nft.hideOwnerAddress && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Owner:</span>
                          <span className="text-gray-200 truncate max-w-[180px]">
                            {nft.ownerAddress}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Zero-Knowledge:</span>
                        <span className="text-gray-200">
                          {nft.enableZkVerification ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </motion.div>
    </PageLayout>
  );
}