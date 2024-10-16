import {defineConfig} from 'vite';
import {terser} from 'rollup-plugin-terser';

export default defineConfig({
    build: {
        rollupOptions: {
            plugins: [
                terser({
                    format: {
                        comments: false,
                    },
                    compress: {
                        drop_console: true,
                        drop_debugger: true,
                        pure_funcs: ['performance.mark', 'performance.measure'],
                    }
                })
            ],
            external: ['leaflet'],  // Exclude Leaflet from the bundle
            output: {
                globals: {
                    leaflet: 'L',  // Refer to Leaflet as the global `L`
                },
            },
        },
        lib: {
            entry: './src/index.ts',  // Adjust to your entry file
            name: 'LeafletClustering',
            fileName: 'leaflet-clustering',
            formats: ['umd', 'iife', 'es'], // UMD and IIFE formats for the browser
        },
        target: 'modules'
    },
});