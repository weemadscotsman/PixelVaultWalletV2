import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Plus, ShoppingCart, Palette, TrendingUp } from 'lucide-react';

export default function NFTMarketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('marketplace');

  // Fetch marketplace data with error handling
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/nft/stats'],
    retry: false,
    staleTime: 30000,
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['/api/nft/collections'],
    retry: false,
    staleTime: 30000,
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['/api/nft/marketplace'],
    retry: false,
    staleTime: 30000,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            NFT Marketplace
          </h1>
          <p className="text-muted-foreground">Create, trade, and collect unique digital assets on the PVX blockchain</p>
        </div>
      </div>

      {/* Stats Overview */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Collections</p>
                  <p className="text-2xl font-bold">{stats.totalCollections || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total NFTs</p>
                  <p className="text-2xl font-bold">{stats.totalNFTs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-2xl font-bold">{Math.round((parseInt(stats.totalVolume || '0') / 1000000) * 100) / 100} PVX</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Listed</p>
                  <p className="text-2xl font-bold">{stats.activeListings || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Listings</h2>
            <div className="text-sm text-muted-foreground">
              {Array.isArray(listings) ? listings.length : 0} items available
            </div>
          </div>
          
          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                    <div className="h-8 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.isArray(listings) && listings.length > 0 ? (
                listings.map((listing: any) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 relative flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                        <p>NFT Preview</p>
                      </div>
                      {listing.listingType === 'auction' && (
                        <Badge className="absolute top-2 left-2" variant="secondary">
                          Auction
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{listing.token?.name || 'Unnamed NFT'}</h3>
                      <p className="text-sm text-muted-foreground truncate mb-3">{listing.token?.description || 'No description'}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-bold">{Math.round((parseInt(listing.price || '0') / 1000000) * 100) / 100} PVX</p>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground">NFTs will appear here when they're listed for sale.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <h2 className="text-xl font-semibold">Collections</h2>
          
          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-16" />
                      <div className="h-6 bg-muted rounded w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(collections) && collections.length > 0 ? (
                collections.map((collection: any) => (
                  <Card key={collection.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400 relative flex items-center justify-center">
                      <div className="text-white text-center">
                        <Palette className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-semibold">{collection.symbol}</p>
                      </div>
                      {collection.isVerified && (
                        <Badge className="absolute top-2 right-2" variant="default">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{collection.name}</h3>
                        <Badge variant="outline">{collection.symbol}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{collection.description}</p>
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Items</p>
                          <p className="font-medium">{collection.totalSupply || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Floor</p>
                          <p className="font-medium">{Math.round((parseInt(collection.floorPrice || '0') / 1000000) * 100) / 100} PVX</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Volume</p>
                          <p className="font-medium">{Math.round((parseInt(collection.volume || '0') / 1000000) * 100) / 100} PVX</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
                  <p className="text-muted-foreground">Collections will appear here when they're created.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="text-center py-12">
            <Plus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Create NFTs</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              NFT creation tools will be available here. You'll be able to mint new NFTs, create collections, and manage your digital assets.
            </p>
            <div className="flex gap-4 justify-center">
              <Button disabled variant="outline">
                Create Collection
              </Button>
              <Button disabled>
                Mint NFT
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">Coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}