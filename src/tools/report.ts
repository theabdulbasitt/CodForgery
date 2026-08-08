let findingsCount = 0;

export const reportToolSchemas = [
    {
        type: 'function' as const,
        function: {
            name: 'report_finding',
            description: 'Report one confirmed security vulnerability. Only call this after you have read the file with read_file and verified the issue is real — one call per distinct issue.',
            parameters: {
                type: 'object',
                properties: {
                    file: { type: 'string', description: 'File path relative to workspace root.' },
                    line: { type: 'number', description: 'Line number where the vulnerability occurs.' },
                    vuln_type: {
                        type: 'string',
                        enum: ['injection', 'hardcoded_secret', 'unsafe_deserialization', 'broken_auth', 'path_traversal', 'xss', 'insecure_config', 'other']
                    },
                    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                    evidence: { type: 'string', description: 'The exact line(s) of code you read that prove this finding, copied from the read_file output.' },
                    explanation: { type: 'string', description: '1-2 sentences: what the issue is and why it matters.' }
                },
                required: ['file', 'line', 'vuln_type', 'severity', 'evidence', 'explanation']
            }
        }
    }
];

export const reportHandlers: Record<string, (args: any) => Promise<string>> = {
    report_finding: async (args) => {
        findingsCount++;
        console.log(`\n🔴 [${args.severity.toUpperCase()}] ${args.vuln_type} — ${args.file}:${args.line}`);
        console.log(`   Evidence: ${args.evidence}`);
        console.log(`   ${args.explanation}`);
        return `Finding #${findingsCount} recorded.`;
    }
};