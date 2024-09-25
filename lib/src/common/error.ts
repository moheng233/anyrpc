import { IValidation } from "typia";

export abstract class RPCError<E = unknown> extends Error {
    constructor(
        public readonly path: string,
        public readonly method: string,
        public readonly error: E,
    ) {
        super();
    }
}

export abstract class RPCServerError<E = unknown> extends RPCError<E> {
    public abstract get status(): number;

    constructor(
        path: string,
        method: string,
        error: E,
    ) {
        super(path, method, error);
    }
}

export abstract class RPCClientError<E = unknown> extends RPCError<E> {
    constructor(
        path: string,
        method: string,
        error: E,
    ) {
        super(path, method, error);
    }
}

export class RPCModuleNotFoundError extends RPCServerError {
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

export class RPCMethodNotFoundError extends RPCServerError {
    public get status(): number {
        return 405;
    }

    constructor(
        path: string,
        method: string,
        error: unknown,
    ) {
        super(path, method, error);
    }
}

export class RPCCallError extends RPCServerError {
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

export class RPCParmasPaserError extends RPCServerError<IValidation.IFailure> {
    public get status() {
        return 400;
    }

    constructor(
        path: string,
        method: string,
        error: IValidation.IFailure,
    ) {
        super(path, method, error);
    }
}

export class RPCParmasStringifyError extends RPCClientError<IValidation.IFailure> {
    public get status() {
        return 400;
    }

    constructor(
        path: string,
        method: string,
        error: IValidation.IFailure,
    ) {
        super(path, method, error);
    }
}

export class RPCReturnParserError extends RPCClientError<IValidation.IFailure> {
    constructor(
        path: string,
        method: string,
        error: IValidation.IFailure,
    ) {
        super(path, method, error);
    }
}

export class RPCReturnStringifyError extends RPCServerError<IValidation.IFailure> {
    public get status(): number {
        return 500;
    }

    constructor(
        path: string,
        method: string,
        error: IValidation.IFailure,
    ) {
        super(path, method, error);
    }
}

export class RPCSSEParserError extends RPCClientError<IValidation.IFailure> {
    constructor(
        path: string,
        method: string,
        error: IValidation.IFailure,
    ) {
        super(path, method, error);
    }
}

export class RPCSSEStringifyError extends RPCServerError<IValidation.IFailure> {
    public get status(): number {
        return 500;
    }

    constructor(
        path: string,
        method: string,
        error: IValidation.IFailure,
    ) {
        super(path, method, error);
    }
}

export class PluginCallError extends RPCServerError {
    public get status(): number {
        return 550;
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
