// src/commands/mint.rs
use clap::Args;
use crate::types::ChainState; // Assuming types are in root src
use crate::nft_minter; // Assuming nft_minter is in root src

#[derive(Args, Debug)]
pub struct MintArgs {
    /// Name of the NFT
    #[arg(long)]
    name: String,
    /// Wallet address of the creator
    #[arg(long)]
    creator: String,
    /// Description of the NFT
    #[arg(long)]
    desc: String,
    /// Image URL (e.g., ipfs://...)
    #[arg(long)]
    image: String,
     /// Category of the NFT
    #[arg(long)]
    category: String,
    // Add other mint options if needed
}

pub fn handle_mint(args: &MintArgs, chain_state: &mut ChainState) {
    println!("Attempting to mint NFT via CLI command...");
    match nft_minter::mint_nft(
        chain_state,
        &args.creator,
        &args.name,
        &args.desc,
        &args.image,
        &args.category
    ) {
        Ok(nft_meta) => {
            println!("✅ NFT Minted Successfully:");
            println!("   ID: {}", nft_meta.id);
            println!("   Name: {}", nft_meta.name);
            println!("   Creator: {}", nft_meta.creator);
            // Potentially save updated chain_state here if not handled by main
        }
        Err(e) => {
            println!("❌ Minting Failed: {}", e);
        }
    }
}