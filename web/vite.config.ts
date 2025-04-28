import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    // ... other config
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                howToPlay: resolve(__dirname, 'how-to-play.html'),
                play: resolve(__dirname, 'play.html'),
                create3dModels: resolve(__dirname, 'create-3d-models.html'),
                exploreWorld: resolve(__dirname, 'explore-the-world.html'),
                eiffelTower: resolve(__dirname, 'explore-the-world/destinations/eiffel-tower-paris.html'),
                grandCanyon: resolve(__dirname, 'explore-the-world/destinations/grand-canyon-usa.html'),
                bali: resolve(__dirname, 'explore-the-world/destinations/bali-indonesia.html'),
                santorini: resolve(__dirname, 'explore-the-world/destinations/santorini-greece.html')
            }
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://0.0.0.0:5001',
                //target: 'https://api.playglenn.com',
                ws: true,
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://0.0.0.0:5001',
                //target: 'https://api.playglenn.com',
                changeOrigin: true,
            },
        }
    }
})