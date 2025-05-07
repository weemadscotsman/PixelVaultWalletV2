// src/commands/stake.rs
use clap::Args;
use crate::types::ChainState;

#[derive(Args, Debug)]
pub struct StakeArgs {
    /// Wallet address performing the stake
    #[arg(long)]
    wallet: String,
    /// Amount of tokens to stake
    #[arg(long)]
    amount: u64,
    // Add options like --duration if applicable
}

pub fn handle_stake(args: &StakeArgs, chain_state: &mut ChainState) {
    println!("Attempting to stake {} tokens for wallet {}", args.amount, args.wallet);
    let account = chain_state.accounts.entry(args.wallet.clone()).or_default();

    if account.balance >= args.amount {
        account.balance -= args.amount; // Deduct from liquid balance
        // Add logic here to track staked amount, e.g., add to a staking pool struct in ChainState
        println!("✅ Staked {} tokens. Remaining balance: {}", args.amount, account.balance);
        // Potentially save updated chain_state
    } else {
        println!("❌ Staking Failed: Insufficient balance (has {}, needs {}).", account.balance, args.amount);
    }
}