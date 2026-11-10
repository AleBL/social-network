import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import HomeView from '../HomeView.vue';

describe('HomeView', () => {
  it('renders the app title and the API status', () => {
    const wrapper = mount(HomeView, {
      global: { stubs: { ApiStatus: true } }
    });

    expect(wrapper.find('h1').text()).toBe('Social Network');
    expect(wrapper.findComponent({ name: 'ApiStatus' }).exists()).toBe(true);
  });
});
