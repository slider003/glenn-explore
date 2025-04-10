# Glenn Explore, try it at [playglenn.com](https://playglenn.com)

## ⚠️ WARNING: THIS ENTIRE PROJECT IS VIBE-CODED ⚠️
No best practices, no patterns, just vibes. Enter at your own risk!

## What's this?
A 3D multiplayer driving/exploration game built with:

**Frontend**:
- Mapbox GL JS (3D map rendering)
- Three.js (3D graphics)
- Threebox (connects Mapbox and Three.js)

**Backend**:
- .NET Core (API)
- SQLite (Database)
- SignalR (Real-time communication)

## Quick Start

### Setup
```bash
# Configure environment
# Copy .env.example to .env and update values
# Copy web/.env.example to web/.env and update values
```

### Running locally
```bash
# Start API (.NET backend)
npm run start:api

# Start web (in another terminal)
npm run start:web
```

### Deployment
```bash
# Deploy
npm run deploy

# Check logs
npm run tail-logs
npm run tail-errors

# SSH to server
npm run ssh
```

## Disclaimer
I'm hoping to make this project financially sustainable to cover costs in the future. I can't guarantee that your contributions will ever be "worth it" financially, but I would love to build this together and create something awesome!

## License
GNU General Public License v3.0 (GPL-3.0) 
