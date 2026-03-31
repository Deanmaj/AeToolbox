const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const srcDir = path.join(__dirname, "src");
const distDir = path.join(__dirname, "dist");

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

// Collect all top-level .ts entry points in src/
const entries = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
  .map((f) => path.join(srcDir, f));

const watch = process.argv.includes("--watch");

const ctx = esbuild.context({
  entryPoints: entries,
  outdir: distDir,
  outExtension: { ".js": ".jsx" },
  bundle: true,
  platform: "neutral",
  format: "iife",
  target: ["es2015"],
  // Capture `this` (the ScriptUI thisObj) at global scope before the IIFE runs
  banner: { js: "var __panelThis = this;" },
});

ctx.then(async (c) => {
  if (watch) {
    await c.watch();
    console.log("Watching for changes...");
  } else {
    await c.rebuild();
    await c.dispose();
    console.log("Build complete →", distDir);
  }
}).catch(() => process.exit(1));
