import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_ROOT } from './sandbox.js';

export const searchToolSchemas = [
    {
        type: 'function' as const,
        function: {
            name: 'search_code',
            description: `Search the workspace for code patterns using a regex. Useful for quickly locating candidate lines across many files before reading them in full with read_file.

Example patterns for common security-relevant APIs:
- Command injection: exec\\s*\\(|execFile\\s*\\(|spawn\\s*\\(
- Dynamic code execution: eval\\s*\\(|new\\s+Function\\s*\\(
- SQL query calls: query\\s*\\(|execute\\s*\\(
- Hardcoded secrets: password\\s*=|api[_-]?key\\s*=|secret\\s*=
- Path/file access: readFile\\s*\\(|writeFile\\s*\\(|createReadStream\\s*\\(
- XSS sinks: innerHTML\\s*=|dangerouslySetInnerHTML
- SSRF-prone requests: axios\\s*\\(|fetch\\s*\\(|http\\.request\\s*\\(
- Unsafe deserialization: deserialize\\s*\\(|unserialize\\s*\\(
- Auth logic: jwt\\.verify\\s*\\(|jwt\\.decode\\s*\\(|isAuthenticated|authorize`,
            parameters: {
                type: 'object',
                properties: {
                    pattern: {
                        type: 'string',
                        description: 'A regular expression to locate security-relevant code. Construct a targeted regex based on the vulnerability hypothesis being investigated, accounting for common whitespace variations (e.g. "exec\\\\s*\\\\(" not just "exec("). Avoid overly broad patterns like "." unless there is a specific reason.'
                    },
                    glob: {
                        type: 'string',
                        description: 'Optional file extension filter, e.g. ".ts", ".js", ".tsx". Use an empty string to search all files.'
                    }
                },
                required: ['pattern', 'glob']
            }
        }
    }
];

export const searchHandlers: Record<string, (args: any) => Promise<string>> = {
    search_code: async (args) => {
        const { pattern, glob } = args;
        const regex = new RegExp(pattern); // compiled once — safe, no 'g' flag means no shared state
        const results: string[] = [];

        async function walk(dir: string): Promise<void> {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                    continue;
                }

                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await walk(fullPath);
                    continue;
                }

                if (glob && !entry.name.endsWith(glob)) {
                    continue;
                }

                const content = await fs.readFile(fullPath, 'utf8');
                const lines = content.split('\n');
                const relPath = path.relative(WORKSPACE_ROOT, fullPath);

                lines.forEach((line, i) => {
                    if (regex.test(line)) {
                        results.push(`${relPath}:${i + 1}: ${line.trim()}`);
                    }
                });
            }
        }

        await walk(WORKSPACE_ROOT);

        return results.length ? results.join('\n') : 'No matches found.';
    }
};