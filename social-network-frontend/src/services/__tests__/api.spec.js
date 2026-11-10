import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '../api';

describe('getErrorMessage', () => {
  it('uses the message sent by the backend', () => {
    const error = {
      response: { status: 409, data: { status: 'error', error: 'Conflict!' } }
    };

    expect(getErrorMessage(error)).toBe('Conflict!');
  });

  it('explains a timeout', () => {
    expect(getErrorMessage({ code: 'ECONNABORTED' })).toBe(
      'The server took too long to answer, please try again'
    );
  });

  it.each([
    ['a network error', { message: 'Network Error' }],
    ['a response without a message', { response: { status: 500, data: {} } }],
    ['undefined', undefined]
  ])('falls back to a generic message for %s', (_label, error) => {
    expect(getErrorMessage(error)).toBe(
      'Could not reach the server, please try again later'
    );
  });
});
