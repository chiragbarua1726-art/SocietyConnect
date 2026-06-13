import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE = path.join(__dirname, "..", "data", "store.json");

let writeQueue = Promise.resolve();

export async function readStore() {
  const raw = await fs.readFile(STORE_FILE, "utf8");
  return JSON.parse(raw);
}

export async function updateStore(updater) {
  writeQueue = writeQueue.then(async () => {
    const current = await readStore();
    const next = await updater(structuredClone(current));
    await fs.writeFile(STORE_FILE, JSON.stringify(next, null, 2));
    return next;
  });

  return writeQueue;
}
