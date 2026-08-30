import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const electronVersion = (() => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
  const raw = pkg.devDependencies?.electron ?? "43.0.0";
  return raw.replace(/^[\^~]/, "");
})();

const bsqlReal = fs.realpathSync(
  path.join(root, "apps", "backend", "node_modules", "better-sqlite3")
);

function resolveFromPnpm(pkgName) {
  const dir = fs
    .readdirSync(path.join(root, "node_modules", ".pnpm"))
    .find((entry) => entry.startsWith(`${pkgName}@`));
  if (!dir) {
    throw new Error(`Could not resolve ${pkgName} in the pnpm store`);
  }
  return path.join(root, "node_modules", ".pnpm", dir, "node_modules", pkgName);
}

const nodeAddonApiReal = fs.realpathSync(resolveFromPnpm("node-addon-api"));

const rebuildDir = path.join(root, "apps", "backend", "dist", ".rebuild");
const rebuildModules = path.join(rebuildDir, "node_modules");

fs.rmSync(rebuildDir, { recursive: true, force: true });
fs.mkdirSync(rebuildModules, { recursive: true });

fs.writeFileSync(
  path.join(rebuildDir, "package.json"),
  JSON.stringify({ name: "native-rebuild", version: "1.0.0", dependencies: { "better-sqlite3": "13.0.3" } })
);

const copy = (from, to) => fs.cpSync(from, to, { recursive: true, dereference: false });
copy(bsqlReal, path.join(rebuildModules, "better-sqlite3"));
copy(nodeAddonApiReal, path.join(rebuildModules, "node-addon-api"));

fs.rmSync(path.join(rebuildModules, "better-sqlite3", "build"), { recursive: true, force: true });
fs.rmSync(path.join(rebuildModules, "better-sqlite3", "prebuilds"), { recursive: true, force: true });

const cli = path.join(
  root,
  "node_modules",
  ".pnpm",
  "@electron+rebuild@4.2.0",
  "node_modules",
  "@electron",
  "rebuild",
  "lib",
  "cli.js"
);

execFileSync(process.execPath, [cli, "--version", electronVersion, "--module-dir", rebuildDir, "--only", "better-sqlite3"], {
  stdio: "inherit"
});

const builtBinary = path.join(rebuildModules, "better-sqlite3", "build", "Release", "better_sqlite3.node");
if (!fs.existsSync(builtBinary)) {
  throw new Error(`Electron-native better-sqlite3 build not found at ${builtBinary}`);
}

// Assemble the shipped package next to the bundle so Node resolves it first.
const dest = path.join(root, "apps", "backend", "dist", "node_modules", "better-sqlite3");
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.join(dest, "prebuilds"), { recursive: true });
copy(path.join(bsqlReal, "lib"), path.join(dest, "lib"));
fs.copyFileSync(path.join(bsqlReal, "package.json"), path.join(dest, "package.json"));
fs.copyFileSync(builtBinary, path.join(dest, "prebuilds", "linux-x64.node"));

fs.rmSync(rebuildDir, { recursive: true, force: true });

console.log(`Rebuilt better-sqlite3 for Electron ${electronVersion} at ${dest}`);
