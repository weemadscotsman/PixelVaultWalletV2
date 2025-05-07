
use crate::types::{ChainState, Account};
use std::collections::HashMap;

/// Represents a bridge transfer record
#[derive(Debug, Clone)]
pub struct BridgeTransfer {
    pub from_wallet: String,
    pub to_external: String,
    pub amount: u64,
    pub destination_chain: String,
    pub timestamp: u64,
}

/// Store a bridge transfer
pub fn bridge_out(
    chain: &mut ChainState,
    wallet: &str,
    destination_chain: &str,
    to_external: &str,
    amount: u64,
    timestamp: u64,
) -> Result<BridgeTransfer, String> {
    let account = chain
        .accounts
        .get_mut(wallet)
        .ok_or("Wallet not found")?;

    if account.balance < amount {
        return Err("Insufficient balance".into());
    }

    account.balance -= amount;

    let transfer = BridgeTransfer {
        from_wallet: wallet.to_string(),
        to_external: to_external.to_string(),
        amount,
        destination_chain: destination_chain.to_string(),
        timestamp,
    };

    // Save to chain log for later off-chain pickup or bridge relay
    chain.bridged.push(transfer.clone());

    Ok(transfer)
}
