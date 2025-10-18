/**
 * Console Logger Utility
 * 
 * Intercepts all console method calls and sends them to a local file in development mode.
 * Automatically clears the log file on app initialization.
 */

type ConsoleMethod = 'log' | 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: ConsoleMethod;
  messages: string[];
}

// Store original console methods
const originalConsole: Record<ConsoleMethod, (...args: any[]) => void> = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

let isInitialized = false;
let logFileCleared = false;

/**
 * Safely converts any value to a string for logging
 */
function stringifyValue(value: any): string {
  try {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Error) {
      return `${value.name}: ${value.message}\n${value.stack || ''}`;
    }
    
    // Handle objects with circular references
    const seen = new WeakSet();
    return JSON.stringify(value, (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular Reference]';
        }
        seen.add(val);
      }
      return val;
    }, 2);
  } catch (error) {
    return `[Unable to stringify: ${String(value)}]`;
  }
}

/**
 * Sends a log entry to the backend
 */
async function sendLogToFile(entry: LogEntry, clearFile: boolean = false): Promise<void> {
  try {
    await fetch('/__console_log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...entry,
        clearFile,
      }),
    });
  } catch (error) {
    // Silently fail - don't spam console with logging errors
    // Use original console to avoid infinite loop
    originalConsole.error('Console logger failed to send log:', error);
  }
}

/**
 * Creates an intercepted console method
 */
function createInterceptedMethod(method: ConsoleMethod) {
  return (...args: any[]) => {
    // Always call the original console method first
    originalConsole[method](...args);
    
    // Only log to file in development mode
    if (import.meta.env.DEV) {
      const timestamp = new Date().toISOString();
      const messages = args.map(arg => stringifyValue(arg));
      
      const entry: LogEntry = {
        timestamp,
        level: method,
        messages,
      };
      
      // Clear file on first log after initialization
      const shouldClear = !logFileCleared;
      if (!logFileCleared) {
        logFileCleared = true;
      }
      
      sendLogToFile(entry, shouldClear);
    }
  };
}

/**
 * Initializes the console logger
 * Should be called once at app startup
 */
export function initConsoleLogger(): void {
  if (isInitialized) {
    return;
  }
  
  // Only intercept in development mode
  if (!import.meta.env.DEV) {
    return;
  }
  
  // Intercept all console methods
  const methods: ConsoleMethod[] = ['log', 'error', 'warn', 'info', 'debug'];
  
  methods.forEach(method => {
    console[method] = createInterceptedMethod(method);
  });
  
  isInitialized = true;
  
  // Log initialization
  console.log('Console logger initialized - all console output will be saved to console-output.log');
}

/**
 * Restores original console methods (useful for cleanup in tests)
 */
export function restoreConsole(): void {
  if (!isInitialized) {
    return;
  }
  
  Object.entries(originalConsole).forEach(([method, fn]) => {
    console[method as ConsoleMethod] = fn;
  });
  
  isInitialized = false;
  logFileCleared = false;
}

