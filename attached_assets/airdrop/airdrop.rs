// src/commands/airdrop.rs
use clap::Args;
use crate::types::ChainState;
use crate::airdrop as airdrop_logic; // Assuming airdrop core logic is in src/airdrop.rs

#[derive(Args, Debug)]
pub struct AirdropArgs {
    /// Event name triggering the airdrop (optional)
    #[arg(long)]
    trigger: Option<String>,

    /// Specific wallet to airdrop to (optional)
    #[arg(long)]
    target: Option<String>,

    /// Amount for targeted airdrop (requires --target)
    #[arg(long, requires = "target")]
    amount: Option<u64>,
}

pub fn handle_airdrop(args: &AirdropArgs, chain_state: &mut ChainState) {
    println!("Processing airdrop command...");
    if let (Some(target), Some(amount)) = (&args.target, args.amount) {
        // Handle targeted airdrop
        let reason = format!("CLI targeted drop ({})", args.trigger.as_deref().unwrap_or("manual"));
         let log = airdrop_logic::airdrop_to_wallet(chain_state, target, amount, &reason);
         println!("{}", log);

    } else if let Some(trigger) = &args.trigger {
         // Handle event-based airdrop (needs more logic based on trigger)
         // Example: Lookup predefined reward map for the trigger
         println!("Triggering airdrop for event: {}", trigger);
         // Placeholder: Airdrop 10 tokens to a default wallet for testing
         let mut rewards = std::collections::HashMap::new();
         rewards.insert("TestWallet".to_string(), 10); // Example target
         let logs = airdrop_logic::drop_tokens(chain_state, rewards, trigger);
         logs.iter().for_each(|log| println!("{}", log));
    } else {
        println!("❌ Airdrop Failed: Specify --trigger <event> or --target <wallet> --amount <num>");
    }
     // Potentially save updated chain_state
}