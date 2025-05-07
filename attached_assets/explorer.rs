// src/commands/explorer.rs
use clap::Args;
use crate::types::ChainState;

#[derive(Args, Debug)]
pub struct ExplorerArgs {
    /// View latest block info (example)
    #[arg(long)]
    block: Option<String>, // Could be "latest" or a block number/hash

    /// View account details
    #[arg(long)]
    address: Option<String>,

     /// List all NFTs (example)
     #[arg(long)]
     list_nfts: bool,
}

pub fn handle_explorer(args: &ExplorerArgs, chain_state: &ChainState) {
    println!("Processing explorer command...");
    if let Some(block_arg) = &args.block {
        println!("Exploring Block: {} (Feature Pending - Requires block history)", block_arg);
         // TODO: Load block data (needs ChainState to store blocks)
    } else if let Some(addr) = &args.address {
        println!("Exploring Address: {}", addr);
        if let Some(account) = chain_state.accounts.get(addr) {
            println!("   Balance: {}", account.balance);
             println!("   NFTs Owned: {}", account.owned_nfts.len());
             if !account.owned_nfts.is_empty() {
                 println!("     NFT Details:");
                 for nft in &account.owned_nfts {
                     println!("       - ID: {}, Name: {}", nft.id, nft.name);
                 }
             }
        } else {
            println!("   Account not found.");
        }
    } else if args.list_nfts {
         println!("Listing all NFTs in Registry ({} total):", chain_state.nft_registry.len());
         if chain_state.nft_registry.is_empty() {
             println!("  (No NFTs minted yet)");
         } else {
             for nft in &chain_state.nft_registry {
                 println!("  - ID: {}, Name: '{}', Creator: {}", nft.id, nft.name, nft.creator);
             }
         }
    }
    else {
        println!("Specify an action: --block <id|latest>, --address <addr>, --list-nfts");
    }
}