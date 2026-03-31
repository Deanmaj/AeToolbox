const { execSync } = require("child_process");
const path = require("path");
const fs   = require("fs");

const srcFile  = path.join(__dirname, "src", "host.ts");
const outFile  = path.join(__dirname, "host.jsx");

const watch = process.argv.includes("--watch");

// Compile host.ts → host.js via tsc, then rename/post-process to host.jsx
try {
    execSync("npx tsc" + (watch ? " --watch" : ""), { stdio: "inherit" });
} catch (e) {
    process.exit(1);
}

// tsc outputs host.js next to host.ts (per tsconfig outDir: root)
const jsFile = path.join(__dirname, "host.js");
if (fs.existsSync(jsFile)) {
    let content = fs.readFileSync(jsFile, "utf8")
        .replace(/^["']use strict["'];?\s*/m, ""); // strip strict mode
    fs.writeFileSync(outFile, content);
    fs.unlinkSync(jsFile);
    console.log("Build complete → host.jsx");
}
