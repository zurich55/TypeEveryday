// Native Canvas Progress Line Chart for WPM and Accuracy
// Zero external dependencies, High-DPI crisp rendering, interactive hover tooltips

export class ProgressChart {
  constructor(canvasElement, tooltipElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.tooltip = tooltipElement;
    this.data = [];
    this.hoverIndex = -1;

    this.initEvents();
  }

  initEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    window.addEventListener('resize', () => {
      if (this.data.length > 0) {
        this.render(this.data);
      }
    });
  }

  setData(historyData) {
    // History records: { timestamp, wpm, accuracy, lessonTitle, ... }
    // Sort chronologically and take up to the last 30 sessions for clarity
    this.data = [...historyData]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-30);
    this.render();
  }

  render() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height || 260;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    if (this.data.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ยังไม่มีข้อมูลประวัติการฝึกพิมพ์ — เริ่มฝึกเพื่อดูกราฟพัฒนาการ!', width / 2, height / 2);
      return;
    }

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const gridColor = isLight ? '#e2e8f0' : '#334155';
    const textColor = isLight ? '#475569' : '#94a3b8';
    const dotFill = isLight ? '#ffffff' : '#0f172a';

    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Find max WPM for y-scale
    const maxWpmVal = Math.max(...this.data.map(d => d.wpm), 40);
    const yMax = Math.ceil((maxWpmVal + 10) / 10) * 10;

    // Draw horizontal grid lines & labels
    const gridLines = 4;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridLines; i++) {
      const yVal = (yMax / gridLines) * i;
      const y = padding.top + chartH - (yVal / yMax) * chartH;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(`${Math.round(yVal)}`, padding.left - 10, y);
    }

    // Calculate point coordinates
    const points = this.data.map((item, idx) => {
      const x = padding.left + (this.data.length === 1 ? chartW / 2 : (idx / (this.data.length - 1)) * chartW);
      const yWpm = padding.top + chartH - (item.wpm / yMax) * chartH;
      const yAcc = padding.top + chartH - (item.accuracy / 100) * chartH;
      return { x, yWpm, yAcc, item, idx };
    });

    this.points = points;

    // 1. Draw WPM Gradient Area
    if (points.length > 1) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].yWpm);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].yWpm);
      }
      ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
      ctx.lineTo(points[0].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // 2. Draw WPM Line (Cyan/Sky)
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.yWpm);
      else ctx.lineTo(pt.x, pt.yWpm);
    });
    ctx.stroke();

    // 3. Draw Accuracy Line (Green/Emerald dashed)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.yAcc);
      else ctx.lineTo(pt.x, pt.yAcc);
    });
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 4. Draw Point Dots
    points.forEach((pt, i) => {
      // WPM dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.yWpm, this.hoverIndex === i ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = dotFill;
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // If single data point: draw a helpful label directly on canvas
      if (this.data.length === 1) {
        ctx.fillStyle = textColor;
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${pt.item.wpm} WPM · ${pt.item.accuracy}% Acc (${pt.item.lessonTitle || 'รอบล่าสุด'})`, pt.x, pt.yWpm - 14);
      }
    });

    // 5. Draw Legend
    this.drawLegend(ctx, width, padding);
  }

  drawLegend(ctx, width, padding) {
    const startX = width - padding.right - 180;
    const y = 14;

    // WPM indicator
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(startX, y - 4, 14, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WPM ความเร็ว', startX + 20, y + 2);

    // Accuracy indicator
    ctx.fillStyle = '#34d399';
    ctx.fillRect(startX + 105, y - 4, 14, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Acc % ความแม่นยำ', startX + 125, y + 2);
  }

  handleMouseMove(e) {
    if (!this.points || this.points.length === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let minDist = Infinity;

    this.points.forEach((pt) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    });

    if (closest && minDist < 35) {
      this.hoverIndex = closest.idx;
      this.render();

      if (this.tooltip) {
        const item = closest.item;
        const dateStr = new Date(item.timestamp).toLocaleDateString('th-TH', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        this.tooltip.innerHTML = `
          <div class="tooltip-title">${item.lessonTitle || 'แบบฝึกหัด'}</div>
          <div class="tooltip-row"><span style="color:#38bdf8">WPM:</span> <strong>${item.wpm}</strong></div>
          <div class="tooltip-row"><span style="color:#34d399">ความแม่นยำ:</span> <strong>${item.accuracy}%</strong></div>
          <div class="tooltip-time">${dateStr}</div>
        `;
        this.tooltip.style.left = `${closest.x}px`;
        this.tooltip.style.top = `${closest.yWpm - 12}px`;
        this.tooltip.style.display = 'block';
      }
    } else {
      this.handleMouseLeave();
    }
  }

  handleMouseLeave() {
    if (this.hoverIndex !== -1) {
      this.hoverIndex = -1;
      this.render();
    }
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }
}

/**
 * Phase 4.3: Per-Level Progress Renderer
 * Displays best WPM and accuracy per level (Level 1 to 6)
 */
export function renderPerLevelProgress(containerElement, scores = {}, unlockedLessons = ['1-1']) {
  if (!containerElement) return;
  containerElement.innerHTML = '';

  const LEVEL_DEFINITIONS = [
    { id: 1, name: 'Level 1: Home Row', desc: 'แป้นวางนิ้วหลัก A S D F J K L ;', icon: '🏠', targetWpm: 15 },
    { id: 2, name: 'Level 2: Top Row', desc: 'แป้นพิมพ์แถวบน Q W E R T Y U I O P', icon: '⬆️', targetWpm: 20 },
    { id: 3, name: 'Level 3: Bottom Row', desc: 'แป้นพิมพ์แถวล่าง Z X C V B N M', icon: '⬇️', targetWpm: 25 },
    { id: 4, name: 'Level 4: Numbers & Symbols', desc: 'ตัวเลขและสัญลักษณ์พื้นฐาน 1-0, -, =', icon: '🔢', targetWpm: 35 },
    { id: 5, name: 'Level 5: Code Punctuation', desc: 'เครื่องหมายโปรแกรมเมอร์ { } [ ] < > ; :', icon: '⚙️', targetWpm: 25 },
    { id: 6, name: 'Level 6: Real Code Snippets', desc: 'โค้ดจริง Python, JS, SQL, HTML, Shell', icon: '💻', targetWpm: 30 }
  ];

  const grid = document.createElement('div');
  grid.className = 'level-progress-grid';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(210px, 1fr))';
  grid.style.gap = '0.75rem';
  grid.style.marginTop = '0.5rem';

  LEVEL_DEFINITIONS.forEach(lvl => {
    // Find all lessons for this level
    const prefix = `${lvl.id}-`;
    const levelScoreKeys = Object.keys(scores).filter(k => k.startsWith(prefix));
    const isUnlocked = lvl.id === 1 || unlockedLessons.some(l => l.startsWith(prefix));

    let bestWpm = 0;
    let bestAcc = 0;
    let starsEarned = 0;

    levelScoreKeys.forEach(k => {
      const s = scores[k];
      if (s) {
        if (s.bestWpm > bestWpm) bestWpm = s.bestWpm;
        if (s.bestAccuracy > bestAcc) bestAcc = s.bestAccuracy;
        if (s.stars) starsEarned += s.stars;
      }
    });

    const card = document.createElement('div');
    card.className = `level-progress-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.style.background = 'var(--bg-secondary)';
    card.style.border = `1px solid ${isUnlocked ? 'var(--border-color)' : 'rgba(148,163,184,0.15)'}`;
    card.style.borderRadius = 'var(--radius-md)';
    card.style.padding = '0.85rem';
    card.style.opacity = isUnlocked ? '1' : '0.6';

    const isPassed = bestAcc >= 95 && bestWpm >= lvl.targetWpm;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
        <span style="font-weight:700; font-size:0.9rem; color:var(--text-primary); display:flex; align-items:center; gap:0.35rem;">
          <span>${lvl.icon}</span> ${lvl.name}
        </span>
        <span style="font-size:0.75rem; font-weight:700; color:${isPassed ? 'var(--accent-green)' : isUnlocked ? 'var(--accent-yellow)' : 'var(--text-muted)'};">
          ${isPassed ? '✅ ผ่านแล้ว' : isUnlocked ? '⏳ กำลังฝึก' : '🔒 ล็อก'}
        </span>
      </div>
      <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.6rem;">${lvl.desc}</div>
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); padding:0.4rem 0.6rem; border-radius:var(--radius-sm); font-size:0.8rem;">
        <div>
          <span style="color:var(--text-muted); font-size:0.72rem;">สปีดสูงสุด</span><br/>
          <strong style="color:var(--accent-cyan); font-size:0.95rem;">${bestWpm > 0 ? bestWpm : '--'}</strong>
          <span style="font-size:0.7rem; color:var(--text-muted);">WPM</span>
        </div>
        <div style="text-align:right;">
          <span style="color:var(--text-muted); font-size:0.72rem;">แม่นยำสูงสุด</span><br/>
          <strong style="color:var(--accent-green); font-size:0.95rem;">${bestAcc > 0 ? `${bestAcc}%` : '--'}</strong>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  containerElement.appendChild(grid);
}

/**
 * Phase 4.3: Daily Practice & Streak Card Renderer
 */
export function renderDailyGoalCard(containerElement, dailyStats = {}) {
  if (!containerElement) return;
  const { todayMinutes, goalMinutes, goalProgressPct, currentStreak } = dailyStats;

  containerElement.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span style="font-size:1.4rem;">🔥</span>
        <div>
          <div style="font-size:0.92rem; font-weight:700; color:var(--text-primary);">ฝึกต่อเนื่อง ${currentStreak} วัน</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">ความสม่ำเสมอคือกุญแจสู่การพิมพ์สัมผัสที่แม่นยำ</div>
        </div>
      </div>
      <div style="text-align:right;">
        <span style="font-size:0.85rem; color:var(--text-secondary);">เป้าหมายวันนี้:</span>
        <strong style="font-size:1rem; color:var(--accent-cyan); margin-left:4px;">${todayMinutes} / ${goalMinutes} นาที</strong>
        <span style="font-size:0.8rem; color:${goalProgressPct >= 100 ? 'var(--accent-green)' : 'var(--text-muted)'}; margin-left:4px;">(${goalProgressPct}%)</span>
      </div>
    </div>
    <div style="background:var(--bg-input); border-radius:9999px; height:8px; overflow:hidden; border:1px solid var(--border-color);">
      <div style="width:${goalProgressPct}%; height:100%; background:linear-gradient(90deg, var(--accent-cyan), var(--accent-green)); transition:width 0.4s ease;"></div>
    </div>
  `;
}
