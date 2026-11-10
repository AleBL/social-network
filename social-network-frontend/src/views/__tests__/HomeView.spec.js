import { describe, expect, it } from 'vitest';
import { RouterLinkStub, mount } from '@vue/test-utils';
import HomeView from '../HomeView.vue';

describe('HomeView', () => {
  const mountView = () =>
    mount(HomeView, {
      global: {
        stubs: {
          NetworkStats: true,
          SuggestedConnections: true,
          RouterLink: RouterLinkStub
        }
      }
    });

  it('renders the hero, the suggestions and the network stats', () => {
    const wrapper = mountView();

    expect(wrapper.find('h1').text()).toBe(
      'Find friends through the people you already know'
    );
    expect(
      wrapper.findComponent({ name: 'SuggestedConnections' }).exists()
    ).toBe(true);
    expect(wrapper.findComponent({ name: 'NetworkStats' }).exists()).toBe(
      true
    );
  });

  it('links to the graph and to the users list', () => {
    const wrapper = mountView();

    const targets = wrapper
      .findAllComponents(RouterLinkStub)
      .map((link) => link.props('to'));
    expect(targets).toEqual(['/graph', '/users']);
  });
});
