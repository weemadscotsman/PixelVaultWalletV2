# PVX Blockchain Wallet & Thringlet System

A zkSNARK-secured blockchain wallet and interactive Thringlet ecosystem platform that combines advanced blockchain technology with engaging digital companion experiences and educational tools.

## System Architecture

The project consists of:

1. **Backend (server)**
   - Express server with blockchain simulation
   - Thringlet ecosystem APIs
   - Badge/achievement system
   - Wallet & transaction handling
   - Blockchain mining, staking, and governance

2. **Frontend (client)**
   - React-based dashboard
   - Cyberpunk-styled UI with matrix effects
   - Wallet balance and transaction functionality
   - Mining control panel
   - Thringlet interaction UI
   - Badge collection display

## Key Features

- **Blockchain Backend**: A simulated PVX blockchain with mining, transactions, and staking
- **Thringlet System**: Interactive digital companions with emotion states
- **Badge System**: Achievement tracking for various blockchain activities
- **Cyberpunk UI**: Matrix-styled interface with CRT effects

## Core API Endpoints

### Wallet Endpoints
- `GET /api/wallet` - Get all wallets
- `GET /api/wallet/:address` - Get a wallet by address  
- `POST /api/wallet` - Create a new wallet
- `PUT /api/wallet/:address` - Update a wallet

### Transaction Endpoints
- `GET /api/tx` - Get recent transactions
- `GET /api/tx/:hash` - Get transaction by hash
- `POST /api/tx` - Create a new transaction
- `GET /api/tx/address/:address` - Get transactions for an address

### Blockchain Endpoints
- `GET /api/blockchain/block` - Get recent blocks
- `GET /api/blockchain/block/:height` - Get block by height
- `GET /api/blockchain/mining/start` - Start mining
- `GET /api/blockchain/mining/stop` - Stop mining
- `GET /api/blockchain/trends` - Get blockchain statistics
- `GET /api/blockchain/miners` - Get miner statistics

### Staking Endpoints
- `GET /api/stake` - Get all stake records
- `GET /api/stake/:id` - Get a stake record by ID
- `POST /api/stake` - Create a new stake
- `PUT /api/stake/:id` - Update a stake record
- `GET /api/stake/address/:address` - Get stakes for an address
- `GET /api/stake/pools` - Get all staking pools

### Badge Endpoints
- `GET /api/badge` - Get all badges
- `GET /api/badge/:id` - Get a badge by ID
- `GET /api/badge/type/:type` - Get badges by type
- `GET /api/badge/user/:userId` - Get badges for a user
- `POST /api/badge/award` - Award a badge to a user
- `POST /api/badge/progress` - Update badge progress

### Thringlet Endpoints
- `GET /api/thringlet` - Get all thringlets
- `GET /api/thringlet/:id` - Get a thringlet by ID
- `POST /api/thringlet` - Create a new thringlet
- `PUT /api/thringlet/:id` - Update a thringlet
- `GET /api/thringlet/user/:userId` - Get thringlets for a user
- `POST /api/thringlet/:id/interact` - Interact with a thringlet

## Data Models

### Wallet
```typescript
interface Wallet {
  address: string;
  publicKey: string;
  balance: string;
  createdAt: Date;
  lastSynced: Date;
  passphraseSalt: string;
  passphraseHash: string;
}
```

### Transaction
```typescript
interface Transaction {
  hash: string;
  type: TransactionType;
  from: string;
  to: string;
  amount: string;
  fee: string;
  data?: string;
  status: TransactionStatus;
  timestamp: number;
  blockHeight?: number;
}
```

### Block
```typescript
interface Block {
  height: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  transactions: string[];
  miner: string;
  difficulty: number;
  nonce: number;
}
```

### Badge
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  rarity: BadgeRarity;
  icon: string;
  requirement: string;
  secret?: boolean;
}
```

### Thringlet
```typescript
interface Thringlet {
  id: string;
  userId: string;
  name: string;
  type: string;
  level: number;
  experience: number;
  emotionalState: ThringletEmotionState;
  abilities: string[];
  createdAt: number;
  lastInteraction: number;
}
```

## Implementation Status

- ✅ Backend structure with Express
- ✅ Blockchain simulation with mining
- ✅ Badge system with achievement tracking
- ✅ Wallet and transaction handling
- ✅ Thringlet emotions and interactions
- ✅ Cyberpunk styled UI
- ✅ File-based storage for persistence

## Next Steps (To Complete Locally)

1. Finish aligning all badge implementations with blueprint IDs
2. Verify that all transactions and blockchain operations update badge progress correctly
3. Implement secure transaction signing with proper hashing
4. Add more interactive elements to Thringlet companions
5. Enhance the visual styling of the badge collection UI
6. Add detailed blockchain explorer functionality

## Running the Project

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The server will start on port 5000 and the frontend will be available at http://localhost:5000

## Core Files Reference

### Backend
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API routes registration
- `server/controllers/` - API endpoint handlers
- `server/storage/` - Data persistence
- `server/mem-blockchain.ts` - Blockchain implementation
- `server/services/blockchain-service.ts` - Blockchain business logic

### Frontend
- `client/src/App.tsx` - Main React component
- `client/src/pages/` - Application pages
- `client/src/components/dashboard/` - Dashboard UI
- `client/src/hooks/` - Data hooks for API calls
- `client/src/components/matrix/` - Matrix rain effect
- `client/src/components/wallet/` - Wallet UI components

### Shared
- `shared/types.ts` - Type definitions used across frontend and backend