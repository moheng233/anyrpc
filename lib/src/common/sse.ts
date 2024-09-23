export interface SSEMessageOption {
    id?: string;
    event?: string;
    retry?: number;
}

export interface SSEMessage<O> extends SSEMessageOption {
    data: O;
}

export class SSEMessageEmit<O> {
    private readonly _writer: WritableStreamDefaultWriter<SSEMessage<O>>;

    constructor(
        private readonly _stream: WritableStream<SSEMessage<O>>
    ) {
        this._writer = this._stream.getWriter();
    }

    async abort(message: string): Promise<void> {
        return await this._writer.abort(message);
    }

    async close(): Promise<void> {
        return await this._writer.close();
    }

    async emit(data: O, opt: SSEMessageOption = {}): Promise<void> {
        return await this._writer.write({
            ...opt,
            data
        });
    }
}

export function formatSSEMessage(message: SSEMessage<string>): string {
    let result = "";
    if (message.id) {
        result += `id: ${message.id}\n`;
    }
    if (message.event) {
        result += `event: ${message.event}\n`;
    }
    if (typeof message.retry === "number" && Number.isInteger(message.retry)) {
        result += `retry: ${message.retry}\n`;
    }
    result += `data: ${message.data}\n\n`;
    return result;
}
