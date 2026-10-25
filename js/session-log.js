// In-memory Per-Keystroke Telemetry Logger
// Appends: { expectedChar, typedChar, correct, latencyMs, positionIndex, timestamp }

export class SessionLogger {
  constructor() {
    this.currentSessionLog = [];
    this.lastKeystrokeTime = null;
  }

  reset() {
    this.currentSessionLog = [];
    this.lastKeystrokeTime = null;
  }

  recordKeystroke(expectedChar, typedChar, correct, positionIndex = 0) {
    const now = Date.now();
    const latencyMs = this.lastKeystrokeTime !== null ? (now - this.lastKeystrokeTime) : null;
    this.lastKeystrokeTime = now;

    const entry = {
      expectedChar,
      typedChar,
      correct,
      latencyMs,
      positionIndex,
      timestamp: now
    };

    this.currentSessionLog.push(entry);
    return entry;
  }

  getLog() {
    return this.currentSessionLog;
  }

  getCurrentLog() {
    return this.currentSessionLog;
  }
}

export const sessionLogger = new SessionLogger();
