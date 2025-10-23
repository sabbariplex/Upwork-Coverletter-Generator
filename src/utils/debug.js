// Debug utility for controlling console logs and debug features
class DebugManager {
  constructor() {
    this.debugMode = false;
    this.loadDebugMode();
  }

  async loadDebugMode() {
    try {
      const result = await chrome.storage.local.get(['debugMode']);
      this.debugMode = result.debugMode || false;
    } catch (error) {
      console.error('Failed to load debug mode:', error);
    }
  }

  async setDebugMode(enabled) {
    this.debugMode = enabled;
    try {
      await chrome.storage.local.set({ debugMode: enabled });
      this.log('Debug mode', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Failed to save debug mode:', error);
    }
  }

  isDebugMode() {
    return this.debugMode;
  }

  log(...args) {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  warn(...args) {
    if (this.debugMode) {
      console.warn(...args);
    }
  }

  error(...args) {
    if (this.debugMode) {
      console.error(...args);
    }
  }

  info(...args) {
    if (this.debugMode) {
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.debugMode) {
      console.debug(...args);
    }
  }

  group(...args) {
    if (this.debugMode) {
      console.group(...args);
    }
  }

  groupEnd() {
    if (this.debugMode) {
      console.groupEnd();
    }
  }

  table(...args) {
    if (this.debugMode) {
      console.table(...args);
    }
  }

  time(label) {
    if (this.debugMode) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.debugMode) {
      console.timeEnd(label);
    }
  }
}

// Create singleton instance
const debugManager = new DebugManager();

// Export functions for easy use
export const debug = {
  log: (...args) => debugManager.log(...args),
  warn: (...args) => debugManager.warn(...args),
  error: (...args) => debugManager.error(...args),
  info: (...args) => debugManager.info(...args),
  debug: (...args) => debugManager.debug(...args),
  group: (...args) => debugManager.group(...args),
  groupEnd: () => debugManager.groupEnd(),
  table: (...args) => debugManager.table(...args),
  time: (label) => debugManager.time(label),
  timeEnd: (label) => debugManager.timeEnd(label),
  setDebugMode: (enabled) => debugManager.setDebugMode(enabled),
  isDebugMode: () => debugManager.isDebugMode(),
  getManager: () => debugManager
};

export default debug;
