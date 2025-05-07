use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Ledger {
    pub balances: HashMap<String, u64>,
    pub nfts: HashMap<String, Vec<String>>, // owner -> list of NFT ids
}

impl Ledger {
    pub fn new() -> Self {
        Self {
            balances: HashMap::new(),
            nfts: HashMap::new(),
        }
    }

    pub fn get_balance(&self, address: &str) -> u64 {
        *self.balances.get(address).unwrap_or(&0)
    }

    pub fn credit(&mut self, address: &str, amount: u64) {
        let entry = self.balances.entry(address.to_string()).or_insert(0);
        *entry += amount;
    }

    pub fn debit(&mut self, address: &str, amount: u64) -> bool {
        let balance = self.balances.entry(address.to_string()).or_insert(0);
        if *balance >= amount {
            *balance -= amount;
            true
        } else {
            false
        }
    }

    pub fn mint_nft(&mut self, owner: &str, nft_id: &str) {
        self.nfts.entry(owner.to_string()).or_default().push(nft_id.to_string());
    }

    pub fn get_nfts(&self, owner: &str) -> Vec<String> {
        self.nfts.get(owner).cloned().unwrap_or_default()
    }
}