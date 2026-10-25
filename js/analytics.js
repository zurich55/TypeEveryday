// Pure Analytics & Weakness Engine (No DOM access, fully testable)
// Computes attempts, errors, EMA latency, confusion pairs, bigrams and weaknessScores

export const ALPHA = 0.2; // Exponential moving average factor for latency
export const MIN_ATTEMPTS_TO_SCORE = 15;
export const MAX_VALID_LATENCY_MS = 2000;

export function createEmptyStats() {
  return {
    version: 2,
    keys: {},       // char -> { attempts, errors, errorRate, avgLatencyMs, latencySamples }
    confusions: {}, // expectedChar -> { [typedChar]: count }
    bigrams: {},    // "ab" -> { attempts, errors, errorRate, avgLatencyMs, latencySamples }
    updatedAt: Date.now()
  };
}

/**
 * Updates stats object in-place from a completed/aborted session's keystroke log.
 *
 * Rules:
 * - One target position = one "attempt" for that expected key.
 * - Attempt is CORRECT only if the FIRST keystroke at that position was correct;
 *   otherwise it counts as ONE error for that key. Extra wrong presses add nothing to errors.
 * - Latency counts only when previous position was typed correctly and 0 < latencyMs <= 2000.
 * - Confusion pairs recorded from every wrong keystroke's first miss at a position.
 * - Bigrams track consecutive non-space character pairs.
 */
export function updateStatsFromLog(stats, log) {
  if (!stats) stats = createEmptyStats();
  if (!Array.isArray(log) || log.length === 0) return stats;

  // Group keystrokes by positionIndex
  const byPosition = new Map();
  for (const entry of log) {
    if (entry.positionIndex === undefined || entry.positionIndex === null) continue;
    if (!byPosition.has(entry.positionIndex)) {
      byPosition.set(entry.positionIndex, []);
    }
    byPosition.get(entry.positionIndex).push(entry);
  }

  const sortedPositions = Array.from(byPosition.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedPositions.length; i++) {
    const pos = sortedPositions[i];
    const keystrokes = byPosition.get(pos);
    if (!keystrokes || keystrokes.length === 0) continue;

    const firstKey = keystrokes[0];
    const expectedChar = firstKey.expectedChar;
    if (expectedChar === undefined || expectedChar === null) continue;

    // Initialize key stats if needed
    if (!stats.keys[expectedChar]) {
      stats.keys[expectedChar] = {
        attempts: 0,
        errors: 0,
        errorRate: 0,
        avgLatencyMs: 0,
        latencySamples: 0
      };
    }
    const keyStats = stats.keys[expectedChar];
    keyStats.attempts += 1;

    const isAttemptCorrect = firstKey.correct === true;

    if (!isAttemptCorrect) {
      // Exactly ONE error per position
      keyStats.errors += 1;

      // First miss confusion pair
      const firstMiss = keystrokes.find(k => !k.correct);
      if (firstMiss && firstMiss.typedChar) {
        const typed = firstMiss.typedChar;
        // Ignore Thai layout keys and multi-char function strings
        const isThai = /[\u0E00-\u0E7F]/.test(typed);
        if (!isThai && (typed.length === 1 || typed === '\n')) {
          if (!stats.confusions[expectedChar]) {
            stats.confusions[expectedChar] = {};
          }
          stats.confusions[expectedChar][typed] = (stats.confusions[expectedChar][typed] || 0) + 1;
        }
      }
    }
    keyStats.errorRate = keyStats.attempts > 0 ? (keyStats.errors / keyStats.attempts) : 0;

    // Check if previous position was typed correctly
    let prevPositionCorrect = false;
    let prevExpectedChar = null;

    if (pos > 0 && byPosition.has(pos - 1)) {
      const prevKeys = byPosition.get(pos - 1);
      if (prevKeys && prevKeys.length > 0) {
        prevPositionCorrect = prevKeys[0].correct === true;
        prevExpectedChar = prevKeys[0].expectedChar;
      }
    }

    // Per-key Latency EMA: only when previous position was correct & latency in valid range
    const lat = firstKey.latencyMs;
    const isValidLatency = (typeof lat === 'number' && lat > 0 && lat <= MAX_VALID_LATENCY_MS);

    if (prevPositionCorrect && isAttemptCorrect && isValidLatency) {
      if (keyStats.latencySamples === 0) {
        keyStats.avgLatencyMs = lat;
      } else {
        keyStats.avgLatencyMs = (1 - ALPHA) * keyStats.avgLatencyMs + ALPHA * lat;
      }
      keyStats.latencySamples += 1;
    }

    // Bigrams: consecutive characters (skip spaces and newlines)
    if (prevExpectedChar && prevExpectedChar !== ' ' && expectedChar !== ' ' &&
        prevExpectedChar !== '\n' && expectedChar !== '\n') {
      const bgKey = prevExpectedChar + expectedChar;
      if (!stats.bigrams[bgKey]) {
        stats.bigrams[bgKey] = {
          attempts: 0,
          errors: 0,
          errorRate: 0,
          avgLatencyMs: 0,
          latencySamples: 0
        };
      }
      const bgStats = stats.bigrams[bgKey];
      bgStats.attempts += 1;
      if (!isAttemptCorrect) {
        bgStats.errors += 1;
      }
      bgStats.errorRate = bgStats.attempts > 0 ? (bgStats.errors / bgStats.attempts) : 0;

      if (prevPositionCorrect && isAttemptCorrect && isValidLatency) {
        if (bgStats.latencySamples === 0) {
          bgStats.avgLatencyMs = lat;
        } else {
          bgStats.avgLatencyMs = (1 - ALPHA) * bgStats.avgLatencyMs + ALPHA * lat;
        }
        bgStats.latencySamples += 1;
      }
    }
  }

  stats.updatedAt = Date.now();
  return stats;
}

/**
 * Computes weaknessScore per key (0..1) = 0.6 * normErrorRate + 0.4 * normSlowness
 * A key is only scored when attempts >= MIN_ATTEMPTS_TO_SCORE (15); otherwise score = null
 */
export function computeWeaknessScores(stats) {
  if (!stats || !stats.keys) {
    return { scores: {}, userMedianLatencyMs: 300 };
  }

  // Find median latency across qualifying keys
  const qualifyingLatencies = Object.values(stats.keys)
    .filter(k => k.attempts >= MIN_ATTEMPTS_TO_SCORE && k.avgLatencyMs > 0)
    .map(k => k.avgLatencyMs)
    .sort((a, b) => a - b);

  let userMedianLatencyMs = 300;
  if (qualifyingLatencies.length > 0) {
    const mid = Math.floor(qualifyingLatencies.length / 2);
    if (qualifyingLatencies.length % 2 === 0) {
      userMedianLatencyMs = (qualifyingLatencies[mid - 1] + qualifyingLatencies[mid]) / 2;
    } else {
      userMedianLatencyMs = qualifyingLatencies[mid];
    }
  }

  const scores = {};
  for (const [key, s] of Object.entries(stats.keys)) {
    // 3.4 Per-key "mastered" badge: >=95% accuracy and latency under user's median over >= 30 samples
    const isMastered = Boolean(
      s.attempts >= 30 &&
      s.errorRate <= 0.05 &&
      s.avgLatencyMs > 0 &&
      s.avgLatencyMs < userMedianLatencyMs
    );

    if (s.attempts < MIN_ATTEMPTS_TO_SCORE) {
      scores[key] = {
        score: null,
        status: 'not enough data',
        attempts: s.attempts,
        errors: s.errors,
        errorRate: s.errorRate,
        avgLatencyMs: Math.round(s.avgLatencyMs),
        normErrorRate: 0,
        normSlowness: 0,
        isMastered: false
      };
      continue;
    }

    // normErrorRate = min(1, errorRate / 0.25)
    const normErrorRate = Math.min(1, s.errorRate / 0.25);

    // normSlowness = clamp((avgLatencyMs / userMedianLatencyMs - 1) / 1.0, 0, 1)
    let normSlowness = 0;
    if (s.avgLatencyMs > 0 && userMedianLatencyMs > 0) {
      const slownessRatio = (s.avgLatencyMs / userMedianLatencyMs - 1) / 1.0;
      normSlowness = Math.max(0, Math.min(1, slownessRatio));
    }

    const score = Number((0.6 * normErrorRate + 0.4 * normSlowness).toFixed(3));
    scores[key] = {
      score,
      status: 'scored',
      attempts: s.attempts,
      errors: s.errors,
      errorRate: s.errorRate,
      avgLatencyMs: Math.round(s.avgLatencyMs),
      normErrorRate,
      normSlowness,
      isMastered
    };
  }

  return { scores, userMedianLatencyMs: Math.round(userMedianLatencyMs) };
}

/**
 * Returns top N weak keys sorted by weaknessScore descending
 */
export function getTopWeakKeys(stats, n = 5, allowedKeys = null) {
  const { scores } = computeWeaknessScores(stats);
  let entries = Object.entries(scores)
    .filter(([_, info]) => info.score !== null);

  if (allowedKeys) {
    const set = allowedKeys instanceof Set ? allowedKeys : new Set(allowedKeys);
    entries = entries.filter(([k]) => set.has(k) || set.has(k.toLowerCase()));
  }

  entries.sort((a, b) => b[1].score - a[1].score);
  return entries.slice(0, n).map(([key, info]) => ({
    key,
    ...info
  }));
}

/**
 * Returns top N confusion pairs sorted by count descending
 */
export function getTopConfusions(stats, n = 5) {
  if (!stats || !stats.confusions) return [];
  const list = [];
  for (const [exp, typedMap] of Object.entries(stats.confusions)) {
    for (const [typed, count] of Object.entries(typedMap)) {
      list.push({ expectedChar: exp, typedChar: typed, count });
    }
  }
  list.sort((a, b) => b.count - a.count);
  return list.slice(0, n);
}

/**
 * Returns top N weak bigrams sorted by errors descending (tie-breaker errorRate)
 */
export function getTopBigrams(stats, n = 5) {
  if (!stats || !stats.bigrams) return [];
  const list = Object.entries(stats.bigrams).map(([bigram, s]) => ({
    bigram,
    attempts: s.attempts,
    errors: s.errors,
    errorRate: s.errorRate,
    avgLatencyMs: Math.round(s.avgLatencyMs)
  }));
  list.sort((a, b) => (b.errors - a.errors) || (b.errorRate - a.errorRate));
  return list.slice(0, n);
}

/**
 * Merges two stats objects safely
 */
export function mergeStats(a, b) {
  const res = createEmptyStats();
  const allKeys = new Set([
    ...Object.keys(a?.keys || {}),
    ...Object.keys(b?.keys || {})
  ]);

  for (const k of allKeys) {
    const ka = a?.keys?.[k] || { attempts: 0, errors: 0, avgLatencyMs: 0, latencySamples: 0 };
    const kb = b?.keys?.[k] || { attempts: 0, errors: 0, avgLatencyMs: 0, latencySamples: 0 };
    const attempts = ka.attempts + kb.attempts;
    const errors = ka.errors + kb.errors;
    const errorRate = attempts > 0 ? (errors / attempts) : 0;
    const samples = (ka.latencySamples || 0) + (kb.latencySamples || 0);
    let avgLatencyMs = 0;
    if (samples > 0) {
      avgLatencyMs = ((ka.avgLatencyMs * (ka.latencySamples || 0)) + (kb.avgLatencyMs * (kb.latencySamples || 0))) / samples;
    }
    res.keys[k] = {
      attempts,
      errors,
      errorRate,
      avgLatencyMs,
      latencySamples: samples
    };
  }

  // Merge Confusions
  for (const src of [a, b]) {
    for (const [exp, tMap] of Object.entries(src?.confusions || {})) {
      if (!res.confusions[exp]) res.confusions[exp] = {};
      for (const [typed, count] of Object.entries(tMap)) {
        res.confusions[exp][typed] = (res.confusions[exp][typed] || 0) + count;
      }
    }
  }

  // Merge Bigrams
  const allBigrams = new Set([
    ...Object.keys(a?.bigrams || {}),
    ...Object.keys(b?.bigrams || {})
  ]);

  for (const bg of allBigrams) {
    const bga = a?.bigrams?.[bg] || { attempts: 0, errors: 0, avgLatencyMs: 0, latencySamples: 0 };
    const bgb = b?.bigrams?.[bg] || { attempts: 0, errors: 0, avgLatencyMs: 0, latencySamples: 0 };
    const attempts = bga.attempts + bgb.attempts;
    const errors = bga.errors + bgb.errors;
    const errorRate = attempts > 0 ? (errors / attempts) : 0;
    const samples = (bga.latencySamples || 0) + (bgb.latencySamples || 0);
    let avgLatencyMs = 0;
    if (samples > 0) {
      avgLatencyMs = ((bga.avgLatencyMs * (bga.latencySamples || 0)) + (bgb.avgLatencyMs * (bgb.latencySamples || 0))) / samples;
    }
    res.bigrams[bg] = {
      attempts,
      errors,
      errorRate,
      avgLatencyMs,
      latencySamples: samples
    };
  }

  res.updatedAt = Date.now();
  return res;
}
