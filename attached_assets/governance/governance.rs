// src/commands/governance.rs
use clap::Args;
use crate::types::ChainState;
use crate::gov_vote as gov_logic; // Assuming gov logic is in src/gov_vote.rs

#[derive(Args, Debug)]
pub struct GovArgs {
    /// List all active proposals
    #[arg(long)]
    list_proposals: bool,

    /// ID of the proposal to vote on
    #[arg(long)]
    vote_id: Option<String>,

    /// Vote 'yes' on the proposal (requires --vote-id)
    #[arg(long, requires = "vote_id")]
    yes: bool,

    /// Vote 'no' on the proposal (requires --vote-id)
    #[arg(long, requires = "vote_id")]
    no: bool,

     /// Add a new proposal (example args)
     #[arg(long)]
     add_proposal: bool,
     #[arg(long, requires="add_proposal")]
     proposal_id: Option<String>,
     #[arg(long, requires="add_proposal")]
     proposal_desc: Option<String>,

}

pub fn handle_governance(args: &GovArgs, chain_state: &mut ChainState) {
    println!("Processing governance command...");
    let mut state_changed = false;

    if args.list_proposals {
        println!("📜 Current Proposals:");
        let proposals = gov_logic::list_proposals(chain_state);
        if proposals.is_empty() {
            println!("   (No active proposals)");
        } else {
            for p in proposals {
                println!("   - ID: {}, Yes: {}, No: {} | Desc: {}", p.id, p.yes_votes, p.no_votes, p.description);
            }
        }
    } else if let (Some(id), Some(desc)) = (&args.proposal_id, &args.proposal_desc) {
         if args.add_proposal {
             match gov_logic::add_proposal(chain_state, id, desc) {
                 Ok(_) => {
                     println!("✅ Proposal '{}' added successfully.", id);
                     state_changed = true;
                 },
                 Err(e) => println!("❌ Failed to add proposal: {}", e),
             }
         }
    } else if let Some(id) = &args.vote_id {
        let vote = args.yes; // true for yes, false if only --no is present (clap handles exclusivity)
        if args.yes || args.no {
             match gov_logic::cast_vote(chain_state, id, vote) {
                 Ok(_) => {
                     println!("✅ Vote cast for proposal '{}'.", id);
                     state_changed = true;
                },
                 Err(e) => println!("❌ Voting Failed: {}", e),
             }
        } else {
            println!("Specify --yes or --no to vote.");
        }
    } else {
        println!("Specify an action: --list-proposals, --add-proposal --proposal-id <id> --proposal-desc <desc>, or --vote-id <id> (--yes | --no)");
    }

     // Potentially save updated chain_state IF state_changed is true
     if state_changed {
         // Logic to inform main to save state could go here, or handle in main.rs
         println!("ℹ️ Governance state updated.");
     }
}