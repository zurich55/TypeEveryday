// Main Application Controller & Typing Engine

import { KEYBOARD_LAYOUT, FINGERS, getKeyInfoForChar, renderKeyboard, renderHeatmap } from './keyboard.js?v=5.0';
import { LESSON_LEVELS, PLACEMENT_TEST_TEXT, LEVEL_PASS_THRESHOLDS, LESSON_TARGET_KEYS, getLessonUnlockedKeys, LESSON_LENGTH_CAPS } from './lessons.js?v=5.0';
import { StorageManager } from './storage.js?v=5.0';
import { sound } from './audio.js?v=5.0';
import { ProgressChart, renderPerLevelProgress, renderDailyGoalCard } from './chart.js?v=5.0';
import { DrillGenerator, generateAdaptiveLessonText } from './drill-generator.js?v=5.0';
import { CODE_LANGUAGES } from './code-snippets.js?v=5.0';
import { sessionLogger } from './session-log.js?v=5.0';
import { computeWeaknessScores, getTopWeakKeys, getTopConfusions, getTopBigrams } from './analytics.js?v=5.0';

class TypeMasterApp {
  constructor() {
    this.settings = StorageManager.getSettings();
    if (typeof this.settings.stopOnError !== 'boolean') {
      this.settings.stopOnError = true;
    }

    this.currentMode = 'course'; // 'course' | 'timed' | 'weak' | 'free' | 'placement'
    this.currentLesson = null;
    this.targetText = '';
    this.cursorIndex = 0;
    this.isStarted = false;
    this.isCompleted = false;
    this.startTime = null;
    this.endTime = null;
    this.timerInterval = null;

    // Stop on error & input layout guards
    this.hasErroredAtCurrentPos = false;
    this.thaiWarningTimeout = null;
    this.logger = sessionLogger;
    this.analyticsSaved = false;

    // Coding mode language selection
    this.selectedLanguage = 'sql';
    this.snippetIndex = 0;

    // Weak keys mode settings (default to 'alltime' analytics)
    this.weakSource = 'alltime'; // 'alltime' | 'recent' | 'toprow' | 'custom'
    this.customWeakKeys = new Set(['e', 'r', 't', 'i', 'u']);

    // Metrics
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.mistakeMap = {}; // Char -> count for this session

    // Timed mode specific
    this.timedDuration = 30;
    this.timeRemaining = 30;

    // DOM references
    this.dom = {};

    if (typeof window !== 'undefined') {
      if (window.app && typeof window.app.destroy === 'function') {
        window.app.destroy();
      }
      window.app = this;
    }

    this.init();
  }

  init() {
    this.cacheDom();
    if (!this.dom.typingBox || !this.dom.kbContainer) {
      // In headless unit test environments without full UI DOM
      return;
    }
    this.applySettings();
    this.renderKeyboardUI();
    this.renderLanguagePills();
    this.renderCustomKeyChips();
    this.initChart();
    this.bindEvents();

    // Check if placement test was ever taken
    const placement = StorageManager.getPlacementResult();
    if (!placement) {
      // First time visitor prompt
      setTimeout(() => this.showPlacementPrompt(), 600);
    }

    // Phase 4: Storage corruption check notice
    const corruption = StorageManager.getCorruptionNotice();
    if (corruption && this.dom.corruptionNoticeBanner) {
      this.dom.corruptionNoticeBanner.style.display = 'flex';
    }

    // Phase 4.3: Update main daily goal tracker
    this.updateDailyGoalUI();

    // Default load: First unlocked lesson or last played
    this.loadDefaultLesson();
  }

  cacheDom() {
    this.dom = {
      // Metric elements
      wpmVal: document.getElementById('metric-wpm'),
      accVal: document.getElementById('metric-acc'),
      errVal: document.getElementById('metric-errors'),
      timerVal: document.getElementById('metric-timer'),
      timerLabel: document.getElementById('timer-label'),

      // Typing area
      typingBox: document.getElementById('typing-box'),
      typingText: document.getElementById('typing-text'),
      hiddenInput: document.getElementById('hidden-input'),

      // Keyboard & Guidance
      kbContainer: document.getElementById('keyboard-container'),
      nextKeyPreview: document.getElementById('next-key-preview'),
      fingerName: document.getElementById('finger-name'),
      fingerDot: document.getElementById('finger-dot'),
      fingerTip: document.getElementById('finger-tip'),
      handsContainer: document.getElementById('hands-container'),

      // Lesson Header
      lessonTitle: document.getElementById('lesson-title'),
      lessonDesc: document.getElementById('lesson-desc'),
      targetWpmBadge: document.getElementById('target-wpm-badge'),
      targetAccBadge: document.getElementById('target-acc-badge'),

      // Modals
      courseModal: document.getElementById('course-modal'),
      courseLevelsContainer: document.getElementById('course-levels-container'),
      statsModal: document.getElementById('stats-modal'),
      resultModal: document.getElementById('result-modal'),
      placementModal: document.getElementById('placement-modal'),

      // Language Selector for Coding Mode
      codeLangSelector: document.getElementById('code-lang-selector'),
      langPillsList: document.getElementById('lang-pills-list'),
      nextSnippetBtn: document.getElementById('next-snippet-btn'),

      // Weak Keys Toolbar
      weakKeysBar: document.getElementById('weak-keys-bar'),
      weakTabToprow: document.getElementById('weak-tab-toprow'),
      weakTabRecent: document.getElementById('weak-tab-recent'),
      weakTabCustom: document.getElementById('weak-tab-custom'),
      weakTabAlltime: document.getElementById('weak-tab-alltime'),
      regenWeakDrillBtn: document.getElementById('regen-weak-drill-btn'),
      clearWeakKeysBtn: document.getElementById('clear-weak-keys-btn'),
      weakCustomPicker: document.getElementById('weak-custom-picker'),
      pickerKeysChips: document.getElementById('picker-keys-chips'),
      applyCustomKeysBtn: document.getElementById('apply-custom-keys-btn'),

      // Nav and Controls
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      soundToggleBtn: document.getElementById('sound-toggle-btn'),
      stopOnErrorBtn: document.getElementById('stop-on-error-btn'),
      stopOnErrorText: document.getElementById('stop-on-error-text'),
      noPeekBtn: document.getElementById('no-peek-btn'),
      noPeekText: document.getElementById('no-peek-text'),
      courseDrawerBtn: document.getElementById('course-drawer-btn'),
      statsBtn: document.getElementById('stats-btn'),
      weakKeysBtn: document.getElementById('weak-keys-btn'),
      placementBtn: document.getElementById('placement-btn'),
      restartBtn: document.getElementById('restart-btn'),
      restartSameBtn: document.getElementById('restart-same-btn'),

      // Thai Warning Banner
      thaiWarningBanner: document.getElementById('thai-warning-banner'),
      closeThaiWarningBtn: document.getElementById('close-thai-warning-btn'),

      // Chart
      chartCanvas: document.getElementById('chart-canvas'),
      chartTooltip: document.getElementById('chart-tooltip'),

      // Result modal details
      resultStatusIcon: document.getElementById('result-status-icon'),
      resultStatusTitle: document.getElementById('result-status-title'),
      resultStars: document.getElementById('result-stars'),
      resultWpm: document.getElementById('result-wpm'),
      resultAcc: document.getElementById('result-acc'),
      resultErrors: document.getElementById('result-errors'),
      resultWeakKeysBox: document.getElementById('result-weak-keys-box'),
      resultWeakKeyTags: document.getElementById('result-weak-key-tags'),
      resultNextBtn: document.getElementById('result-next-btn'),
      resultAdaptiveNextBtn: document.getElementById('result-adaptive-next-btn'),
      resultRetryBtn: document.getElementById('result-retry-btn'),
      resultDrillBtn: document.getElementById('result-drill-btn'),
      resultFailBox: document.getElementById('result-fail-box'),
      resultFailList: document.getElementById('result-fail-list'),
      resultFailPracticeBtn: document.getElementById('result-fail-practice-btn'),
      resultNoPeekBox: document.getElementById('result-no-peek-box'),
      resultEnableNoPeekBtn: document.getElementById('result-enable-no-peek-btn'),

      // Phase 2: Heatmap & Analytics Breakdown
      heatmapContainer: document.getElementById('heatmap-container'),
      heatmapKeyDetail: document.getElementById('heatmap-key-detail'),
      heatmapBreakdown: document.getElementById('heatmap-analytics-breakdown'),
      heatmapEmptyState: document.getElementById('heatmap-empty-state'),
      analyticsTopWeakKeys: document.getElementById('analytics-top-weak-keys'),
      analyticsTopConfusions: document.getElementById('analytics-top-confusions'),
      analyticsTopBigrams: document.getElementById('analytics-top-bigrams'),
      resultDrillComparison: document.getElementById('result-drill-comparison'),
      resultDrillComparisonList: document.getElementById('result-drill-comparison-list'),

      // Phase 4: Timed mode, Custom Paste, Daily Goal & Storage
      timedDurationBar: document.getElementById('timed-duration-bar'),
      freePasteCustomBtn: document.getElementById('free-paste-custom-btn'),
      customPasteModal: document.getElementById('custom-paste-modal'),
      customPasteTextarea: document.getElementById('custom-paste-textarea'),
      customPasteWarning: document.getElementById('custom-paste-warning'),
      customPasteCharCount: document.getElementById('custom-paste-char-count'),
      applyCustomPasteBtn: document.getElementById('apply-custom-paste-btn'),
      exportProgressBtn: document.getElementById('export-progress-btn'),
      importProgressBtn: document.getElementById('import-progress-btn'),
      importFileInput: document.getElementById('import-file-input'),
      corruptionNoticeBanner: document.getElementById('corruption-notice-banner'),
      closeCorruptionBannerBtn: document.getElementById('close-corruption-banner-btn'),
      statsDailyGoalSection: document.getElementById('stats-daily-goal-section'),
      statsLevelProgressContainer: document.getElementById('stats-level-progress-container'),
      mainStreakDays: document.getElementById('main-streak-days'),
      mainTodayMins: document.getElementById('main-today-mins'),
      mainTargetMins: document.getElementById('main-target-mins'),
      mainDailyProgressFill: document.getElementById('main-daily-progress-fill'),
      mainDailyPct: document.getElementById('main-daily-pct'),

      // Phase 5: Ghost Caret, Shortcuts, Suggestions & Pause
      ghostCaretBtn: document.getElementById('ghost-caret-btn'),
      ghostCaretText: document.getElementById('ghost-caret-text'),
      ghostStatusBadge: document.getElementById('ghost-status-badge'),
      shortcutsBtn: document.getElementById('shortcuts-btn'),
      shortcutsModal: document.getElementById('shortcuts-modal'),
      pauseModal: document.getElementById('pause-modal'),
      pauseResumeBtn: document.getElementById('pause-resume-btn'),
      pauseRestartBtn: document.getElementById('pause-restart-btn'),
      pauseRestartSameBtn: document.getElementById('pause-restart-same-btn'),
      resultSuggestionsBox: document.getElementById('result-suggestions-box'),
      resultSuggestionsList: document.getElementById('result-suggestions-list')
    };
  }

  applySettings() {
    let themeToApply = this.settings.theme;
    if (!themeToApply || themeToApply === 'system') {
      const prefersDark = (typeof window !== 'undefined' && window.matchMedia)
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true;
      themeToApply = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', themeToApply);
    document.body.classList.toggle('no-peek-active', Boolean(this.settings.noPeek));
    sound.setSoundType(this.settings.sound || 'mechanical');
    sound.setVolume(this.settings.volume !== undefined ? this.settings.volume : 0.2);
    this.updateSoundBtnText();
    this.updateStopOnErrorBtnText();
    this.updateNoPeekBtnText();
    this.updateGhostCaretBtnText();
  }

  updateGhostCaretBtnText() {
    const isOn = Boolean(this.settings.ghostCaret);
    if (this.dom.ghostCaretText) {
      this.dom.ghostCaretText.textContent = isOn ? '👻 Ghost: เปิด' : '👻 Ghost: ปิด';
    }
    if (this.dom.ghostCaretBtn) {
      this.dom.ghostCaretBtn.classList.toggle('active', isOn);
    }
    if (this.dom.ghostStatusBadge) {
      this.dom.ghostStatusBadge.style.display = (isOn && this.isStarted && !this.isCompleted) ? 'inline-flex' : 'none';
    }
  }

  updateNoPeekBtnText() {
    const isOn = Boolean(this.settings.noPeek);
    if (this.dom.noPeekText) {
      this.dom.noPeekText.textContent = isOn ? '🙈 No-Peek: เปิด' : '👁️ No-Peek: ปิด';
    }
    if (this.dom.noPeekBtn) {
      this.dom.noPeekBtn.classList.toggle('active', isOn);
    }
  }

  updateSoundBtnText() {
    const s = this.settings.sound;
    const icon = s === 'off' ? '🔇 ปิดเสียง' : s === 'soft' ? '🔈 Soft' : '🔊 Mechanical';
    if (this.dom.soundToggleBtn) {
      this.dom.soundToggleBtn.innerHTML = `<span>${icon}</span>`;
    }
  }

  updateStopOnErrorBtnText() {
    const isOn = this.settings.stopOnError !== false;
    if (this.dom.stopOnErrorText) {
      this.dom.stopOnErrorText.textContent = isOn ? '🛑 Stop on error: เปิด' : '⏩ Stop on error: ปิด';
    }
    if (this.dom.stopOnErrorBtn) {
      this.dom.stopOnErrorBtn.classList.toggle('active', isOn);
    }
  }

  showThaiLayoutWarning() {
    if (!this.dom.thaiWarningBanner) return;
    this.dom.thaiWarningBanner.style.display = 'flex';
    if (this.thaiWarningTimeout) {
      clearTimeout(this.thaiWarningTimeout);
    }
    this.thaiWarningTimeout = setTimeout(() => {
      this.hideThaiLayoutWarning();
    }, 4500);
  }

  hideThaiLayoutWarning() {
    if (this.dom.thaiWarningBanner) {
      this.dom.thaiWarningBanner.style.display = 'none';
    }
    if (this.thaiWarningTimeout) {
      clearTimeout(this.thaiWarningTimeout);
      this.thaiWarningTimeout = null;
    }
  }

  renderKeyboardUI() {
    if (!this.dom.kbContainer) return;
    renderKeyboard(this.dom.kbContainer);
  }

  initChart() {
    if (this.dom.chartCanvas && this.dom.chartTooltip) {
      this.chart = new ProgressChart(this.dom.chartCanvas, this.dom.chartTooltip);
    }
  }

  bindEvents() {
    // Mode Switchers
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Theme toggle
    this.dom.themeToggleBtn?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      this.settings.theme = next;
      StorageManager.saveSettings(this.settings);
    });

    // Sound toggle
    this.dom.soundToggleBtn?.addEventListener('click', () => {
      const current = this.settings.sound;
      const next = current === 'mechanical' ? 'soft' : current === 'soft' ? 'off' : 'mechanical';
      this.settings.sound = next;
      sound.setSoundType(next);
      StorageManager.saveSettings(this.settings);
      this.updateSoundBtnText();
      sound.playKeypress();
    });

    // Stop on error toggle
    this.dom.stopOnErrorBtn?.addEventListener('click', () => {
      this.settings.stopOnError = !this.settings.stopOnError;
      StorageManager.saveSettings(this.settings);
      this.updateStopOnErrorBtnText();
      this.dom.hiddenInput?.focus();
    });

    // Phase 3.3: No-peek toggle
    this.dom.noPeekBtn?.addEventListener('click', () => {
      this.settings.noPeek = !this.settings.noPeek;
      StorageManager.saveSettings(this.settings);
      document.body.classList.toggle('no-peek-active', Boolean(this.settings.noPeek));
      this.updateNoPeekBtnText();
      this.dom.hiddenInput?.focus();
    });

    // Phase 5.2: Ghost Caret toggle
    this.dom.ghostCaretBtn?.addEventListener('click', () => {
      this.settings.ghostCaret = !this.settings.ghostCaret;
      StorageManager.saveSettings(this.settings);
      this.updateGhostCaretBtnText();
      this.dom.hiddenInput?.focus();
    });

    // Phase 5.3: Shortcuts Help button
    this.dom.shortcutsBtn?.addEventListener('click', () => {
      this.openModal(this.dom.shortcutsModal);
    });

    // Phase 5.3: Pause modal buttons
    this.dom.pauseResumeBtn?.addEventListener('click', () => {
      this.resumeSession();
    });

    this.dom.pauseRestartBtn?.addEventListener('click', () => {
      this.closeModal(this.dom.pauseModal);
      this.resetSession({ keepSameText: false });
    });

    this.dom.pauseRestartSameBtn?.addEventListener('click', () => {
      this.closeModal(this.dom.pauseModal);
      this.resetSession({ keepSameText: true });
    });

    // Close Thai warning banner
    this.dom.closeThaiWarningBtn?.addEventListener('click', () => {
      this.hideThaiLayoutWarning();
      this.dom.hiddenInput?.focus();
    });

    // Modals open/close
    this.dom.courseDrawerBtn?.addEventListener('click', () => this.openCourseModal());
    this.dom.statsBtn?.addEventListener('click', () => this.openStatsModal());
    this.dom.weakKeysBtn?.addEventListener('click', () => this.startWeakKeyDrill());
    this.dom.placementBtn?.addEventListener('click', () => this.startPlacementTest());
    this.dom.restartBtn?.addEventListener('click', () => this.resetSession({ keepSameText: false }));
    this.dom.restartSameBtn?.addEventListener('click', () => this.resetSession({ keepSameText: true }));

    // Close buttons for modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
        this.dom.hiddenInput?.focus();
      });
    });

    // Typing box focus trigger
    this.dom.typingBox?.addEventListener('click', () => {
      this.dom.hiddenInput?.focus();
      this.dom.typingBox?.classList.add('focused');
    });

    this.dom.hiddenInput?.addEventListener('focus', () => {
      this.dom.typingBox?.classList.add('focused');
    });

    this.dom.hiddenInput?.addEventListener('blur', () => {
      this.dom.typingBox?.classList.remove('focused');
    });

    // Key event handling on window / input
    this.keyDownHandler = (e) => this.handleKeyDown(e);
    window.addEventListener('keydown', this.keyDownHandler);

    // Result modal buttons
    this.dom.resultRetryBtn?.addEventListener('click', () => {
      this.closeModal(this.dom.resultModal);
      this.resetSession();
    });

    this.dom.resultNextBtn?.addEventListener('click', () => {
      this.closeModal(this.dom.resultModal);
      if (this.currentMode === 'free') {
        this.loadNextLanguageSnippet();
      } else {
        this.loadNextLesson();
      }
    });

    this.dom.resultDrillBtn?.addEventListener('click', () => {
      this.closeModal(this.dom.resultModal);
      const sessionMistakes = { ...this.mistakeMap };
      if (Object.keys(sessionMistakes).length > 0) {
        this.startWeakKeyDrill(sessionMistakes, '⚡ ซ้อมจุดที่เพิ่งสะดุดรอบนี้');
      } else {
        this.startWeakKeyDrill();
      }
    });

    this.dom.resultAdaptiveNextBtn?.addEventListener('click', () => {
      this.closeModal(this.dom.resultModal);
      this.loadAdaptiveNextLesson(this.mistakeMap);
    });

    // Phase 3.3: Result modal No-peek suggestion button
    this.dom.resultEnableNoPeekBtn?.addEventListener('click', () => {
      this.settings.noPeek = true;
      StorageManager.saveSettings(this.settings);
      document.body.classList.toggle('no-peek-active', true);
      this.updateNoPeekBtnText();
      if (this.dom.resultNoPeekBox) this.dom.resultNoPeekBox.style.display = 'none';
    });

    // Next snippet button in coding mode
    this.dom.nextSnippetBtn?.addEventListener('click', () => {
      this.loadNextLanguageSnippet();
    });

    // Weak Keys Toolbar filters
    this.dom.weakTabToprow?.addEventListener('click', () => {
      this.setWeakSource('toprow');
    });
    this.dom.weakTabRecent?.addEventListener('click', () => {
      this.setWeakSource('recent');
    });
    this.dom.weakTabCustom?.addEventListener('click', () => {
      this.setWeakSource('custom');
    });
    this.dom.weakTabAlltime?.addEventListener('click', () => {
      this.setWeakSource('alltime');
    });

    // Weak Keys Toolbar actions
    this.dom.regenWeakDrillBtn?.addEventListener('click', () => {
      this.startWeakKeyDrill();
    });
    this.dom.clearWeakKeysBtn?.addEventListener('click', () => {
      if (confirm('คุณต้องการล้างประวัติปุ่มที่พิมพ์ผิดและข้อมูลสถิติ Analytics ทั้งหมดเพื่อเริ่มบันทึกใหม่ใช่หรือไม่?')) {
        StorageManager.resetWeakKeys();
        alert('ล้างสถิติจุดอ่อนและข้อมูล Analytics ทั้งหมดเรียบร้อยแล้ว!');
        this.setWeakSource('toprow');
      }
    });
    this.dom.applyCustomKeysBtn?.addEventListener('click', () => {
      const keys = Array.from(this.customWeakKeys);
      if (keys.length === 0) {
        alert('กรุณาคลิกเลือกปุ่มที่ต้องการฝึกอย่างน้อย 1 ปุ่ม');
        return;
      }
      this.startWeakKeyDrill(keys, '🎯 ซ้อมปุ่มที่เลือกเอง');
    });

    // Phase 4.2: Close corruption notice banner
    this.dom.closeCorruptionBannerBtn?.addEventListener('click', () => {
      StorageManager.clearCorruptionNotice();
      if (this.dom.corruptionNoticeBanner) this.dom.corruptionNoticeBanner.style.display = 'none';
      this.dom.hiddenInput?.focus();
    });

    // Phase 4.5: System color scheme listener
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!this.settings.theme || this.settings.theme === 'system') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    }

    // Phase 4.4: Timed mode duration selector pills
    document.querySelectorAll('.timed-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.timed-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const sec = parseInt(pill.dataset.seconds, 10) || 30;
        this.timedDuration = sec;
        this.startTimedSprint(sec);
      });
    });

    // Phase 4.4: Free mode custom text paste modal
    this.dom.freePasteCustomBtn?.addEventListener('click', () => {
      this.openModal(this.dom.customPasteModal);
      if (this.dom.customPasteTextarea) {
        this.dom.customPasteTextarea.focus();
      }
    });

    this.dom.customPasteTextarea?.addEventListener('input', () => {
      const len = this.dom.customPasteTextarea.value.length;
      if (this.dom.customPasteCharCount) {
        this.dom.customPasteCharCount.textContent = len;
        this.dom.customPasteCharCount.style.color = len > 2000 ? 'var(--accent-red)' : '';
      }
      if (this.dom.customPasteWarning) {
        if (len > 2000) {
          this.dom.customPasteWarning.textContent = 'ข้อความเกิน 2,000 ตัวอักษร (จะถูกตัดอัตโนมัติ)';
          this.dom.customPasteWarning.style.display = 'inline';
        } else {
          this.dom.customPasteWarning.style.display = 'none';
        }
      }
    });

    this.dom.applyCustomPasteBtn?.addEventListener('click', () => {
      const raw = this.dom.customPasteTextarea?.value || '';
      this.applyCustomPastedText(raw);
    });

    // Phase 4.1: Export & Import buttons in stats modal
    this.dom.exportProgressBtn?.addEventListener('click', () => {
      StorageManager.downloadExportFile();
    });

    this.dom.importProgressBtn?.addEventListener('click', () => {
      this.dom.importFileInput?.click();
    });

    this.dom.importFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const validation = StorageManager.validateImportData(parsed);
          if (!validation.valid) {
            alert(`ไฟล์ไม่ถูกต้อง: ${validation.error}\nข้อมูลเดิมยังคงปลอดภัย`);
            return;
          }
          const s = validation.summary;
          const confirmed = confirm(`พบข้อมูลในไฟล์สำรอง:\n- ประวัติการฝึก: ${s.sessionsCount} รอบ\n- บทเรียนที่ปลดล็อก: ${s.unlockedCount} บทเรียน\n\nต้องการนำเข้าข้อมูลเพื่อแทนที่ข้อมูลปัจจุบันหรือไม่?`);
          if (confirmed) {
            StorageManager.importProgress(parsed);
            alert('นำเข้าข้อมูลสำเร็จแล้ว! กำลังรีโหลดหน้าจอเพื่อปรับใช้ข้อมูลใหม่');
            window.location.reload();
          }
        } catch (err) {
          alert('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบว่าเป็นไฟล์ JSON ที่ถูกต้อง');
        } finally {
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  setWeakSource(source) {
    this.weakSource = source;
    this.dom.weakTabToprow?.classList.toggle('active', source === 'toprow');
    this.dom.weakTabRecent?.classList.toggle('active', source === 'recent');
    this.dom.weakTabCustom?.classList.toggle('active', source === 'custom');
    this.dom.weakTabAlltime?.classList.toggle('active', source === 'alltime');

    if (source === 'custom') {
      if (this.dom.weakCustomPicker) this.dom.weakCustomPicker.style.display = 'flex';
      this.startWeakKeyDrill(Array.from(this.customWeakKeys), '🎯 ซ้อมปุ่มที่เลือกเอง');
    } else if (source === 'toprow') {
      if (this.dom.weakCustomPicker) this.dom.weakCustomPicker.style.display = 'none';
      this.startWeakKeyDrill(['e', 'r', 't', 'i', 'u'], '🎯 ซ่อมปุ่มแถวบน');
    } else {
      if (this.dom.weakCustomPicker) this.dom.weakCustomPicker.style.display = 'none';
      this.startWeakKeyDrill();
    }
  }

  loadAdaptiveNextLesson(mistakes) {
    let allLessons = [];
    LESSON_LEVELS.forEach(lvl => allLessons.push(...lvl.lessons));

    const targetLesson = this.currentLesson || allLessons[0];
    const weakChars = Object.keys(mistakes || {}).filter(c => c.trim().length === 1);
    if (weakChars.length === 0) {
      this.loadLesson(targetLesson, 'course');
      return;
    }

    // Build targeted warm-up words for these exact weak keys
    const warmupWords = [];
    weakChars.forEach(k => {
      const lower = k.toLowerCase();
      if (['e', 'r', 't', 'i', 'u', 'y', 'o', 'p', 'q', 'w'].includes(lower)) {
        warmupWords.push('red', 'tree', 'true', 'tire', 'fire', 'user', 'write');
      } else if (['v', 'm', 'c', 'b', 'n', 'x'].includes(lower)) {
        warmupWords.push('come', 'move', 'claim', 'mind', 'calm');
      } else {
        warmupWords.push('dad', 'sad', 'glad', 'flag', 'fall');
      }
    });

    const uniqueWarmup = Array.from(new Set(warmupWords)).slice(0, 5).join(' ');
    const combinedText = `${uniqueWarmup}   ${targetLesson.text}`;

    const adaptiveLesson = {
      ...targetLesson,
      id: `${targetLesson.id}-adaptive`,
      title: `🎯 ${targetLesson.title} (เสริมจุดอ่อน: [ ${weakChars.join(' ')} ])`,
      description: `ระบบนำปุ่มที่คุณเพิ่งสะดุด [ ${weakChars.join(', ')} ] มาเสริมช่วงต้นบทเรียน เพื่อให้พิมพ์ได้แม่นยำยิ่งขึ้น!`,
      text: combinedText
    };

    this.loadLesson(adaptiveLesson, 'course');
  }

  renderCustomKeyChips() {
    if (!this.dom.pickerKeysChips) return;
    this.dom.pickerKeysChips.innerHTML = '';

    const letters = ['e', 'r', 't', 'u', 'i', 'o', 'p', 'q', 'w', 'y', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];

    letters.forEach(char => {
      const chip = document.createElement('div');
      chip.className = `picker-key-chip ${this.customWeakKeys.has(char) ? 'selected' : ''}`;
      chip.textContent = char;
      chip.dataset.key = char;

      chip.addEventListener('click', () => {
        if (this.customWeakKeys.has(char)) {
          this.customWeakKeys.delete(char);
          chip.classList.remove('selected');
        } else {
          this.customWeakKeys.add(char);
          chip.classList.add('selected');
        }
      });

      this.dom.pickerKeysChips.appendChild(chip);
    });
  }

  renderLanguagePills() {
    if (!this.dom.langPillsList) return;
    this.dom.langPillsList.innerHTML = '';

    Object.values(CODE_LANGUAGES).forEach(lang => {
      const pill = document.createElement('button');
      pill.className = `lang-pill ${this.selectedLanguage === lang.id ? 'active' : ''}`;
      pill.dataset.lang = lang.id;
      pill.innerHTML = `<span>${lang.icon}</span> <span>${lang.name}</span>`;

      pill.addEventListener('click', () => {
        this.selectLanguage(lang.id);
      });

      this.dom.langPillsList.appendChild(pill);
    });
  }

  selectLanguage(langId) {
    this.selectedLanguage = langId;
    this.snippetIndex = 0;
    this.updateLanguagePillsUI();
    this.loadLanguageSnippet(langId, this.snippetIndex);
  }

  updateLanguagePillsUI() {
    if (!this.dom.langPillsList) return;
    this.dom.langPillsList.querySelectorAll('.lang-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.lang === this.selectedLanguage);
    });
  }

  loadNextLanguageSnippet() {
    const lang = CODE_LANGUAGES[this.selectedLanguage] || CODE_LANGUAGES.sql;
    this.snippetIndex = (this.snippetIndex + 1) % lang.snippets.length;
    this.loadLanguageSnippet(this.selectedLanguage, this.snippetIndex);
  }

  loadLanguageSnippet(langId, index = 0) {
    const lang = CODE_LANGUAGES[langId] || CODE_LANGUAGES.sql;
    const snippet = lang.snippets[index % lang.snippets.length];

    this.loadLesson({
      id: `code-${langId}-${index}`,
      title: `${lang.icon} ฝึกพิมพ์โค้ด: ${lang.name} (${index + 1}/${lang.snippets.length})`,
      description: lang.description,
      targetWpm: 28,
      minAccuracy: 92,
      tips: `สังเกตสัญลักษณ์และช่องว่าง เคาะทีละบรรทัด กด Enter เพื่อขึ้นบรรทัดใหม่`,
      text: snippet
    }, 'free');
  }

  loadDefaultLesson() {
    const unlocked = StorageManager.getUnlockedLessons();
    // Default to the highest unlocked lesson or 1-1
    let targetId = unlocked[unlocked.length - 1] || '1-1';
    let foundLesson = this.findLessonById(targetId) || LESSON_LEVELS[0].lessons[0];
    this.loadLesson(foundLesson, 'course');
  }

  findLessonById(id) {
    for (const level of LESSON_LEVELS) {
      for (const les of level.lessons) {
        if (les.id === id) return les;
      }
    }
    return null;
  }

  generateLessonText(lesson) {
    if (!lesson) return '';
    let textToUse = lesson.text;
    if (this.currentMode === 'course' && lesson?.id && LESSON_TARGET_KEYS[lesson.id] && !lesson.isStatic) {
      try {
        const targetKeys = LESSON_TARGET_KEYS[lesson.id];
        const unlockedKeys = getLessonUnlockedKeys(lesson.id);
        const analytics = StorageManager.getAnalytics();
        const topWeak = getTopWeakKeys(analytics, 5, unlockedKeys);
        const weakKeys = (topWeak || []).map(k => k.key);
        const reviewKeys = unlockedKeys.filter(k => !targetKeys.includes(k.toLowerCase()));

        // Cap lesson length: 80-120 for Level 1-2, 120-200 for later levels (fits without scrollbar)
        let currentLevelNum = 1;
        if (lesson?.id) {
          const match = String(lesson.id).match(/^([1-6])/);
          if (match) currentLevelNum = parseInt(match[1], 10);
        }
        const caps = LESSON_LENGTH_CAPS[currentLevelNum] || { min: 80, max: 120 };
        const targetLength = Math.round((caps.min + caps.max) / 2);

        const generated = generateAdaptiveLessonText({
          targetKeys,
          weakKeys,
          reviewKeys,
          unlockedKeys,
          targetLength,
          minLength: caps.min,
          maxLength: caps.max
        });
        if (generated && generated.trim().length > 0) {
          textToUse = generated;
        }
      } catch (err) {
        console.warn('Adaptive text generation fallback:', err);
        textToUse = lesson.text;
      }
    }
    return textToUse;
  }

  loadLesson(lesson, mode = 'course') {
    this.saveSessionAnalyticsIfNeeded();
    this.currentMode = mode;
    this.currentLesson = lesson;

    // Phase 3.1 & Phase 5: Generate adaptive lesson text for curriculum lessons
    this.targetText = (mode === 'course') ? this.generateLessonText(lesson) : (lesson?.text || '');
    this.resetSession({ keepSameText: true });

    // Toggle language and weak keys toolbar visibility
    const codeSelector = this.dom.codeLangSelector || document.getElementById('code-lang-selector');
    if (codeSelector) {
      codeSelector.style.display = (mode === 'free') ? 'flex' : 'none';
    }
    const weakBar = this.dom.weakKeysBar || document.getElementById('weak-keys-bar');
    if (weakBar) {
      weakBar.style.display = (mode === 'weak') ? 'flex' : 'none';
    }
    const timedBar = this.dom.timedDurationBar || document.getElementById('timed-duration-bar');
    if (timedBar) {
      timedBar.style.display = (mode === 'timed') ? 'flex' : 'none';
    }

    // Update banner metadata
    if (this.dom.lessonTitle) this.dom.lessonTitle.textContent = lesson.title;
    if (this.dom.lessonDesc) this.dom.lessonDesc.textContent = lesson.description || lesson.tips || '';
    if (this.dom.targetWpmBadge) this.dom.targetWpmBadge.innerHTML = `เป้าหมาย: <strong>${lesson.targetWpm} WPM</strong>`;
    if (this.dom.targetAccBadge) this.dom.targetAccBadge.innerHTML = `ความแม่นยำ: <strong>${lesson.minAccuracy}%</strong>`;

    this.updateModeButtonsUI(mode);
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.updateModeButtonsUI(mode);

    if (mode === 'course') {
      this.openCourseModal();
    } else if (mode === 'timed') {
      this.startTimedSprint(this.timedDuration || 30);
    } else if (mode === 'weak') {
      this.startWeakKeyDrill();
    } else if (mode === 'free') {
      this.loadLanguageSnippet(this.selectedLanguage || 'sql', this.snippetIndex || 0);
    }
  }

  startTimedSprint(seconds = 30) {
    this.timedDuration = seconds;
    const wordCount = Math.max(30, Math.round(seconds * 1.0));
    const text = DrillGenerator.generateRandomText(wordCount, 'words');
    this.loadLesson({
      id: `timed-${seconds}`,
      title: `⏱️ Timed Sprint: ${seconds} Seconds`,
      description: `โหมดจับเวลา ${seconds} วินาที ฝึกเค้นสปีดความเร็วและความแม่นยำสูงสุด`,
      targetWpm: 30,
      minAccuracy: 93,
      text: text
    }, 'timed');
  }

  applyCustomPastedText(rawText) {
    if (!rawText || !rawText.trim()) {
      alert('กรุณากรอกหรือวางข้อความก่อนเริ่มฝึก');
      return;
    }

    let text = rawText;
    let wasCapped = false;
    if (text.length > 2000) {
      text = text.slice(0, 2000);
      wasCapped = true;
    }

    // Normalize curly quotes, dashes, newlines
    text = text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // Strip characters not supported on keyboard (printable ASCII \x20-\x7E and \n)
    const initialLen = text.length;
    text = text.replace(/[^\x20-\x7E\n]/g, '');
    const strippedCount = initialLen - text.length;

    if (!text.trim()) {
      alert('ข้อความไม่มีตัวอักษรภาษาอังกฤษหรือสัญลักษณ์ที่รองรับบนคีย์บอร์ด');
      return;
    }

    const notices = [];
    if (wasCapped) notices.push('ตัดความยาวเหลือ 2,000 ตัวอักษร');
    if (strippedCount > 0) notices.push(`ตัดอักขระพิเศษที่ไม่รองรับออก ${strippedCount} ตัว`);

    if (notices.length > 0) {
      alert(`แจ้งเตือน: ${notices.join(' และ ')} เรียบร้อยแล้ว`);
    }

    this.closeAllModals();
    this.loadLesson({
      id: 'custom-paste',
      title: '📋 แบบฝึกหัด: ข้อความกำหนดเอง (Custom Text)',
      description: 'ฝึกพิมพ์ข้อความที่คุณกำหนดเองด้วยสปีดและความแม่นยำสูงสุด',
      targetWpm: 25,
      minAccuracy: 95,
      tips: 'รักษาจังหวะการเคาะให้สม่ำเสมอ หากพิมพ์ผิด ให้กดปุ่มที่ถูกต้องเพื่อไปต่อ',
      text: text
    }, 'free');
    this.dom.hiddenInput?.focus();
  }

  updateDailyGoalUI() {
    const stats = StorageManager.computeDailyStats(null, this.settings.dailyGoalMinutes || 15);
    if (this.dom.mainStreakDays) this.dom.mainStreakDays.textContent = stats.currentStreak;
    if (this.dom.mainTodayMins) this.dom.mainTodayMins.textContent = stats.todayMinutes;
    if (this.dom.mainTargetMins) this.dom.mainTargetMins.textContent = stats.goalMinutes;
    if (this.dom.mainDailyProgressFill) this.dom.mainDailyProgressFill.style.width = `${stats.goalProgressPct}%`;
    if (this.dom.mainDailyPct) this.dom.mainDailyPct.textContent = `${stats.goalProgressPct}%`;
  }

  updateModeButtonsUI(activeMode) {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === activeMode);
    });
  }

  startPlacementTest() {
    this.closeAllModals();
    const testLesson = {
      id: 'placement-test',
      title: '🎯 แบบทดสอบวัดระดับครั้งแรก (Placement Assessment)',
      description: 'พิมพ์ข้อความผสมชุดนี้ตามจังหวะปกติของคุณ ระบบจะวิเคราะห์และแนะนำเลเวลที่เหมาะสมที่สุดให้',
      targetWpm: 20,
      minAccuracy: 88,
      text: PLACEMENT_TEST_TEXT
    };
    this.loadLesson(testLesson, 'placement');
    this.dom.hiddenInput.focus();
  }

  startWeakKeyDrill(specificKeysOrMap = null, titlePrefix = null) {
    this.closeAllModals();

    if (specificKeysOrMap) {
      const drill = DrillGenerator.generateWeakKeyDrill(specificKeysOrMap, { titlePrefix: titlePrefix || '🎯 ซ่อมจุดอ่อน' });
      this.loadLesson(drill, 'weak');
      this.dom.hiddenInput.focus();
      return;
    }

    if (this.weakSource === 'custom') {
      const drill = DrillGenerator.generateWeakKeyDrill(Array.from(this.customWeakKeys), { titlePrefix: '🎯 ซ้อมปุ่มที่เลือกเอง (Custom)' });
      this.loadLesson(drill, 'weak');
      this.dom.hiddenInput.focus();
      return;
    }

    if (this.weakSource === 'toprow') {
      const drill = DrillGenerator.generateWeakKeyDrill(['e', 'r', 't', 'i', 'u'], { titlePrefix: '🎯 ซ่อมปุ่มแถวบน (E, R, T, I, U)' });
      this.loadLesson(drill, 'weak');
      this.dom.hiddenInput.focus();
      return;
    }

    if (this.weakSource === 'recent') {
      const analytics = StorageManager.getAnalytics();
      const topWeak = getTopWeakKeys(analytics, 5);
      if (topWeak && topWeak.length > 0) {
        const drill = DrillGenerator.generateAnalyticsDrill(analytics, null, {
          titlePrefix: '⚡ ซ่อมจุดอ่อนรอบล่าสุด (Analytics)'
        });
        this.loadLesson(drill, 'weak');
        this.dom.hiddenInput.focus();
        return;
      }

      // Fallback: If not enough analytics data yet, use last session mistake map with anchor drill
      const lastSession = StorageManager.getLastSessionMistakes();
      if (Object.keys(lastSession).length > 0) {
        const drill = DrillGenerator.generateWeakKeyDrill(lastSession, { titlePrefix: '⚡ ซ่อมจุดอ่อนรอบล่าสุด' });
        this.loadLesson(drill, 'weak');
        this.dom.hiddenInput.focus();
        return;
      }
    }

    // Phase 2: Weak-Spot Drill powered by Analytics Engine
    const analytics = StorageManager.getAnalytics();
    const drill = DrillGenerator.generateAnalyticsDrill(analytics);
    this.loadLesson(drill, 'weak');
    this.dom.hiddenInput.focus();
  }

  saveSessionAnalyticsIfNeeded() {
    if (this.analyticsSaved) return;
    const log = sessionLogger.getLog();
    if (log && log.length >= 10) {
      StorageManager.updateAnalyticsFromSession(log);
      this.analyticsSaved = true;
    }
  }

  resetSession(options = {}) {
    const keepSameText = (typeof options === 'boolean') ? options : !!options?.keepSameText;

    // Regenerate adaptive text for curriculum lessons on restart unless keepSameText is true
    if (!keepSameText && this.currentMode === 'course' && this.currentLesson?.id && LESSON_TARGET_KEYS[this.currentLesson.id] && !this.currentLesson.isStatic) {
      this.targetText = this.generateLessonText(this.currentLesson);
    }

    this.saveSessionAnalyticsIfNeeded();

    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.isStarted = false;
    this.isCompleted = false;
    if (this.isPaused && this.dom.pauseModal) {
      this.closeModal(this.dom.pauseModal);
    }
    this.isPaused = false;
    this.totalPausedMs = 0;
    this.pauseStartTime = null;
    this.lastGhostIndex = null;
    if (this.dom.ghostStatusBadge) {
      this.dom.ghostStatusBadge.style.display = 'none';
    }
    this.cursorIndex = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.mistakeMap = {};
    this.hasErroredAtCurrentPos = false;
    this.analyticsSaved = false;
    this.startTime = null;
    this.endTime = null;
    this.timeRemaining = this.timedDuration;

    // Reset telemetry logger and layout warning
    sessionLogger.reset();
    this.hideThaiLayoutWarning();

    // Reset metrics display
    if (this.dom.wpmVal) this.dom.wpmVal.textContent = '--';
    if (this.dom.accVal) this.dom.accVal.textContent = '100%';
    if (this.dom.errVal) this.dom.errVal.textContent = '0';
    if (this.dom.timerVal) this.dom.timerVal.textContent = this.currentMode === 'timed' ? `${this.timedDuration}s` : '0:00';
    if (this.dom.timerLabel) this.dom.timerLabel.textContent = this.currentMode === 'timed' ? 'เวลาเหลือ' : 'เวลาที่ใช้';

    // Render characters
    this.renderTextCharacters();
    this.updateActiveGuidance();
    if (this.dom.hiddenInput) {
      this.dom.hiddenInput.value = '';
      this.dom.hiddenInput.focus();
    }
  }

  renderTextCharacters() {
    if (!this.dom.typingText) return;
    this.dom.typingText.innerHTML = '';
    const frag = document.createDocumentFragment();

    for (let i = 0; i < this.targetText.length; i++) {
      const ch = this.targetText[i];
      const span = document.createElement('span');
      span.className = 'char untyped';
      span.dataset.index = i;

      if (ch === ' ') {
        span.innerHTML = '&nbsp;';
      } else if (ch === '\n') {
        span.innerHTML = '↵<br/>';
        span.classList.add('char-newline');
      } else {
        span.textContent = ch;
      }

      if (i === 0) {
        span.classList.add('current');
      }

      frag.appendChild(span);
    }

    this.dom.typingText.appendChild(frag);
  }

  handleKeyDown(e) {
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    // 5.3: Handle shortcuts when a modal is open
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.isPaused && activeModal === this.dom.pauseModal) {
          this.resumeSession();
        } else {
          this.closeModal(activeModal);
        }
        this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
        return;
      }
      if (e.key === 'Enter') {
        if (activeModal === this.dom.resultModal) {
          e.preventDefault();
          if (this.dom.resultNextBtn && this.dom.resultNextBtn.style.display !== 'none') {
            this.dom.resultNextBtn.click();
          } else if (this.dom.resultRetryBtn) {
            this.dom.resultRetryBtn.click();
          }
          this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
          return;
        }
      }
      if (e.key === 'Tab' && activeModal === this.dom.pauseModal) {
        e.preventDefault();
        this.closeModal(activeModal);
        this.resetSession({ keepSameText: e.shiftKey });
        this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
        return;
      }
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    }

    // 5.3: Global shortcuts when no modal is open
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.isStarted && !this.isCompleted) {
        this.pauseSession();
      } else if (this.dom.shortcutsModal) {
        this.openModal(this.dom.shortcutsModal);
      }
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      this.resetSession({ keepSameText: e.shiftKey });
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    }

    if (e.key === '?' && (!this.targetText || this.targetText[this.cursorIndex] !== '?')) {
      e.preventDefault();
      if (this.dom.shortcutsModal) {
        this.openModal(this.dom.shortcutsModal);
      }
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    }

    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    }

    // Prevent default scrolling for Space, PageDown, Arrows
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || e.key === ' ') {
      e.preventDefault();
    }

    if (this.isCompleted) {
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    }

    // 1.3 Thai layout detection: if e.key is in range \u0E00-\u0E7F
    // Show a non-blocking banner, do NOT count it as an error, do NOT log it, do NOT advance cursor
    if (/[\u0E00-\u0E7F]/.test(e.key)) {
      this.showThaiLayoutWarning();
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    } else {
      this.hideThaiLayoutWarning();
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      this.flashPhysicalKey(e.code, false);
      this.handleBackspace();
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return;
    }

    // Typing evaluation
    const expectedChar = this.targetText[this.cursorIndex];
    let typedChar = e.key;
    if (e.key === 'Enter') typedChar = '\n';

    if (typedChar.length !== 1 && typedChar !== '\n') {
      this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
      return; // Ignore other multi-char function keys
    }

    // Start timer on first valid keydown
    if (!this.isStarted) {
      this.startTypingSession();
    }

    this.totalKeystrokes++;

    if (typedChar === expectedChar) {
      // Correct!
      this.flashPhysicalKey(e.code, false);
      sessionLogger.recordKeystroke(expectedChar, typedChar, true, this.cursorIndex);
      sound.playKeypress(expectedChar === ' ');
      this.correctKeystrokes++;
      this.hasErroredAtCurrentPos = false; // Reset error flag when cursor advances
      this.markCharacterState(this.cursorIndex, 'correct');
      this.cursorIndex++;

      // Check if finished
      if (this.cursorIndex >= this.targetText.length) {
        this.completeSession();
        this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
        return;
      } else {
        this.markCharacterState(this.cursorIndex, 'current');
      }
    } else {
      // Wrong key!
      this.flashPhysicalKey(e.code, true);
      sessionLogger.recordKeystroke(expectedChar, typedChar, false, this.cursorIndex);
      sound.playError();

      // Count at most ONE error per character position
      if (!this.hasErroredAtCurrentPos) {
        this.hasErroredAtCurrentPos = true;
        this.errorCount++;
        this.mistakeMap[expectedChar] = (this.mistakeMap[expectedChar] || 0) + 1;
      }

      if (this.settings.stopOnError !== false) {
        // Stop on error: cursor does NOT advance
        const chars = this.dom.typingText.querySelectorAll('.char');
        const currentSpan = chars[this.cursorIndex];
        if (currentSpan) {
          currentSpan.classList.remove('char-shake');
          void currentSpan.offsetWidth;
          currentSpan.classList.add('char-shake');
          setTimeout(() => currentSpan?.classList.remove('char-shake'), 220);
        }
      } else {
        // Legacy behavior: advance cursor on error
        this.hasErroredAtCurrentPos = false;
        this.markCharacterState(this.cursorIndex, 'incorrect');
        this.cursorIndex++;

        if (this.cursorIndex >= this.targetText.length) {
          this.completeSession();
          this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
          return;
        } else {
          this.markCharacterState(this.cursorIndex, 'current');
        }
      }
    }

    this.updateMetrics();
    this.updateActiveGuidance();
    this.scrollCursorIntoView();
    this.updateGhostCaret();
    this.lastProcessMs = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - t0;
  }

  handleBackspace() {
    if (this.cursorIndex > 0) {
      sound.playKeypress();
      this.hasErroredAtCurrentPos = false;
      // Remove current highlight
      this.markCharacterState(this.cursorIndex, 'untyped');
      this.cursorIndex--;
      this.markCharacterState(this.cursorIndex, 'current');
      this.updateMetrics();
      this.updateActiveGuidance();
      this.scrollCursorIntoView();
    }
  }

  markCharacterState(index, state) {
    if (!this.dom.typingText) return;
    const chars = this.dom.typingText.querySelectorAll('.char');
    const span = chars[index];
    if (!span) return;

    span.className = 'char ' + state;
    if (this.targetText[index] === '\n') {
      span.classList.add('char-newline');
    }
  }

  scrollCursorIntoView() {
    if (!this.dom.typingText || !this.dom.typingBox) return;
    const chars = this.dom.typingText.querySelectorAll('.char');
    const currentSpan = chars[this.cursorIndex];
    if (currentSpan) {
      const boxRect = this.dom.typingBox.getBoundingClientRect();
      const charRect = currentSpan.getBoundingClientRect();

      if (charRect.bottom > boxRect.bottom - 40 || charRect.top < boxRect.top + 40) {
        currentSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  flashPhysicalKey(code, isWrong = false) {
    if (!this.dom.kbContainer) return;
    const keyEl = this.dom.kbContainer.querySelector(`[data-code="${code}"]`);
    if (keyEl) {
      const cls = isWrong ? 'key-wrong-press' : 'key-pressed';
      keyEl.classList.add(cls);
      setTimeout(() => keyEl.classList.remove(cls), 140);
    }
  }

  startTypingSession() {
    this.isStarted = true;
    this.startTime = Date.now();
    sound.init();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 250);
  }

  tick() {
    if (!this.isStarted || this.isCompleted || this.isPaused) return;

    const elapsedSeconds = Math.max(1, (Date.now() - this.startTime) / 1000);

    if (this.currentMode === 'timed') {
      const remaining = Math.max(0, this.timedDuration - Math.floor(elapsedSeconds));
      this.dom.timerVal.textContent = `${remaining}s`;
      if (remaining <= 0) {
        this.completeSession();
        return;
      }
    } else {
      const mins = Math.floor(elapsedSeconds / 60);
      const secs = Math.floor(elapsedSeconds % 60);
      this.dom.timerVal.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    this.updateMetrics();
    this.updateGhostCaret();
  }

  updateGhostCaret() {
    if (!this.settings.ghostCaret || !this.isStarted || this.isCompleted || this.isPaused) {
      if (this.lastGhostIndex !== null && this.lastGhostIndex !== undefined) {
        const chars = this.dom.typingText?.querySelectorAll('.char');
        if (chars && chars[this.lastGhostIndex]) {
          chars[this.lastGhostIndex].classList.remove('char-ghost');
        }
        this.lastGhostIndex = null;
      }
      if (this.dom.ghostStatusBadge && !this.settings.ghostCaret) {
        this.dom.ghostStatusBadge.style.display = 'none';
      }
      return;
    }

    if (!this.targetText || this.targetText.length === 0) return;

    // Pace determined by user's best previous session on the same lesson (or target WPM)
    let bestWpm = 0;
    if (this.currentLesson?.id) {
      const scores = StorageManager.getLessonScores();
      bestWpm = scores[this.currentLesson.id]?.bestWpm || 0;
    }
    if (!bestWpm) {
      bestWpm = this.currentLesson?.targetWpm || 25;
    }

    const charsPerSec = (bestWpm * 5) / 60;
    const elapsedSeconds = this.startTime ? Math.max(0, (Date.now() - this.startTime) / 1000) : 0;
    const ghostIndex = Math.min(this.targetText.length - 1, Math.floor(elapsedSeconds * charsPerSec));

    const chars = this.dom.typingText?.querySelectorAll('.char');
    if (chars && chars.length > 0) {
      if (this.lastGhostIndex !== null && this.lastGhostIndex !== undefined && this.lastGhostIndex !== ghostIndex) {
        if (chars[this.lastGhostIndex]) {
          chars[this.lastGhostIndex].classList.remove('char-ghost');
        }
      }
      if (chars[ghostIndex]) {
        chars[ghostIndex].classList.add('char-ghost');
        this.lastGhostIndex = ghostIndex;
      }
    }

    // Update status badge: ahead / behind by N chars
    if (this.dom.ghostStatusBadge) {
      this.dom.ghostStatusBadge.style.display = 'inline-flex';
      const diff = this.cursorIndex - ghostIndex;
      if (diff > 0) {
        this.dom.ghostStatusBadge.textContent = `👻 นำผี ${diff} ตัว (Ahead +${diff})`;
        this.dom.ghostStatusBadge.className = 'ghost-status-badge ahead';
      } else if (diff < 0) {
        this.dom.ghostStatusBadge.textContent = `👻 ตามผี ${Math.abs(diff)} ตัว (Behind ${diff})`;
        this.dom.ghostStatusBadge.className = 'ghost-status-badge behind';
      } else {
        this.dom.ghostStatusBadge.textContent = `👻 ความเร็วเท่ากับผี (Even ±0)`;
        this.dom.ghostStatusBadge.className = 'ghost-status-badge';
      }
    }
  }

  pauseSession() {
    if (!this.isStarted || this.isCompleted || this.isPaused) return;
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.dom.pauseModal) {
      this.openModal(this.dom.pauseModal);
    }
  }

  resumeSession() {
    if (!this.isPaused) return;
    this.isPaused = false;
    if (this.pauseStartTime && this.startTime) {
      const pausedMs = Date.now() - this.pauseStartTime;
      this.startTime += pausedMs;
    }
    this.pauseStartTime = null;
    if (this.dom.pauseModal) {
      this.closeModal(this.dom.pauseModal);
    }
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 250);
    this.dom.hiddenInput?.focus();
  }

  updateMetrics() {
    const elapsedSeconds = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const elapsedMinutes = Math.max(0.01, elapsedSeconds / 60);

    // 1.4 WPM stabilization: do not show WPM until >= 3s elapsed AND >= 5 correct chars; show "--" before that
    if (elapsedSeconds < 3 || this.correctKeystrokes < 5) {
      if (this.dom.wpmVal) this.dom.wpmVal.textContent = '--';
    } else {
      const netWpm = Math.max(0, Math.round((this.correctKeystrokes / 5) / elapsedMinutes));
      if (this.dom.wpmVal) this.dom.wpmVal.textContent = netWpm;
    }

    const accuracy = this.totalKeystrokes > 0
      ? Math.max(0, Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100))
      : 100;

    if (this.dom.accVal) this.dom.accVal.textContent = `${accuracy}%`;
    if (this.dom.errVal) this.dom.errVal.textContent = this.errorCount;
  }

  updateActiveGuidance() {
    if (!this.dom.kbContainer || !this.dom.nextKeyPreview || !this.dom.fingerName) return;
    // Clear previous highlights on keyboard
    this.dom.kbContainer.querySelectorAll('.key-target, .key-shift-req').forEach(el => {
      el.classList.remove('key-target', 'key-shift-req');
      el.style.borderColor = '';
    });

    if (this.cursorIndex >= this.targetText.length) {
      this.dom.nextKeyPreview.textContent = '✓';
      this.dom.fingerName.textContent = 'เสร็จสมบูรณ์!';
      this.clearHandsHighlight();
      return;
    }

    const nextChar = this.targetText[this.cursorIndex];
    const keyInfo = getKeyInfoForChar(nextChar);

    // Preview badge
    if (nextChar === ' ') {
      this.dom.nextKeyPreview.textContent = '␣';
    } else if (nextChar === '\n') {
      this.dom.nextKeyPreview.textContent = '↵';
    } else {
      this.dom.nextKeyPreview.textContent = nextChar;
    }

    if (!keyInfo) {
      this.dom.fingerName.textContent = 'พิมพ์: ' + nextChar;
      return;
    }

    const finger = FINGERS[keyInfo.finger];

    // Highlight target key on keyboard
    const targetKeyEl = this.dom.kbContainer.querySelector(`[data-code="${keyInfo.code}"]`);
    if (targetKeyEl) {
      targetKeyEl.classList.add('key-target');
      targetKeyEl.style.borderColor = finger.color;
    }

    // Highlight Shift key if needed
    if (keyInfo.requiresShift) {
      const shiftKeyEl = this.dom.kbContainer.querySelector(`[data-code="${keyInfo.shiftCode}"]`);
      if (shiftKeyEl) {
        shiftKeyEl.classList.add('key-shift-req');
      }

      const shiftFinger = FINGERS[keyInfo.shiftFinger];
      this.dom.fingerName.innerHTML = `
        <span class="finger-dot" style="background-color:${shiftFinger.color}"></span>
        <span>กด <strong>${keyInfo.shiftCode === 'ShiftRight' ? 'Shift ขวา' : 'Shift ซ้าย'}</strong> + <strong style="color:${finger.color}">${finger.name}</strong></span>
      `;
      this.dom.fingerTip.textContent = `ใช้นิ้วก้อยกด Shift ค้างไว้ แล้วใช้นิ้ว ${finger.name} กดแป้น ${nextChar}`;
      this.highlightHands(finger.id, shiftFinger.id);
    } else {
      this.dom.fingerName.innerHTML = `
        <span class="finger-dot" style="background-color:${finger.color}"></span>
        <span>${finger.name}</span>
      `;
      this.dom.fingerTip.textContent = this.currentLesson?.tips || 'มองที่หน้าจอ วางนิ้วตามตำแหน่งตุ่มนูน F และ J';
      this.highlightHands(finger.id, null);
    }
  }

  highlightHands(primaryFingerId, shiftFingerId = null) {
    if (!this.dom.handsContainer) return;

    // Reset all finger paths in hands SVG
    this.dom.handsContainer.querySelectorAll('.finger-path').forEach(f => {
      f.classList.remove('active');
      f.style.fill = 'var(--bg-card)';
      f.style.stroke = 'var(--border-color)';
    });

    const highlightFinger = (fid) => {
      const fingerEl = this.dom.handsContainer.querySelector(`[data-finger-id="${fid}"]`);
      if (fingerEl) {
        const info = FINGERS[fid];
        fingerEl.classList.add('active');
        fingerEl.style.fill = info.color;
        fingerEl.style.stroke = info.color;
      }
    };

    if (primaryFingerId) highlightFinger(primaryFingerId);
    if (shiftFingerId) highlightFinger(shiftFingerId);
  }

  clearHandsHighlight() {
    if (!this.dom.handsContainer) return;
    this.dom.handsContainer.querySelectorAll('.finger-path').forEach(f => {
      f.classList.remove('active');
      f.style.fill = 'var(--bg-card)';
      f.style.stroke = 'var(--border-color)';
    });
  }

  completeSession() {
    // 1. Analytics save (optional - safe try/catch)
    try {
      this.saveSessionAnalyticsIfNeeded();
    } catch (err) {
      console.error('Analytics save error in completeSession:', err);
    }

    clearInterval(this.timerInterval);
    this.isCompleted = true;
    this.updateGhostCaret();
    this.endTime = Date.now();

    const elapsedMinutes = Math.max(0.01, (this.endTime - this.startTime) / 60000);
    const finalWpm = Math.round((this.correctKeystrokes / 5) / elapsedMinutes);
    const finalAcc = this.totalKeystrokes > 0
      ? Math.max(0, Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100))
      : 100;

    // 2. Storage persistence (optional - safe try/catch)
    try {
      StorageManager.recordMistakes(this.mistakeMap);
      StorageManager.addHistoryRecord({
        lessonId: this.currentLesson?.id || 'custom',
        lessonTitle: this.currentLesson?.title || 'แบบฝึกหัด',
        wpm: finalWpm,
        accuracy: finalAcc,
        errors: this.errorCount,
        duration: this.currentMode === 'timed' ? (this.timedDuration || 30) : Math.round(elapsedMinutes * 60),
        mode: this.currentMode
      });
      this.updateDailyGoalUI();
    } catch (err) {
      console.error('Storage record error in completeSession:', err);
    }

    // 3. Level threshold resolution
    let currentLevelNum = 1;
    if (this.currentLesson?.id) {
      const match = String(this.currentLesson.id).match(/^([1-6])/);
      if (match) currentLevelNum = parseInt(match[1], 10);
    }
    const lessonThreshold = this.currentLesson?.id ? LEVEL_PASS_THRESHOLDS[this.currentLesson.id] : null;
    const defaultThreshold = LEVEL_PASS_THRESHOLDS[currentLevelNum] || {
      wpm: 15,
      accuracy: 95,
      minKeyAccuracy: 90
    };
    const threshold = {
      wpm: this.currentLesson?.targetWpm || lessonThreshold?.wpm || defaultThreshold.wpm,
      accuracy: lessonThreshold?.accuracy || defaultThreshold.accuracy,
      minKeyAccuracy: lessonThreshold?.minKeyAccuracy || defaultThreshold.minKeyAccuracy,
      minLength: lessonThreshold?.minLength || defaultThreshold.minLength,
      maxLength: lessonThreshold?.maxLength || defaultThreshold.maxLength
    };

    const isWpmPassed = finalWpm >= threshold.wpm;
    const isAccPassed = finalAcc >= threshold.accuracy;

    // 4. Per-key accuracy evaluation (first-attempt-per-position - safe try/catch)
    let failedKeys = [];
    let isPerKeyPassed = true;
    try {
      const byPosition = new Map();
      const log = (sessionLogger.getLog ? sessionLogger.getLog() : []) || [];
      for (const entry of log) {
        const pos = entry.positionIndex ?? 0;
        if (!byPosition.has(pos)) {
          byPosition.set(pos, entry);
        }
      }

      const keyAttempts = {};
      const keyErrors = {};
      for (const [pos, firstKey] of byPosition.entries()) {
        const ch = firstKey.expectedChar;
        if (!ch) continue;
        keyAttempts[ch] = (keyAttempts[ch] || 0) + 1;
        if (!firstKey.correct) {
          keyErrors[ch] = (keyErrors[ch] || 0) + 1;
        }
      }

      for (const [ch, attempts] of Object.entries(keyAttempts)) {
        const errors = keyErrors[ch] || 0;
        const keyAcc = Math.round(((attempts - errors) / attempts) * 100);
        if (keyAcc < threshold.minKeyAccuracy) {
          failedKeys.push({ key: ch, accuracy: keyAcc, attempts, errors });
        }
      }
      isPerKeyPassed = failedKeys.length === 0;
    } catch (err) {
      console.error('Per-key evaluation error in completeSession:', err);
      isPerKeyPassed = true;
    }

    const isPassed = isWpmPassed && isAccPassed && isPerKeyPassed;

    // Calculate stars
    let stars = 1;
    if (isPassed) {
      if (finalWpm >= threshold.wpm + 10 && finalAcc >= 98) {
        stars = 3;
      } else if (finalWpm >= threshold.wpm + 5 && finalAcc >= threshold.accuracy) {
        stars = 2;
      }
    }

    // 5. Course unlock / scoring (optional - safe try/catch)
    try {
      const isCourseLesson = LESSON_LEVELS.some(lvl => lvl.lessons.some(l => l.id === this.currentLesson?.id));
      if (isPassed) {
        sound.playSuccess();
        if (isCourseLesson) {
          StorageManager.saveLessonScore(this.currentLesson.id, {
            wpm: finalWpm,
            accuracy: finalAcc,
            stars: stars
          });
          this.unlockNextLessonSequence(this.currentLesson.id);
        }
      } else if (this.currentMode === 'placement') {
        this.evaluatePlacementTest(finalWpm, finalAcc);
        return;
      }
    } catch (err) {
      console.error('Course unlock/scoring error in completeSession:', err);
    }

    const criteriaDetails = [
      {
        name: 'ความเร็วการพิมพ์',
        required: `>= ${threshold.wpm} WPM`,
        actual: `${finalWpm} WPM`,
        passed: isWpmPassed
      },
      {
        name: 'ความแม่นยำรวม',
        required: `>= ${threshold.accuracy}%`,
        actual: `${finalAcc}%`,
        passed: isAccPassed
      },
      {
        name: `ความแม่นยำรายปุ่ม (ทุกปุ่มต้อง >= ${threshold.minKeyAccuracy}%)`,
        required: `ทุกปุ่ม >= ${threshold.minKeyAccuracy}%`,
        actual: failedKeys.length === 0
          ? 'ผ่านเกณฑ์ทุกปุ่ม (≥ 90%)'
          : failedKeys.map(k => `[ ${k.key === ' ' ? 'Space' : k.key} ]: ${k.accuracy}% (${k.errors}/${k.attempts} ผิด)`).join(', '),
        passed: isPerKeyPassed
      }
    ];

    // 6. Show result modal - ALWAYS guaranteed to open with Retry / Next (if passed) / Close
    try {
      this.showResultModal({
        isPassed,
        wpm: finalWpm,
        accuracy: finalAcc,
        errors: this.errorCount,
        targetWpm: threshold.wpm,
        minAcc: threshold.accuracy,
        stars: isPassed ? stars : 0,
        failedKeys,
        criteriaDetails,
        currentLevelNum
      });
    } catch (err) {
      console.error('Error showing result modal in completeSession:', err);
      if (this.dom.resultModal) {
        this.openModal(this.dom.resultModal);
      }
    }
  }

  unlockNextLessonSequence(currentId) {
    let allLessons = [];
    LESSON_LEVELS.forEach(lvl => allLessons.push(...lvl.lessons));

    const currentIndex = allLessons.findIndex(l => l.id === currentId);
    if (currentIndex !== -1 && currentIndex + 1 < allLessons.length) {
      const nextLesson = allLessons[currentIndex + 1];
      StorageManager.unlockLesson(nextLesson.id);
    }
  }

  generateSuggestions(sessionData) {
    const suggestions = [];
    const analytics = StorageManager.getAnalytics() || {};
    const { isPassed, wpm, accuracy, errors, targetWpm } = sessionData;

    // 1. Confusion check (e.g., e->r mix-up)
    if (analytics.confusions) {
      let topExp = null;
      let topAct = null;
      let topCount = 0;
      for (const [exp, typedMap] of Object.entries(analytics.confusions)) {
        if (typeof typedMap === 'object' && typedMap !== null) {
          for (const [act, cnt] of Object.entries(typedMap)) {
            if (cnt > topCount) {
              topCount = cnt;
              topExp = exp;
              topAct = act;
            }
          }
        }
      }
      if (topCount >= 2 && topExp && topAct) {
        const expLabel = topExp === ' ' ? 'Space' : topExp;
        const actLabel = topAct === ' ' ? 'Space' : topAct;
        suggestions.push(`สับสน '${expLabel}' ➔ '${actLabel}' บ่อย (${topCount} ครั้ง): แนะนำทำ Weak-Spot Drill ซ่อมคู่นี้`);
      }
    }

    // 2. Slowest or most error-prone weak key from analytics
    const weakKeys = getTopWeakKeys(analytics, 5);
    if (weakKeys && weakKeys.length > 0) {
      const worstErrorKey = [...weakKeys].sort((a, b) => b.errorRate - a.errorRate)[0];
      const slowestKey = [...weakKeys].sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)[0];

      if (worstErrorKey && worstErrorKey.errorRate > 0.12) {
        const kLabel = worstErrorKey.key === ' ' ? 'Space' : worstErrorKey.key;
        suggestions.push(`ปุ่มผิดบ่อยสุด: '${kLabel}' (พลาด ${Math.round(worstErrorKey.errorRate * 100)}%): สังเกตตำแหน่งนิ้วก่อนเคาะ`);
      } else if (slowestKey && slowestKey.avgLatencyMs > 450) {
        const kLabel = slowestKey.key === ' ' ? 'Space' : slowestKey.key;
        suggestions.push(`ปุ่มช้าที่สุด: '${kLabel}' (${Math.round(slowestKey.avgLatencyMs)}ms): ซ้อมเคาะจังหวะให้นิ้วขยับคล่องขึ้น`);
      }
    }

    // 3. Speed vs Accuracy balance advice
    if (accuracy < 95) {
      suggestions.push(`ความแม่นยำ ${accuracy}% ต่ำกว่าเกณฑ์: ชะลอความเร็วลง เน้นพิมพ์ถูก 100% ต่อเนื่องก่อนเร่งสปีด`);
    } else if (accuracy >= 95 && wpm < (targetWpm || 25)) {
      suggestions.push(`ความแม่นยำดีเยี่ยม (${accuracy}%) แต่ความเร็วยังต่ำกว่าเป้า (${wpm}/${targetWpm || 25} WPM): ลองฝึกโหมดจับเวลา (Timed Mode) 30s เพื่อเร่งสปีด`);
    } else if (accuracy >= 98 && wpm >= (targetWpm || 25)) {
      suggestions.push(`ผ่านเกณฑ์ยอดเยี่ยม! แนะนำเปิดโหมด 'No-Peek' (ซ่อนคีย์บอร์ด) เพื่อฝึกความจำกล้ามเนื้อขั้นสูง`);
    }

    // 4. Fallback if still under 2 suggestions: check weak bigrams
    if (suggestions.length < 2 && analytics.bigrams) {
      const bgEntries = Object.entries(analytics.bigrams).sort((a, b) => b[1].errors - a[1].errors);
      if (bgEntries.length > 0 && bgEntries[0][1].errors > 0) {
        suggestions.push(`คู่ตัวอักษรที่สะดุด: '${bgEntries[0][0]}' (ผิด ${bgEntries[0][1].errors} ครั้ง): ฝึกจังหวะส่งนิ้วต่อกัน`);
      }
    }

    // 5. General fallback
    if (suggestions.length < 2) {
      suggestions.push(`รักษาท่าทางและผ่อนคลายนิ้วมือ ฝึกสม่ำเสมอวันละ 15 นาทีเพื่อสร้าง Muscle Memory`);
    }

    return suggestions.slice(0, 3);
  }

  showResultModal(data) {
    const { isPassed, wpm, accuracy, errors, targetWpm, minAcc, stars, failedKeys, criteriaDetails, currentLevelNum } = data;

    // Status header and stars
    try {
      if (isPassed) {
        if (this.dom.resultStatusIcon) this.dom.resultStatusIcon.textContent = '🎉';
        if (this.dom.resultStatusTitle) {
          this.dom.resultStatusTitle.textContent = 'ยอดเยี่ยม! ผ่านด่านแล้ว';
          this.dom.resultStatusTitle.className = 'result-status-title passed';
        }
        
        let starDetail = '';
        if (stars === 1) {
          const diff2 = (targetWpm + 5) - wpm;
          starDetail = `<div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">(เกณฑ์ 2 ดาว: ${targetWpm + 5} WPM — ต้องการอีกเพียง ${Math.max(1, diff2)} WPM)</div>`;
        } else if (stars === 2) {
          const diff3 = (targetWpm + 10) - wpm;
          starDetail = `<div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">(เกณฑ์ 3 ดาว: ${targetWpm + 10} WPM & Acc >= 98% — ขาดอีก ${Math.max(1, diff3)} WPM)</div>`;
        } else if (stars === 3) {
          starDetail = `<div style="font-size:0.85rem; color:var(--accent-yellow); margin-top:4px;">(3 ดาว ระดับปรมาจารย์! 🏆)</div>`;
        }

        if (this.dom.resultStars) {
          this.dom.resultStars.innerHTML = `
            <div>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
            ${starDetail}
          `;
        }
      } else {
        if (this.dom.resultStatusIcon) this.dom.resultStatusIcon.textContent = '💪';
        if (this.dom.resultStatusTitle) {
          this.dom.resultStatusTitle.textContent = 'ยังไม่ผ่านเกณฑ์! ฝึกซ่อมจุดที่พลาด';
          this.dom.resultStatusTitle.className = 'result-status-title failed';
        }
        if (this.dom.resultStars) {
          this.dom.resultStars.innerHTML = `<span style="font-size:0.9rem; color:var(--text-muted)">เกณฑ์ผ่านเลเวล ${currentLevelNum}: WPM >= ${targetWpm}, Acc >= ${minAcc}%, ทุกปุ่ม >= 90%</span>`;
        }
      }
    } catch (err) {
      console.error('Error rendering result status header:', err);
    }

    // Modal action buttons: Retry is ALWAYS visible; Next is ONLY visible if passed
    if (this.dom.resultRetryBtn) {
      this.dom.resultRetryBtn.style.display = 'inline-flex';
    }
    if (this.dom.resultNextBtn) {
      this.dom.resultNextBtn.style.display = isPassed ? 'inline-flex' : 'none';
    }

    // Numeric stats
    try {
      if (this.dom.resultWpm) this.dom.resultWpm.textContent = wpm;
      if (this.dom.resultAcc) this.dom.resultAcc.textContent = `${accuracy}%`;
      if (this.dom.resultErrors) this.dom.resultErrors.textContent = errors;
    } catch (err) {
      console.error('Error setting numeric result metrics:', err);
    }

    // Optional: Fail details breakdown & practice button
    try {
      if (isPassed) {
        if (this.dom.resultFailBox) {
          this.dom.resultFailBox.style.display = 'none';
        }
      } else {
        if (this.dom.resultFailBox && this.dom.resultFailList) {
          this.dom.resultFailBox.style.display = 'block';
          const listHtml = (criteriaDetails || []).map(c => `
            <div class="result-fail-item ${c.passed ? 'passed' : 'failed'}">
              <span>${c.passed ? '✅' : '❌'}</span>
              <span><strong>${c.name}:</strong> ได้ ${c.actual} (เกณฑ์: ${c.required})</span>
            </div>
          `).join('');
          this.dom.resultFailList.innerHTML = listHtml;

          if (this.dom.resultFailPracticeBtn) {
            if (failedKeys && failedKeys.length > 0) {
              const keysDisplay = failedKeys.map(k => `[ ${k.key === ' ' ? 'Space' : k.key} ]`).join(' ');
              this.dom.resultFailPracticeBtn.innerHTML = `<span>🎯</span> ซ่อมปุ่มที่ไม่ผ่านเกณฑ์ทันที: ${keysDisplay}`;
              this.dom.resultFailPracticeBtn.onclick = () => {
                this.closeModal(this.dom.resultModal);
                const drill = DrillGenerator.generateWeakKeyDrill(failedKeys.map(k => k.key), {
                  titlePrefix: '🎯 ซ่อมปุ่มที่ไม่ผ่านเกณฑ์'
                });
                this.loadLesson(drill, 'weak');
              };
            } else {
              this.dom.resultFailPracticeBtn.innerHTML = `<span>⚡</span> ซ้อมด่านนี้อีกครั้งเพื่อเพิ่มความเร็ว`;
              this.dom.resultFailPracticeBtn.onclick = () => {
                this.closeModal(this.dom.resultModal);
                this.resetSession();
              };
            }
          }
        }
      }
    } catch (err) {
      console.error('Error rendering fail details box:', err);
    }

    // Optional: Suggest No-Peek mode after Level 1 is passed
    try {
      if (isPassed && currentLevelNum === 1 && !this.settings.noPeek && this.dom.resultNoPeekBox) {
        this.dom.resultNoPeekBox.style.display = 'flex';
      } else if (this.dom.resultNoPeekBox) {
        this.dom.resultNoPeekBox.style.display = 'none';
      }
    } catch (err) {
      console.error('Error rendering no-peek prompt:', err);
    }

    // Optional: Before/After Comparison for Targeted Weak Keys in Drill Mode
    try {
      if (this.currentLesson?.snapshot && this.currentLesson?.targetKeys) {
        const snapshot = this.currentLesson.snapshot;
        const targetKeys = this.currentLesson.targetKeys;
        const compList = this.dom.resultDrillComparisonList;
        if (compList) {
          compList.innerHTML = targetKeys.map(k => {
            const beforeInfo = snapshot[k] || { errorRate: 0 };
            const beforeRate = Math.round(beforeInfo.errorRate * 100);

            const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const timesExpected = (this.targetText.match(new RegExp(escaped, 'gi')) || []).length;
            const timesMistaken = (this.mistakeMap[k] || 0) + (this.mistakeMap[k.toUpperCase()] || 0);
            const sessionRate = timesExpected > 0 ? Math.round((timesMistaken / timesExpected) * 100) : 0;

            const isImproved = sessionRate <= beforeRate;
            const badgeColor = isImproved ? 'var(--accent-green)' : 'var(--accent-red)';
            const badgeIcon = isImproved ? '▼ ลดลง (พัฒนาขึ้น)' : '▲ พลาดเพิ่ม';
            const displayChar = k === ' ' ? '␣ Space' : k === '\n' ? '↵ Enter' : k;

            return `
              <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); padding:0.4rem 0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border-color)">
                <span>ปุ่ม <strong>[ ${displayChar} ]</strong>: ก่อนซ้อมพลาด <strong style="color:var(--text-secondary)">${beforeRate}%</strong> ➔ รอบนี้พลาด <strong style="color:${badgeColor}">${sessionRate}%</strong></span>
                <span style="font-size:0.75rem; color:${badgeColor}; font-weight:700">${badgeIcon}</span>
              </div>
            `;
          }).join('');
          if (this.dom.resultDrillComparison) {
            this.dom.resultDrillComparison.style.display = 'block';
          }
        }
      } else {
        if (this.dom.resultDrillComparison) {
          this.dom.resultDrillComparison.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Error rendering drill comparison:', err);
    }

    // Optional: Display session weak keys tags
    try {
      const mistakeEntries = Object.entries(this.mistakeMap).sort((a, b) => b[1] - a[1]);
      if (mistakeEntries.length > 0 && this.dom.resultWeakKeysBox && this.dom.resultWeakKeyTags) {
        this.dom.resultWeakKeysBox.style.display = 'block';
        this.dom.resultWeakKeyTags.innerHTML = mistakeEntries.slice(0, 5).map(([char, count]) => {
          const displayChar = char === ' ' ? 'Space' : char === '\n' ? 'Enter' : char;
          return `<span class="weak-key-tag">${displayChar} (ผิด ${count} ครั้ง)</span>`;
        }).join('');
      } else if (this.dom.resultWeakKeysBox) {
        this.dom.resultWeakKeysBox.style.display = 'none';
      }
    } catch (err) {
      console.error('Error rendering session weak key tags:', err);
    }

    // Phase 5.1: "What to work on next" summary suggestions
    try {
      if (this.dom.resultSuggestionsBox && this.dom.resultSuggestionsList) {
        const suggestions = this.generateSuggestions(data);
        if (suggestions && suggestions.length > 0) {
          this.dom.resultSuggestionsList.innerHTML = suggestions.map(item => `
            <div class="suggestion-item">
              <span style="color:var(--accent-cyan); font-weight:bold;">💡</span>
              <span>${item}</span>
            </div>
          `).join('');
          this.dom.resultSuggestionsBox.style.display = 'block';
        } else {
          this.dom.resultSuggestionsBox.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Error rendering suggestions:', err);
    }

    // ALWAYS open the result modal
    if (this.dom.resultModal) {
      this.openModal(this.dom.resultModal);
    }
  }

  evaluatePlacementTest(wpm, acc) {
    let recLevel = 1;
    let recName = 'Level 1: Home Row (วางนิ้วหลัก asdf jkl;)';
    let rationale = 'เหมาะสำหรับผู้ที่ยังต้องมองแป้นคีย์บอร์ด หรือเพิ่งเริ่มฝึกวางนิ้วสัมผัสที่ถูกต้อง';

    if (wpm >= 50 && acc >= 92) {
      recLevel = 6;
      recName = 'Level 6: Real Code Snippets (เขียนโค้ดจริงระดับโปรแกรมเมอร์)';
      rationale = 'คุณมีความเร็วและความแม่นยำในระดับดีเยี่ยม พร้อมลุยโค้ดโครงสร้างจริงและคำสั่ง Shell ทันที!';
    } else if (wpm >= 35 && acc >= 90) {
      recLevel = 5;
      recName = 'Level 5: Code Symbols (สัญลักษณ์ { } [ ] < > = ; & _) ';
      rationale = 'คุณพิมพ์ข้อความปกติได้คล่องแล้ว ถึงเวลาฝึกกดสัญลักษณ์พิเศษที่โปรแกรมเมอร์ต้องใช้ทุกวัน!';
    } else if (wpm >= 25 && acc >= 88) {
      recLevel = 3;
      recName = 'Level 3: Capitals, Numbers & Punctuation';
      rationale = 'คุณจำตัวอักษรพื้นฐานได้ดี ให้ต่อยอดที่ปุ่ม Shift ข้ามมือ และแถวตัวเลข';
    }

    // Save placement result
    StorageManager.savePlacementResult({
      wpm,
      accuracy: acc,
      recommendedLevel: recLevel,
      date: Date.now()
    });

    // Automatically unlock lessons up to the recommended level
    for (const lvl of LESSON_LEVELS) {
      if (lvl.id <= recLevel) {
        lvl.lessons.forEach(les => StorageManager.unlockLesson(les.id));
      }
    }

    // Show Placement results dialog
    const modal = this.dom.placementModal;
    modal.querySelector('#placement-results-content').innerHTML = `
      <div style="text-align:center; margin-bottom:1.5rem">
        <div style="font-size:3rem">🎯</div>
        <h3 style="font-size:1.4rem; font-weight:800; margin:0.5rem 0">ผลการวัดระดับทักษะของคุณ</h3>
        <p style="color:var(--text-secondary)">ความเร็วเฉลี่ย: <strong style="color:var(--accent-cyan); font-size:1.2rem">${wpm} WPM</strong> | ความแม่นยำ: <strong style="color:var(--accent-green); font-size:1.2rem">${acc}%</strong></p>
      </div>

      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.2rem; margin-bottom:1.5rem">
        <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">ระดับที่ระบบแนะนำให้เริ่ม:</div>
        <h4 style="color:var(--accent-cyan); font-size:1.15rem; margin:0.3rem 0">${recName}</h4>
        <p style="font-size:0.875rem; color:var(--text-secondary)">${rationale}</p>
      </div>

      <div style="display:flex; gap:0.75rem; justify-content:flex-end">
        <button id="placement-start-rec-btn" class="action-btn btn-accent">เริ่มที่ระดับแนะนำ (${recName.split(':')[0]})</button>
        <button id="placement-start-l1-btn" class="action-btn">เริ่มจากศูนย์ (Level 1) เพื่อความแม่นยำ</button>
      </div>
    `;

    modal.querySelector('#placement-start-rec-btn').onclick = () => {
      this.closeModal(modal);
      const targetLvl = LESSON_LEVELS.find(l => l.id === recLevel) || LESSON_LEVELS[0];
      this.loadLesson(targetLvl.lessons[0], 'course');
    };

    modal.querySelector('#placement-start-l1-btn').onclick = () => {
      this.closeModal(modal);
      this.loadLesson(LESSON_LEVELS[0].lessons[0], 'course');
    };

    this.openModal(modal);
  }

  showPlacementPrompt() {
    const modal = this.dom.placementModal;
    modal.querySelector('#placement-results-content').innerHTML = `
      <div style="text-align:center; padding:1rem 0">
        <div style="font-size:3.5rem; margin-bottom:0.5rem">⌨️</div>
        <h3 style="font-size:1.5rem; font-weight:800; margin-bottom:0.5rem">ยินดีต้อนรับสู่ Touch Typing Master!</h3>
        <p style="color:var(--text-secondary); margin-bottom:1.5rem; line-height:1.6">
          คุณต้องการทำแบบทดสอบสั้นๆ เพื่อให้ระบบประเมินความเร็วและความแม่นยำปัจจุบันก่อนไหม? หรือเริ่มฝึกก้าวแรกจาก <strong>Home Row</strong> เลย?
        </p>
        <div style="display:flex; justify-content:center; gap:1rem">
          <button id="prompt-test-btn" class="action-btn btn-accent" style="padding:0.7rem 1.4rem">🎯 ทดสอบวัดระดับก่อน (1 นาที)</button>
          <button id="prompt-l1-btn" class="action-btn" style="padding:0.7rem 1.4rem">🏠 เริ่มฝึกจากศูนย์ (Level 1)</button>
        </div>
      </div>
    `;

    modal.querySelector('#prompt-test-btn').onclick = () => {
      this.closeModal(modal);
      this.startPlacementTest();
    };

    modal.querySelector('#prompt-l1-btn').onclick = () => {
      this.closeModal(modal);
      this.loadLesson(LESSON_LEVELS[0].lessons[0], 'course');
    };

    this.openModal(modal);
  }

  loadNextLesson() {
    let allLessons = [];
    LESSON_LEVELS.forEach(lvl => allLessons.push(...lvl.lessons));

    const currentIndex = allLessons.findIndex(l => l.id === this.currentLesson?.id);
    if (currentIndex !== -1 && currentIndex + 1 < allLessons.length) {
      this.loadLesson(allLessons[currentIndex + 1], 'course');
    } else {
      this.openCourseModal();
    }
  }

  openCourseModal() {
    const unlocked = StorageManager.getUnlockedLessons();
    const scores = StorageManager.getLessonScores();
    const container = this.dom.courseLevelsContainer;
    container.innerHTML = '';

    LESSON_LEVELS.forEach(level => {
      const groupEl = document.createElement('div');
      groupEl.className = 'level-group';

      groupEl.innerHTML = `
        <div class="level-group-header">
          <span style="font-size:1.5rem">${level.icon}</span>
          <div>
            <h3>${level.title}</h3>
            <p style="font-size:0.8rem; color:var(--text-secondary)">${level.description}</p>
          </div>
        </div>
        <div class="lesson-grid"></div>
      `;

      const gridEl = groupEl.querySelector('.lesson-grid');

      level.lessons.forEach(les => {
        const isUnlocked = unlocked.includes(les.id);
        const score = scores[les.id];
        const card = document.createElement('div');
        card.className = `lesson-card ${isUnlocked ? '' : 'locked'} ${this.currentLesson?.id === les.id ? 'active-lesson' : ''}`;

        let starsHtml = '';
        if (score?.stars) {
          starsHtml = `<span style="color:var(--accent-yellow)">${'★'.repeat(score.stars)}</span>`;
        }

        card.innerHTML = `
          <div class="card-top">
            <span class="lesson-id-tag">${les.id}</span>
            <span>${starsHtml}</span>
          </div>
          <div class="lesson-card-title">${les.title}</div>
          <div class="lesson-card-meta">
            <span>เป้าหมาย: ${les.targetWpm} WPM</span>
            <span>${score ? `สถิติ: ${score.bestWpm} WPM` : (isUnlocked ? 'พร้อมฝึก' : '🔒 ล็อก')}</span>
          </div>
        `;

        if (isUnlocked) {
          card.onclick = () => {
            this.closeModal(this.dom.courseModal);
            this.loadLesson(les, 'course');
          };
        }

        gridEl.appendChild(card);
      });

      container.appendChild(groupEl);
    });

    this.openModal(this.dom.courseModal);
  }

  openStatsModal() {
    const history = StorageManager.getHistory();

    // Summary statistics
    const totalTests = history.length;
    const bestWpm = history.reduce((max, h) => Math.max(max, h.wpm), 0);
    const avgAcc = totalTests > 0
      ? Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / totalTests)
      : 100;

    const elTotal = document.getElementById('stat-total-tests');
    const elBest = document.getElementById('stat-best-wpm');
    const elAvg = document.getElementById('stat-avg-acc');
    if (elTotal) elTotal.textContent = totalTests;
    if (elBest) elBest.textContent = bestWpm;
    if (elAvg) elAvg.textContent = `${avgAcc}%`;

    // Phase 4.3: Render Daily Practice Goal & Streak Card
    if (this.dom.statsDailyGoalSection) {
      const dailyStats = StorageManager.computeDailyStats(history, this.settings.dailyGoalMinutes || 15);
      renderDailyGoalCard(this.dom.statsDailyGoalSection, dailyStats);
    }

    // Phase 4.3: Render Per-Level Progress Breakdown
    if (this.dom.statsLevelProgressContainer) {
      const scores = StorageManager.getLessonScores();
      const unlocked = StorageManager.getUnlockedLessons();
      renderPerLevelProgress(this.dom.statsLevelProgressContainer, scores, unlocked);
    }

    // Phase 2: Render Heatmap & Analytics Breakdown
    this.renderAnalyticsHeatmapUI();

    this.openModal(this.dom.statsModal);

    // Render Progress Chart
    setTimeout(() => {
      if (this.chart) {
        this.chart.setData(history);
      }
    }, 150);
  }

  renderAnalyticsHeatmapUI() {
    const analytics = StorageManager.getAnalytics();
    const { scores } = computeWeaknessScores(analytics);
    const hasScoredKeys = Object.values(scores).some(s => s.score !== null);

    if (!hasScoredKeys) {
      if (this.dom.heatmapEmptyState) this.dom.heatmapEmptyState.style.display = 'block';
      if (this.dom.heatmapBreakdown) this.dom.heatmapBreakdown.style.display = 'none';
    } else {
      if (this.dom.heatmapEmptyState) this.dom.heatmapEmptyState.style.display = 'none';
      if (this.dom.heatmapBreakdown) this.dom.heatmapBreakdown.style.display = 'grid';
    }

    // Render visual keyboard heatmap
    if (this.dom.heatmapContainer) {
      renderHeatmap(this.dom.heatmapContainer, scores);

      // Attach hover listener for interactive detail display
      this.dom.heatmapContainer.querySelectorAll('.kb-heatmap-key').forEach(keyEl => {
        keyEl.addEventListener('mouseenter', () => {
          const char = keyEl.dataset.keyChar;
          if (!char) return;
          const displayChar = char === ' ' ? '␣ Space' : char === '\n' ? '↵ Enter' : char;
          if (keyEl.dataset.hasData === 'true') {
            this.dom.heatmapKeyDetail.innerHTML = `
              ปุ่ม <strong>[ ${displayChar} ]</strong> —
              คะแนนจุดอ่อน: <strong style="color:var(--accent-red)">${keyEl.dataset.scorePct}%</strong> |
              อัตราผิด: <strong>${keyEl.dataset.errPct}%</strong> |
              ลองพิมพ์: <strong>${keyEl.dataset.attempts}</strong> ครั้ง |
              ดีเลย์เฉลี่ย: <strong>${keyEl.dataset.latency}</strong>
            `;
          } else {
            this.dom.heatmapKeyDetail.innerHTML = `
              ปุ่ม <strong>[ ${displayChar} ]</strong> — ข้อมูลยังไม่เพียงพอ (${keyEl.dataset.attempts || 0}/15 ครั้ง)
            `;
          }
        });
      });
    }

    // Render Top Weak Keys
    const topWeak = getTopWeakKeys(analytics, 5);
    if (this.dom.analyticsTopWeakKeys) {
      if (topWeak.length === 0) {
        this.dom.analyticsTopWeakKeys.innerHTML = '<div class="analytics-empty-hint">ยังไม่มีจุดอ่อนสะสมเกิน 15 ครั้ง</div>';
      } else {
        this.dom.analyticsTopWeakKeys.innerHTML = topWeak.map(k => {
          const displayKey = k.key === ' ' ? '␣ Space' : k.key === '\n' ? '↵ Enter' : `[ ${k.key} ]`;

          // Reason label: "ผิดบ่อย", "ช้า", or "ผิดบ่อย + ช้า"
          const errVal = 0.6 * (k.normErrorRate || 0);
          const slowVal = 0.4 * (k.normSlowness || 0);
          let reason = 'ผิดบ่อย';
          if (errVal >= 0.15 && slowVal >= 0.15 && Math.abs(errVal - slowVal) <= 0.25) {
            reason = 'ผิดบ่อย + ช้า';
          } else if (slowVal > errVal) {
            reason = 'ช้า';
          }

          return `
            <div class="analytics-stat-pill">
              <div style="display:flex; align-items:center; gap:0.45rem;">
                <span class="key-char">${displayKey}</span>
                <span class="key-reason-badge" style="font-size:0.68rem; padding:1px 6px; border-radius:3px; background:rgba(244,63,94,0.18); color:var(--accent-red); font-weight:700;">${reason}</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <span style="font-size:0.78rem; color:var(--text-secondary)">ผิด ${(k.errorRate * 100).toFixed(0)}% (${k.errors}/${k.attempts})</span>
                <span class="key-score">${(k.score * 100).toFixed(0)}%</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Top Confusions
    const confusions = getTopConfusions(analytics, 5);
    if (this.dom.analyticsTopConfusions) {
      if (confusions.length === 0) {
        this.dom.analyticsTopConfusions.innerHTML = '<div class="analytics-empty-hint">ยังไม่พบปุ่มกดสับสน</div>';
      } else {
        this.dom.analyticsTopConfusions.innerHTML = confusions.map(c => `
          <div class="analytics-stat-pill">
            <span class="key-char">${c.expectedChar} ➔ ${c.typedChar}</span>
            <span style="color:var(--text-secondary)">สับสน</span>
            <span class="key-score">${c.count} ครั้ง</span>
          </div>
        `).join('');
      }
    }

    // Render Top Bigrams
    const bigrams = getTopBigrams(analytics, 5);
    if (this.dom.analyticsTopBigrams) {
      if (bigrams.length === 0) {
        this.dom.analyticsTopBigrams.innerHTML = '<div class="analytics-empty-hint">ยังไม่พบคู่ตัวอักษรที่สะดุด</div>';
      } else {
        this.dom.analyticsTopBigrams.innerHTML = bigrams.map(b => `
          <div class="analytics-stat-pill">
            <span class="key-char">"${b.bigram}"</span>
            <span>ผิด ${(b.errorRate * 100).toFixed(0)}%</span>
            <span class="key-score">${b.errors} ครั้ง</span>
          </div>
        `).join('');
      }
    }
  }

  openModal(modal) {
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
    }
    this.dom.hiddenInput.focus();
  }

  destroy() {
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
    clearInterval(this.timerInterval);
    if (this.thaiWarningTimeout) {
      clearTimeout(this.thaiWarningTimeout);
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }
}

// Start application safely whether DOMContentLoaded has already fired or not
function startApp() {
  window.sessionLogger = sessionLogger;
  window.app = new TypeMasterApp();
}

if (typeof document !== 'undefined' && document.getElementById('typing-box')) {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
}

export { TypeMasterApp };
