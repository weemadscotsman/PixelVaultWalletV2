
use ed25519_dalek::{Keypair, Signer, Signature, PublicKey, SecretKey};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::env;
use base64::{encode, decode};

#[derive(Deserialize)]
struct Wallet {
    address: String,
    public_key: String,
    private_key: String,
}

#[derive(Serialize)]
struct SignedTransaction {
    from: String,
    to: String,
    amount: f64,
    timestamp: u64,
    signature: String,
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() != 5 {
        eprintln!("Usage: tx_signer <wallet_path> <to_address> <amount> <timestamp>");
        return;
    }

    let wallet_path = &args[1];
    let to_address = &args[2];
    let amount: f64 = args[3].parse().expect("Invalid amount");
    let timestamp: u64 = args[4].parse().expect("Invalid timestamp");

    // Load wallet JSON
    let mut file = File::open(wallet_path).expect("Unable to open wallet file");
    let mut data = String::new();
    file.read_to_string(&mut data).unwrap();
    let wallet: Wallet = serde_json::from_str(&data).unwrap();

    // Decode keys
    let pub_bytes = decode(wallet.public_key).unwrap();
    let priv_bytes = decode(wallet.private_key).unwrap();
    let secret = SecretKey::from_bytes(&priv_bytes).unwrap();
    let public = PublicKey::from_bytes(&pub_bytes).unwrap();
    let keypair = Keypair { secret, public };

    // Build message
    let message = format!("{}|{}|{}|{}", wallet.address, to_address, amount, timestamp);
    let signature: Signature = keypair.sign(message.as_bytes());
    let signature_b64 = encode(signature.to_bytes());

    let signed_tx = SignedTransaction {
        from: wallet.address,
        to: to_address.clone(),
        amount,
        timestamp,
        signature: signature_b64,
    };

    let json = serde_json::to_string_pretty(&signed_tx).unwrap();
    println!("{}", json);
}
