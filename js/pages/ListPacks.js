export default {
  template: `
    <main class="pack-list">
      <div class="list-container">
        <h1>Packs</h1>

        <p v-if="loading">Loading packs...</p>

        <p v-else-if="error" style="color: red;">
          Could not load packs. Make sure data/_packlist.json exists.
        </p>

        <div v-else>
          <div
            v-for="pack in packs"
            :key="pack.name"
            style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid currentColor;"
          >
            <h2 :style="{ color: pack.colour || 'inherit' }">
              {{ pack.name }}
            </h2>

            <p>
              Levels:
              <span v-for="(level, index) in pack.levels" :key="level">
                {{ level }}<span v-if="index < pack.levels.length - 1">, </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  `,

  data: () => ({
    packs: [],
    loading: true,
    error: false,
  }),

  async mounted() {
    try {
      const result = await fetch('/data/_packlist.json');
      this.packs = await result.json();
    } catch {
      this.error = true;
    }

    this.loading = false;
  },
};
