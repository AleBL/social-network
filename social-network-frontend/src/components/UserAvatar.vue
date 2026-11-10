<template>
  <span
    class="avatar"
    :class="`avatar--${size}`"
    :style="{ '--avatar-hue': hue }"
    :data-initials="initials"
    aria-hidden="true"
  ></span>
</template>

<script>
// "Pedro Henrique Dias" -> "PD". The initials are drawn with CSS
// (content: attr(data-initials)) so they never mix with the name text.
export function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${parts[0][0]}${last}`.toUpperCase();
}

// Same person, same color: a stable hue derived from the id.
export function hueOf(seed = '') {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return hash % 360;
}

export default {
  name: 'UserAvatar',
  props: {
    name: {
      type: String,
      required: true
    },
    id: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    }
  },
  computed: {
    initials() {
      return initialsOf(this.name);
    },
    hue() {
      return hueOf(this.id || this.name);
    }
  }
};
</script>

<style scoped>
.avatar {
  --size: 2.25rem;
  flex: none;
  display: inline-grid;
  place-items: center;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  /* Follows the light/dark theme (see main.css). */
  background: light-dark(
    hsl(var(--avatar-hue) 70% 92%),
    hsl(var(--avatar-hue) 35% 24%)
  );
  color: light-dark(
    hsl(var(--avatar-hue) 55% 30%),
    hsl(var(--avatar-hue) 80% 84%)
  );
  font-weight: 700;
  font-size: calc(var(--size) * 0.38);
  letter-spacing: 0.02em;
  user-select: none;
}

.avatar::before {
  content: attr(data-initials);
}

.avatar--sm {
  --size: 1.9rem;
}

.avatar--lg {
  --size: 4.5rem;
}

</style>
