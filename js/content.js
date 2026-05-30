import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json`, `_packlist.json`, and all levels
 */
const dir = './data';

export async function fetchList() {
  const listResult = await fetch(`${dir}/_list.json`);
  const packResult = await fetch(`${dir}/_packlist.json`);

  try {
    const list = await listResult.json();
    const packsList = await packResult.json();

    return await Promise.all(
      list.map(async (path, rank) => {
        const levelResult = await fetch(`${dir}/${path}.json`);

        try {
          const level = await levelResult.json();

          let packs = packsList.filter((pack) => {
            return pack.levels.includes(path);
          });

          return [
            {
              ...level,
              packs,
              path,
              records: (level.records || []).sort((a, b) => {
                return b.percent - a.percent;
              }),
            },
            null,
          ];
        } catch {
          console.error(`Failed to load level #${rank + 1} ${path}.`);
          return [null, path];
        }
      })
    );
  } catch {
    console.error('Failed to load list.');
    return null;
  }
}

export async function fetchEditors() {
  try {
    const editorsResults = await fetch(`${dir}/_editors.json`);
    const editors = await editorsResults.json();
    return editors;
  } catch {
    return null;
  }
}

export async function fetchLeaderboard() {
  const list = await fetchList();
  const packResult = await (await fetch(`${dir}/_packlist.json`)).json();

  const scoreMap = {};
  const errs = [];

  list.forEach(([level, err], rank) => {
    if (err) {
      errs.push(err);
      return;
    }

    const verifier =
      Object.keys(scoreMap).find((user) => {
        return user.toLowerCase() === level.verifier.toLowerCase();
      }) || level.verifier;

    scoreMap[verifier] ??= {
      verified: [],
      completed: [],
      progressed: [],
      packs: [],
    };

    const { verified } = scoreMap[verifier];

    verified.push({
      rank: rank + 1,
      level: level.name,
      score: score(rank + 1, 100, level.percentToQualify),
      link: level.verification,
      path: level.path,
    });

    level.records.forEach((record) => {
      const user =
        Object.keys(scoreMap).find((existingUser) => {
          return existingUser.toLowerCase() === record.user.toLowerCase();
        }) || record.user;

      scoreMap[user] ??= {
        verified: [],
        completed: [],
        progressed: [],
        packs: [],
        path: level.path,
      };

      const { completed, progressed } = scoreMap[user];

      if (record.percent === 100) {
        completed.push({
          rank: rank + 1,
          level: level.name,
          score: score(rank + 1, 100, level.percentToQualify),
          link: record.link,
          path: level.path,
        });

        return;
      }

      progressed.push({
        rank: rank + 1,
        level: level.name,
        percent: record.percent,
        score: score(rank + 1, record.percent, level.percentToQualify),
        link: record.link,
        path: level.path,
      });
    });
  });

  for (let user of Object.entries(scoreMap)) {
    let levels = [...user[1].verified, ...user[1].completed].map((level) => {
      return level.path;
    });

    for (let pack of packResult) {
      if (pack.levels.every((level) => levels.includes(level))) {
        user[1].packs.push(pack);
      }
    }
  }

  const res = Object.entries(scoreMap).map(([user, scores]) => {
    const { verified, completed, progressed } = scores;

    const total = [verified, completed, progressed]
      .flat()
      .reduce((prev, cur) => {
        return prev + cur.score;
      }, 0);

    return {
      user,
      total: round(total),
      ...scores,
    };
  });

  return [res.sort((a, b) => b.total - a.total), errs];
}

export async function fetchPacks() {
  try {
    const packResult = await fetch(`${dir}/_packlist.json`);
    const packsList = await packResult.json();
    return packsList;
  } catch {
    return null;
  }
}

export async function fetchPackLevels(packname) {
  const packResult = await fetch(`${dir}/_packlist.json`);
  const packsList = await packResult.json();
  const selectedPack = packsList.find((pack) => pack.name === packname);

  try {
    return await Promise.all(
      selectedPack.levels.map(async (path, rank) => {
        const levelResult = await fetch(`${dir}/${path}.json`);

        try {
          const level = await levelResult.json();

          return [
            {
              level,
              path,
              records: (level.records || []).sort((a, b) => {
                return b.percent - a.percent;
              }),
            },
            null,
          ];
        } catch {
          console.error(`Failed to load level #${rank + 1} ${path} (${packname}).`);
          return [null, path];
        }
      })
    );
  } catch (error) {
    console.error('Failed to load packs.', error);
    return null;
  }
}
