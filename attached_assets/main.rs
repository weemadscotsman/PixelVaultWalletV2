
mod wallet;
mod mint;
mod banana;
mod stake;
mod governance;
mod quest;
mod airdrop;
mod explorer;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    match args.get(1).map(|s| s.as_str()) {
        Some("wallet") => wallet::run(),
        Some("mint") => mint::run(),
        Some("banana") => banana::run(),
        Some("stake") => stake::run(),
        Some("governance") => governance::run(),
        Some("quest") => quest::run(),
        Some("airdrop") => airdrop::run(),
        Some("explorer") => explorer::run(),
        _ => eprintln!("❌ Unknown or missing command."),
    }
}
