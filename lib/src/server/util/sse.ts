import type { SSEMessage, SSEMessageOption } from "../../common/sse.js";

export { SSEMessageEmit, formatSSEMessage, formatSSEMessages }

class SSEMessageEmit<O extends {}> {
  private readonly _writer: WritableStreamDefaultWriter<SSEMessage<O>>

  constructor(
    private readonly _stream: WritableStream<SSEMessage<O>>
  ) {
    this._writer = this._stream.getWriter();
  }

  async emit(data: O, opt: SSEMessageOption = {}): Promise<void> {
    return await this._writer.write({
      ...opt,
      data
    });
  }

  async abort(message: string): Promise<void> {
    return await this._writer.abort(message);
  }

  async close(): Promise<void> {
    return await this._writer.close();
  }
}

function formatSSEMessage<O extends {}>(message: SSEMessage<O>): string {
  let result = '';
  if (message.id) {
    result += `id: ${message.id}\n`;
  }
  if (message.event) {
    result += `event: ${message.event}\n`;
  }
  if (typeof message.retry === 'number' && Number.isInteger(message.retry)) {
    result += `retry: ${message.retry}\n`;
  }
  result += `data: ${message.data}\n\n`;
  return result;
}

function formatSSEMessages<O extends {}>(messages: SSEMessage<O>[]): string {
  let result = '';
  for (const msg of messages) {
    result += formatSSEMessage(msg);
  }
  return result;
}
