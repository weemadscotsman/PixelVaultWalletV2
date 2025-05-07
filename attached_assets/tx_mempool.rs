
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use ed25519_dalek::{PublicKey, Signature};
use crate::signature::SignatureManager;

/// A transaction object
#[derive(Clone, Debug)]
pub struct Transaction {
    pub sender: PublicKey,
    pub payload: Vec<u8>,
    pub signature: Signature,
}

/// The transaction mempool: holds transactions before they are mined
#[derive(Clone)]
pub struct TxMempool {
    pool: Arc<Mutex<VecDeque<Transaction>>>,
}

impl TxMempool {
    /// Initialize a new empty mempool
    pub fn new() -> Self {
        TxMempool {
            pool: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    /// Attempt to add a transaction if valid
    pub fn add_transaction(&self, tx: Transaction) -> bool {
        let is_valid = SignatureManager::verify(&tx.sender, &tx.payload, &tx.signature);
        if is_valid {
            let mut mempool = self.pool.lock().unwrap();
            mempool.push_back(tx);
            true
        } else {
            false
        }
    }

    /// Get and remove the next transaction
    pub fn pop_transaction(&self) -> Option<Transaction> {
        let mut mempool = self.pool.lock().unwrap();
        mempool.pop_front()
    }

    /// Peek at the current transactions
    pub fn list_transactions(&self) -> Vec<Transaction> {
        let mempool = self.pool.lock().unwrap();
        mempool.iter().cloned().collect()
    }

    /// Check the size of the mempool
    pub fn size(&self) -> usize {
        let mempool = self.pool.lock().unwrap();
        mempool.len()
    }
}
