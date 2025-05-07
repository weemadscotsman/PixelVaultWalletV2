
use ed25519_dalek::{Keypair, Signature, Signer};
use rand::rngs::OsRng;
use serde::{Serialize, Deserialize};
use std::fs;

#[derive(Serialize, Deserialize)]
pub struct Wallet {
    pub public_key: String,
    pub secret_key: String,
}

pub fn create_wallet(filename: &str) {
    let mut csprng = OsRng {};
    let keypair: Keypair = Keypair::generate(&mut csprng);

    let wallet = Wallet {
        public_key: base64::encode(&keypair.public.to_bytes()),
        secret_key: base64::encode(&keypair.secret.to_bytes()),
    };

    let data = serde_json::to_string_pretty(&wallet).unwrap();
    fs::write(filename, data).unwrap();
    println!("✅ Wallet saved to {}", filename);
}
