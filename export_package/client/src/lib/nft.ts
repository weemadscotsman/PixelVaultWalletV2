import { NFT } from "@/types/blockchain";

// Mock base URL - in a real app, this would be configured properly
const API_BASE_URL = "/api";

// Create and mint a new NFT
export async function mintNFT(
  ownerAddress: string,
  name: string,
  description: string,
  file: File,
  enableZkVerification: boolean = false,
  hideOwnerAddress: boolean = false
): Promise<NFT> {
  try {
    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append("ownerAddress", ownerAddress);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("file", file);
    formData.append("enableZkVerification", enableZkVerification.toString());
    formData.append("hideOwnerAddress", hideOwnerAddress.toString());
    
    const response = await fetch(`${API_BASE_URL}/nft/mint`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to mint NFT: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw new Error("Failed to mint NFT");
  }
}

// Get NFTs owned by an address
export async function getNFTs(ownerAddress: string): Promise<NFT[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/nft/owned?address=${ownerAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    throw new Error("Failed to fetch NFTs");
  }
}

// Get a specific NFT by ID
export async function getNFT(id: string): Promise<NFT> {
  try {
    const response = await fetch(`${API_BASE_URL}/nft/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch NFT: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching NFT:", error);
    throw new Error("Failed to fetch NFT");
  }
}

// Transfer an NFT to another address
export async function transferNFT(
  id: string,
  fromAddress: string,
  toAddress: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/nft/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, fromAddress, toAddress }),
    });

    if (!response.ok) {
      throw new Error(`Failed to transfer NFT: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error transferring NFT:", error);
    throw new Error("Failed to transfer NFT");
  }
}
