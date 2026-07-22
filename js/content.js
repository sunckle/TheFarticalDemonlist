import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = './data';

function clean(value) {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function sameUser(a, b) {
  return clean(a).toLowerCase() === clean(b).toLowerCase();
}

function emptyScores() {
  return {
    verified: [],
    completed: [],
    progressed: [],
  };
}

export async function fetchList() {
  const listResult = await fetch(`${dir}/_list.json`);

  try {
    const list = await listResult.json();
    console.log("LIST:", list);

    return await Promise.all(
      list.map(async (path, rank) => {
        console.log("LOADING:", path);

        const levelResult = await fetch(`${dir}/${path}.json`);

        try {
          const level = await levelResult.json();
          console.log("LOADED:", path, level);

          const records = Array.isArray(level.records) ? level.records : [];

          return [
            {
              ...level,
              path,
              records: records.sort((a, b) => Number(b.percent || 0) - Number(a.percent || 0)),
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
  const scoreMap = {};
  const errs = [];

  if (!Array.isArray(list)) {
    return [[], ['Failed to load list.']];
  }

  list.forEach(([level, err], rank) => {
    if (err) {
      errs.push(err);
      return;
    }

    if (!level) {
      errs.push(`Missing level at rank ${rank + 1}`);
      return;
    }

    const verifierName = clean(level.verifier);

    if (verifierName) {
      const verifier =
        Object.keys(scoreMap).find((user) => {
          return sameUser(user, verifierName);
        }) || verifierName;

      scoreMap[verifier] ??= emptyScores();

      const { verified } = scoreMap[verifier];

      verified.push({
        rank: rank + 1,
        level: level.name,
        score: score(rank + 1, 100, level.percentToQualify),
        link: level.verification,
      });
    }

    const records = Array.isArray(level.records) ? level.records : [];

    records.forEach((record) => {
      const recordUser = clean(record && record.user);

      if (!recordUser) return;

      const percent = Number(record.percent);

      if (!Number.isFinite(percent)) return;

      const user =
        Object.keys(scoreMap).find((existingUser) => {
          return sameUser(existingUser, recordUser);
        }) || recordUser;

      scoreMap[user] ??= emptyScores();

      const { completed, progressed } = scoreMap[user];

      if (percent === 100) {
        completed.push({
          rank: rank + 1,
          level: level.name,
          score: score(rank + 1, 100, level.percentToQualify),
          link: record.link,
        });

        return;
      }

      progressed.push({
        rank: rank + 1,
        level: level.name,
        percent,
        score: score(rank + 1, percent, level.percentToQualify),
        link: record.link,
      });
    });
  });

  const res = Object.entries(scoreMap).map(([user, scores]) => {
    const { verified, completed, progressed } = scores;

    const total = [verified, completed, progressed]
      .flat()
      .reduce((prev, cur) => prev + Number(cur.score || 0), 0);

    return {
      user,
      total: round(total),
      ...scores,
    };
  });

  return [res.sort((a, b) => b.total - a.total), errs];
}
