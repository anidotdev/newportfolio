export const INITIAL_VISIBLE_PROJECTS = 3;

/**
 * @template T
 * @param {T[]} projects
 * @returns {{ visible: T[], remaining: T[], hasMore: boolean }}
 */
export function groupProjects(projects) {
  return {
    visible: projects.slice(0, INITIAL_VISIBLE_PROJECTS),
    remaining: projects.slice(INITIAL_VISIBLE_PROJECTS),
    hasMore: projects.length > INITIAL_VISIBLE_PROJECTS,
  };
}
