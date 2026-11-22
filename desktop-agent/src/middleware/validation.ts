export function validateMessage(raw: string): { valid: boolean; parsed?: any; error?: string } {
  try {
    const parsed = JSON.parse(raw);
    
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Message must be an object' };
    }

    if (typeof parsed.type !== 'string' || !parsed.type) {
      return { valid: false, error: 'Message must have a "type" string field' };
    }

    if (parsed.payload !== undefined && typeof parsed.payload !== 'object') {
      return { valid: false, error: 'Payload must be an object' };
    }

    if (!parsed.payload) {
      parsed.payload = {};
    }

    return { valid: true, parsed };
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/[\x00-\x1f]/g, '');
}

export function validatePayload(type: string, payload: any): { valid: boolean; error?: string } {
  switch (type) {
    case 'mouse.move':
      if (typeof payload.deltaX !== 'number' || typeof payload.deltaY !== 'number')
        return { valid: false, error: 'mouse.move requires deltaX and deltaY numbers' };
      break;
    case 'mouse.click':
      if (payload.button && !['left', 'right', 'middle'].includes(payload.button))
        return { valid: false, error: 'Invalid mouse button' };
      break;
    case 'mouse.scroll':
      if (typeof payload.deltaY !== 'number')
        return { valid: false, error: 'mouse.scroll requires deltaY number' };
      break;
    case 'keyboard.type':
      if (typeof payload.text !== 'string')
        return { valid: false, error: 'keyboard.type requires text string' };
      break;
    case 'keyboard.key':
      if (typeof payload.key !== 'string')
        return { valid: false, error: 'keyboard.key requires key string' };
      break;
    case 'keyboard.shortcut':
      if (typeof payload.shortcut !== 'string')
        return { valid: false, error: 'keyboard.shortcut requires shortcut string' };
      break;
    case 'audio.setVolume':
      if (typeof payload.level !== 'number')
        return { valid: false, error: 'audio.setVolume requires level number' };
      break;
    case 'file.list':
      if (typeof payload.path !== 'string')
        return { valid: false, error: 'file.list requires path string' };
      break;
    case 'app.launch':
      if (typeof payload.name !== 'string')
        return { valid: false, error: 'app.launch requires name string' };
      break;
  }
  return { valid: true };
}
