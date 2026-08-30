import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stage = path.join(root, "dist-electron-stage");

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const cp = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true, dereference: false });
};

rm(stage);

// Electron main
cp(path.join(root, "electron", "main.js"), path.join(stage, "main.js"));

// Bundled backend (self-contained, better-sqlite3 externalized)
cp(path.join(root, "apps", "backend", "dist", "index.cjs"), path.join(stage, "backend", "index.cjs"));

// Note: the Electron-native better-sqlite3 binary is shipped via electron-builder
// `extraResources` (see package.json), which places it at
// resources/app/backend/node_modules/better-sqlite3 — where the bundle resolves it.

// Frontend build
cp(path.join(root, "apps", "web", "dist"), path.join(stage, "web"));

// Migrations
cp(path.join(root, "apps", "backend", "data", "migrations"), path.join(stage, "migrations"));

const pkg = {
  name: "dsa-lab-desktop",
  version: "0.1.0",
  description: "Lightweight self-hosted AI-powered DSA practice platform",
  author: "DSA Lab",
  main: "main.js"
};
fs.writeFileSync(path.join(stage, "package.json"), JSON.stringify(pkg, null, 2) + "\n", "utf-8");

console.log("Staged app at", stage);
