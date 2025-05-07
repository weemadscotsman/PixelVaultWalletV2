
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TransactionType {
    Transfer,
    Mint,
    Burn,
}

impl TransactionType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TransactionType::Transfer => "Transfer",
            TransactionType::Mint => "Mint",
            TransactionType::Burn => "Burn",
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transaction {
    pub from: String,
    pub to: String,
    pub amount: u64,
    pub tx_type: TransactionType,
    pub signature: String,
    pub public_key: String,
    pub timestamp: u64,
}
