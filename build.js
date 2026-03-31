const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

const watch = process.argv.includes("--watch");

// Compile TypeScript → ES5 JavaScript via tsc
try {
    execSync("npx tsc" + (watch ? " --watch" : ""), { stdio: "inherit" });
} catch (e) {
    process.exit(1);
}

// Post-process: prepend banner and rename .js → .jsx
const files = fs.readdirSync(distDir).filter(f => f.endsWith(".js"));
for (const file of files) {
    const jsPath  = path.join(distDir, file);
    const jsxPath = path.join(distDir, file.replace(/\.js$/, ".jsx"));
    const content = "var __panelThis = this;\n" +
        fs.readFileSync(jsPath, "utf8").replace(/^["']use strict["'];?\s*/m, "");
    fs.writeFileSync(jsxPath, content);
    fs.unlinkSync(jsPath);
}

console.log("Build complete →", distDir);
