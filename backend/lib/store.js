import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE = path.join(__dirname, "..", "data", "store.json");

// Serialised write queue — prevents concurrent writes from corrupting the file
let writeQueue = Promise.resolve();

export async function readStore() {
  let raw;
  try {
    raw = await fs.readFile(STORE_FILE, "utf8");
  } catch (err) {
    throw new Error(`Could not read store file: ${err.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Store file contains invalid JSON. Check backend/data/store.json.");
  }
}

export async function updateStore(updater) {
  // Each call chains onto the previous write; errors don't poison the queue
  writeQueue = writeQueue
    .catch(() => {}) // recover from any previous failure before attempting next write
    .then(async () => {
      const current = await readStore();
      const next = await updater(structuredClone(current));
      await fs.writeFile(STORE_FILE, JSON.stringify(next, null, 2), "utf8");
      return next;
    });

  return writeQueue;
}
