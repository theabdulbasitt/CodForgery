import fs from 'fs/promises';
import { resolveSafePath } from './sandbox.js';

export const filesystemToolSchemas = [
    {
        type: 'function' as const,
        function: {
            name: 'list_files',
            description: 'List files and directories inside the workspace, optionally under a subdirectory.',
            parameters: {
                type: 'object',
                properties: {
                    dir: { type: 'string', description: 'Subdirectory relative to workspace root. Use empty string for root.' }
                },
                required: ['dir']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'read_file',
            description: 'Read the contents of a file, returned with line numbers prepended to each line.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path relative to workspace root, e.g. app.ts or src/auth.ts.' }
                },
                required: ['path']
            }
        }
    }
];

export const filesystemHandlers: Record<string, (args: any) => Promise<string>> = {
    list_files: async (args) => {
        const target = resolveSafePath(args.dir);
        const entries = await fs.readdir(target, { withFileTypes: true });
        return entries.map(e => (e.isDirectory() ? `${e.name}/` : e.name)).join('\n') || '(empty)';
    },
    read_file: async (args) => {
        const target = resolveSafePath(args.path);
        const content = await fs.readFile(target, 'utf8');
        return content
            .split('\n')
            .map((line, i) => `${i + 1}: ${line}`)
            .join('\n');
    },
};