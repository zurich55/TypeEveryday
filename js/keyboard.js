// Keyboard and Finger Configuration & Helpers

export const FINGERS = {
  LP: { id: 'LP', name: 'นิ้วก้อยซ้าย (Left Pinky)', hand: 'left', finger: 'pinky', color: '#f43f5e' },
  LR: { id: 'LR', name: 'นิ้วนางซ้าย (Left Ring)', hand: 'left', finger: 'ring', color: '#fb923c' },
  LM: { id: 'LM', name: 'นิ้วกลางซ้าย (Left Middle)', hand: 'left', finger: 'middle', color: '#facc15' },
  LI: { id: 'LI', name: 'นิ้วชี้ซ้าย (Left Index)', hand: 'left', finger: 'index', color: '#38bdf8' },
  LT: { id: 'LT', name: 'นิ้วโป้งซ้าย (Left Thumb)', hand: 'left', finger: 'thumb', color: '#a855f7' },
  RT: { id: 'RT', name: 'นิ้วโป้งขวา (Right Thumb)', hand: 'right', finger: 'thumb', color: '#a855f7' },
  RI: { id: 'RI', name: 'นิ้วชี้ขวา (Right Index)', hand: 'right', finger: 'index', color: '#2dd4bf' },
  RM: { id: 'RM', name: 'นิ้วกลางขวา (Right Middle)', hand: 'right', finger: 'middle', color: '#4ade80' },
  RR: { id: 'RR', name: 'นิ้วนางขวา (Right Ring)', hand: 'right', finger: 'ring', color: '#fb923c' },
  RP: { id: 'RP', name: 'นิ้วก้อยขวา (Right Pinky)', hand: 'right', finger: 'pinky', color: '#f43f5e' }
};

// Physical keyboard layout representation
export const KEYBOARD_LAYOUT = [
  // Row 1
  [
    { code: 'Backquote', key: '`', shiftKey: '~', finger: 'LP' },
    { code: 'Digit1', key: '1', shiftKey: '!', finger: 'LP' },
    { code: 'Digit2', key: '2', shiftKey: '@', finger: 'LR' },
    { code: 'Digit3', key: '3', shiftKey: '#', finger: 'LM' },
    { code: 'Digit4', key: '4', shiftKey: '$', finger: 'LI' },
    { code: 'Digit5', key: '5', shiftKey: '%', finger: 'LI' },
    { code: 'Digit6', key: '6', shiftKey: '^', finger: 'RI' },
    { code: 'Digit7', key: '7', shiftKey: '&', finger: 'RI' },
    { code: 'Digit8', key: '8', shiftKey: '*', finger: 'RM' },
    { code: 'Digit9', key: '9', shiftKey: '(', finger: 'RR' },
    { code: 'Digit0', key: '0', shiftKey: ')', finger: 'RP' },
    { code: 'Minus', key: '-', shiftKey: '_', finger: 'RP' },
    { code: 'Equal', key: '=', shiftKey: '+', finger: 'RP' },
    { code: 'Backspace', label: 'Backspace', width: 2, finger: 'RP' }
  ],
  // Row 2
  [
    { code: 'Tab', label: 'Tab', width: 1.5, finger: 'LP' },
    { code: 'KeyQ', key: 'q', shiftKey: 'Q', finger: 'LP' },
    { code: 'KeyW', key: 'w', shiftKey: 'W', finger: 'LR' },
    { code: 'KeyE', key: 'e', shiftKey: 'E', finger: 'LM' },
    { code: 'KeyR', key: 'r', shiftKey: 'R', finger: 'LI' },
    { code: 'KeyT', key: 't', shiftKey: 'T', finger: 'LI' },
    { code: 'KeyY', key: 'y', shiftKey: 'Y', finger: 'RI' },
    { code: 'KeyU', key: 'u', shiftKey: 'U', finger: 'RI' },
    { code: 'KeyI', key: 'i', shiftKey: 'I', finger: 'RM' },
    { code: 'KeyO', key: 'o', shiftKey: 'O', finger: 'RR' },
    { code: 'KeyP', key: 'p', shiftKey: 'P', finger: 'RP' },
    { code: 'BracketLeft', key: '[', shiftKey: '{', finger: 'RP' },
    { code: 'BracketRight', key: ']', shiftKey: '}', finger: 'RP' },
    { code: 'Backslash', key: '\\', shiftKey: '|', width: 1.5, finger: 'RP' }
  ],
  // Row 3 (Home Row)
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75, finger: 'LP' },
    { code: 'KeyA', key: 'a', shiftKey: 'A', finger: 'LP', isHome: true },
    { code: 'KeyS', key: 's', shiftKey: 'S', finger: 'LR', isHome: true },
    { code: 'KeyD', key: 'd', shiftKey: 'D', finger: 'LM', isHome: true },
    { code: 'KeyF', key: 'f', shiftKey: 'F', finger: 'LI', isHome: true, hasBump: true },
    { code: 'KeyG', key: 'g', shiftKey: 'G', finger: 'LI' },
    { code: 'KeyH', key: 'h', shiftKey: 'H', finger: 'RI' },
    { code: 'KeyJ', key: 'j', shiftKey: 'J', finger: 'RI', isHome: true, hasBump: true },
    { code: 'KeyK', key: 'k', shiftKey: 'K', finger: 'RM', isHome: true },
    { code: 'KeyL', key: 'l', shiftKey: 'L', finger: 'RR', isHome: true },
    { code: 'Semicolon', key: ';', shiftKey: ':', finger: 'RP', isHome: true },
    { code: 'Quote', key: "'", shiftKey: '"', finger: 'RP' },
    { code: 'Enter', label: 'Enter', width: 2.25, finger: 'RP' }
  ],
  // Row 4
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25, finger: 'LP' },
    { code: 'KeyZ', key: 'z', shiftKey: 'Z', finger: 'LP' },
    { code: 'KeyX', key: 'x', shiftKey: 'X', finger: 'LR' },
    { code: 'KeyC', key: 'c', shiftKey: 'C', finger: 'LM' },
    { code: 'KeyV', key: 'v', shiftKey: 'V', finger: 'LI' },
    { code: 'KeyB', key: 'b', shiftKey: 'B', finger: 'LI' },
    { code: 'KeyN', key: 'n', shiftKey: 'N', finger: 'RI' },
    { code: 'KeyM', key: 'm', shiftKey: 'M', finger: 'RI' },
    { code: 'Comma', key: ',', shiftKey: '<', finger: 'RM' },
    { code: 'Period', key: '.', shiftKey: '>', finger: 'RR' },
    { code: 'Slash', key: '/', shiftKey: '?', finger: 'RP' },
    { code: 'ShiftRight', label: 'Shift', width: 2.75, finger: 'RP' }
  ],
  // Row 5
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.5, finger: 'LP' },
    { code: 'AltLeft', label: 'Alt', width: 1.25, finger: 'LT' },
    { code: 'Space', label: 'Space', width: 6.25, key: ' ', finger: 'RT' },
    { code: 'AltRight', label: 'Alt', width: 1.25, finger: 'RT' },
    { code: 'ControlRight', label: 'Ctrl', width: 1.5, finger: 'RP' }
  ]
];

// Lookup map for fast character to key info lookup
const CHAR_MAP = new Map();

KEYBOARD_LAYOUT.forEach(row => {
  row.forEach(item => {
    if (item.key) {
      CHAR_MAP.set(item.key, {
        code: item.code,
        requiresShift: false,
        shiftCode: null,
        finger: item.finger,
        isHome: !!item.isHome
      });
    }
    if (item.shiftKey) {
      // If typing character with left hand finger, use Right Shift; else Left Shift
      const fingerInfo = FINGERS[item.finger];
      const shiftCode = fingerInfo.hand === 'left' ? 'ShiftRight' : 'ShiftLeft';
      const shiftFinger = fingerInfo.hand === 'left' ? 'RP' : 'LP';

      CHAR_MAP.set(item.shiftKey, {
        code: item.code,
        requiresShift: true,
        shiftCode: shiftCode,
        shiftFinger: shiftFinger,
        finger: item.finger,
        isHome: false
      });
    }
  });
});

// Newline / enter support
CHAR_MAP.set('\n', {
  code: 'Enter',
  requiresShift: false,
  finger: 'RP',
  isHome: false
});

export function getKeyInfoForChar(char) {
  return CHAR_MAP.get(char) || null;
}

export function renderKeyboard(containerElement) {
  containerElement.innerHTML = '';

  KEYBOARD_LAYOUT.forEach((row, rowIndex) => {
    const rowEl = document.createElement('div');
    rowEl.className = `kb-row kb-row-${rowIndex + 1}`;

    row.forEach(key => {
      const keyEl = document.createElement('div');
      keyEl.className = 'kb-key';
      keyEl.dataset.code = key.code;
      keyEl.dataset.finger = key.finger;

      if (key.width) {
        keyEl.style.flexGrow = key.width;
      } else {
        keyEl.style.flexGrow = '1';
      }

      if (key.hasBump) {
        keyEl.classList.add('has-bump');
      }

      if (key.isHome) {
        keyEl.classList.add('is-home');
      }

      // Content of key
      if (key.label) {
        keyEl.innerHTML = `<span class="key-label">${key.label}</span>`;
      } else if (key.shiftKey && key.key) {
        keyEl.innerHTML = `
          <span class="key-shift">${escapeHtml(key.shiftKey)}</span>
          <span class="key-main">${escapeHtml(key.key.toUpperCase())}</span>
        `;
      } else if (key.key) {
        keyEl.innerHTML = `<span class="key-main">${escapeHtml(key.key)}</span>`;
      }

      rowEl.appendChild(keyEl);
    });

    containerElement.appendChild(rowEl);
  });
}

/**
 * Phase 2: Render visual keyboard heatmap using weaknessScores
 * Colors: Gray = not enough data, Green -> Yellow -> Red by weaknessScore (0..1)
 */
export function renderHeatmap(containerElement, keyScores = {}) {
  if (!containerElement) return;
  containerElement.innerHTML = '';

  const kbWrapper = document.createElement('div');
  kbWrapper.className = 'heatmap-keyboard-grid';

  KEYBOARD_LAYOUT.forEach((row, rowIndex) => {
    const rowEl = document.createElement('div');
    rowEl.className = `kb-row kb-row-${rowIndex + 1}`;

    row.forEach(key => {
      const keyEl = document.createElement('div');
      keyEl.className = 'kb-key kb-heatmap-key';
      keyEl.dataset.code = key.code;

      if (key.width) {
        keyEl.style.flexGrow = key.width;
      } else {
        keyEl.style.flexGrow = '1';
      }

      // Check score data for this key
      const lookupChar = key.key ? key.key.toLowerCase() : null;
      const scoreInfo = lookupChar && keyScores ? (keyScores[lookupChar] || keyScores[key.key]) : null;

      if (scoreInfo && scoreInfo.score !== null && scoreInfo.score !== undefined) {
        const score = Math.max(0, Math.min(1, scoreInfo.score));
        // Hue: 120 (pure green) -> 60 (yellow) -> 0 (red)
        const hue = Math.round(120 * (1 - score));
        keyEl.style.backgroundColor = `hsla(${hue}, 80%, 42%, 0.38)`;
        keyEl.style.borderColor = `hsl(${hue}, 80%, 50%)`;
        keyEl.style.boxShadow = `0 0 10px hsla(${hue}, 80%, 50%, 0.25)`;

        const scorePct = Math.round(score * 100);
        const errPct = Math.round(scoreInfo.errorRate * 100);
        const lat = Math.round(scoreInfo.avgLatencyMs);
        const charLabel = key.key === ' ' ? '␣ Space' : key.key === '\n' ? '↵ Enter' : key.key;

        keyEl.dataset.keyChar = key.key;
        keyEl.dataset.scorePct = scorePct;
        keyEl.dataset.errPct = errPct;
        keyEl.dataset.attempts = scoreInfo.attempts;
        keyEl.dataset.latency = lat > 0 ? `${lat}ms` : '--';
        keyEl.dataset.hasData = 'true';

        let tooltip = `ปุ่ม: [ ${charLabel} ]\nคะแนนจุดอ่อน: ${scorePct}%\nอัตราผิด: ${errPct}% (${scoreInfo.errors}/${scoreInfo.attempts})\nความเร็วเฉลี่ย: ${lat > 0 ? lat + ' ms' : '--'}`;
        if (scoreInfo.isMastered) {
          keyEl.classList.add('heatmap-key-mastered');
          tooltip += '\n★ Mastered (ความแม่นยำ ≥ 95% และเร็วกว่าค่ามัธยฐาน)';
        }
        keyEl.title = tooltip;
      } else if (lookupChar) {
        // Not enough data (< 15 attempts)
        const attempts = scoreInfo?.attempts || 0;
        const charLabel = key.key === ' ' ? '␣ Space' : key.key === '\n' ? '↵ Enter' : key.key;
        keyEl.style.backgroundColor = 'rgba(148, 163, 184, 0.08)';
        keyEl.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        keyEl.dataset.keyChar = key.key;
        keyEl.dataset.attempts = attempts;
        keyEl.dataset.hasData = 'false';
        keyEl.title = `ปุ่ม: [ ${charLabel} ]\nข้อมูลยังไม่เพียงพอ (${attempts}/15 ครั้ง)`;
      } else {
        keyEl.style.opacity = '0.5';
        keyEl.style.backgroundColor = 'rgba(148, 163, 184, 0.04)';
      }

      // Content of key
      const masteredStar = (scoreInfo && scoreInfo.isMastered)
        ? `<span class="heatmap-mastered-star" title="Mastered">★</span>`
        : '';

      if (key.label) {
        keyEl.innerHTML = `<span class="key-label">${key.label}</span>`;
      } else if (key.shiftKey && key.key) {
        const badge = scoreInfo && scoreInfo.score !== null
          ? `<span class="heatmap-key-badge">${Math.round(scoreInfo.score * 100)}%</span>`
          : '';
        keyEl.innerHTML = `
          ${masteredStar}
          <span class="key-shift">${escapeHtml(key.shiftKey)}</span>
          <span class="key-main">${escapeHtml(key.key.toUpperCase())}</span>
          ${badge}
        `;
      } else if (key.key) {
        const badge = scoreInfo && scoreInfo.score !== null
          ? `<span class="heatmap-key-badge">${Math.round(scoreInfo.score * 100)}%</span>`
          : '';
        keyEl.innerHTML = `
          ${masteredStar}
          <span class="key-main">${escapeHtml(key.key)}</span>
          ${badge}
        `;
      }

      rowEl.appendChild(keyEl);
    });

    kbWrapper.appendChild(rowEl);
  });

  containerElement.appendChild(kbWrapper);
}

function escapeHtml(str) {
  if (str === '&') return '&amp;';
  if (str === '<') return '&lt;';
  if (str === '>') return '&gt;';
  if (str === '"') return '&quot;';
  if (str === "'") return '&#039;';
  return str;
}
