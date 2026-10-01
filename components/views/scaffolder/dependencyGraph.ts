/** True when adding a reference fromProjId -> toProjId would create a cycle (BFS over references). */
export function checkCausesCircularDependency(
  projects: Array<{ id: string; references: string[] }>,
  fromProjId: string,
  toProjId: string
): boolean {
  if (fromProjId === toProjId) return true;
  const visited = new Set<string>();
  const queue = [toProjId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === fromProjId) return true;
    if (visited.has(curr)) continue;
    visited.add(curr);

    const proj = projects.find((p) => p.id === curr);
    if (proj && proj.references) {
      for (const refId of proj.references) {
        if (!visited.has(refId)) {
          queue.push(refId);
        }
      }
    }
  }

  return false;
}
