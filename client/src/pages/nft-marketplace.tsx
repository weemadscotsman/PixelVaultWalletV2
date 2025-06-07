import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Plus, ShoppingCart, Palette, TrendingUp, Clock, Eye } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

const mintNFTSchema = z.object({
  collectionId: z.string().min(1, 'Collection is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().url('Valid image URL is required'),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.string()
  })).optional(),
});

const listNFTSchema = z.object({
  price: z.string().min(1, 'Price is required'),
  listingType: z.enum(['fixed', 'auction']),
  duration: z.number().optional(),
  reservePrice: z.string().optional(),
});

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  imageUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  royaltyPercentage: z.number().min(0).max(1000).default(250),
});

interface NFTToken {
  id: string;
  tokenId: string;
  collectionId: string;
  name: string;
  description?: string;
  imageUrl: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  ownerAddress: string;
  creatorAddress: string;
  currentPrice?: string;
  isListed: boolean;
  listingType?: 'fixed' | 'auction';
  mintedAt: string;
}

interface NFTCollection {
  id: string;
  name: string;
  description: string;
  symbol: string;
  creatorAddress: string;
  imageUrl?: string;
  bannerUrl?: string;
  totalSupply: number;
  floorPrice: string;
  volume: string;
  isVerified: boolean;
}

interface MarketplaceListing {
  id: string;
  tokenId: string;
  sellerAddress: string;
  price: string;
  listingType: 'fixed' | 'auction';
  isActive: boolean;
  currency: string;
  token: NFTToken;
}

export default function NFTMarketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('marketplace');
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showCreateCollectionDialog, setShowCreateCollectionDialog] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTToken | null>(null);

  // Get current user address from auth system
  const currentUserAddress = 'PVX_1295b5490224b2eb64e9724dc091795a'; // Using existing wallet address

  // Fetch marketplace data
  const { data: marketplaceStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/nft/stats'],
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery<NFTCollection[]>({
    queryKey: ['/api/nft/collections'],
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery<MarketplaceListing[]>({
    queryKey: ['/api/nft/marketplace'],
  });

  const { data: userNFTs = [], isLoading: userNFTsLoading } = useQuery<NFTToken[]>({
    queryKey: ['/api/nft/wallet', currentUserAddress],
  });

  const { data: recentSales = [], isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ['/api/nft/sales/recent'],
  });

  // Mutations
  const createCollectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createCollectionSchema>) => {
      const res = await apiRequest('POST', '/api/nft/collections', {
        ...data,
        creatorAddress: currentUserAddress,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nft/collections'] });
      setShowCreateCollectionDialog(false);
      toast({ title: 'Collection created successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to create collection', variant: 'destructive' });
    },
  });

  const mintNFTMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mintNFTSchema>) => {
      const res = await apiRequest('POST', '/api/nft/mint', {
        ...data,
        ownerAddress: currentUserAddress,
        creatorAddress: currentUserAddress,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nft/wallet', currentUserAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/nft/collections'] });
      setShowMintDialog(false);
      toast({ title: 'NFT minted successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to mint NFT', variant: 'destructive' });
    },
  });

  const listNFTMutation = useMutation({
    mutationFn: async ({ tokenId, data }: { tokenId: string; data: z.infer<typeof listNFTSchema> }) => {
      const res = await apiRequest('POST', `/api/nft/${tokenId}/list`, {
        ...data,
        sellerAddress: currentUserAddress,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nft/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nft/wallet', currentUserAddress] });
      setSelectedNFT(null);
      toast({ title: 'NFT listed successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to list NFT', variant: 'destructive' });
    },
  });

  const buyNFTMutation = useMutation({
    mutationFn: async ({ tokenId, price }: { tokenId: string; price: string }) => {
      const res = await apiRequest('POST', `/api/nft/${tokenId}/buy`, {
        buyerAddress: currentUserAddress,
        price,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nft/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nft/wallet', currentUserAddress] });
      toast({ title: 'NFT purchased successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to purchase NFT', variant: 'destructive' });
    },
  });

  // Forms
  const createCollectionForm = useForm<z.infer<typeof createCollectionSchema>>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      royaltyPercentage: 250,
    },
  });

  const mintNFTForm = useForm<z.infer<typeof mintNFTSchema>>({
    resolver: zodResolver(mintNFTSchema),
  });

  const listNFTForm = useForm<z.infer<typeof listNFTSchema>>({
    resolver: zodResolver(listNFTSchema),
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
        <div className="flex gap-3">
          <Dialog open={showCreateCollectionDialog} onOpenChange={setShowCreateCollectionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Palette className="h-4 w-4" />
                Create Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create NFT Collection</DialogTitle>
              </DialogHeader>
              <Form {...createCollectionForm}>
                <form onSubmit={createCollectionForm.handleSubmit((data) => createCollectionMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={createCollectionForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Collection" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createCollectionForm.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="MAC" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createCollectionForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your collection..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createCollectionForm.control}
                    name="royaltyPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Royalty Percentage (0-10%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="1000" 
                            placeholder="250" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createCollectionMutation.isPending} className="w-full">
                    {createCollectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Collection
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Mint NFT
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Mint New NFT</DialogTitle>
              </DialogHeader>
              <Form {...mintNFTForm}>
                <form onSubmit={mintNFTForm.handleSubmit((data) => mintNFTMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={mintNFTForm.control}
                    name="collectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a collection" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {collections?.map((collection: NFTCollection) => (
                              <SelectItem key={collection.id} value={collection.id}>
                                {collection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={mintNFTForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NFT Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome NFT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={mintNFTForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your NFT..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={mintNFTForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={mintNFTMutation.isPending} className="w-full">
                    {mintNFTMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mint NFT
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      {!statsLoading && marketplaceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Collections</p>
                  <p className="text-2xl font-bold">{marketplaceStats.totalCollections}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total NFTs</p>
                  <p className="text-2xl font-bold">{marketplaceStats.totalNFTs}</p>
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
                  <p className="text-2xl font-bold">{formatNumber(parseInt(marketplaceStats.totalVolume) / 1000000)} PVX</p>
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
                  <p className="text-2xl font-bold">{marketplaceStats.activeListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="my-nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Listings</h2>
            <div className="text-sm text-muted-foreground">
              {listings?.length || 0} items available
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
              {listings?.map((listing: MarketplaceListing) => (
                <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 relative">
                    <img 
                      src={listing.token.imageUrl} 
                      alt={listing.token.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2MS4wNDYgMTAwIDE3MCA4OS4wNDU3IDE3MCA3OEMxNzAgNjYuOTU0MyAxNjEuMDQ2IDU2IDE1MCA1NkMxMzguOTU0IDU2IDEzMCA2Ni45NTQzIDEzMCA3OEMxMzAgODkuMDQ1NyAxMzguOTU0IDEwMCAxNTAgMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAwIDIwMEgxMDBWMTgwQzEwMCAxNjIuMzI3IDExNC4zMjcgMTQ4IDEzMiAxNDhIMTY4QzE4NS42NzMgMTQ4IDIwMCAxNjIuMzI3IDIwMCAxODBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                      }}
                    />
                    {listing.listingType === 'auction' && (
                      <Badge className="absolute top-2 left-2" variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Auction
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{listing.token.name}</h3>
                    <p className="text-sm text-muted-foreground truncate mb-3">{listing.token.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-bold">{formatNumber(parseInt(listing.price) / 1000000)} PVX</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => buyNFTMutation.mutate({ tokenId: listing.tokenId, price: listing.price })}
                        disabled={buyNFTMutation.isPending}
                      >
                        {buyNFTMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              {collections?.map((collection: NFTCollection) => (
                <Card key={collection.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400 relative">
                    {collection.bannerUrl && (
                      <img 
                        src={collection.bannerUrl} 
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    )}
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
                        <p className="font-medium">{collection.totalSupply}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Floor</p>
                        <p className="font-medium">{formatNumber(parseInt(collection.floorPrice) / 1000000)} PVX</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volume</p>
                        <p className="font-medium">{formatNumber(parseInt(collection.volume) / 1000000)} PVX</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-nfts" className="space-y-4">
          <h2 className="text-xl font-semibold">My NFTs</h2>
          
          {userNFTsLoading ? (
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
              {userNFTs?.map((nft: NFTToken) => (
                <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100">
                    <img 
                      src={nft.imageUrl} 
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTAwQzE2MS4wNDYgMTAwIDE3MCA4OS4wNDU3IDE3MCA3OEMxNzAgNjYuOTU0MyAxNjEuMDQ2IDU2IDE1MCA1NkMxMzguOTU0IDU2IDEzMCA2Ni45NTQzIDEzMCA3OEMxMzAgODkuMDQ1NyAxMzguOTU0IDEwMCAxNTAgMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAwIDIwMEgxMDBWMTgwQzEwMCAxNjIuMzI3IDExNC4zMjcgMTQ4IDEzMiAxNDhIMTY4QzE4NS42NzMgMTQ4IDIwMCAxNjIuMzI3IDIwMCAxODBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{nft.name}</h3>
                    <p className="text-sm text-muted-foreground truncate mb-3">{nft.description}</p>
                    <div className="flex gap-2">
                      {nft.isListed ? (
                        <Badge variant="secondary">Listed</Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedNFT(nft)}
                        >
                          List for Sale
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Sales</h2>
          
          {salesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                    <div className="h-6 bg-muted rounded w-20" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales?.map((sale: any) => (
                <Card key={sale.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">NFT Sale</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.sellerAddress.slice(0, 8)}... → {sale.buyerAddress.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatNumber(parseInt(sale.price) / 1000000)} PVX</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* List NFT Dialog */}
      {selectedNFT && (
        <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>List NFT for Sale</DialogTitle>
            </DialogHeader>
            <Form {...listNFTForm}>
              <form onSubmit={listNFTForm.handleSubmit((data) => {
                listNFTMutation.mutate({ tokenId: selectedNFT.id, data });
              })} className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <img 
                    src={selectedNFT.imageUrl} 
                    alt={selectedNFT.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium">{selectedNFT.name}</p>
                    <p className="text-sm text-muted-foreground">Token #{selectedNFT.tokenId}</p>
                  </div>
                </div>
                
                <FormField
                  control={listNFTForm.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select listing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="auction">Auction</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={listNFTForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (μPVX)</FormLabel>
                      <FormControl>
                        <Input placeholder="1000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={listNFTMutation.isPending} className="w-full">
                  {listNFTMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  List NFT
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}