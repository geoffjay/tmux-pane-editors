import * as path from "path";
import Mocha from "mocha";
import * as glob from "glob";

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 60000
  });

  const testsRoot = path.resolve(__dirname, ".");

  return new Promise<void>((resolve, reject) => {
    const testFiles = glob.glob.sync("**/**.test.js", { cwd: testsRoot });
    
    testFiles.forEach((file: string) => {
      mocha.addFile(path.resolve(testsRoot, file));
    });

    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
} 