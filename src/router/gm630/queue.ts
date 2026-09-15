export class RouterCircuitOpenError extends Error {
  constructor() {
    super('Router circuit breaker is open — too many consecutive failures. Tap retry to reset.');
    this.name = 'RouterCircuitOpenError';
  }
}

export class RouterTimeoutError extends Error {
  constructor() {
    super('Router did not respond within 10 seconds.');
    this.name = 'RouterTimeoutError';
  }
}

export interface QueueState {
  circuitOpen: boolean;
  consecutiveFailures: number;
  queueLength: number;
  lastError?: string;
}

type QueueTask<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queue: QueueTask<any>[] = [];
let running = false;
let consecutiveFailures = 0;
let circuitOpen = false;
let lastRequestTime = 0;
const MIN_GAP_MS = 400;
const MAX_CONSECUTIVE_FAILURES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function drain(): Promise<void> {
  if (running) return;
  running = true;

  while (queue.length > 0) {
    const task = queue.shift()!;

    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_GAP_MS) {
      await sleep(MIN_GAP_MS - elapsed);
    }

    try {
      lastRequestTime = Date.now();
      const result = await task.fn();
      consecutiveFailures = 0;
      task.resolve(result);
    } catch (err) {
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        circuitOpen = true;
      }
      task.reject(err);
    }
  }

  running = false;
}

export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  if (circuitOpen) {
    return Promise.reject(new RouterCircuitOpenError());
  }

  return new Promise<T>((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    void drain();
  });
}

export function resetCircuit(): void {
  circuitOpen = false;
  consecutiveFailures = 0;
}

export function getQueueState(): QueueState {
  return {
    circuitOpen,
    consecutiveFailures,
    queueLength: queue.length,
  };
}
