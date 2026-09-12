import { spawn } from "node:child_process";
import { resolve } from "node:path";

// This machine's Application Control policy blocks Next.js's native SWC
// binary, so force the WASM fallback the same way scripts/build.mjs does.
const nextCli = resolve("node_modules/next/dist/bin/next");
const wasmDirectory = resolve("node_modules/@next/swc-wasm-nodejs");

const child = spawn(process.execPath, [nextCli, "dev"], {
  env: { ...process.env, NEXT_TEST_WASM_DIR: wasmDirectory },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exitCode = code ?? 1;
});
