import {Hono} from "hono";
import {serveStatic} from "hono/bun";

import * as SkreetPruneCluster from "../src/SkreetPruneCluster";

const app = new Hono();
app.get('/*', serveStatic({root: './examples'}));

// Start the server on port 3000
export default {
    port: 3000,
    fetch: app.fetch,
    app
};
