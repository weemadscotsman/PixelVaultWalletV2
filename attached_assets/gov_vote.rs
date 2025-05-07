
use std::collections::HashMap;
use crate::types::ChainState;

/// Proposal object
#[derive(Debug, Clone)]
pub struct Proposal {
    pub id: String,
    pub description: String,
    pub yes_votes: u32,
    pub no_votes: u32,
}

/// Cast a vote on a proposal
pub fn cast_vote(
    chain: &mut ChainState,
    proposal_id: &str,
    vote: bool,
) -> Result<(), String> {
    let proposal = chain
        .governance_votes
        .get_mut(proposal_id)
        .ok_or("Proposal not found")?;

    if vote {
        proposal.yes_votes += 1;
    } else {
        proposal.no_votes += 1;
    }

    Ok(())
}

/// Add a new proposal
pub fn add_proposal(chain: &mut ChainState, id: &str, description: &str) -> Result<(), String> {
    if chain.governance_votes.contains_key(id) {
        return Err("Proposal with this ID already exists".to_string());
    }

    let proposal = Proposal {
        id: id.to_string(),
        description: description.to_string(),
        yes_votes: 0,
        no_votes: 0,
    };

    chain.governance_votes.insert(id.to_string(), proposal);
    Ok(())
}

/// List all proposals
pub fn list_proposals(chain: &ChainState) -> Vec<&Proposal> {
    chain.governance_votes.values().collect()
}
