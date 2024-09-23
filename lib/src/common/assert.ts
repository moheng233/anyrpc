import assert from "node:assert";

const sepPosix = "/";
const sepWin32 = "\\";

export function assertPosixPath(path: string) {
    assert(path && !path.includes(sepWin32), `Wrongly formatted path: ${path}`);
}
