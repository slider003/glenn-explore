import { defineConfig } from 'vite'
export default defineConfig({
    // ... other config
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