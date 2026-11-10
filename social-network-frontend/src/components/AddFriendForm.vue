<template>
  <form class="add-friend" @submit.prevent="submit">
    <UserPicker
      v-model="selected"
      label="Add a friend"
      placeholder="Search people to add"
      :exclude-ids="excludeIds"
      :disabled="disabled"
    />
    <button type="submit" :disabled="disabled || !selected">Add friend</button>
  </form>
</template>

<script>
import UserPicker from './UserPicker.vue';

// Only picks the user; the parent view calls the API and shows the result.
export default {
  name: 'AddFriendForm',
  components: { UserPicker },
  props: {
    // The profile owner and their current friends.
    excludeIds: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['add'],
  data() {
    return { selected: null };
  },
  methods: {
    submit() {
      if (!this.selected) {
        return;
      }
      this.$emit('add', this.selected);
      this.selected = null;
    }
  }
};
</script>

<style scoped>
.add-friend {
  display: grid;
  gap: 0.6rem;
}

button {
  justify-self: start;
}
</style>
