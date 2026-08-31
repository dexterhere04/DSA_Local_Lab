import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "apps", "backend", "dist", "index.js");
const outfile = path.join(root, "apps", "backend", "dist", "index.cjs");

await esbuild.build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  external: ["better-sqlite3"],
  sourcemap: false,
  minify: false,
  legalComments: "none"
});

console.log("Bundled backend to", outfile);
