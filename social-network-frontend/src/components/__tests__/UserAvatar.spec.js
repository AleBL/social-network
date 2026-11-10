import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import UserAvatar, { hueOf, initialsOf } from '../UserAvatar.vue';

describe('initialsOf', () => {
  it.each([
    ['Sofia Martins', 'SM'],
    ['Pedro Henrique Dias', 'PD'],
    ['  júlia   fernandes ', 'JF'],
    ['Madonna', 'M'],
    ['', '?']
  ])('turns %j into %j', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});

describe('hueOf', () => {
  it('is stable and stays in the 0-359 range', () => {
    expect(hueOf('user-42')).toBe(hueOf('user-42'));
    expect(hueOf('user-42')).toBeGreaterThanOrEqual(0);
    expect(hueOf('user-42')).toBeLessThan(360);
    expect(hueOf('user-1')).not.toBe(hueOf('user-2'));
  });
});

describe('UserAvatar', () => {
  it('draws the initials with CSS, hidden from screen readers', () => {
    const wrapper = mount(UserAvatar, {
      props: { id: 'u1', name: 'Sofia Martins', size: 'lg' }
    });

    expect(wrapper.attributes('data-initials')).toBe('SM');
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.classes()).toContain('avatar--lg');
    // No text node: lists that show the avatar keep only the name as text.
    expect(wrapper.text()).toBe('');
  });
});
