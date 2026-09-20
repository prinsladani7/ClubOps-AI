#!/usr/bin/env node

/**
 * ClubOps AI - Environment Doctor & Compatibility Check
 * Verifies that the host laptop has everything needed to run the website smoothly.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const net = require("net");
const { execSync } = require("child_process");

console.log("\n======================================================================");
console.log("   CLUBOPS AI - HOST LAPTOP ENVIRONMENT DOCTOR");
console.log("======================================================================\n");

let issuesFound = 0;

function check(label, testFn, hint) {
  try {
    const ok = testFn();
    if (ok) {
      console.log(`  [\x1b[32mPASS\x1b[0m] ${label}`);
    } else {
      issuesFound++;
      console.log(`  [\x1b[31mFAIL\x1b[0m] ${label}`);
      if (hint) console.log(`         \x1b[33mHint:\x1b[0m ${hint}`);
    }
  } catch (err) {
    issuesFound++;
    console.log(`  [\x1b[31mFAIL\x1b[0m] ${label} (${err.message})`);
    if (hint) console.log(`         \x1b[33mHint:\x1b[0m ${hint}`);
  }
}

// 1. Host Architecture & OS
console.log(`  * Host Platform: ${os.type()} ${os.release()} (${os.arch()})`);
console.log(`  * Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB\n`);

// 2. Node.js version
check(
  `Node.js version (Detected: ${process.version})`,
  () => {
    const major = parseInt(process.versions.node.split(".")[0], 10);
    return major >= 18;
  },
  "Node.js 18.0.0 or higher is required. Please download from https://nodejs.org"
);

// 3. npm package manager
check(
  "npm package manager",
  () => {
    const out = execSync("npm -v", { encoding: "utf8" }).trim();
    return Boolean(out);
  },
  "npm is required to manage dependencies."
);

// 4. Critical project files
const rootDir = path.resolve(__dirname, "..");
check(
  "Project configuration files (package.json, next.config.mjs)",
  () => {
    return (
      fs.existsSync(path.join(rootDir, "package.json")) &&
      fs.existsSync(path.join(rootDir, "next.config.mjs"))
    );
  },
  "Corrupt or incomplete repository directory."
);

// 5. Environment configuration file
check(
  "Environment configuration (.env.local or .env.example)",
  () => {
    const hasLocal = fs.existsSync(path.join(rootDir, ".env.local"));
    const hasExample = fs.existsSync(path.join(rootDir, ".env.example"));
    if (!hasLocal && hasExample) {
      fs.copyFileSync(path.join(rootDir, ".env.example"), path.join(rootDir, ".env.local"));
      console.log("         \x1b[36mNotice:\x1b[0m Auto-created .env.local from .env.example");
    }
    return fs.existsSync(path.join(rootDir, ".env.local")) || hasExample;
  },
  "Run 'cp .env.example .env.local' to initialize configuration."
);

// 6. Installed dependencies
check(
  "Installed dependencies (node_modules/next)",
  () => {
    return fs.existsSync(path.join(rootDir, "node_modules", "next"));
  },
  "Run 'npm install' or double-click start.bat to install required packages."
);

// 7. Port 3000 check
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

checkPortAvailable(3000).then((available) => {
  if (available) {
    console.log(`  [\x1b[32mPASS\x1b[0m] Default port 3000 is open and available`);
  } else {
    console.log(`  [\x1b[33mINFO\x1b[0m] Port 3000 is currently in use (dev server may already be running, or Next.js will auto-bind to 3001)`);
  }

  console.log("\n----------------------------------------------------------------------");
  if (issuesFound === 0) {
    console.log("  \x1b[32m✓ Environment is 100% HEALTHY! Ready to launch on this laptop.\x1b[0m");
    console.log("    To run: 'npm run dev' or double-click 'start.bat' (Windows) / './start.sh' (Mac/Linux)");
    console.log("    Docker: 'docker compose up'");
  } else {
    console.log(`  \x1b[31m⚠ Found ${issuesFound} potential compatibility item(s). Please review hints above.\x1b[0m`);
  }
  console.log("----------------------------------------------------------------------\n");
});
