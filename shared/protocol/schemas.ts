/**
 * Message validation and factory utilities.
 */
import { BaseMessage, DeskRemoteMessage, MessageType } from './messages.js';
import { Events, EventName } from './events.js';
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Set of all valid message types */
const VALID_TYPES = new Set<string>(Object.values(Events));

/** Validate a raw parsed JSON object is a valid DeskRemote message */
export function validateMessage(raw: unknown): { valid: boolean; error?: string; message?: BaseMessage } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Message must be a non-null object' };
  }

  const msg = raw as Record<string, unknown>;

  if (typeof msg.type !== 'string') {
    return { valid: false, error: 'Message must have a string "type" field' };
  }

  if (!VALID_TYPES.has(msg.type)) {
    return { valid: false, error: `Unknown message type: ${msg.type}` };
  }

  if (msg.payload !== undefined && (typeof msg.payload !== 'object' || msg.payload === null)) {
    return { valid: false, error: 'Payload must be an object if present' };
  }

  return { valid: true, message: msg as unknown as BaseMessage };
}

/** Create a protocol message with auto-generated id and timestamp */
export function createMessage<T extends DeskRemoteMessage>(
  type: T['type'],
  payload: T['payload'],
  token?: string
): T {
  return {
    type,
    payload,
    id: generateUUID(),
    timestamp: Date.now(),
    ...(token ? { token } : {}),
  } as T;
}

/** Parse a raw WebSocket string into a validated message */
export function parseMessage(raw: string): { valid: boolean; error?: string; message?: BaseMessage } {
  try {
    const parsed = JSON.parse(raw);
    return validateMessage(parsed);
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }
}

/** Create a command.response message */
export function createResponse(
  success: boolean,
  message?: string,
  data?: unknown,
  requestId?: string,
  error?: string
) {
  return createMessage('command.response' as any, {
    success,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
    ...(requestId ? { requestId } : {}),
    ...(error ? { error } : {}),
  });
}
