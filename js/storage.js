// Storage & State Persistence Manager using LocalStorage
import { createEmptyStats, updateStatsFromLog } from './analytics.js?v=5.0';

export const CURRENT_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  UNLOCKED: 'tm_unlocked_lessons',
  SCORES: 'tm_lesson_scores',
  HISTORY: 'tm_history',
  WEAK_KEYS: 'tm_weak_keys',
  SETTINGS: 'tm_settings',
  PLACEMENT: 'tm_placement_test',
  ANALYTICS: 'tm_analytics',
  SCHEMA_VERSION: 'tm_schema_version'
};

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  sound: 'mechanical',
  showKeyboard: true,
  showHands: true,
  volume: 0.2,
  stopOnError: true,
  noPeek: false,
  ghostCaret: false,
  dailyGoalMinutes: 15
};

export class StorageManager {
  /**
   * Safe JSON parser with corruption recovery:
   * Catches syntax/corrupted data, backs it up to a temp key,
   * sets a corruption notice, and falls back to a defensive default.
   */
  static safeGetJSON(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[StorageManager] Corrupted localStorage entry for "${key}". Backing up and resetting.`, e);
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const backupKey = `corrupted_backup_${key}_${Date.now()}`;
          localStorage.setItem(backupKey, raw);
        }
        localStorage.setItem('tm_corruption_notice', JSON.stringify({
          corruptedKey: key,
          timestamp: Date.now()
        }));
      } catch (backupErr) {}
      // Reset key with defensive default
      try {
        localStorage.setItem(key, JSON.stringify(defaultValue));
      } catch (setErr) {}
      return defaultValue;
    }
  }

  static getSettings() {
    const data = this.safeGetJSON(STORAGE_KEYS.SETTINGS, null);
    return data ? { ...DEFAULT_SETTINGS, ...data } : { ...DEFAULT_SETTINGS };
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  /**
   * Migrates Level 2 progress from the old 5-lesson structure to the new 11-lesson format.
   * Level 1 and Level 3+ data remain 100% intact.
   * Old completed Level 2 lessons map sensibly with best WPM and stars preserved.
   */
  static migrateLevel2Progress(options = {}) {
    try {
      const MIGRATION_KEY = 'tm_level2_restructured_v2';
      if (!options.force && localStorage.getItem(MIGRATION_KEY)) {
        return false;
      }

      const unlocked = this.safeGetJSON(STORAGE_KEYS.UNLOCKED, ['1-1']);
      const scores = this.safeGetJSON(STORAGE_KEYS.SCORES, {});

      const oldScores = { ...scores };
      // Preserve non-Level 2 scores (Level 1, Level 3+) untouched
      const newScores = {};
      for (const [id, s] of Object.entries(scores)) {
        if (!/^2-/.test(id)) {
          newScores[id] = s;
        }
      }
      let scoresChanged = false;

      // Mapping old Level 2 lessons to new ones:
      // Old 2-1 -> New 2-1, 2-2
      if (oldScores['2-1']) {
        newScores['2-1'] = { ...oldScores['2-1'] };
        newScores['2-2'] = { ...oldScores['2-1'] };
        scoresChanged = true;
      }
      // Old 2-2 -> New 2-3, 2-4, 2-5
      if (oldScores['2-2']) {
        newScores['2-3'] = { ...oldScores['2-2'] };
        newScores['2-4'] = { ...oldScores['2-2'] };
        newScores['2-5'] = { ...oldScores['2-2'] };
        scoresChanged = true;
      }
      // Old 2-3 -> New 2-6, 2-7
      if (oldScores['2-3']) {
        newScores['2-6'] = { ...oldScores['2-3'] };
        newScores['2-7'] = { ...oldScores['2-3'] };
        scoresChanged = true;
      }
      // Old 2-4 -> New 2-8, 2-9, 2-10
      if (oldScores['2-4']) {
        newScores['2-8'] = { ...oldScores['2-4'] };
        newScores['2-9'] = { ...oldScores['2-4'] };
        newScores['2-10'] = { ...oldScores['2-4'] };
        scoresChanged = true;
      }
      // Old 2-5 -> New 2-11
      if (oldScores['2-5']) {
        newScores['2-11'] = { ...oldScores['2-5'] };
        scoresChanged = true;
      }

      // Unlocked lessons migration: preserve non-Level 2 untouched
      const newUnlocked = new Set();
      unlocked.forEach(id => {
        if (!/^2-/.test(id)) {
          newUnlocked.add(id);
        }
      });
      let unlockedChanged = false;

      const hasLevel3Plus = unlocked.some(id => /^[3-6]-/.test(id));
      const hasCompletedOld25 = Boolean(oldScores['2-5']);

      if (hasLevel3Plus || hasCompletedOld25) {
        for (let i = 1; i <= 11; i++) {
          newUnlocked.add(`2-${i}`);
        }
        unlockedChanged = true;
      } else if (unlocked.includes('2-5') || Boolean(oldScores['2-4'])) {
        for (let i = 1; i <= 11; i++) {
          newUnlocked.add(`2-${i}`);
        }
        unlockedChanged = true;
      } else if (unlocked.includes('2-4') || Boolean(oldScores['2-3'])) {
        for (let i = 1; i <= 8; i++) {
          newUnlocked.add(`2-${i}`);
        }
        unlockedChanged = true;
      } else if (unlocked.includes('2-3') || Boolean(oldScores['2-2'])) {
        for (let i = 1; i <= 6; i++) {
          newUnlocked.add(`2-${i}`);
        }
        unlockedChanged = true;
      } else if (unlocked.includes('2-2') || Boolean(oldScores['2-1'])) {
        ['2-1', '2-2', '2-3'].forEach(id => newUnlocked.add(id));
        unlockedChanged = true;
      } else if (unlocked.includes('2-1')) {
        newUnlocked.add('2-1');
        unlockedChanged = true;
      }

      if (scoresChanged) {
        localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(newScores));
      }
      if (unlockedChanged) {
        localStorage.setItem(STORAGE_KEYS.UNLOCKED, JSON.stringify(Array.from(newUnlocked)));
      }

      localStorage.setItem(MIGRATION_KEY, 'true');
      return true;
    } catch (err) {
      console.error('[StorageManager] migrateLevel2Progress error:', err);
      return false;
    }
  }

  static getUnlockedLessons() {
    this.migrateLevel2Progress();
    const data = this.safeGetJSON(STORAGE_KEYS.UNLOCKED, ['1-1']);
    if (!Array.isArray(data) || data.length === 0) return ['1-1'];
    if (!data.includes('1-1')) data.unshift('1-1');
    return data;
  }

  static unlockLesson(lessonId) {
    const unlocked = this.getUnlockedLessons();
    if (!unlocked.includes(lessonId)) {
      unlocked.push(lessonId);
      try {
        localStorage.setItem(STORAGE_KEYS.UNLOCKED, JSON.stringify(unlocked));
      } catch (e) {
        console.error('Failed to save unlocked lessons', e);
      }
    }
  }

  static getLessonScores() {
    this.migrateLevel2Progress();
    const data = this.safeGetJSON(STORAGE_KEYS.SCORES, {});
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
  }

  static saveLessonScore(lessonId, score) {
    const scores = this.getLessonScores();
    const existing = scores[lessonId] || { bestWpm: 0, bestAccuracy: 0, stars: 1, attempts: 0 };

    scores[lessonId] = {
      bestWpm: Math.max(score.wpm || 0, existing.bestWpm || 0),
      bestAccuracy: Math.max(score.accuracy || 0, existing.bestAccuracy || 0),
      stars: Math.max(score.stars || 1, existing.stars || 1),
      lastCompleted: Date.now(),
      attempts: (existing.attempts || 0) + 1
    };

    try {
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
    } catch (e) {
      console.error('Failed to save scores', e);
    }
  }

  static getHistory() {
    const data = this.safeGetJSON(STORAGE_KEYS.HISTORY, []);
    return Array.isArray(data) ? data : [];
  }

  static addHistoryRecord(record) {
    const history = this.getHistory();
    history.push({
      id: Date.now(),
      timestamp: Date.now(),
      ...record
    });
    // Keep last 150 records to prevent memory bloat
    if (history.length > 150) {
      history.splice(0, history.length - 150);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }

  static getWeakKeys() {
    const data = this.safeGetJSON(STORAGE_KEYS.WEAK_KEYS, {});
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
  }

  static getLastSessionMistakes() {
    const data = this.safeGetJSON('tm_last_session_mistakes', {});
    return (data && typeof data === 'object') ? data : {};
  }

  static getRecentWeakKeys() {
    const recent = this.safeGetJSON('tm_recent_mistakes', []);
    if (!Array.isArray(recent) || recent.length === 0) return {};

    const combined = {};
    recent.forEach((session, idx) => {
      const weight = Math.max(1, 5 - idx);
      for (const [char, count] of Object.entries(session.mistakes || {})) {
        const key = char.toLowerCase();
        combined[key] = (combined[key] || 0) + (count * weight);
      }
    });
    return combined;
  }

  static recordMistake(char) {
    if (!char) return;
    const weakKeys = this.getWeakKeys();
    const key = char.toLowerCase();
    weakKeys[key] = (weakKeys[key] || 0) + 1;
    try {
      localStorage.setItem(STORAGE_KEYS.WEAK_KEYS, JSON.stringify(weakKeys));
    } catch (e) {
      console.error('Failed to save weak keys', e);
    }
  }

  static recordMistakes(mistakeMap) {
    if (!mistakeMap || Object.keys(mistakeMap).length === 0) return;

    // 1. Save as latest session mistakes
    try {
      localStorage.setItem('tm_last_session_mistakes', JSON.stringify(mistakeMap));
    } catch (e) {}

    // 2. Add to rolling window of recent sessions (last 5 sessions)
    let recent = this.safeGetJSON('tm_recent_mistakes', []);
    if (!Array.isArray(recent)) recent = [];

    recent.unshift({ timestamp: Date.now(), mistakes: mistakeMap });
    if (recent.length > 5) recent = recent.slice(0, 5);

    try {
      localStorage.setItem('tm_recent_mistakes', JSON.stringify(recent));
    } catch (e) {}

    // 3. Accumulate in all-time weak keys
    const weakKeys = this.getWeakKeys();
    for (const [char, count] of Object.entries(mistakeMap)) {
      const key = char.toLowerCase();
      weakKeys[key] = (weakKeys[key] || 0) + count;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.WEAK_KEYS, JSON.stringify(weakKeys));
    } catch (e) {
      console.error('Failed to save weak keys', e);
    }
  }

  static clearWeakKey(char) {
    const weakKeys = this.getWeakKeys();
    delete weakKeys[char.toLowerCase()];
    try {
      localStorage.setItem(STORAGE_KEYS.WEAK_KEYS, JSON.stringify(weakKeys));
    } catch (e) {}
  }

  static resetWeakKeys() {
    try {
      localStorage.removeItem(STORAGE_KEYS.WEAK_KEYS);
      localStorage.removeItem('tm_recent_mistakes');
      localStorage.removeItem('tm_last_session_mistakes');
      localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
    } catch (e) {}
  }

  // --- Phase 2: Analytics & Weakness Engine Persistence ---
  static getAnalytics() {
    const parsed = this.safeGetJSON(STORAGE_KEYS.ANALYTICS, null);
    if (!parsed || typeof parsed !== 'object') return createEmptyStats();
    return {
      version: 2,
      keys: parsed.keys || {},
      confusions: parsed.confusions || {},
      bigrams: parsed.bigrams || {},
      updatedAt: parsed.updatedAt || Date.now()
    };
  }

  static saveAnalytics(stats) {
    try {
      if (!stats) return;
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify({
        version: 2,
        keys: stats.keys || {},
        confusions: stats.confusions || {},
        bigrams: stats.bigrams || {},
        updatedAt: Date.now()
      }));
    } catch (e) {
      console.error('Failed to save analytics', e);
    }
  }

  static updateAnalyticsFromSession(log) {
    if (!Array.isArray(log) || log.length < 10) return null;
    const stats = this.getAnalytics();
    updateStatsFromLog(stats, log);
    this.saveAnalytics(stats);
    return stats;
  }

  static getPlacementResult() {
    return this.safeGetJSON(STORAGE_KEYS.PLACEMENT, null);
  }

  static savePlacementResult(result) {
    try {
      localStorage.setItem(STORAGE_KEYS.PLACEMENT, JSON.stringify(result));
    } catch (e) {}
  }

  // --- Phase 4: Corruption Notice ---
  static getCorruptionNotice() {
    return this.safeGetJSON('tm_corruption_notice', null);
  }

  static clearCorruptionNotice() {
    try {
      localStorage.removeItem('tm_corruption_notice');
      localStorage.removeItem('tm_level2_restructured_v2');
    } catch (e) {}
  }

  // --- Phase 4.1: Export & Import Progress ---
  static exportProgress() {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appName: 'Typeeveryday',
      exportedAt: new Date().toISOString(),
      data: {
        history: this.getHistory(),
        scores: this.getLessonScores(),
        unlockedLevels: this.getUnlockedLessons(),
        settings: this.getSettings(),
        tm_analytics: this.getAnalytics(),
        placement: this.getPlacementResult()
      }
    };
  }

  static downloadExportFile() {
    const exportData = this.exportProgress();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `typeeveryday-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  static validateImportData(importJson) {
    if (!importJson || typeof importJson !== 'object') {
      return { valid: false, error: 'ไฟล์ไม่ใช่รูปแบบ JSON ที่ถูกต้อง' };
    }
    if (typeof importJson.schemaVersion !== 'number') {
      return { valid: false, error: 'ไม่พบหมายเลขเวอร์ชัน schemaVersion ในไฟล์' };
    }
    if (importJson.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return { valid: false, error: `เวอร์ชันของไฟล์ (${importJson.schemaVersion}) ใหม่กว่าที่ระบบนี้รองรับ (${CURRENT_SCHEMA_VERSION})` };
    }

    const payload = importJson.data || importJson;
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'ไม่พบโครงสร้างข้อมูล (data) ที่ถูกต้องในไฟล์' };
    }

    // Defensive parsing of arrays and objects
    const history = Array.isArray(payload.history) ? payload.history : [];
    const scores = (payload.scores && typeof payload.scores === 'object' && !Array.isArray(payload.scores)) ? payload.scores : {};
    const unlockedLevels = Array.isArray(payload.unlockedLevels)
      ? payload.unlockedLevels
      : (Array.isArray(payload.unlockedLessons) ? payload.unlockedLessons : ['1-1']);

    return {
      valid: true,
      summary: {
        sessionsCount: history.length,
        unlockedCount: unlockedLevels.length,
        scoresCount: Object.keys(scores).length
      },
      payload: {
        history,
        scores,
        unlockedLevels: unlockedLevels.length > 0 ? unlockedLevels : ['1-1'],
        settings: (payload.settings && typeof payload.settings === 'object') ? payload.settings : {},
        tm_analytics: payload.tm_analytics || null,
        placement: payload.placement || null
      }
    };
  }

  static importProgress(importJson) {
    const result = this.validateImportData(importJson);
    if (!result.valid) {
      throw new Error(result.error);
    }
    const p = result.payload;
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(p.history));
      localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(p.scores));
      localStorage.setItem(STORAGE_KEYS.UNLOCKED, JSON.stringify(p.unlockedLevels));
      if (p.settings && Object.keys(p.settings).length > 0) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...p.settings }));
      }
      if (p.tm_analytics) {
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(p.tm_analytics));
      }
      if (p.placement) {
        localStorage.setItem(STORAGE_KEYS.PLACEMENT, JSON.stringify(p.placement));
      }
      return true;
    } catch (e) {
      console.error('Failed to restore imported data', e);
      throw e;
    }
  }

  // --- Phase 4.3: Daily Practice Minutes & Streak Calculator ---
  static computeDailyStats(history = null, dailyGoalMinutes = 15) {
    const hist = history || this.getHistory();
    if (!Array.isArray(hist) || hist.length === 0) {
      return {
        todayMinutes: 0,
        goalMinutes: dailyGoalMinutes,
        goalProgressPct: 0,
        currentStreak: 0
      };
    }

    const dateMinutes = {};
    hist.forEach(item => {
      const d = new Date(item.timestamp || Date.now());
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const durSec = item.duration || 60;
      dateMinutes[dateKey] = (dateMinutes[dateKey] || 0) + (durSec / 60);
    });

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayMinutes = Math.round(dateMinutes[todayKey] || 0);
    const goalProgressPct = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

    // Calculate streak
    let streak = 0;
    const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const formatDateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (dateMinutes[formatDateKey(checkDate)]) {
      while (dateMinutes[formatDateKey(checkDate)]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      // Check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      while (dateMinutes[formatDateKey(checkDate)]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    return {
      todayMinutes,
      goalMinutes: dailyGoalMinutes,
      goalProgressPct,
      currentStreak: streak
    };
  }

  static resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
      localStorage.removeItem(STORAGE_KEYS.SCORES);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      localStorage.removeItem(STORAGE_KEYS.WEAK_KEYS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.PLACEMENT);
      localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
      localStorage.removeItem('tm_recent_mistakes');
      localStorage.removeItem('tm_last_session_mistakes');
      localStorage.removeItem('tm_corruption_notice');
      localStorage.removeItem('tm_level2_restructured_v2');
    } catch (e) {}
  }
}
