import type { AnyRPCPlugin } from "../types.js";

import { definePlugin } from "../types.js";
import { useRaw } from "../util/context.js";

export const AnyRPCSessionPlugin: AnyRPCPlugin = definePlugin({
    name: "session",
    async setup() {
    },
    async preCall() {
        const raw = useRaw();
    },
    async postCall() {
    },
});
