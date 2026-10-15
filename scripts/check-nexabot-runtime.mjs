import { setTimeout, clearTimeout } from 'node:timers';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';
// Installed runtime smoke only: initializes SQLite without key or network calls.
export function checkNexabotRuntime(executable, script, directory, environment) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [script], {
      env: { ...environment, ALURAYA_NEXABOT_DIR: directory },
      windowsHide: true,
    });
    let received = false;
    let sequence = 0;
    let expected;
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('NEXABOT_RUNTIME_TIMEOUT'));
    }, 15000);
    function inspect() {
      expected = randomUUID();
      child.stdin.write(
        JSON.stringify({
          schemaVersion: 1,
          requestId: expected,
          type: 'nexabot.action',
          payload: { action: 'inspect' },
        }) + '\n',
      );
    }
    child.on('error', () => {
      clearTimeout(timer);
      reject(new Error('NEXABOT_RUNTIME_SPAWN'));
    });
    child.stdin.on('error', () => {});
    child.stderr.resume();
    createInterface({ input: child.stdout }).on('line', (line) => {
      try {
        const response = JSON.parse(line);
        const state = response.payload;
        if (
          response.requestId !== expected ||
          !response.ok ||
          state.error ||
          state.configured ||
          state.jobs.length
        )
          throw new Error('STATE');
        if (state.activity === 'idle') {
          received = true;
          child.stdin.end();
        } else if (++sequence < 100) setTimeout(inspect, 50);
        else throw new Error('LOADING');
      } catch {
        child.kill();
      }
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0 && received) resolve();
      else reject(new Error('NEXABOT_RUNTIME_PROTOCOL'));
    });
    inspect();
  });
}
