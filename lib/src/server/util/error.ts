export abstract class RPCError extends Error {
    public abstract get status(): number;

    constructor(
        private readonly path: string,
        private readonly method: string,
        private readonly error: unknown,
    ) {
        super();
    }
}

export class RPCModuleNotFoundError extends RPCError {
    public get status(): number {
        return 404;
    }

    constructor(
        path: string,
        method: string,
        error: unknown,
    ) {
        super(path, method, error);
    }
}

export class RPCMethodNotFoundError extends RPCError {
    public get status(): number {
        return 404;
    }

    constructor(
        path: string,
        method: string,
        error: unknown,
    ) {
        super(path, method, error);
    }
}

export class RPCCallError extends RPCError {
    public get status(): number {
        return 500;
    }

    constructor(
        path: string,
        method: string,
        error: unknown,
    ) {
        super(path, method, error);
    }
}

export class RPCArgsPaserError extends RPCError {
    public get status() {
        return 400;
    }

    constructor(
        path: string,
        method: string,
        error: unknown,
    ) {
        super(path, method, error);
    }
}

export class RPCReturnStringifyError extends RPCError {
    public get status(): number {
        return 500;
    }

    constructor(
        path: string,
        method: string,
        error: unknown,
    ) {
        super(path, method, error);
    }
}

export class PluginCallError extends RPCError {
    public get status(): number {
        return 500;
    }

    constructor(
        path: string,
        method: string,
        private readonly plugin: string,
        error: unknown,
    ) {
        super(path, method, error);
    }
}
