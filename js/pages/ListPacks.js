export default {
  template: `
    <main class="packs-page">
      <div class="packs-tabs">
        <button
          v-for="pack in packs"
          :key="pack.name"
          class="packs-tab"
          :class="{ active: selectedPack && selectedPack.name === pack.name }"
          :style="{ backgroundColor: pack.colour || '#777' }"
          @click="selectPack(pack)"
        >
          {{ pack.name }}
        </button>
      </div>

      <div v-if="loading" class="packs-message">Loading packs...</div>

      <div v-else-if="error" class="packs-message">
        Could not load packs: {{ error }}
      </div>

      <section v-else-if="selectedPack" class="packs-layout">
        <aside class="packs-sidebar">
          <button
            v-for="(level, index) in selectedPack.levels"
            :key="level"
            class="packs-level-button"
            :class="{ active: selectedLevel === level }"
            @click="selectLevel(level)"
          >
            <span>#{{ index + 1 }}</span>
            <strong>{{ levelName(level) }}</strong>
          </button>
        </aside>

        <section class="packs-main">
          <h1>{{ levelName(selectedLevel) }}</h1>

          <div v-if="selectedLevelData" class="packs-info">
            <p v-if="selectedLevelData.creators">
              <strong>Creators</strong> {{ formatValue(selectedLevelData.creators) }}
            </p>

            <p v-if="selectedLevelData.verifier">
              <strong>Verifier</strong> {{ formatValue(selectedLevelData.verifier) }}
            </p>

            <p v-if="selectedLevelData.publisher">
              <strong>Publisher</strong> {{ formatValue(selectedLevelData.publisher) }}
            </p>

            <p v-if="selectedLevelData.id">
              <strong>ID</strong> {{ selectedLevelData.id }}
            </p>

            <p v-if="selectedLevelData.password">
              <strong>Password</strong> {{ selectedLevelData.password }}
            </p>
          </div>

          <div v-if="videoEmbedUrl" class="packs-video">
            <iframe
              :src="videoEmbedUrl"
              title="Video preview"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>

          <p v-else class="packs-message-small">
            No video preview found for this level.
          </p>
        </section>

        <aside class="packs-about">
          <h2>About the packs</h2>
          <p>
            These are list packs. Beat every level in a pack to complete it.
          </p>

          <h2>How can I get these packs?</h2>
          <p>
            Complete all levels listed under the pack.
          </p>
        </aside>
      </section>
    </main>
  `,

  data: () => ({
    packs: [],
    selectedPack: null,
    selectedLevel: '',
    selectedLevelData: null,
    loading: true,
    error: '',
  }),

  computed: {
    videoEmbedUrl() {
      if (!this.selectedLevelData) return '';

      const video =
        this.selectedLevelData.video ||
        this.selectedLevelData.verification ||
        this.selectedLevelData.showcase ||
        this.selectedLevelData.youtube ||
        this.selectedLevelData.youtubeVideo ||
        this.selectedLevelData.videoUrl ||
        this.selectedLevelData.video_url;

      return this.toYouTubeEmbed(video);
    },
  },

  async mounted() {
    try {
      const result = await fetch('./data/packlist.json');

      if (!result.ok) {
        throw new Error(`File not found: ${result.status}`);
      }

      this.packs = await result.json();

      if (this.packs.length > 0) {
        this.selectPack(this.packs[0]);
      }
    } catch (error) {
      this.error = error.message;
    }

    this.loading = false;
  },

  methods: {
    selectPack(pack) {
      this.selectedPack = pack;
      this.selectedLevel = pack.levels[0] || '';
      this.loadLevelData(this.selectedLevel);
    },

    selectLevel(level) {
      this.selectedLevel = level;
      this.loadLevelData(level);
    },

    levelName(level) {
      return String(level)
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
    },

    formatValue(value) {
      if (Array.isArray(value)) {
        return value.join(', ');
      }

      return value;
    },

    toYouTubeEmbed(video) {
      if (!video) return '';

      const value = Array.isArray(video) ? video[0] : String(video);

      if (value.includes('youtube.com/embed/')) {
        return value;
      }

      if (value.includes('youtu.be/')) {
        const id = value.split('youtu.be/')[1].split('?')[0].split('&')[0];
        return `https://www.youtube.com/embed/${id}`;
      }

      if (value.includes('youtube.com/watch?v=')) {
        const id = value.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${id}`;
      }

      if (value.length === 11 && !value.includes('/')) {
        return `https://www.youtube.com/embed/${value}`;
      }

      return '';
    },

    async loadLevelData(level) {
      this.selectedLevelData = null;

      try {
        const result = await fetch(`./data/${level}.json`);

        if (!result.ok) {
          return;
        }

        this.selectedLevelData = await result.json();
      } catch {
        this.selectedLevelData = null;
      }
    },
  },
};
