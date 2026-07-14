import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

export const orgFiles = async (directory: string, prefix = ""): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await orgFiles(resolve(directory, entry.name), relative)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".org")) {
      files.push(relative);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
};
