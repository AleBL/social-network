<template>
  <form class="add-friend" @submit.prevent="submit">
    <p v-if="candidates.length === 0" class="empty">
      Everyone is already a friend.
    </p>
    <template v-else>
      <label for="add-friend-select">Add a friend</label>
      <div class="row">
        <select
          id="add-friend-select"
          v-model="selectedId"
          :disabled="disabled"
        >
          <option value="" disabled>Choose a user</option>
          <option
            v-for="candidate in candidates"
            :key="candidate.id"
            :value="candidate.id"
          >
            {{ candidate.name }} ({{ candidate.email }})
          </option>
        </select>
        <button type="submit" :disabled="disabled || !selectedId">
          Add friend
        </button>
      </div>
    </template>
  </form>
</template>

<script>
// Only picks the user; the parent view calls the API and shows the result.
export default {
  name: 'AddFriendForm',
  props: {
    candidates: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['add'],
  data() {
    return { selectedId: '' };
  },
  methods: {
    submit() {
      if (!this.selectedId) {
        return;
      }
      this.$emit('add', this.selectedId);
      this.selectedId = '';
    }
  }
};
</script>

<style scoped>
.add-friend {
  display: grid;
  gap: 0.25rem;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

select {
  font: inherit;
  flex: 1 1 14rem;
  min-width: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
}

.empty {
  margin: 0;
  color: var(--color-muted);
}
</style>
