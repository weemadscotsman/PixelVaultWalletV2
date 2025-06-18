import { generateKeyPairSync } from "crypto";
import { base64SpkiToPem } from "../utils/formatters";
import { deriveAESKeyFromPassphrase, encryptWithAES } from "../utils/crypto";
import { createWallet } from "../database/walletDao"; // Corrected path

export const createWalletHandler = async (req: any, res: any, next: any) => { // Added next for error handling
  try {
    const { passphrase } = req.body;
    if (!passphrase) return res.status(400).json({ error: "Missing passphrase" });

    // Note: Previous fix for generateKeyPairSync used 'der' for privateKeyEncoding too.
    // The user provided 'pem' for privateKeyEncoding. We'll try 'pem' first as specified.
    // If errors occur, this might need to be changed back to 'der'.
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "der" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }, // User specified 'pem'
    });

    const publicKeyPem = base64SpkiToPem(publicKey.toString("base64"));
    const { key: aesKey, salt } = deriveAESKeyFromPassphrase(passphrase); // Ensure crypto.ts exports this structure

    // encryptWithAES expects data: string. privateKey from generateKeyPairSync with 'pem' format should be a string.
    const encryptedPrivateKey = encryptWithAES(privateKey, aesKey);

    // Ensure walletAddress generation is robust.
    const walletAddress = "PVX_" + publicKeyPem.slice(-32).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    await createWallet({
      address: walletAddress,
      publicKey: publicKeyPem, // DAO expects publicKey, controller provides publicKeyPem
      encryptedPrivateKey,
      salt
    });

    // Adjust response to match user's expected output for testing if possible,
    // or note the difference. User expects: address, publicKey, createdAt, status.
    // Current controller provides: walletAddress, publicKey.
    // We can add createdAt and status for now.
    res.status(200).json({
      status: "success",
      address: walletAddress,
      publicKey: publicKeyPem,
      createdAt: new Date().toISOString() // Added createdAt
    });
  } catch (err) {
    console.error("Wallet creation error:", err);
    // Pass error to Express error handler if next is available
    if (next) {
      next(err);
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
