// packages/frontend/src/apps/xshell/path.utils.ts

/**
 * Resolves a given path against the current working directory.
 * - Handles absolute paths (e.g., /Documents)
 * - Handles relative paths (e.g., myFolder, ./myFolder)
 * - Handles parent directories (e.g., ../)
 */
export function resolvePath(cwd: string, targetPath: string): string {
  if (targetPath.startsWith("/")) {
    // It's an absolute path, so just normalize it
    return normalizePath(targetPath);
  }

  // It's a relative path, join with cwd
  const combined = cwd === "/" ? `/${targetPath}` : `${cwd}/${targetPath}`;
  return normalizePath(combined);
}

/**
 * Normalizes a path, resolving '..' and '.' segments.
 */
export function normalizePath(path: string): string {
  if (path === "/") return "/";

  const parts = path.split("/").filter((p) => p.length > 0);
  const stack: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      stack.pop();
    } else if (part !== ".") {
      stack.push(part);
    }
  }

  return "/" + stack.join("/");
}
