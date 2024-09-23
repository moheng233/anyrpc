export interface SSEMessageOption {
	id?: string;
	event?: string;
	retry?: number;
}

export interface SSEMessage<O> extends SSEMessageOption {
	data: O;
}
