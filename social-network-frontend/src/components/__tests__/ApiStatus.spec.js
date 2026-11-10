import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ApiStatus, { SLOW_THRESHOLD_MS } from '../ApiStatus.vue';
import { ping } from '../../services/api';

vi.mock('../../services/api', () => ({
  ping: vi.fn()
}));

describe('ApiStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows online when the backend answers', async () => {
    ping.mockResolvedValue({ status: 'success', data: 'PONG' });

    const wrapper = mount(ApiStatus);
    await flushPromises();

    expect(wrapper.text()).toBe('API online');
  });

  it('shows unavailable when the request fails', async () => {
    ping.mockRejectedValue(new Error('Network Error'));

    const wrapper = mount(ApiStatus);
    await flushPromises();

    expect(wrapper.text()).toBe('API unavailable, please try again later');
  });

  it('explains the cold start when the backend is slow', async () => {
    ping.mockReturnValue(new Promise(() => {}));

    const wrapper = mount(ApiStatus);
    expect(wrapper.text()).toBe('Checking API...');

    await vi.advanceTimersByTimeAsync(SLOW_THRESHOLD_MS);

    expect(wrapper.text()).toContain('Waking up the server');
  });
});
