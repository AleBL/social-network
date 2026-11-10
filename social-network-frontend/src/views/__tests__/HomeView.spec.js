import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import HomeView from '../HomeView.vue';

describe('HomeView', () => {
  it('renders the title, the API status and the suggested connections', () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { ApiStatus: true, SuggestedConnections: true } }
    });

    expect(wrapper.find('h1').text()).toBe('Social Network');
    expect(wrapper.findComponent({ name: 'ApiStatus' }).exists()).toBe(true);
    expect(
      wrapper.findComponent({ name: 'SuggestedConnections' }).exists()
    ).toBe(true);
  });
});
