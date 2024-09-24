import { createFilter } from "vite";

export const defaultInclude: (id: string | undefined) => boolean = createFilter("**/*.rpc.ts");
