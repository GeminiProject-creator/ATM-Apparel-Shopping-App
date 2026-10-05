const { spawn } = require("node:child_process");

const port = process.env.PORT || "8081";
const env = {
  ...process.env,
  PORT: port,
};

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(
  command,
  ["exec", "expo", "start", "--localhost", "--port", port],
  {
    cwd: __dirname + "/..",
    env,
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
