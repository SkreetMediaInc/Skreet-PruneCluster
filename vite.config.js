import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            external: ['leaflet'],  // Exclude Leaflet from the bundle
            output: {
                globals: {
                    leaflet: 'L',  // Refer to Leaflet as the global `L`
                },
            },
        },
        lib: {
            entry: './src/index.ts',  // Adjust to your entry file
            name: 'PruneCluster',
            fileName: 'prune-cluster',
            formats: ['umd', 'iife'], // UMD and IIFE formats for the browser
        },
    },
});