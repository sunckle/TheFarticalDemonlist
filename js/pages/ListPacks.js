import { fetchPacks, fetchPackLevels } from "../content.js";
import { getFontColour, embed } from "../util.js";
import { score } from "../score.js";
import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

export default {
  components: {
    Spinner,
    LevelAuthors,
  },

  template: `
    <main v-if="loading">
      <Spinner></Spinner>
    </main>

    <main v-else class="pack-list">
      <div class="packs-nav">
        <div>
          <button
            v-for="(pack, i) in packs"
            :key="pack.name"
            @click="switchLevels(i)"
            :style="{ background: pack.colour }"
            class="type-label-lg"
          >
            <p :style="{ color: getFontColour(pack.colour) }">
              {{ pack.name }}
            </p>
          </button>
        </div>
      </div>

      <div class="list-container">
        <table class="list" v-if="selectedPackLevels && selectedPackLevels.length">
          <tr v-for="(level, i) in selectedPackLevels" :key="level[1] || level[0]?.path || i">
            <td class="rank">
              <p class="type-label-lg">#{{ i + 1 }}</p>
            </td>

            <td class="level" :class="{ active: selectedLevel === i, error: !level[0] }">
              <button
                :style="[selectedLevel === i ? { background: pack.colour, color: getFontColour(pack.colour) } : {}]"
                @click="selectedLevel = i"
              >
                <span class="type-label-lg">
                  {{ level[0] ? level[0].level.name : 'Error (' + level[1] + '.json)' }}
                </span>
              </button>
            </td>
          </tr>
        </table>
      </div>

      <div class="level-container">
        <div class="level" v-if="currentLevel">
          <h1>{{ currentLevel.level.name }}</h1>

          <LevelAuthors
            :author="currentLevel.level.author"
            :creators="currentLevel.level.creators"
            :verifier="currentLevel.level.verifier"
          ></LevelAuthors>

          <p v-if="currentLevel.level.description" class="level-description">
            {{ currentLevel.level.description }}
          </p>

          <iframe
            v-if="video"
            class="video"
            :src="video"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>

          <p v-else>No video preview found for this level.</p>

          <ul class="stats">
            <li>
              <div class="type-title-sm">ID</div>
              <p>{{ currentLevel.level.id }}</p>
            </li>

            <li>
              <div class="type-title-sm">Password</div>
              <p>{{ currentLevel.level.password || 'Free to Copy' }}</p>
            </li>
          </ul>

          <h2>Records</h2>

          <p v-if="currentLevel.level.percentToQualify">
            <strong>{{ currentLevel.level.percentToQualify }}%</strong> or better to qualify
          </p>

          <p v-else>100% or better to qualify</p>

          <table class="records">
            <tr v-for="record in currentLevel.records" :key="record.user" class="record">
              <td class="percent">
                <p>{{ record.percent }}%</p>
              </td>

              <td class="user">
                <a
                  :href="record.link || record.video || '#'"
                  target="_blank"
                  class="type-label-lg"
                >
                  {{ record.user }}
                </a>
              </td>

              <td class="mobile">
                <img
                  v-if="record.mobile"
                  src="./assets/phone-landscape.svg"
                  alt="Mobile"
                >
              </td>

              <td class="hz">
                <p>{{ record.hz }}Hz</p>
              </td>
            </tr>
          </table>
        </div>

        <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
          <p>(ノಠ益ಠ)ノ彡┻━┻</p>
        </div>
      </div>

      <div class="meta-container">
        <div class="meta">
          <div class="errors" v-show="errors.length > 0">
            <p class="error" v-for="error of errors" :key="error">
              {{ error }}
            </p>
          </div>

          <h3>About the packs</h3>

          <p>
            These are list packs all chosen by the staff team that you can beat levels for and get the packs attached to your profile.
          </p>

          <h3>How can I get these packs?</h3>

          <p>
            You get packs by beating all levels that are under them.
          </p>

          <p>
            Thanks to KrisGra for helping to make the packs functionality.
          </p>
        </div>
      </div>
    </main>
  `,

  data: () => ({
    packs: [],
    errors: [],
    selected: 0,
    selectedLevel: 0,
    selectedPackLevels: [],
    loading: true,
    loadingPack: true,
  }),

  computed: {
    pack() {
      return this.packs[this.selected] || {};
    },

    currentLevel() {
      if (!this.selectedPackLevels || !this.selectedPackLevels[this.selectedLevel]) {
        return null;
      }

      return this.selectedPackLevels[this.selectedLevel][0];
    },

    video() {
      if (!this.currentLevel) {
        return "";
      }

      return embed(
        this.currentLevel.level.verification ||
        this.currentLevel.level.video ||
        this.currentLevel.level.youtube ||
        this.currentLevel.level.videoUrl ||
        this.currentLevel.level.video_url
      );
    },
  },

  async mounted() {
    this.packs = await fetchPacks();

    if (!this.packs || !this.packs.length) {
      this.errors = [
        "Failed to load packs. Make sure data/_packlist.json exists.",
      ];

      this.loading = false;
      this.loadingPack = false;
      return;
    }

    await this.loadSelectedPack();

    this.loading = false;
    this.loadingPack = false;
  },

  methods: {
    async loadSelectedPack() {
      this.selectedPackLevels = await fetchPackLevels(
        this.packs[this.selected].name
      );

      this.errors.length = 0;

      if (!this.selectedPackLevels) {
        this.errors = [
          "Failed to load pack levels.",
        ];

        return;
      }

      this.errors.push(
        ...this.selectedPackLevels
          .filter(([_, err]) => err)
          .map(([_, err]) => {
            return `Failed to load level. (${err}.json)`;
          })
      );
    },

    async switchLevels(i) {
      this.loadingPack = true;
      this.selected = i;
      this.selectedLevel = 0;

      await this.loadSelectedPack();

      this.loadingPack = false;
    },

    score,
    embed,
    getFontColour,
  },
};
