// Copies the extension into After Effects' CEP extensions folder.
// Run: npm run deploy

const fs   = require("fs");
const path = require("path");

const SRC  = __dirname;
const DEST = path.join(
    process.env.APPDATA,
    "Adobe", "CEP", "extensions", "AeToolbox"
);

const IGNORE = new Set([
    "node_modules", ".git", ".claude", "src",
    "deploy.js", "build.js", "package.json", "package-lock.json",
    "tsconfig.json", "AE_Toolbox_Spec.md", "Context",
    "dist",   // old ScriptUI output
]);

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (IGNORE.has(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        if (fs.statSync(s).isDirectory()) {
            copyDir(s, d);
        } else {
            fs.copyFileSync(s, d);
        }
    }
}

// First build
require("child_process").execSync("node build.js", { stdio: "inherit" });

// Then deploy
copyDir(SRC, DEST);
console.log("Deployed to:", DEST);
console.log("Restart After Effects, then open Window → AE Toolbox.");
