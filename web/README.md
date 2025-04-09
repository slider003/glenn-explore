# Threebox Game

A simple 3D game built with Threebox, Mapbox GL JS, and TypeScript. This project uses Vite for fast development.

## Getting Started

### Prerequisites

- Node.js and npm installed
- A Mapbox access token

### Installation

1. Clone this repository
2. Install dependencies:
```
npm install
```
3. Add your Mapbox access token to `src/config.ts`:
```typescript
export const MAPBOX_ACCESS_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN';
```

### Development

Run the development server:
```
npm run dev
```

### Game Controls

- **Arrow Keys**: Move the player (green cube)
- **Start/Pause Button**: Control the game state

### Game Objective

Avoid hitting the red obstacles that fall from the top of the screen. Your score increases the longer you survive.

## Built With

- [Threebox](https://github.com/jscastro76/threebox) - A Three.js plugin for Mapbox GL JS
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) - JavaScript library for interactive maps
- [Three.js](https://threejs.org/) - JavaScript 3D library
- [Vite](https://vitejs.dev/) - Frontend build tool
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

## Getting a Mapbox Access Token

1. Sign up for a Mapbox account at [mapbox.com](https://www.mapbox.com/)
2. Navigate to your account page
3. Create a new access token or use the default token
4. Copy the token and paste it in `src/config.ts`

## Customization

- Modify game difficulty by adjusting values in `GameController.ts`
- Add more complex 3D models by using Threebox's `loadObj` method
- Change the map style in `main.ts` to create different environments 