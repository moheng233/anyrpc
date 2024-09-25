import * as Namespace from "typia/lib/functional/Namespace/index.js";

export const typia: ReturnType<typeof Namespace.json.stringify> & ReturnType<typeof Namespace.validate> = Object.assign(
    Namespace.json.stringify("typia"),
    Namespace.validate(),
);
