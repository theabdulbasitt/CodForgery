import fs from 'fs/promises';
import { resolveSafePath } from './sandbox.js';
import { confirmWrite } from './confirm.js';

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
    },
    {
        type: 'function' as const,
        function: {
            name: 'edit_file',
            description: 'Replace an exact string in an existing file with a new string. old_str must match the file content exactly and must appear only once — if it appears zero or multiple times, this will fail. Requires human confirmation before writing.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path relative to workspace root.' },
                    old_str: { type: 'string', description: 'The exact existing text to replace. Must be unique in the file — include enough surrounding context (extra lines) if the text alone would match multiple places.' },
                    new_str: { type: 'string', description: 'The replacement text.' }
                },
                required: ['path', 'old_str', 'new_str']
            }
        }
    },
    {
        type: 'function' as const,
        function: {
            name: 'write_file',
            description: 'Create a brand new file with the given content. Fails if the file already exists — use edit_file to modify existing files. Requires human confirmation before writing.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path relative to workspace root.' },
                    content: { type: 'string', description: 'Full content of the new file.' }
                },
                required: ['path', 'content']
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

    edit_file: async (args) => {
        const { path: filePath, old_str, new_str } = args;
        const target = resolveSafePath(filePath);
        const content = await fs.readFile(target, 'utf8');

        const occurrences = content.split(old_str).length - 1;

        if (occurrences === 0) {
            if (content.includes(new_str)) {
                return `No changes made: the file already contains the target text. This edit appears to have already been applied — no further action needed.`;
            }
            return `Error: old_str not found in ${filePath}. Make sure it matches the file content exactly, including whitespace.`;
        }
        if (occurrences > 1) {
            return `Error: old_str appears ${occurrences} times in ${filePath}. It must be unique — include more surrounding context and try again.`;
        }

        const promptText =
            `⚠ Agent wants to edit ${filePath}\n` +
            `--------------------\n${old_str}\n` +
            `++++++++++\n${new_str}`;

        const allowed = await confirmWrite(promptText);
        if (!allowed) {
            return 'User denied this edit. Do not retry the same edit unless the user asks you to.';
        }

        const updated = content.replace(old_str, new_str);
        await fs.writeFile(target, updated, 'utf8');
        return `Successfully edited ${filePath}.`;
    },

    write_file: async (args) => {
        const { path: filePath, content } = args;
        const target = resolveSafePath(filePath);

        try {
            await fs.access(target);
            return `Error: ${filePath} already exists. Use edit_file to modify it instead.`;
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                return `Error checking ${filePath}: ${error.message}`;
            }

            const promptText =
                `⚠ Agent wants to create new file ${filePath}\n` +
                `++++++++++\n${content}`;

            const allowed = await confirmWrite(promptText);
            if (!allowed) {
                return 'User denied file creation. Do not retry unless the user asks you to.';
            }

            await fs.writeFile(target, content, 'utf8');
            return `Successfully created ${filePath}.`;
        }
    }
};