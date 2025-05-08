import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNFT } from "@/hooks/use-nft";
import { timeAgo } from "@/lib/formatters";
import { Link } from "wouter";

export function NFTCollection() {
  const { nfts, isLoading } = useNFT();
  
  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-gallery-line mr-2 text-accent"></i>
        Your Collection
      </h3>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <i className="ri-loader-4-line animate-spin text-xl text-primary"></i>
        </div>
      ) : nfts.length === 0 ? (
        // Empty State
        <div className="bg-background rounded-md p-6 flex flex-col items-center justify-center text-center h-64">
          <i className="ri-emotion-sad-line text-gray-400 text-3xl mb-2"></i>
          <p className="text-gray-400 mb-1">No NFTs in your collection yet</p>
          <p className="text-xs text-gray-500">Mint your first NFT or import existing ones</p>
        </div>
      ) : (
        // NFT Grid
        <>
          <div className="grid grid-cols-2 gap-3">
            {nfts.slice(0, 4).map((nft) => (
              <Dialog key={nft.id}>
                <DialogTrigger asChild>
                  <div className="bg-background rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition">
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {nft.imageUrl ? (
                        <img 
                          src={nft.imageUrl} 
                          alt={nft.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <i className="ri-image-line text-4xl text-gray-400"></i>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-sm text-white font-medium truncate">
                        {nft.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Minted {timeAgo(nft.createdAt)}
                      </div>
                    </div>
                  </div>
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
          
          {nfts.length > 4 && (
            <Link href="/nfts">
              <Button 
                variant="outline"
                className="w-full mt-4 bg-background hover:bg-muted text-white"
              >
                <i className="ri-eye-line mr-2"></i>
                View All NFTs
              </Button>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
