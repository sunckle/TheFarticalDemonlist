export default {
  template: `
    <main class="page-list-packs">
      <section class="pack-container">
        <h1 class="pack-title">Packs</h1>

        <p v-if="loading" class="pack-message">Loading packs...</p>

        <p v-else-if="error" class="pack-message">
          Could not load packs: {{ error }}
        </p>

        <div v-else class="pack-grid">
          <div
            v-for="pack in packs"
            :key="pack.name"
            class="pack-card"
          >
            <h2 class="pack-name" :style="{ color: pack.colour || 'inherit' }">
              {{ pack.name }}
            </h2>

            <p class="pack-levels">
              <strong>Levels:</strong>
              {{ pack.levels.join(', ') }}
            </p>
          </div>
        </div>
      </section>
    </main>
  `,

  data: () => ({
    packs: [],
    loading: true,
    error: '',
  }),

  async mounted() {
    try {
      const result = await fetch('./data/packlist.json');

      if (!result.ok) {
        throw new Error(`File not found: ${result.status}`);
      }

      this.packs = await result.json();
    } catch (error) {
      this.error = error.message;
    }

    this.loading = false;
  },
};
