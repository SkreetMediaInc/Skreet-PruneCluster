import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { exec } from "child_process";
import chokidar from "chokidar";

const app = new Hono();
const PORT = 3000;

// Serve static files from the 'examples' directory
app.get('/*', serveStatic({ root: './examples' }));

// Track if a build is already running to avoid overlapping builds
let isBuilding = false;

// Watch for changes in the 'src' directory
chokidar.watch("src/**/*.{ts,js}", { ignoreInitial: false }).on("all", (event, file) => {
    console.log(`File changed: ${file}`);
    if (isBuilding) {
        console.log(`Change detected in ${file}, but a build is already in progress.`);
        return;
    }

    isBuilding = true;
    console.log(`Starting build due to changes in ${file}...`);

    exec("bun run build:example", (error, stdout, stderr) => {
        isBuilding = false; // Reset build flag

        if (error) {
            console.error(`Build error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Build stderr: ${stderr}`);
            return;
        }

        console.log(`Build succeeded:\n${stdout}`);
    });
});

// Start the server
export default {
    port: PORT,
    fetch: app.fetch,
};