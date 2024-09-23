import fs from "node:fs/promises";

export async function exists(path: string) {
    try {
        await fs.access(path, fs.constants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
