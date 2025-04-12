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
                //contact: resolve(__dirname, 'contact.html'),
                // Add other pages here as you create them
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
        }
    }
})