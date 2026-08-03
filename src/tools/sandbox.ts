import path from 'path';

export const WORKSPACE_ROOT = path.resolve(process.cwd(), 'workspace');

export function resolveSafePath(relativePath: string): string {
    const resolved = path.resolve(WORKSPACE_ROOT, relativePath || '');

    const isRootItself = resolved === WORKSPACE_ROOT;
    const isInsideRoot = resolved.startsWith(WORKSPACE_ROOT + path.sep);

    if (!isRootItself && !isInsideRoot) {
        throw new Error(`Path escapes workspace sandbox: ${relativePath}`);
    }

    return resolved;
}