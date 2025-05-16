import * as path from "path";
import * as assert from "assert";
import * as fs from "fs";
import { runTests } from "@vscode/test-electron";

/**
 * VS Code version compatibility test runner
 * This script tests the extension against multiple versions of VS Code
 */
async function runVersionCompatibilityTests() {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../");
  const extensionTestsPath = path.resolve(__dirname, "./suite/index");
  
  const versionsToTest = [
    "1.96.0", // Minimum supported version
    "1.97.0",
    "1.98.0",
    "1.99.0",
    "insiders" // Latest insiders build
  ];
  
  const failures: { version: string; error: any }[] = [];

  for (const version of versionsToTest) {
    try {
      console.log(`Testing extension on VS Code version: ${version}`);
      
      await runTests({
        version,
        extensionDevelopmentPath,
        extensionTestsPath,
        launchArgs: ["--disable-extensions", "--disable-gpu"]
      });
      
      console.log(`✅ Tests passed on VS Code version ${version}`);
    } catch (err) {
      console.error(`❌ Tests failed on VS Code version ${version}:`, err);
      failures.push({ version, error: err });
    }
  }
  
  if (failures.length === 0) {
    console.log("✅ Extension passed compatibility tests on all specified VS Code versions");
    return 0;
  } else {
    console.error(`❌ Extension failed compatibility tests on ${failures.length} VS Code versions:`);
    failures.forEach(failure => {
      console.error(`- Version ${failure.version}:`, failure.error);
    });
    return 1;
  }
}

if (require.main === module) {
  runVersionCompatibilityTests().then(
    code => process.exit(code),
    err => {
      console.error("Failed to run tests:", err);
      process.exit(1);
    }
  );
}

export { runVersionCompatibilityTests };
