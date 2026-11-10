import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ThemeToggle from '../ThemeToggle.vue';
import { THEME_STORAGE_KEY, getStoredTheme } from '../../utils/theme';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('starts from the system theme (light here) and offers the other one', () => {
    const wrapper = mount(ThemeToggle);

    expect(wrapper.attributes('aria-label')).toBe('Switch to dark theme');
  });

  it('switches the page theme and remembers it', async () => {
    const wrapper = mount(ThemeToggle);

    await wrapper.trigger('click');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(wrapper.attributes('aria-label')).toBe('Switch to light theme');

    await wrapper.trigger('click');

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(getStoredTheme()).toBe('light');
  });

  it('starts from the saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const wrapper = mount(ThemeToggle);

    expect(wrapper.attributes('aria-label')).toBe('Switch to light theme');
  });

  it('ignores an invalid saved value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');

    expect(getStoredTheme()).toBeNull();
  });
});
