export interface GateLogEntry {
  id: string;
  timestamp: string;
  event: string;
  details?: Record<string, any>;
}

type GateLogListener = (entries: GateLogEntry[]) => void;

class GateLogger {
  private entries: GateLogEntry[] = [];
  private listeners: Set<GateLogListener> = new Set();

  public log(event: string, details?: Record<string, any>) {
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const entry: GateLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: timeStr,
      event,
      details,
    };

    this.entries = [...this.entries.slice(-25), entry];
    console.log(`%c[GATE ${entry.timestamp}]%c ${event}`, 'color: #ffb000; font-weight: bold;', 'color: #f3f4f6;', details || '');

    this.listeners.forEach((fn) => {
      try {
        fn(this.entries);
      } catch {
        // ignore
      }
    });
  }

  public getHistory(): GateLogEntry[] {
    return this.entries;
  }

  public subscribe(listener: GateLogListener): () => void {
    this.listeners.add(listener);
    listener(this.entries);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clear() {
    this.entries = [];
    this.listeners.forEach((fn) => fn([]));
  }
}

export const gateLogger = new GateLogger();
