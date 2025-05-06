import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useNFT } from "@/hooks/use-nft";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

export function NFTMinter() {
  const { mintNFT } = useNFT();
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [enableZkVerification, setEnableZkVerification] = useState(false);
  const [hideOwnerAddress, setHideOwnerAddress] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleMint = async () => {
    if (!wallet || !file) return;
    
    try {
      setIsMinting(true);
      await mintNFT(
        wallet.publicAddress, 
        name, 
        description, 
        file,
        enableZkVerification,
        hideOwnerAddress
      );
      
      toast({
        title: "NFT Minted Successfully",
        description: `Your NFT "${name}" has been minted`,
      });
      
      // Reset form
      setName("");
      setDescription("");
      setFile(null);
      setEnableZkVerification(false);
      setHideOwnerAddress(false);
    } catch (error) {
      console.error("Minting error:", error);
      toast({
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "Failed to mint NFT",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <i className="ri-nft-line mr-2 text-accent"></i>
        Create & Mint NFT
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label className="block text-sm font-medium text-gray-400 mb-1">NFT Name</Label>
          <Input 
            type="text" 
            placeholder="My Awesome NFT" 
            className="w-full bg-background border border-gray-600 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-400 mb-1">Description</Label>
          <Textarea 
            placeholder="Describe your NFT..." 
            rows={3} 
            className="w-full bg-background border border-gray-600 text-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-400 mb-1">File Upload</Label>
          <div 
            className={`border-2 border-dashed ${dragActive ? 'border-primary' : 'border-gray-600'} rounded-md p-6 flex flex-col items-center justify-center bg-background`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="text-center">
                <i className="ri-file-check-line text-accent text-3xl mb-2"></i>
                <p className="text-sm text-white mb-1">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button 
                  variant="link" 
                  className="text-primary text-sm mt-2"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <i className="ri-upload-cloud-2-line text-gray-400 text-3xl mb-2"></i>
                <p className="text-sm text-gray-400 mb-2">Drag and drop or click to upload</p>
                <p className="text-xs text-gray-500">Supports: PNG, JPG, GIF, SVG, GLB, GLTF</p>
              </>
            )}
            <input 
              type="file" 
              className="hidden" 
              id="nft-file-upload"
              onChange={handleFileChange}
              accept=".png,.jpg,.jpeg,.gif,.svg,.glb,.gltf"
            />
            <Button 
              variant="outline"
              className="mt-3 px-4 py-1.5 bg-primary hover:bg-primary-light text-white text-sm"
              onClick={() => document.getElementById('nft-file-upload')?.click()}
              disabled={!!file}
            >
              Select File
            </Button>
          </div>
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-400 mb-1">Privacy Settings</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enable-zk" 
                checked={enableZkVerification}
                onCheckedChange={(checked) => setEnableZkVerification(!!checked)}
              />
              <Label htmlFor="enable-zk" className="text-sm text-gray-300">
                Enable zk-verification (shields metadata)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hide-owner" 
                checked={hideOwnerAddress}
                onCheckedChange={(checked) => setHideOwnerAddress(!!checked)}
              />
              <Label htmlFor="hide-owner" className="text-sm text-gray-300">
                Hide owner address
              </Label>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            variant="outline"
            className="w-full bg-accent hover:bg-accent-light text-white"
            onClick={handleMint}
            disabled={!wallet || !name || !file || isMinting}
          >
            {isMinting ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Minting...
              </>
            ) : (
              <>
                <i className="ri-nft-line mr-2"></i>
                Mint NFT
              </>
            )}
          </Button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Estimated network fee: 0.001 PVX
          </p>
        </div>
      </div>
    </div>
  );
}
