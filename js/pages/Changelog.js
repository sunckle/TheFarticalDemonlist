export default {
    template: `
        <main class="page-changelog">
            <div class="changelog-container">

                <h1>Changelog</h1>
                <p class="subtitle">
                    Updates and improvements to The Fartical Demonlist.
                </p>

                <div
                    class="update"
                    v-for="update in updates"
                    :key="update.version"
                >
                    <div class="header">
                        <h2>Version {{ update.version }}</h2>
                        <span>{{ update.date }}</span>
                    </div>

                    <ul>
                        <li
                            v-for="change in update.changes"
                            :key="change"
                        >
                            • {{ change }}
                        </li>
                    </ul>
                </div>

            </div>
        </main>
    `,

    data() {
        return {
            updates: []
        };
    },

    async mounted() {
        try {
            const response = await fetch("/content/changelog.json");
            this.updates = await response.json();
        } catch (e) {
            console.error(e);

            this.updates = [
                {
                    version: "Error",
                    date: "",
                    changes: [
                        "Failed to load changelog."
                    ]
                }
            ];
        }
    }
};
