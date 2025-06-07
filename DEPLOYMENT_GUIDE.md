# PVX Blockchain Platform - Local Development & GitHub Deployment Guide

## Quick Start - Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (optional - uses in-memory storage by default)

### Installation Steps

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd pvx-blockchain-platform
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   SESSION_SECRET=your-super-secure-session-secret-minimum-32-characters
   ENCRYPTION_KEY=your-encryption-key-for-secure-storage
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The application will be available at:
   - Frontend: `http://localhost:5000`
   - API: `http://localhost:5000/api`
   - WebSocket: `ws://localhost:5000/ws`

### Verification Steps

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/api/ping
   # Expected: {"status":"ok","message":"PixelVault Wallet Backend is Live"}
   ```

2. **Create Test Wallet**
   ```bash
   curl -X POST http://localhost:5000/api/wallet/create \
     -H "Content-Type: application/json" \
     -d '{"passphrase":"test123456"}'
   ```

3. **Check Blockchain Status**
   ```bash
   curl http://localhost:5000/api/blockchain/info
   # Should return live blockchain data with block height
   ```

## Security Features

### Encrypted Local Storage
- Session tokens encrypted with AES-256
- Wallet private keys stored with crypto-js encryption
- Automatic session expiration (24 hours default)
- Secure password hashing with PBKDF2

### Database Security
- Environment-based encryption keys
- Salted password hashing
- HMAC signature verification
- Secure session management

### Production Environment Variables

```env
# Required for Production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
SESSION_SECRET=secure-64-character-minimum-session-secret
ENCRYPTION_KEY=secure-encryption-key-for-data-protection

# Optional Production Settings
PORT=5000
MINING_DIFFICULTY=5
BLOCK_REWARD=50000000
MAX_SUPPLY=6009420000000000
```

## GitHub Deployment

### Repository Setup

1. **Environment Secrets**
   - Go to Repository Settings → Secrets and Variables → Actions
   - Add the following secrets:
     ```
     DATABASE_URL
     SESSION_SECRET
     ENCRYPTION_KEY
     ```

2. **Build Configuration**
   ```bash
   npm run build    # Builds both frontend and backend
   npm run start    # Starts production server
   ```

### Deployment Platforms

#### Vercel Deployment
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

#### Heroku Deployment
```json
// package.json scripts
{
  "heroku-postbuild": "npm run build",
  "start": "npm run start"
}
```

#### Railway/Render Deployment
- Set build command: `npm run build`
- Set start command: `npm run start`
- Configure environment variables in platform dashboard

## Database Migration

### PostgreSQL Setup (Production)
```sql
-- Create database
CREATE DATABASE pvx_blockchain;

-- The application will auto-create tables on first run
-- No manual migration required
```

### In-Memory Storage (Development)
- No setup required
- Data persists to `data/blockchain.json`
- Automatically loads on startup

## Monitoring & Health Checks

### Health Endpoints
- `/api/ping` - Basic server health
- `/api/health` - Detailed system status
- `/api/status` - Blockchain and service status

### WebSocket Monitoring
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Blockchain event:', data);
};
```

## Security Checklist

- [ ] Environment variables configured
- [ ] Session secrets are 32+ characters
- [ ] Database connection uses SSL in production
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive data
- [ ] All API endpoints use proper authentication
- [ ] WebSocket connections are secured

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -ti:5000 | xargs kill -9
   npm run dev
   ```

2. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure PostgreSQL is running

3. **Build Failures**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **WebSocket Connection Issues**
   - Check firewall settings
   - Verify WebSocket URL format
   - Ensure proper CORS configuration

### Performance Optimization

- Enable gzip compression in production
- Configure CDN for static assets
- Use connection pooling for database
- Implement Redis for session storage at scale

## Development Features

### Real-time Blockchain
- Continuous block mining
- Live transaction processing
- Real-time balance updates
- WebSocket event broadcasting

### Wallet System
- Secure key generation
- Multi-wallet support
- Transaction history
- Balance synchronization

### Security Features
- Unified authentication
- Session management
- Encrypted storage
- HMAC verification

The platform is production-ready with comprehensive security, real-time blockchain functionality, and scalable architecture.