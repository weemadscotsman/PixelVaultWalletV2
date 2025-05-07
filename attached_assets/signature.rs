
use ed25519_dalek::{Keypair, PublicKey, SecretKey, Signature, Signer, Verifier};
use rand::rngs::OsRng;
use std::error::Error;

/// A simple wrapper for a keypair to sign and verify messages.
pub struct SignatureManager {
    keypair: Keypair,
}

impl SignatureManager {
    /// Generates a new keypair.
    pub fn new() -> Result<Self, Box<dyn Error>> {
        let mut csprng = OsRng {};
        let keypair = Keypair::generate(&mut csprng);
        Ok(SignatureManager { keypair })
    }

    /// Signs a message using the private key.
    pub fn sign(&self, message: &[u8]) -> Signature {
        self.keypair.sign(message)
    }

    /// Verifies a message and signature against a public key.
    pub fn verify(public_key: &PublicKey, message: &[u8], signature: &Signature) -> bool {
        public_key.verify(message, signature).is_ok()
    }

    /// Returns the public key as bytes.
    pub fn get_public_key(&self) -> PublicKey {
        self.keypair.public
    }

    /// Returns the secret key for potential use (caution: handle securely).
    pub fn get_secret_key(&self) -> SecretKey {
        self.keypair.secret
    }
}
