// Targeted Drill Generator for Weak Keys (ระบบสร้างแบบฝึกหัดเฉพาะจุดเพื่อแก้ปัญหาปุ่มที่พิมพ์ผิดบ่อย)
import { StorageManager } from './storage.js?v=4.0';
import { getTopWeakKeys, getTopConfusions, getTopBigrams } from './analytics.js?v=4.0';

// Tactile Home Anchor Mapping: Maps each key to its home row finger resting key
const HOME_ANCHOR_MAP = {
  // Top Row
  q: 'a', w: 's', e: 'd', r: 'f', t: 'f',
  y: 'j', u: 'j', i: 'k', o: 'l', p: ';',
  // Bottom Row
  z: 'a', x: 's', c: 'd', v: 'f', b: 'f',
  n: 'j', m: 'j', ',': 'k', '.': 'l', '/': ';',
  // Home Row
  a: 'a', s: 's', d: 'd', f: 'f', g: 'f',
  h: 'j', j: 'j', k: 'k', l: 'l', ';': ';'
};

// Level-appropriate word banks
const HOME_ROW_WORDS = [
  'dad', 'sad', 'lad', 'ask', 'fall', 'all', 'salad', 'flask', 'flag', 'glad',
  'half', 'dash', 'flash', 'glass', 'gas', 'had', 'has', 'add', 'alas', 'kafka',
  'salsa', 'fad', 'fads', 'lads', 'dads', 'asks', 'falls', 'lass', 'sass'
];

const TOP_ROW_WORDS = [
  'red', 'rue', 'ire', 'user', 'fire', 'free', 'ride', 'risk', 'true', 'sure',
  'tree', 'tire', 'write', 'try', 'port', 'reply', 'root', 'type', 'fruit', 'return',
  'quite', 'guide', 'unit', 'rate', 'tear', 'tier', 'rule', 'pure', 'cure', 'edit',
  'power', 'quiet', 'loop', 'peer', 'trip', 'wire', 'tour', 'wear', 'rest', 'test'
];

const BOTTOM_ROW_WORDS = [
  'come', 'move', 'calm', 'cave', 'view', 'text', 'next', 'zone', 'size', 'buzz',
  'claim', 'beam', 'mind', 'main', 'back', 'pack', 'verb', 'vote', 'navy', 'mask'
];

const GENERAL_WORDS = [
  'about', 'after', 'again', 'almost', 'always', 'another', 'before', 'between',
  'change', 'course', 'different', 'during', 'early', 'every', 'example', 'follow',
  'great', 'group', 'important', 'large', 'later', 'learn', 'letter', 'little',
  'never', 'number', 'often', 'people', 'public', 'question', 'right', 'school',
  'second', 'sentence', 'should', 'start', 'still', 'system', 'thought', 'through',
  'together', 'under', 'until', 'water', 'while', 'without', 'world', 'write'
];

export class DrillGenerator {
  /**
   * Phase 2: Weak-Spot Drill rewrite using Analytics Engine
   * Builds drill from top 3-5 weak keys, confusion pairs, and weak bigrams
   */
  static generateAnalyticsDrill(analytics, unlockedKeys = null, options = {}) {
    const topKeys = getTopWeakKeys(analytics, 5, unlockedKeys);

    // If fewer than 1 key with enough data (attempts < 15), fall back to existing drill
    if (!topKeys || topKeys.length === 0) {
      const fallbackDrill = this.generateWeakKeyDrill(['e', 'r', 't', 'i', 'u'], {
        titlePrefix: '🎯 ซ่อมจุดอ่อน (โหมดพื้นฐาน)'
      });
      fallbackDrill.description = 'ระบบยังไม่มีข้อมูลสถิติจุดอ่อนสะสมครบ 15 ครั้งต่อปุ่ม จึงจัดชุดฝึกปุ่มแถวบนพื้นฐานให้ฝึกซ้อมพลางก่อน เมื่อฝึกเพิ่มขึ้นระบบจะเปิดโหมดวิเคราะห์อัจฉริยะอัตโนมัติ!';
      fallbackDrill.isFallback = true;
      return fallbackDrill;
    }

    const targetKeyChars = topKeys.map(k => k.key.toLowerCase());
    const targetSet = new Set(targetKeyChars);

    // Snapshot before drill starts
    const snapshot = {};
    topKeys.forEach(k => {
      snapshot[k.key] = {
        errorRate: k.errorRate,
        score: k.score,
        avgLatencyMs: k.avgLatencyMs
      };
    });

    // Find confusion pairs and bigrams involving these target keys
    const allConfusions = getTopConfusions(analytics, 10);
    const relevantConfusions = allConfusions.filter(c =>
      targetSet.has(c.expectedChar.toLowerCase()) || targetSet.has(c.typedChar.toLowerCase())
    );

    const allBigrams = getTopBigrams(analytics, 10);
    const relevantBigrams = allBigrams.filter(b =>
      targetKeyChars.some(k => b.bigram.toLowerCase().includes(k))
    );

    // Word Bank
    const allWords = Array.from(new Set([
      ...HOME_ROW_WORDS,
      ...TOP_ROW_WORDS,
      ...BOTTOM_ROW_WORDS,
      ...GENERAL_WORDS
    ]));

    // Score each word by how many target keys and bigrams it contains
    const scoredWords = allWords.map(word => {
      const w = word.toLowerCase();
      let matchCount = 0;
      targetKeyChars.forEach(k => {
        if (w.includes(k)) matchCount += 2;
      });
      relevantBigrams.forEach(b => {
        if (w.includes(b.bigram.toLowerCase())) matchCount += 3;
      });
      return { word, matchCount };
    }).filter(item => item.matchCount > 0);

    scoredWords.sort((a, b) => b.matchCount - a.matchCount);

    // Build ~60 seconds of text: ~28 words
    const targetWordCount = 28;
    const selectedWords = [];

    // 1. Confusion contrast pairs
    const confusionWords = [];
    relevantConfusions.forEach(c => {
      const pairMatches = scoredWords.filter(item =>
        item.word.includes(c.expectedChar) && item.word.includes(c.typedChar)
      );
      pairMatches.slice(0, 2).forEach(m => confusionWords.push(m.word));
    });
    selectedWords.push(...confusionWords);

    // 2. High-scoring matched words
    for (const item of scoredWords) {
      if (!selectedWords.includes(item.word)) {
        selectedWords.push(item.word);
      }
      if (selectedWords.length >= targetWordCount) break;
    }

    // Fallback: If not enough matching real words, create focused targeted patterns
    if (selectedWords.length < 15) {
      targetKeyChars.forEach(k => {
        selectedWords.push(`${k}${k}`, `${k}a${k}`, `s${k}${k}`, `f${k}j`);
      });
    }

    // Shuffle and repeat to reach ~28 words
    const finalWords = [];
    let poolIndex = 0;
    while (finalWords.length < targetWordCount && selectedWords.length > 0) {
      const word = selectedWords[poolIndex % selectedWords.length];
      finalWords.push(word);
      poolIndex++;
    }

    // Slightly shuffle neighboring words to avoid robotic repetition
    for (let i = finalWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (Math.abs(i - j) <= 3) {
        [finalWords[i], finalWords[j]] = [finalWords[j], finalWords[i]];
      }
    }

    const text = finalWords.join(' ');
    const displayKeys = targetKeyChars.map(k => `[ ${k} ]`).join(' ');
    const titlePrefix = options.titlePrefix || '🎯 แบบฝึกซ่อมจุดอ่อนอัจฉริยะ';

    return {
      id: `analytics-drill-${Date.now()}`,
      title: `${titlePrefix}: ${displayKeys}`,
      description: `ระบบตรวจพบว่าคุณสะดุดที่ปุ่ม [ ${targetKeyChars.join(', ')} ] จึงรวบรวมคำศัพท์เฉพาะทางพร้อมคู่สับสนมาสร้างเป็นแบบฝึกฟื้นฟูความแม่นยำ`,
      targetWpm: 22,
      minAccuracy: 92,
      targetKeys: targetKeyChars,
      snapshot,
      text
    };
  }

  /**
   * Analyzes weakKeys (map or array of keys) and creates an optimal anchor-reach drill
   */
  static generateWeakKeyDrill(inputKeys, options = {}) {
    let topKeys = [];
    let weakKeysList = [];

    if (Array.isArray(inputKeys) && inputKeys.length > 0) {
      topKeys = inputKeys.map(k => k.toLowerCase().trim()).filter(k => k.length === 1);
      weakKeysList = topKeys.map(k => [k, 1]);
    } else if (inputKeys && typeof inputKeys === 'object' && Object.keys(inputKeys).length > 0) {
      const sorted = Object.entries(inputKeys)
        .filter(([char, count]) => count > 0 && char.trim().length > 0)
        .sort((a, b) => b[1] - a[1]);
      topKeys = sorted.slice(0, 5).map(item => item[0].toLowerCase());
      weakKeysList = sorted.slice(0, 5);
    }

    if (topKeys.length === 0) {
      return {
        id: 'drill-default',
        title: '🎯 แบบฝึกเสริมความคล่องตัวรอบด้าน',
        description: 'วิธีฝึก: พิมพ์ตามจังหวะช้าๆ วางนิ้วที่แป้นหลัก asdf jkl; โดยมองที่หน้าจอเท่านั้น',
        targetWpm: 20,
        minAccuracy: 92,
        weakKeys: [],
        text: 'asdf jkl; sad dad lad ask fall all salad flag glad dash flash'
      };
    }

    // 1. Stage 1: Real words & targeted muscle memory reach (replaces repetitive "e e ee ee" with real words)
    let pool = [...HOME_ROW_WORDS, ...TOP_ROW_WORDS];
    if (topKeys.some(k => ['z', 'x', 'c', 'v', 'b', 'n', 'm'].includes(k))) {
      pool.push(...BOTTOM_ROW_WORDS);
    }

    const matchedWords = [];
    topKeys.forEach(key => {
      const found = pool.filter(w => w.includes(key));
      matchedWords.push(...found.slice(0, 4));
    });
    const uniqueWords = Array.from(new Set(matchedWords)).slice(0, 12);

    const stage1Patterns = [];
    topKeys.forEach(k => {
      const anchor = HOME_ANCHOR_MAP[k] || 'f';
      if (k !== anchor) {
        stage1Patterns.push(`${anchor}${k} ${k}${anchor} ${anchor}${k}${anchor}`);
      }
    });
    // If real words exist, prioritize real words over repetitive single-letter drills
    const part1 = uniqueWords.length >= 4 ? uniqueWords.slice(0, 6).join(' ') : stage1Patterns.join(' ');

    // 2. Stage 2: Mutual combinations of target keys (ฝึกการสลับนิ้วระหว่างปุ่มที่พลาด)
    const stage2Pairs = [];
    for (let i = 0; i < topKeys.length; i++) {
      for (let j = i + 1; j < topKeys.length; j++) {
        const k1 = topKeys[i];
        const k2 = topKeys[j];
        stage2Pairs.push(`${k1}${k2} ${k2}${k1}`);
      }
    }
    const part2 = stage2Pairs.length > 0 ? stage2Pairs.join(' ') : `${topKeys.join('')} ${topKeys.slice().reverse().join('')}`;

    // 3. Stage 3: Rich Real Words targeting these specific keys
    const part3 = uniqueWords.length > 6 ? uniqueWords.slice(6).join(' ') : uniqueWords.join(' ');

    // Combined clean text (NO confusing '|' pipe or symbols!)
    const fullText = `${part1}   ${part2}   ${part3}`;
    const keysDisplay = topKeys.map(k => `[ ${k} ]`).join(' ');

    const titlePrefix = options.titlePrefix || '🎯 ซ่อมจุดอ่อนปุ่ม';

    return {
      id: `drill-${Date.now()}`,
      title: `${titlePrefix}: ${keysDisplay}`,
      description: `วิธีฝึก: พิมพ์ช้าๆ ตามจังหวะ ใช้นิ้วขยับจากแป้นพักไปยังปุ่ม ${topKeys.join(', ')} โดยมองภาพมือบนจอ`,
      targetWpm: 18,
      minAccuracy: 92,
      weakKeys: weakKeysList,
      text: fullText
    };
  }

  /**
   * Generates a random timed test text from words and phrases
   */
  static generateRandomText(duration = 30, mode = 'words') {
    if (mode === 'code') {
      const snippets = [
        'function debounce(fn, ms) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; }',
        'const fetchRecords = async (query) => { try { const res = await db.find(query); return res.data; } catch (err) { console.error(err); } };',
        'class EventEmitter { constructor() { this.events = {}; } on(event, listener) { (this.events[event] = this.events[event] || []).push(listener); } }',
        'const flatten = (arr) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);'
      ];
      return snippets[Math.floor(Math.random() * snippets.length)];
    }

    const count = Math.max(30, Math.floor(duration * 1.5));
    const words = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * GENERAL_WORDS.length);
      words.push(GENERAL_WORDS[idx]);
    }
    return words.join(' ');
  }

  static generateAdaptiveLessonText(options) {
    return generateAdaptiveLessonText(options);
  }
}

/**
 * Checks if a word is allowed given a set/list of unlocked keys.
 * A word is allowed only if every character in it is in unlockedKeys.
 */
export function isWordAllowed(word, unlockedKeys) {
  if (!word || typeof word !== 'string' || word.length === 0) return false;
  const set = unlockedKeys instanceof Set ? unlockedKeys : new Set(Array.from(unlockedKeys).map(k => k.toLowerCase()));
  for (const ch of word.toLowerCase()) {
    if (!set.has(ch)) return false;
  }
  return true;
}

/**
 * Helper to generate rhythmic touch typing pseudo-words from a specific set of keys
 * In Level 1, varies patterns (e.g. "fj jf ff jj fjf jfj") instead of repeating one pattern
 */
function makePseudoWord(keys, length) {
  if (!keys || keys.length === 0) return 'fjf';

  // Varied rhythmic patterns for 2-key pairs (e.g. Level 1 pairs: f & j, d & k, s & l, etc.)
  if (keys.length === 2) {
    const [k1, k2] = keys;
    const variedTemplates = [
      `${k1}${k2}`,
      `${k2}${k1}`,
      `${k1}${k1}`,
      `${k2}${k2}`,
      `${k1}${k2}${k1}`,
      `${k2}${k1}${k2}`,
      `${k1}${k1}${k1}`,
      `${k2}${k2}${k2}`,
      `${k1}${k2}${k2}`,
      `${k2}${k1}${k1}`,
      `${k1}${k1}${k2}${k2}`,
      `${k2}${k2}${k1}${k1}`
    ];
    return variedTemplates[Math.floor(Math.random() * variedTemplates.length)];
  }

  const len = Math.max(2, Math.min(6, length));
  if (keys.length === 1) {
    return keys[0].repeat(len);
  }
  let res = '';
  let lastChar = '';
  for (let i = 0; i < len; i++) {
    // Alternate or pick neighboring key
    const available = keys.filter(k => k !== lastChar);
    const chosen = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : keys[Math.floor(Math.random() * keys.length)];
    res += chosen;
    lastChar = chosen;
  }
  return res;
}

/**
 * Enforces Phase 5 text repetition rules:
 * 1. Never place the same word more than 2 times in a row.
 * 2. No word may make up more than ~20% of the lesson text.
 */
function enforceRepetitionAndShareRules(words, allowedWords, targetSet, weakSet, reviewSet, unlockedSet) {
  if (!words || words.length === 0) return words;

  const N = words.length;
  // Maximum allowed count per word: strictly <= 20% of total words in lesson
  const maxAllowedCount = Math.max(1, Math.floor(N * 0.20));

  // Build a diverse pool of fallback tokens using ONLY unlocked keys
  const fallbackSet = new Set(allowedWords.filter(w => isWordAllowed(w, unlockedSet)));

  // If unlockedSet contains ';', add semi-colon drill tokens
  if (unlockedSet.has(';')) {
    ['a;', ';a', 'a;a', ';a;', 'ask;', 'dad;', 'all;', 'fall;', 'sad;'].forEach(t => {
      if (isWordAllowed(t, unlockedSet)) fallbackSet.add(t);
    });
  }

  // Generate varied rhythmic pseudo-words from targetSet
  const tKeys = targetSet.size > 0 ? Array.from(targetSet) : Array.from(unlockedSet);
  for (let i = 0; i < tKeys.length; i++) {
    for (let j = 0; j < tKeys.length; j++) {
      fallbackSet.add(`${tKeys[i]}${tKeys[j]}`);
      fallbackSet.add(`${tKeys[i]}${tKeys[j]}${tKeys[i]}`);
      fallbackSet.add(`${tKeys[j]}${tKeys[i]}${tKeys[j]}`);
    }
  }

  const fallbackList = Array.from(fallbackSet).filter(w => isWordAllowed(w, unlockedSet));
  const result = [...words];

  const getCounts = (arr) => {
    const c = {};
    arr.forEach(w => {
      const lw = w.toLowerCase();
      c[lw] = (c[lw] || 0) + 1;
    });
    return c;
  };

  let counts = getCounts(result);

  // Helper to find a replacement matching bucket preference
  const findReplacement = (currWord, idx) => {
    let hasTarget = false;
    for (const c of currWord.toLowerCase()) {
      if (targetSet.has(c)) { hasTarget = true; break; }
    }

    const isValid = (w) => {
      const lw = w.toLowerCase();
      if ((counts[lw] || 0) >= maxAllowedCount) return false;
      if (idx >= 1 && result[idx - 1].toLowerCase() === lw) return false;
      if (idx + 1 < result.length && result[idx + 1].toLowerCase() === lw) return false;
      if (idx >= 2 && result[idx - 2].toLowerCase() === lw) return false;
      return true;
    };

    if (hasTarget) {
      // Prioritize replacement that also contains target keys to maintain target ratio
      const targetMatches = fallbackList.filter(w => {
        for (const c of w.toLowerCase()) if (targetSet.has(c)) return true;
        return false;
      });
      const found = targetMatches.find(isValid);
      if (found) return found;
    }

    return fallbackList.find(isValid);
  };

  // Pass 1: Resolve excessive word share (> 20%)
  for (let i = 0; i < result.length; i++) {
    const lw = result[i].toLowerCase();
    if (counts[lw] > maxAllowedCount) {
      const repl = findReplacement(result[i], i);
      if (repl) {
        counts[lw]--;
        counts[repl.toLowerCase()] = (counts[repl.toLowerCase()] || 0) + 1;
        result[i] = repl;
      }
    }
  }

  // Pass 2: Resolve consecutive repeats (> 2 times in a row)
  for (let i = 2; i < result.length; i++) {
    if (result[i].toLowerCase() === result[i - 1].toLowerCase() &&
        result[i].toLowerCase() === result[i - 2].toLowerCase()) {
      const repl = findReplacement(result[i], i);
      if (repl) {
        counts[result[i].toLowerCase()]--;
        counts[repl.toLowerCase()] = (counts[repl.toLowerCase()] || 0) + 1;
        result[i] = repl;
      }
    }
  }

  // Pass 3: Final sweep to ensure 100% compliance
  counts = getCounts(result);
  for (let i = 0; i < result.length; i++) {
    const lw = result[i].toLowerCase();
    const isConsecutive = (i >= 2 && result[i - 1].toLowerCase() === lw && result[i - 2].toLowerCase() === lw);
    const isOverShare = counts[lw] > maxAllowedCount;

    if (isConsecutive || isOverShare) {
      const repl = findReplacement(result[i], i);
      if (repl) {
        counts[lw]--;
        counts[repl.toLowerCase()] = (counts[repl.toLowerCase()] || 0) + 1;
        result[i] = repl;
      }
    }
  }

  return result;
}

/**
 * Phase 3.1: Adaptive lesson text generator (Pure function)
 *
 * Ratios:
 *   When weakKeys present: ~60% target keys, ~30% weak keys, ~10% review keys
 *   Fallback (no weakKeys): ~90% target keys, ~10% review keys
 *
 * Guaranteed:
 *   - ONLY keys in unlockedKeys are ever used (never uses locked keys)
 *   - Real English words used when possible; pseudo-words from unlocked letters otherwise
 *   - Capped at minLength - maxLength (e.g. 80-120 for L1-2, 120-200 for later levels)
 */
export function generateAdaptiveLessonText(options = {}) {
  const {
    targetKeys = [],
    weakKeys = [],
    reviewKeys = [],
    unlockedKeys = [],
    targetLength = 100,
    minLength = null,
    maxLength = null,
    wordBank = null
  } = options;

  const minLen = typeof minLength === 'number' ? minLength : (targetLength > 120 ? 120 : 80);
  const maxLen = typeof maxLength === 'number' ? maxLength : (targetLength > 120 ? 200 : 120);

  const unlockedSet = new Set(unlockedKeys.map(k => k.toLowerCase()));
  const targetSet = new Set(targetKeys.map(k => k.toLowerCase()).filter(k => unlockedSet.has(k)));

  // Weak keys must ONLY be keys already unlocked and not currently in targetSet
  const weakSet = new Set(
    (weakKeys || [])
      .map(k => (typeof k === 'object' && k.key ? k.key : k).toLowerCase())
      .filter(k => unlockedSet.has(k) && !targetSet.has(k))
  );

  // Review keys are earlier unlocked keys not in targetSet and not in weakSet
  let reviewSet = new Set(
    (reviewKeys || [])
      .map(k => k.toLowerCase())
      .filter(k => unlockedSet.has(k) && !targetSet.has(k) && !weakSet.has(k))
  );

  // If reviewSet empty, fallback to any unlocked key outside target & weak
  if (reviewSet.size === 0) {
    unlockedSet.forEach(k => {
      if (!targetSet.has(k) && !weakSet.has(k)) reviewSet.add(k);
    });
  }
  // If still empty (e.g. lesson 1-1 where unlockedSet == targetSet), use targetSet
  if (reviewSet.size === 0) {
    reviewSet = new Set(targetSet);
  }

  const hasWeak = weakSet.size > 0;
  let tGoal, wGoal, rGoal;

  if (hasWeak) {
    tGoal = Math.round(targetLength * 0.60);
    wGoal = Math.round(targetLength * 0.30);
    rGoal = Math.max(0, targetLength - tGoal - wGoal);
  } else {
    tGoal = Math.round(targetLength * 0.90);
    wGoal = 0;
    rGoal = Math.max(0, targetLength - tGoal);
  }

  // Combined word pool
  const pool = Array.isArray(wordBank) && wordBank.length > 0
    ? wordBank
    : Array.from(new Set([...HOME_ROW_WORDS, ...TOP_ROW_WORDS, ...BOTTOM_ROW_WORDS, ...GENERAL_WORDS]));

  // Strictly filter words that only use unlockedKeys
  const allowedWords = pool.filter(w => isWordAllowed(w, unlockedSet));

  // If semicolon key is unlocked, include semicolon tokens
  if (unlockedSet.has(';')) {
    ['a;', ';a', 'a;a', ';a;', 'ask;', 'dad;', 'all;', 'fall;', 'sad;'].forEach(t => {
      if (isWordAllowed(t, unlockedSet) && !allowedWords.includes(t)) {
        allowedWords.push(t);
      }
    });
  }

  const words = [];
  const wordCounts = {};
  const estimatedWords = Math.max(16, Math.round(targetLength / 5));
  const maxAllowedPerWord = Math.max(2, Math.floor(estimatedWords * 0.20));

  let currT = 0;
  let currW = 0;
  let currR = 0;
  let currentTotalChars = 0;

  let maxIterations = 200; // Safeguard against infinite loop
  while ((currT < tGoal || (hasWeak && currW < wGoal) || currR < rGoal) && maxIterations-- > 0) {
    const gapT = tGoal - currT;
    const gapW = hasWeak ? wGoal - currW : 0;
    const gapR = rGoal - currR;

    let targetBucket = 'target';
    if (gapW >= gapT && gapW >= gapR && gapW > 0) {
      targetBucket = 'weak';
    } else if (gapT >= gapR && gapT > 0) {
      targetBucket = 'target';
    } else if (gapR > 0 && reviewSet.size > 0) {
      targetBucket = 'review';
    } else if (gapT > 0) {
      targetBucket = 'target';
    } else if (gapW > 0) {
      targetBucket = 'weak';
    } else {
      targetBucket = 'review';
    }

    let chosenWord = null;

    // Helper to filter candidates by repetition and share rules
    const filterValidCandidates = (list, isTargetBucket = false) => {
      let filtered = list.filter(w => {
        const lw = w.toLowerCase();
        // Rule 1: Never place the same word more than 2 times in a row
        if (words.length >= 2 && words[words.length - 1].toLowerCase() === lw && words[words.length - 2].toLowerCase() === lw) {
          return false;
        }
        // Rule 2: No word may make up more than ~20% of the lesson text
        if ((wordCounts[lw] || 0) >= maxAllowedPerWord) {
          return false;
        }
        return true;
      });

      // If review quota is filled in target bucket, prefer words with no review letters if available
      if (isTargetBucket && gapR <= 0) {
        const pureTarget = filtered.filter(w => {
          for (const c of w.toLowerCase()) if (reviewSet.has(c)) return false;
          return true;
        });
        if (pureTarget.length >= 2) {
          filtered = pureTarget;
        }
      }

      return filtered;
    };

    const pickBestCandidate = (list) => {
      if (list.length === 0) return null;
      // Prefer candidate different from the immediately preceding word
      const nonConsecutive = list.filter(w => words.length === 0 || words[words.length - 1].toLowerCase() !== w.toLowerCase());
      const poolToPick = nonConsecutive.length > 0 ? nonConsecutive : list;
      return poolToPick[Math.floor(Math.random() * poolToPick.length)];
    };

    if (targetBucket === 'weak') {
      const highWeak = allowedWords.filter(w => {
        let cnt = 0;
        for (const c of w.toLowerCase()) if (weakSet.has(c)) cnt++;
        return cnt / w.length >= 0.5;
      });
      const poolCandidates = highWeak.length >= 3 ? highWeak : allowedWords.filter(w => {
        for (const c of w.toLowerCase()) if (weakSet.has(c)) return true;
        return false;
      });
      const validCandidates = filterValidCandidates(poolCandidates);
      if (validCandidates.length > 0) {
        chosenWord = pickBestCandidate(validCandidates);
      } else {
        const len = Math.min(4, Math.max(2, gapW));
        const wKeys = Array.from(weakSet);
        let attempts = 15;
        while (attempts-- > 0) {
          const pw = makePseudoWord(wKeys, len);
          const lpw = pw.toLowerCase();
          if (words.length >= 2 && words[words.length - 1].toLowerCase() === lpw && words[words.length - 2].toLowerCase() === lpw) continue;
          if ((wordCounts[lpw] || 0) >= maxAllowedPerWord) continue;
          chosenWord = pw;
          break;
        }
        if (!chosenWord) chosenWord = makePseudoWord(wKeys, len);
      }
    } else if (targetBucket === 'review') {
      const highReview = allowedWords.filter(w => {
        let cnt = 0;
        let tgt = 0;
        for (const c of w.toLowerCase()) {
          if (reviewSet.has(c)) cnt++;
          if (targetSet.has(c)) tgt++;
        }
        return cnt / w.length >= 0.5 && tgt === 0;
      });
      const poolCandidates = highReview.length >= 3 ? highReview : allowedWords.filter(w => {
        for (const c of w.toLowerCase()) if (reviewSet.has(c)) return true;
        return false;
      });
      const validCandidates = filterValidCandidates(poolCandidates);
      if (validCandidates.length > 0) {
        chosenWord = pickBestCandidate(validCandidates);
      } else {
        const rKeys = reviewSet.size > 0 ? Array.from(reviewSet) : Array.from(targetSet);
        const len = Math.min(4, Math.max(2, gapR));
        let attempts = 15;
        while (attempts-- > 0) {
          const pw = makePseudoWord(rKeys, len);
          const lpw = pw.toLowerCase();
          if (words.length >= 2 && words[words.length - 1].toLowerCase() === lpw && words[words.length - 2].toLowerCase() === lpw) continue;
          if ((wordCounts[lpw] || 0) >= maxAllowedPerWord) continue;
          chosenWord = pw;
          break;
        }
        if (!chosenWord) chosenWord = makePseudoWord(rKeys, len);
      }
    } else {
      // target bucket: words where target keys are dominant (>= 50%) if enough exist; otherwise any word with target key
      const highTarget = allowedWords.filter(w => {
        let cnt = 0;
        for (const c of w.toLowerCase()) if (targetSet.has(c)) cnt++;
        return cnt / w.length >= 0.5;
      });
      const poolCandidates = highTarget.length >= 3 ? highTarget : allowedWords.filter(w => {
        for (const c of w.toLowerCase()) if (targetSet.has(c)) return true;
        return false;
      });
      const validCandidates = filterValidCandidates(poolCandidates, true);
      const isTargetDeficit = (!hasWeak && gapR <= 0 && (currT / Math.max(1, currT + currR) < 0.88));
      const pureTargetCandidates = validCandidates.filter(w => {
        for (const c of w.toLowerCase()) if (reviewSet.has(c)) return false;
        return true;
      });

      if (isTargetDeficit && pureTargetCandidates.length > 0) {
        chosenWord = pickBestCandidate(pureTargetCandidates);
      } else if (!isTargetDeficit && validCandidates.length > 0) {
        chosenWord = pickBestCandidate(validCandidates);
      } else {
        const tKeys = targetSet.size > 0 ? Array.from(targetSet) : Array.from(unlockedSet);
        const len = Math.min(4, Math.max(2, gapT));
        let attempts = 15;
        while (attempts-- > 0) {
          const pw = makePseudoWord(tKeys, len);
          const lpw = pw.toLowerCase();
          if (words.length >= 2 && words[words.length - 1].toLowerCase() === lpw && words[words.length - 2].toLowerCase() === lpw) continue;
          if ((wordCounts[lpw] || 0) >= maxAllowedPerWord) continue;
          chosenWord = pw;
          break;
        }
        if (!chosenWord) chosenWord = makePseudoWord(tKeys, len);
      }
    }

    if (chosenWord) {
      // Check if adding this word would exceed maxLen
      const nextTotal = currentTotalChars === 0 ? chosenWord.length : currentTotalChars + 1 + chosenWord.length;
      if (nextTotal > maxLen && words.length > 0) {
        break; // Stop adding words to avoid overflow
      }

      words.push(chosenWord);
      const lcw = chosenWord.toLowerCase();
      wordCounts[lcw] = (wordCounts[lcw] || 0) + 1;

      currentTotalChars = nextTotal;
      for (const ch of chosenWord.toLowerCase()) {
        if (targetSet.has(ch)) {
          currT++;
        } else if (weakSet.has(ch)) {
          currW++;
        } else if (reviewSet.has(ch)) {
          currR++;
        }
      }
    }
  }

  // Final length clamping: ensure text strictly stays within [minLen, maxLen]
  const finalWords = [];
  let currentLen = 0;
  for (const w of words) {
    const nextLen = currentLen === 0 ? w.length : currentLen + 1 + w.length;
    if (nextLen <= maxLen) {
      finalWords.push(w);
      currentLen = nextLen;
    } else {
      break;
    }
  }

  // If under minLen, add small valid tokens without exceeding maxLen
  if (currentLen < minLen) {
    const poolKeys = targetSet.size > 0 ? Array.from(targetSet) : Array.from(unlockedSet);
    let attempts = 15;
    while (currentLen < minLen && attempts-- > 0) {
      const remaining = maxLen - currentLen - 1;
      if (remaining < 2) break;
      const token = makePseudoWord(poolKeys, Math.min(3, remaining));
      const nextLen = currentLen + 1 + token.length;
      if (nextLen <= maxLen) {
        finalWords.push(token);
        currentLen = nextLen;
      } else {
        break;
      }
    }
  }

  // Fallback check: if no words generated (e.g. edge case), produce basic pseudo drill from targetKeys
  if (finalWords.length === 0) {
    const keys = targetSet.size > 0 ? Array.from(targetSet) : ['f', 'j'];
    for (let i = 0; i < 20; i++) {
      finalWords.push(makePseudoWord(keys, 3));
    }
  }

  // Post-generation pass: strictly enforce repetition rules (never > 2 in a row, no word > 20% share)
  const guardedWords = enforceRepetitionAndShareRules(finalWords, allowedWords, targetSet, weakSet, reviewSet, unlockedSet);
  return guardedWords.join(' ');
}
