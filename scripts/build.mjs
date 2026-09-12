import { spawn } from "node:child_process";
import { resolve } from "node:path";

const nextCli = resolve("node_modules/next/dist/bin/next");
const wasmDirectory = resolve("node_modules/@next/swc-wasm-nodejs");

const child = spawn(process.execPath, [nextCli, "build"], {
  env: { ...process.env, NEXT_TEST_WASM_DIR: wasmDirectory },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exitCode = code ?? 1;
});
