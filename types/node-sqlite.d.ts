// Phase 8: @types/node do projeto é v20 (sem node:sqlite) e o registry está
// inacessível — declaração mínima local do builtin do Node 22. Cobrir só o
// que lib/sql.ts usa (DatabaseSync/prepare/get/all/run/exec).
declare module 'node:sqlite' {
  export interface RunResult {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }
  export interface StatementSync {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): RunResult;
  }
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
