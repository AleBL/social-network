<template>
  <div class="user-picker">
    <label :for="inputId" class="label">{{ label }}</label>

    <div v-if="modelValue" class="picked">
      <UserAvatar :id="modelValue.id" :name="modelValue.name" size="sm" />
      <span class="person-text">
        <span class="person-name">{{ modelValue.name }}</span>
        <span class="person-email">{{ modelValue.email }}</span>
      </span>
      <button
        type="button"
        class="secondary change"
        :disabled="disabled"
        :aria-label="`Change ${label.toLowerCase()}`"
        @click="clear"
      >
        Change
      </button>
    </div>

    <div v-else class="search">
      <input
        :id="inputId"
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        :aria-expanded="String(open)"
        :aria-controls="listId"
        :aria-activedescendant="activeId"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @focus="onFocus"
        @blur="open = false"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="selectActive"
        @keydown.esc="open = false"
      />

      <ul
        v-show="open"
        :id="listId"
        role="listbox"
        class="options card"
        :aria-label="`${label} results`"
      >
        <li v-if="loading" class="status">Searching...</li>
        <li v-else-if="error" class="status status--error">{{ error }}</li>
        <li v-else-if="results.length === 0" class="status">
          No users found
        </li>
        <template v-else>
          <!-- mousedown (not click) runs before the input blur closes the list. -->
          <li
            v-for="(user, index) in results"
            :id="optionId(index)"
            :key="user.id"
            role="option"
            class="option"
            :class="{ 'option--active': index === activeIndex }"
            :aria-selected="String(index === activeIndex)"
            @mousedown.prevent="select(user)"
            @mouseenter="activeIndex = index"
          >
            <UserAvatar :id="user.id" :name="user.name" size="sm" />
            <span class="person-text">
              <span class="person-name">{{ user.name }}</span>
              <span class="person-email">{{ user.email }}</span>
            </span>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
import UserAvatar from './UserAvatar.vue';
import { getErrorMessage, searchUsers } from '../services/api';

// Typing waits a bit before searching so each keystroke is not a request.
export const SEARCH_DELAY_MS = 250;
export const RESULTS_LIMIT = 8;
const API_LIMIT_MAX = 100;

let instances = 0;

// Search-as-you-type user selector (ARIA combobox): the backend does the
// filtering, so it never loads the whole user list.
export default {
  name: 'UserPicker',
  components: { UserAvatar },
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    label: {
      type: String,
      required: true
    },
    // Users that must not be offered (the profile owner, current friends...).
    excludeIds: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String,
      default: 'Type a name or email'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data() {
    instances += 1;
    return {
      uid: instances,
      query: '',
      results: [],
      loading: false,
      error: '',
      open: false,
      activeIndex: -1,
      timer: null,
      lastRequest: 0
    };
  },
  computed: {
    inputId() {
      return `user-picker-${this.uid}`;
    },
    listId() {
      return `${this.inputId}-list`;
    },
    activeId() {
      return this.activeIndex >= 0 ? this.optionId(this.activeIndex) : undefined;
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  },
  methods: {
    optionId(index) {
      return `${this.inputId}-option-${index}`;
    },
    onFocus() {
      this.open = true;
      if (this.results.length === 0 && !this.loading) {
        this.scheduleSearch(0);
      }
    },
    onInput() {
      this.open = true;
      this.scheduleSearch(SEARCH_DELAY_MS);
    },
    scheduleSearch(delay) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.search(), delay);
    },
    async search() {
      const request = ++this.lastRequest;
      this.loading = true;
      this.error = '';

      try {
        // A few extra results keep the list full after removing excluded users.
        const { users } = await searchUsers({
          search: this.query.trim(),
          limit: Math.min(API_LIMIT_MAX, RESULTS_LIMIT + this.excludeIds.length)
        });

        // An older, slower answer must not replace a newer one.
        if (request !== this.lastRequest) {
          return;
        }

        const excluded = new Set(this.excludeIds);
        this.results = users
          .filter((user) => !excluded.has(user.id))
          .slice(0, RESULTS_LIMIT);
        this.activeIndex = this.results.length > 0 ? 0 : -1;
      } catch (err) {
        if (request === this.lastRequest) {
          this.results = [];
          this.error = getErrorMessage(err);
        }
      } finally {
        if (request === this.lastRequest) {
          this.loading = false;
        }
      }
    },
    move(step) {
      if (!this.open) {
        this.open = true;
        return;
      }
      if (this.results.length === 0) {
        return;
      }
      const count = this.results.length;
      this.activeIndex = (this.activeIndex + step + count) % count;
    },
    selectActive() {
      const user = this.results[this.activeIndex];
      if (this.open && user) {
        this.select(user);
      }
    },
    select(user) {
      this.$emit('update:modelValue', user);
      this.open = false;
      this.query = '';
      this.results = [];
      this.activeIndex = -1;
    },
    clear() {
      this.$emit('update:modelValue', null);
      this.$nextTick(() => this.$refs.input?.focus());
    }
  }
};
</script>

<style scoped>
.user-picker {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.label {
  font-weight: 600;
  font-size: 0.9rem;
}

.search {
  position: relative;
}

.search input {
  width: 100%;
}

.options {
  position: absolute;
  z-index: 5;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  max-height: 18rem;
  overflow-y: auto;
  box-shadow: var(--shadow-md);
}

.option,
.picked {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.option {
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.option--active {
  background: var(--color-primary-soft);
}

.picked {
  padding: 0.4rem 0.5rem 0.4rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.person-text {
  display: grid;
  min-width: 0;
  flex: 1;
}

.person-name {
  font-weight: 600;
}

.person-email {
  font-size: 0.8rem;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.change {
  padding: 0.3rem 0.7rem;
  font-size: 0.85rem;
}

.status {
  padding: 0.5rem 0.6rem;
  color: var(--color-muted);
}

.status--error {
  color: var(--color-error);
}
</style>
