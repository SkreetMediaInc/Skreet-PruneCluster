//@ts-ignore

const result = await Bun.build({
    entrypoints: ['src/index.ts'], // Corrected: "entryPoints" to "entrypoints"
    outdir: './dist',              // Output directory for the build
    target: 'browser',              // Ensuring it targets the browser environment
    format: 'esm',                  // Output as an ES module
    sourcemap: 'linked',            // Generates linked sourcemaps
    minify: true,                   // Enable minification for the output
    drop: ['console', 'debugger'],  // Removes console & debugger statements
    splitting: false,               // No code splitting
    // experimentalCss: true           // Support for CSS bundling (if needed)
});

if (!result.success) {
    console.error('❌ Build failed.');
    for (const log of result.logs) {
        console.group(`Log [${log.level.toUpperCase()}]: ${log.message}`);
        if (log.position) {
            console.log(`Position: ${JSON.stringify(log.position)}`);
        }
        try {
            console.log(`Referrer: ${log.referrer}`);
            console.log(`Specifier: ${log.specifier}`);
            console.log(`Import Kind: ${log.importKind}`);
        } catch (e) {

        }
        console.groupEnd();
    }
} else {
    console.log('✅ Build succeeded!');
    console.group('Build Outputs');
    for (const output of result.outputs) {
        console.log(`- File: ${output.path}`);
        console.log(`  Kind: ${output.kind}`);
        console.log(`  Hash: ${output.hash}`);
        console.log(`  Loader: ${output.loader}`);
    }
    console.groupEnd();
}
