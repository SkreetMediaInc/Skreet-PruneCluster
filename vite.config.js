import {defineConfig} from 'vite';
import {resolve} from 'path';
import {terser} from 'rollup-plugin-terser';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            outputDir: 'dist',
            staticImport: true,
        })
    ],
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
            entry: resolve(__dirname, 'src/index.ts'),  // Adjust to your entry file
            name: 'LeafletClustering',
            fileName: 'index',
            formats: ['umd', 'iife', 'es'], // UMD and IIFE formats for the browser
        },
        target: 'modules'
    },
});