// backend/src/types.rs - FINAL COMPREHENSIVE VERSION

use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};

// --- Primitive Type Aliases ---
pub type AccountId = String;
pub type Balance = u128;
pub type BlockNumber = u64;
pub type Timestamp = u64;
pub type Nonce = u64;
pub type Signature = String;
pub type TransactionHash = String;
pub type NftId = String;
pub type TemplateId = String;
pub type StakeId = Uuid;
pub type LoanId = Uuid;
pub type CampaignId = Uuid;
pub type ProposalId = Uuid;
pub type RewardId = Uuid;
pub type GameId = String;
pub type PlayerId = String;
pub type RewardPoints = u64;
pub type MembershipTier = u32;
pub type ProofData = Vec<u8>;
pub type CollateralType = String;
pub type WorkshopId = String;

// --- Core Enums ---

#[derive(Debug, Clone, Serialize, Deserialize, thiserror::Error)]
pub enum Error {
    #[error("Internal error: {0
    #[error("Stake not found: {0}")] StakeNotFound(String),
    #[error("Internal error: {0}")] InternalError(String),
    #[error("Game session not found")] GameSessionNotFound,
    #[error("Invalid CLI argument: {0}")] InvalidCliArgument(String),
    #[error("JSON deserialization error: {0}")] JsonDeserializationError(String),
    #[error("Invalid transaction type: {0}")] InvalidTransactionType(String),
    #[error("Insufficient stake amount (min {1}, got {0})")] InsufficientStakeAmount(Balance, Balance),
    #[error("Flexible staking not allowed")] FlexibleStakingNotAllowed,
    #[error("Permission denied: {0}")] PermissionDenied(String),
    #[error("Stake locked (unlocks at {1}): {0}")] StakeLocked(String, Timestamp),
    #[error("Proof verification failed: {0}")] ProofVerificationFailed(String),
    #[error("Not owner")] NotOwner,
    #[error("Not implemented: {0}")] NotImplemented(String),
    #[error("Account not found: {0}")] AccountNotFound(AccountId),
    #[error("Invalid signature: {0}")] InvalidSignature(String),
    #[error("Reward not found: {0}")] RewardNotFound(RewardId),
    #[error("Reward already claimed: {0}")] RewardAlreadyClaimed(RewardId),
    #[error("Proposal not found")] ProposalNotFound,
    #[error("Voting period inactive or invalid")] VotingPeriodInactive,
    #[error("Account {0} already voted on proposal {1}")] AlreadyVoted(AccountId, ProposalId),}")] InternalError(String),
    #[error("Not implemented: {0}")] NotImplemented(String),
    #[error("Poisoned mutex / state lock: {0}")] StateLockError(String),
    #[error("Account not found: {0}")] AccountNotFound(AccountId),
    #[error("Insufficient balance: {0} needs {1}")] InsufficientBalance(AccountId, Balance),
    #[error("Invalid nonce (expected {0}, got {1})")] InvalidNonce(Nonce, Nonce),
    #[error("Permission denied: {0}")] PermissionDenied(String),
    #[error("Not owner")] NotOwner,
    #[error("Invalid signature: {0}")] InvalidSignature(String),
    #[error("Proof verification failed: {0}")] ProofVerificationFailed(String),
    #[error("NFT not found: {0}")] NftNotFound(NftId),
    #[error("NFT template not found: {0}")] NftTemplateNotFound(String),
    #[error("Airdrop campaign not found: {0}")] AirdropCampaignNotFound(String),
    #[error("Airdrop campaign inactive: {0}")] AirdropCampaignInactive(String),
    #[error("Airdrop campaign expired: {0}")] AirdropCampaignExpired(String),
    #[error("Airdrop already claimed by {0} for campaign {1}")] AirdropAlreadyClaimed(AccountId, String),
    #[error("Reward not found: {0}")] RewardNotFound(RewardId),
    #[error("Reward already claimed: {0}")] RewardAlreadyClaimed(RewardId),
    #[error("Stake not found: {0}")] StakeNotFound(String),
    #[error("Stake locked (unlocks at {1}): {0}")] StakeLocked(String, Timestamp),
    #[error("Insufficient stake amount (min {1}, got {0})")] InsufficientStakeAmount(Balance, Balance),
    #[error("Flexible staking not allowed")] FlexibleStakingNotAllowed,
    #[error("Loan not found: {0}")] LoanNotFound(String),
    #[error("Proposal not found")] ProposalNotFound,
    #[error("Voting period inactive or invalid")] VotingPeriodInactive,
    #[error("Account {0} already voted on proposal {1}")] AlreadyVoted(AccountId, ProposalId),
    #[error("Invalid CLI argument: {0}")] InvalidCliArgument(String),
    #[error("JSON deserialization error: {0}")] JsonDeserializationError(String),
    #[error("Invalid transaction type: {0}")] InvalidTransactionType(String),
    #[error("Wallet error: {0}")] WalletError(String),
    #[error("Game session not found")] GameSessionNotFound,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TransactionType {
    Transfer { to: AccountId, amount: Balance },
    Mint { recipient: AccountId, amount: Balance },
    Burn { amount: Balance },
    Stake { amount: Balance, duration_days: Option<u32> },
    Unstake { stake_id: StakeId },
    Lend { asset: String, amount: Balance, rate_bps: u32 },
    WithdrawLend { asset: String, amount: Balance },
    Borrow { asset: String, amount: Balance, collateral_nft_id: Option<NftId> },
    RepayLoan { loan_id: LoanId, amount: Balance },
    LiquidateLoan { loan_id: LoanId },
    CreateProposal { title: String, description: String },
    Vote { proposal_id: ProposalId, support: bool },
    ClaimReward { reward_id: RewardId },
    ClaimAirdrop { campaign_id: CampaignId },
    MintNft { template_id: TemplateId },
    SubmitProof { proof_type: ProofType, data: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ProofType {
    Miner,
    ScreenCapture(String),
    ScreenCaptureHash(String), // Unit variant as needed by runtime
    ZkSnark(ZkEngine), // Unit variant
    GameActivity(GameId),
    Play,
    Growth,
    Contribution,
    Knowledge,
    Build,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ZkEngine { Halo2, Zexe, Mock }

// --- Core Structs ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: AccountId,
    pub balance: Balance,
    pub nfts: HashSet<NftId>,
    pub nonce: Nonce,
    pub proof_submissions: HashMap<ProofType, u64>,
}
impl Account {
    pub fn new(id: AccountId) -> Self {
        Self { id, balance: 0, nfts: HashSet::new(), nonce: 0, proof_submissions: HashMap::new() }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftMetadata {
    pub uri: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub image_uri: Option<String>,
    pub attributes: Option<serde_json::Value>, // Use JSON Value for flexibility
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftData {
    pub id: NftId,
    pub owner: AccountId,
    pub metadata: NftMetadata,
    pub minted_at: Option<Timestamp>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NftTemplate {
    pub id: TemplateId,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub hash: TransactionHash,
    pub signer: AccountId,
    pub to: Option<AccountId>,
    pub amount: Option<Balance>,
    pub nonce: Nonce,
    pub timestamp: Timestamp, // Added missing field from wallet.rs usage
    pub tx_type: TransactionType, // Use this name consistently
    pub signature: Option<Signature>,
    pub payload: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub number: BlockNumber,
    pub block_hash: String,
    pub previous_hash: String,
    pub state_root: String,
    pub proposer: AccountId,
    pub timestamp: Timestamp,
    pub transactions: Vec<Transaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reward {
    pub id: RewardId,
    pub owner: AccountId,
    pub account_id: Option<AccountId>, // Keep for potential compatibility
    pub source: Option<String>,
    pub points: u64, // Direct u64 based on reward_engine errors
    pub nft_id: Option<NftId>,
    pub claimed: bool,
    pub timestamp: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StakeInfo {
    pub id: StakeId,
    pub owner: AccountId, // Renamed from staker
    pub amount: Balance,
    pub start_timestamp: Timestamp,
    pub end_timestamp: Option<Timestamp>,
    pub claimed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Loan {
    pub id: LoanId,
    pub borrower: AccountId,
    pub lender: AccountId,
    pub amount: Balance,
    pub collateral_nft_id: Option<NftId>,
    pub interest_rate_bps: u32,
    pub due_date: Timestamp,
    pub repaid: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BorrowRequest {
    pub id: Uuid,
    pub borrower: AccountId,
    pub amount: Balance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
    pub id: ProposalId,
    pub title: String,
    pub description: String,
    pub proposer: AccountId,
    pub votes_for: u64,
    pub votes_against: u64,
    pub voters: HashMap<AccountId, bool>,
    pub start_time: Timestamp,
    pub end_time: Timestamp,
    pub executed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSession {
    pub id: Uuid,
    pub game_id: GameId,
    pub player_id: PlayerId,
    pub start: Timestamp, // Use start/end consistently
    pub end: Timestamp,
    pub score: u64,
    // pub xp_earned: u64, // Add if game_events requires it
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofData { // Corrected based on runtime usage
    pub proof_type: ProofType,
    pub data: ProofData, // Alias to Vec<u8>
}

// --- Chain State ---
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ChainState {
    pub accounts: HashMap<AccountId, Account>,
    pub nfts: HashMap<NftId, NftData>,
    pub blocks: Vec<Block>,
    pub rewards: HashMap<RewardId, Reward>,
    pub proposals: HashMap<ProposalId, Proposal>,
    pub stakes: HashMap<StakeId, StakeInfo>,
    pub loans: HashMap<LoanId, Loan>,
    // Add BorrowRequests if needed: pub borrow_requests: HashMap<Uuid, BorrowRequest>,

    // Counters
    pub block_height: BlockNumber,
    pub next_nft_id: u64,
    pub next_proposal_id: u64,
    pub next_stake_id: u64,
}

// --- Shared State Alias ---
pub type SharedState = Arc<Mutex<ChainState>>;

// --- Warp Rejection Types ---
#[derive(Debug)] pub struct NotFoundError;
impl warp::reject::Reject for NotFoundError {}

#[derive(Debug)] pub struct InternalServerErrorRejection(pub String);
impl warp::reject::Reject for InternalServerErrorRejection {}

#[derive(Debug)] pub struct BadRequestError(pub String);
impl warp::reject::Reject for BadRequestError {}

#[derive(Debug)] pub struct StateLockErrorRejection(pub String); // For map_err
impl warp::reject::Reject for StateLockErrorRejection {}

impl Account {
    pub fn with_balance(id: AccountId, bal: Balance) -> Self {
        let mut a = Self::new(id); a.balance = bal; a
    }
}
impl ChainState { pub fn new() -> Self { Self::default() } }

