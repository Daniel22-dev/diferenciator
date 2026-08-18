import { setTimeout as sleep } from 'node:timers/promises';

export async function waitChromiumPageTarget(portOrBase, options = {}) {
  const attempts = Number(options.attempts || 400);
  const delayMs = Number(options.delayMs || 50);
  const value = String(portOrBase);
  const base = /^https?:\/\//i.test(value) ? value.replace(/\/+$/, '') : `http://127.0.0.1:${value}`;
  let lastState = 'debug endpoint not ready';
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`${base}/json`);
      if (response.ok) {
        const targets = await response.json();
        if (Array.isArray(targets)) {
          const page = targets.find((target) => target?.type === 'page' && typeof target.webSocketDebuggerUrl === 'string' && target.webSocketDebuggerUrl);
          if (page) return page;
          lastState = `targets=${targets.map((target) => target?.type || 'unknown').join(',') || 'none'}`;
        } else {
          lastState = 'invalid /json response';
        }
      } else {
        lastState = `HTTP ${response.status}`;
      }
    } catch (error) {
      lastState = String(error?.message || error || 'fetch failed');
    }
    await sleep(delayMs);
  }
  throw new Error(`Chromium page target timeout: ${lastState}`);
}
