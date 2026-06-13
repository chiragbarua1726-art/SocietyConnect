import { spawn } from "node:child_process";

const cwd = process.cwd();
const isWin = process.platform === "win32";
const viteBin = isWin ? "node_modules\\.bin\\vite.cmd" : "node_modules/.bin/vite";

const processes = [
  {
    name: "server",
    color: "\x1b[36m",
    command: "node",
    args: ["backend/server.js"],
  },
  {
    name: "client",
    color: "\x1b[35m",
    command: viteBin,
    args: ["--config", "frontend/vite.config.js"],
  },
];

const children = processes.map((proc) => {
  const child = spawn(proc.command, proc.args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWin && proc.command.includes(".cmd"),
  });

  const prefix = `${proc.color}[${proc.name}]\x1b[0m`;
  child.stdout.on("data", (chunk) => process.stdout.write(`${prefix} ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`${prefix} ${chunk}`));
  child.on("exit", (code) => {
    if (code !== 0) {
      process.stderr.write(`${prefix} exited with code ${code}\n`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
