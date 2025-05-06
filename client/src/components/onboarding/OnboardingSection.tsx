import { useState, useEffect } from 'react';
import { ChallengeList } from './ChallengeList';
import { OnboardingChallenge, Challenge } from './OnboardingChallenge';

// Sample blockchain learning challenges data
const blockchainChallenges: Challenge[] = [
  {
    id: 'blockchain-basics',
    title: 'Blockchain Fundamentals',
    description: 'Learn the core concepts behind blockchain technology and how it works.',
    difficulty: 'beginner',
    points: 100,
    steps: [
      {
        question: 'What is a blockchain?',
        options: [
          'A type of cryptocurrency',
          'A centralized database managed by banks',
          'A distributed ledger technology that records transactions across many computers',
          'A programming language for smart contracts'
        ],
        correctIndex: 2,
        explanation: 'A blockchain is a distributed ledger technology that records transactions across many computers so that the record cannot be altered retroactively without the alteration of all subsequent blocks and the consensus of the network.'
      },
      {
        question: 'Which of the following is NOT a key feature of blockchain technology?',
        options: [
          'Decentralization',
          'Immutability',
          'Central authority control',
          'Transparency'
        ],
        correctIndex: 2,
        explanation: 'Central authority control is actually the opposite of what blockchain provides. Blockchain technology is designed to operate without a central authority, enabling decentralized trust.'
      },
      {
        question: 'What is a block in a blockchain?',
        options: [
          'A unit of cryptocurrency',
          'A collection of validated transactions grouped together',
          'A type of encryption algorithm',
          'The computer running the blockchain software'
        ],
        correctIndex: 1,
        explanation: 'A block in a blockchain is a collection of validated transactions that are grouped together. Each block contains a list of transactions, a timestamp, and a reference to the previous block, forming a chain.'
      }
    ],
    terminalCommands: [
      {
        command: 'blockchain --explain',
        output: 'Blockchain is a distributed ledger technology that maintains a continuously growing list of records (blocks) that are linked and secured using cryptography. Each block contains a timestamp and transaction data.\n\nKey properties:\n- Decentralized: No single authority controls the entire chain\n- Immutable: Once recorded, data cannot be altered retroactively\n- Transparent: All transactions are visible to anyone on the network'
      },
      {
        command: 'blockchain --view-block',
        output: 'Block #14592\nTimestamp: 2025-05-06T12:34:56Z\nPrevious Hash: 0x8f2b3d9b6f7e4c5d3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f\nMerkle Root: 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2\nNonce: 482930175\nTransactions: 137'
      },
      {
        command: 'blockchain --demo-consensus',
        output: 'Running consensus demonstration...\n\nNode 1: Validates block ✓\nNode 2: Validates block ✓\nNode 3: Validates block ✓\nNode 4: Validates block ✓\n\nConsensus achieved: 4/4 nodes agree\nBlock added to chain ✓'
      }
    ],
    reward: {
      type: 'token',
      value: 100,
      description: 'Congratulations on completing the Blockchain Fundamentals challenge! You\'ve earned 100 PVX tokens and now understand the basic concepts of blockchain technology.'
    },
    completionMessage: 'You\'ve successfully completed the Blockchain Fundamentals challenge! You now understand the basic concepts that power blockchain technology.'
  },
  {
    id: 'crypto-wallets',
    title: 'Understanding Crypto Wallets',
    description: 'Learn about different types of cryptocurrency wallets and how to use them securely.',
    difficulty: 'beginner',
    points: 150,
    steps: [
      {
        question: 'What does a cryptocurrency wallet actually store?',
        options: [
          'Digital coins or tokens',
          'Private and public keys',
          'Blockchain copies',
          'Mining software'
        ],
        correctIndex: 1,
        explanation: 'Contrary to popular belief, cryptocurrency wallets don\'t actually store the coins themselves. They store your private and public keys which allow you to interact with the blockchain to send and receive funds.'
      },
      {
        question: 'Which of the following wallet types is generally considered the most secure?',
        options: [
          'Online web wallets',
          'Mobile wallets',
          'Hardware wallets',
          'Desktop wallets'
        ],
        correctIndex: 2,
        explanation: 'Hardware wallets are physical devices specifically designed to store cryptocurrency keys securely offline, protecting them from online threats. This makes them generally the most secure option for storing significant amounts of cryptocurrency.'
      },
      {
        question: 'What is a seed phrase (recovery phrase) used for?',
        options: [
          'Encrypting transactions for privacy',
          'Speeding up transaction confirmation',
          'Recovering wallet access if you lose your device or password',
          'Mining new coins more efficiently'
        ],
        correctIndex: 2,
        explanation: 'A seed phrase (or recovery phrase) is a series of words (usually 12-24) that stores all the information needed to recover a cryptocurrency wallet. If you lose access to your wallet, this phrase can be used to restore your keys and access your funds.'
      }
    ],
    terminalCommands: [
      {
        command: 'wallet --explain',
        output: 'Cryptocurrency wallets are applications that allow users to interact with blockchain networks. They manage digital keys (not actual coins) and provide an interface to send and receive funds.\n\nPublic Key: Your "address" that others use to send you cryptocurrency\nPrivate Key: The secret that gives you control over funds in your address\n\nNEVER share your private key or seed phrase with anyone!'
      },
      {
        command: 'wallet --types',
        output: 'Wallet Types:\n\n1. Hardware Wallets: Physical devices that store keys offline\n   Examples: Ledger, Trezor\n   Security: Very High\n\n2. Software Wallets:\n   - Desktop: Applications on your computer\n   - Mobile: Apps on smartphones\n   - Web: Browser-based wallets\n   Security: Moderate to High (depending on implementation)\n\n3. Paper Wallets: Physical documents containing keys\n   Security: High (if properly created and stored)'
      },
      {
        command: 'wallet --demo-transaction',
        output: 'Simulating transaction...\n\n1. User initiates transaction from wallet\n2. Transaction is signed with private key\n3. Signed transaction is broadcast to network\n4. Nodes validate transaction\n5. Transaction is included in block\n6. Recipient wallet shows new balance\n\nTransaction complete ✓'
      }
    ],
    reward: {
      type: 'token',
      value: 150,
      description: 'You\'ve earned 150 PVX tokens for completing the Crypto Wallets challenge. You now understand how to securely manage your digital assets.'
    },
    completionMessage: 'Excellent work! You now understand how cryptocurrency wallets work and how to keep your assets secure.'
  },
  {
    id: 'zero-knowledge-proofs',
    title: 'Zero-Knowledge Proofs & Privacy',
    description: 'Understand how zkSNARKs enable privacy while maintaining security on blockchain networks.',
    difficulty: 'intermediate',
    points: 250,
    steps: [
      {
        question: 'What is a Zero-Knowledge Proof?',
        options: [
          'A method to mine cryptocurrency without using electricity',
          'A way to prove you know something without revealing what that something is',
          'A consensus algorithm for public blockchains',
          'A technique to compress blockchain data'
        ],
        correctIndex: 1,
        explanation: 'A Zero-Knowledge Proof is a cryptographic method where one party can prove to another that they know a value or statement is true, without conveying any additional information apart from the fact that the statement is indeed true.'
      },
      {
        question: 'What does "zk" in zkSNARKs stand for?',
        options: [
          'Zero Keys',
          'Zero Knowledge',
          'Zone Keeper',
          'Zeta Kappa'
        ],
        correctIndex: 1,
        explanation: 'The "zk" in zkSNARKs stands for "Zero Knowledge," referring to the zero-knowledge property of the proof system. SNARK stands for "Succinct Non-interactive Argument of Knowledge."'
      },
      {
        question: 'Which of the following is a benefit of zkSNARKs in blockchain applications?',
        options: [
          'They increase the speed of mining',
          'They reduce the size of the blockchain',
          'They provide privacy while maintaining verification',
          'They eliminate the need for consensus mechanisms'
        ],
        correctIndex: 2,
        explanation: 'One of the key benefits of zkSNARKs in blockchain applications is that they enable privacy by allowing transactions to be verified without revealing the details. This maintains the integrity and verification of the blockchain while protecting user privacy.'
      },
      {
        question: 'Which of the following cryptocurrencies was the first to implement zkSNARKs?',
        options: [
          'Bitcoin',
          'Ethereum',
          'Zcash',
          'Monero'
        ],
        correctIndex: 2,
        explanation: 'Zcash was the first cryptocurrency to implement zkSNARKs, launching in 2016. It introduced the ability to have shielded transactions where the sender, recipient, and amount are all private while still being verifiable on the blockchain.'
      }
    ],
    terminalCommands: [
      {
        command: 'zk --explain',
        output: 'Zero-Knowledge Proofs allow one party (the prover) to prove to another party (the verifier) that a statement is true, without revealing any information beyond the validity of the statement itself.\n\nExample: Proving you know a password without revealing the password itself.\n\nzkSNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) are a specific type of zero-knowledge proof that is:\n- Succinct: Small in size and quick to verify\n- Non-interactive: Doesn\'t require back-and-forth communication\n- Argument of Knowledge: Proves the prover knows some information'
      },
      {
        command: 'zk --demo-private-transaction',
        output: 'Demonstrating private transaction with zkSNARKs...\n\n1. Alice wants to send 50 PVX to Bob privately\n2. Alice creates a zkSNARK proof that:\n   - She has 50 PVX to spend\n   - The transaction preserves the correct balances\n   - No new money is created\n3. The proof is published on the blockchain\n4. Validators verify the proof is valid (without seeing amounts)\n5. Bob receives the funds\n\nThe transaction is validated while keeping the amount private!'
      },
      {
        command: 'zk --applications',
        output: 'Applications of Zero-Knowledge Proofs in blockchain:\n\n1. Private Transactions: Hide sender, recipient, and/or amount\n2. Identity Verification: Prove eligibility without revealing personal data\n3. Private Smart Contracts: Execute contracts without revealing inputs/outputs\n4. Scalability Solutions: Prove computation was done correctly off-chain\n5. Anonymous Voting: Prove voting eligibility without revealing identity'
      },
      {
        command: 'zk --security-considerations',
        output: 'Security Considerations for zkSNARKs:\n\n1. Trusted Setup: Many zkSNARK implementations require an initial "trusted setup" ceremony\n2. Quantum Vulnerability: Some zk systems may be vulnerable to quantum computing attacks\n3. Implementation Complexity: Properly implementing zkSNARKs is difficult and errors can lead to security vulnerabilities\n4. Regulatory Compliance: Privacy features must be balanced with regulatory requirements in some jurisdictions'
      }
    ],
    reward: {
      type: 'nft',
      value: 'Privacy Advocate NFT',
      description: 'You\'ve earned a special Privacy Advocate NFT for completing the Zero-Knowledge Proofs challenge. This NFT gives you access to private beta features in the PIXELVAULT ecosystem.'
    },
    completionMessage: 'Congratulations on mastering Zero-Knowledge Proofs! You now understand one of the most powerful privacy technologies in blockchain.'
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contracts Deep Dive',
    description: 'Learn how smart contracts work and how they enable decentralized applications.',
    difficulty: 'intermediate',
    points: 200,
    steps: [
      {
        question: 'What is a smart contract?',
        options: [
          'A legally binding agreement written by lawyers on the blockchain',
          'Self-executing code that automatically enforces agreements on the blockchain',
          'A type of cryptocurrency wallet',
          'An AI system that creates legal documents'
        ],
        correctIndex: 1,
        explanation: 'A smart contract is self-executing code deployed on a blockchain that automatically enforces the terms of an agreement when predetermined conditions are met. They run exactly as programmed without the possibility of downtime, censorship, fraud, or third-party interference.'
      },
      {
        question: 'Which of the following best describes the relationship between smart contracts and DApps (Decentralized Applications)?',
        options: [
          'Smart contracts and DApps are two terms for the same thing',
          'Smart contracts are a type of DApp',
          'DApps are built using smart contracts as their backend logic',
          'DApps are centralized interfaces for smart contracts'
        ],
        correctIndex: 2,
        explanation: 'DApps (Decentralized Applications) are applications that run on a P2P network of computers rather than a single computer. They are built using smart contracts as their backend business logic. A DApp typically consists of frontend user interfaces combined with smart contracts on the blockchain.'
      },
      {
        question: 'What is a key security concern with smart contracts?',
        options: [
          'They execute too quickly',
          'Once deployed, they cannot be changed even if bugs are found',
          'They can only handle small amounts of cryptocurrency',
          'They require too much storage'
        ],
        correctIndex: 1,
        explanation: 'A major security concern with smart contracts is their immutability. Once deployed on the blockchain, they cannot be directly changed or updated, even if critical bugs or vulnerabilities are discovered. This is why thorough testing and security audits are essential before deployment.'
      }
    ],
    terminalCommands: [
      {
        command: 'smartcontract --explain',
        output: 'Smart contracts are self-executing programs stored on a blockchain that run when predetermined conditions are met. They typically are used to automate the execution of an agreement without any intermediary\'s involvement.\n\nKey properties:\n- Autonomous: Execute automatically when conditions are met\n- Transparent: Code is visible on the blockchain\n- Immutable: Cannot be changed once deployed\n- Deterministic: Same inputs always produce same outputs'
      },
      {
        command: 'smartcontract --example',
        output: '// Simple Escrow Smart Contract Example\n\ncontract Escrow {\n    address public buyer;\n    address public seller;\n    address public arbiter;\n    uint public amount;\n    bool public isReleased;\n    \n    constructor(address _seller, address _arbiter) payable {\n        buyer = msg.sender;\n        seller = _seller;\n        arbiter = _arbiter;\n        amount = msg.value;\n        isReleased = false;\n    }\n    \n    function release() public {\n        require(msg.sender == buyer || msg.sender == arbiter);\n        require(!isReleased);\n        \n        isReleased = true;\n        payable(seller).transfer(amount);\n    }\n    \n    function refund() public {\n        require(msg.sender == seller || msg.sender == arbiter);\n        require(!isReleased);\n        \n        isReleased = true;\n        payable(buyer).transfer(amount);\n    }\n}'
      },
      {
        command: 'smartcontract --applications',
        output: 'Smart Contract Applications:\n\n1. DeFi (Decentralized Finance):\n   - Lending and borrowing\n   - Decentralized exchanges\n   - Insurance\n   - Derivatives\n\n2. NFTs (Non-Fungible Tokens):\n   - Digital art and collectibles\n   - Gaming items\n   - Virtual real estate\n\n3. DAOs (Decentralized Autonomous Organizations):\n   - Governance\n   - Treasury management\n   - Community-owned businesses\n\n4. Supply Chain:\n   - Product tracking\n   - Proof of authenticity\n   - Automated payments\n\n5. Identity Management:\n   - Self-sovereign identity\n   - Credential verification'
      }
    ],
    reward: {
      type: 'token',
      value: 200,
      description: 'You\'ve earned 200 PVX tokens for completing the Smart Contracts Deep Dive challenge.'
    },
    completionMessage: 'Great job! You now understand how smart contracts work and how they form the backbone of decentralized applications.'
  },
  {
    id: 'consensus-mechanisms',
    title: 'Consensus Mechanisms Explained',
    description: 'Dive into the different ways blockchains achieve consensus and the trade-offs involved.',
    difficulty: 'advanced',
    points: 300,
    steps: [
      {
        question: 'What is the purpose of a consensus mechanism in blockchain?',
        options: [
          'To encrypt transactions',
          'To create new cryptocurrency tokens',
          'To determine which transactions are valid and added to the blockchain',
          'To connect different blockchains together'
        ],
        correctIndex: 2,
        explanation: "Consensus mechanisms are protocols that ensure all nodes in a blockchain network agree on the validity of transactions and the order in which they're added to the blockchain. They solve the problem of trust in a decentralized network where participants don't necessarily know or trust each other."
      },
      {
        question: 'What is the main criticism of Proof of Work (PoW) consensus?',
        options: [
          'It\'s too easy to attack',
          'It requires specialized hardware',
          'It uses too much energy',
          'It processes transactions too quickly'
        ],
        correctIndex: 2,
        explanation: 'The main criticism of Proof of Work (PoW) is its high energy consumption. PoW requires miners to solve complex mathematical puzzles, which demands significant computational power and electricity. This has raised environmental concerns as blockchain networks like Bitcoin grew.'
      },
      {
        question: 'In Proof of Stake (PoS), how are validators typically selected to create new blocks?',
        options: [
          'Based on how much cryptocurrency they hold and are willing to "stake"',
          'Based on their computing power',
          'Based on their historical accuracy in validating transactions',
          'Based on a random lottery system'
        ],
        correctIndex: 0,
        explanation: 'In Proof of Stake (PoS), validators are selected based on how much of the network\'s cryptocurrency they hold and are willing to "stake" (lock up as collateral). Those with more staked tokens have a higher chance of being selected to create new blocks. This economic stake in the network incentivizes honest behavior.'
      },
      {
        question: 'What is "finality" in blockchain consensus?',
        options: [
          'The total number of blocks in a blockchain',
          'The assurance that a transaction cannot be reversed once added to the blockchain',
          'The time it takes to mine a new block',
          'The final phase of blockchain development'
        ],
        correctIndex: 1,
        explanation: 'Finality in blockchain consensus refers to the assurance that a completed transaction cannot be reversed, altered, or canceled once it has been added to the blockchain. Different consensus mechanisms provide different types of finality (probabilistic vs. absolute) and at different speeds.'
      },
      {
        question: 'Which consensus mechanism does Ethereum currently use after "The Merge"?',
        options: [
          'Proof of Work (PoW)',
          'Proof of Stake (PoS)',
          'Delegated Proof of Stake (DPoS)',
          'Proof of Authority (PoA)'
        ],
        correctIndex: 1,
        explanation: 'After "The Merge" in September 2022, Ethereum transitioned from Proof of Work (PoW) to Proof of Stake (PoS). This change was part of Ethereum\'s roadmap to make the network more scalable, secure, and sustainable by reducing energy consumption by approximately 99.95%.'
      }
    ],
    terminalCommands: [
      {
        command: 'consensus --list-mechanisms',
        output: 'Major Consensus Mechanisms:\n\n1. Proof of Work (PoW):\n   - Validators compete to solve cryptographic puzzles\n   - High energy consumption but proven security\n   - Used by: Bitcoin, Litecoin, Dogecoin\n\n2. Proof of Stake (PoS):\n   - Validators selected based on amount of cryptocurrency staked\n   - Energy efficient but more complex security model\n   - Used by: Ethereum (post-Merge), Cardano, Solana\n\n3. Delegated Proof of Stake (DPoS):\n   - Token holders vote for validators\n   - Highly scalable but more centralized\n   - Used by: EOS, Tron\n\n4. Proof of Authority (PoA):\n   - Pre-approved validators based on identity\n   - Very efficient but centralized\n   - Used by: Many enterprise blockchains, some sidechains\n\n5. Practical Byzantine Fault Tolerance (PBFT):\n   - Based on state machine replication\n   - Fast finality but limited scalability in validators\n   - Used by: Hyperledger Fabric, some permissioned chains'
      },
      {
        command: 'consensus --compare-pow-pos',
        output: 'Comparing Proof of Work vs. Proof of Stake:\n\n                  | Proof of Work (PoW)      | Proof of Stake (PoS)\n------------------+---------------------------+---------------------------\nSecurity Model    | Energy expenditure        | Economic stake\nEnergy Usage      | Very high                 | Low\nHardware          | Specialized miners        | Regular nodes\nBarrier to Entry  | High (mining equipment)   | Medium (token purchase)\nAttack Cost       | 51% of hash power         | 33-51% of total supply\nCentralization    | Mining pools              | Wealthy stakeholders\nFinality          | Probabilistic             | Varies by implementation\nTested History    | Since 2009 (Bitcoin)      | Various implementations\n                  |                           | since ~2012'
      },
      {
        command: 'consensus --demo-pow',
        output: 'Demonstrating Proof of Work (simplified)...\n\nTarget: Find a value that, when hashed with the block data, produces a hash starting with "0000"\n\nAttempt 1: hash(block_data + nonce:1) = 8f3d72a9c1b5e6...\nAttempt 2: hash(block_data + nonce:2) = 7a2e4d8c3b5f9...\nAttempt 3: hash(block_data + nonce:3) = 6b3a5c8d2e4f...\n...\nAttempt 3,752: hash(block_data + nonce:3752) = 0000f8e7d6c5...\n\nSolution found! Nonce = 3752\nBlock is valid and added to the chain\nMiner receives block reward'
      },
      {
        command: 'consensus --demo-pos',
        output: 'Demonstrating Proof of Stake (simplified)...\n\nNetwork state:\n- Total staked: 1,000,000 PVX\n- Validator A: 300,000 PVX staked (30% chance)\n- Validator B: 200,000 PVX staked (20% chance)\n- Validator C: 500,000 PVX staked (50% chance)\n\nRandom selection process...\nValidator C selected as block proposer!\n\nValidator C:\n1. Creates a new block\n2. Signs the block\n3. Broadcasts to network\n\nOther validators attest to the block\'s validity\nBlock is added to the chain\nValidator C receives transaction fees as reward'
      },
      {
        command: 'consensus --security-considerations',
        output: 'Consensus Security Considerations:\n\n1. Nothing-at-Stake Problem (PoS):\n   Risk that validators have nothing to lose by validating conflicting chains\n   Solution: Slashing conditions that penalize bad behavior\n\n2. Long-Range Attacks (PoS):\n   Rewriting blockchain history from a distant point in the past\n   Solution: Checkpoints and social consensus on history\n\n3. 51% Attacks (PoW/PoS):\n   Controlling majority of network power allows transaction censorship/reversal\n   PoW: Need 51% of hash power\n   PoS: Need 33-51% of staked tokens (depending on implementation)\n\n4. Sybil Attacks:\n   Creating multiple identities to influence network\n   Solution: Making validation power tied to limited resource (energy or tokens)'
      }
    ],
    reward: {
      type: 'badge',
      value: 'Consensus Expert',
      description: 'You\'ve earned the Consensus Expert badge for completing this advanced challenge on consensus mechanisms. This badge grants you special privileges in the governance section.'
    },
    completionMessage: 'Congratulations! You\'ve mastered the complex topic of consensus mechanisms, which is fundamental to understanding how blockchains achieve security and agreement in a decentralized environment.'
  }
];

export function OnboardingSection() {
  const [userProgress, setUserProgress] = useState({
    completedChallenges: [] as string[],
    totalPoints: 0,
    level: 1
  });
  
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  
  // Load user progress from localStorage on initial render
  useEffect(() => {
    const savedProgress = localStorage.getItem('pvx_learning_progress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
      // If user has started learning, don't show welcome modal again
      setShowWelcomeModal(false);
    }
  }, []);
  
  // Save progress whenever it changes
  useEffect(() => {
    localStorage.setItem('pvx_learning_progress', JSON.stringify(userProgress));
  }, [userProgress]);
  
  const handleChallengeComplete = (challengeId: string, points: number) => {
    if (!userProgress.completedChallenges.includes(challengeId)) {
      const newTotalPoints = userProgress.totalPoints + points;
      const newLevel = Math.floor(newTotalPoints / 500) + 1; // Level up every 500 points
      
      setUserProgress({
        completedChallenges: [...userProgress.completedChallenges, challengeId],
        totalPoints: newTotalPoints,
        level: newLevel
      });
    }
  };
  
  const handleChallengeSelect = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
  };
  
  const selectedChallenge = blockchainChallenges.find(c => c.id === selectedChallengeId);
  
  return (
    <div className="space-y-8">
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-90 border border-blue-500 rounded-lg p-8 max-w-2xl w-full shadow-lg shadow-blue-900/40 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 text-shadow-neon">Welcome to the PIXELVAULT Learning Center!</h2>
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
              <p className="text-gray-300 mb-4">
                Get started with blockchain technology through our gamified learning experience. 
                Complete challenges to earn PVX tokens, NFTs, and achievement badges.
              </p>
              <p className="text-gray-300">
                Start with the beginner challenges and work your way up to the advanced topics. 
                Your progress will be saved automatically so you can continue learning at your own pace.
              </p>
            </div>
            <div className="flex justify-end">
              <button 
                className="bg-blue-700 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-shadow-neon shadow-md shadow-blue-900/30 border border-blue-500/50 transition-all"
                onClick={() => setShowWelcomeModal(false)}
              >
                Start Learning
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedChallenge ? (
        <div>
          <button 
            className="mb-6 flex items-center px-4 py-2 bg-black bg-opacity-90 border border-blue-500/50 rounded-md text-blue-400 hover:text-blue-300 text-shadow-neon shadow-md shadow-blue-900/20 transition-all hover:bg-blue-900/20"
            onClick={() => setSelectedChallengeId(null)}
          >
            <span className="mr-2 text-xl">←</span>
            <span className="font-medium">Back to Challenges</span>
          </button>
          
          <OnboardingChallenge
            challenge={selectedChallenge}
            onComplete={handleChallengeComplete}
          />
        </div>
      ) : (
        <ChallengeList
          challenges={blockchainChallenges}
          onSelect={handleChallengeSelect}
          userProgress={userProgress}
        />
      )}
    </div>
  );
}