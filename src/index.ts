import Groq from 'groq-sdk';
import 'dotenv/config';
import { filesystemToolSchemas, filesystemHandlers } from './tools/filesystem.js';
import { SYSTEM_PROMPT } from './prompts.js';


const client = new Groq({ apiKey: process.env['GROQ_API_KEY'] });

const tools = filesystemToolSchemas;
const handlers = filesystemHandlers;

let messages: Groq.Chat.CompletionCreateParams['messages'] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'What is in app.ts?' }
];

const model = 'llama-3.3-70b-versatile';
const MAX_ITERATIONS = 10; // safety net: never loop forever

for (let turn = 1; turn <= MAX_ITERATIONS; turn++) {
    console.log(`\n=== Turn ${turn} ===`);

    const response = await client.chat.completions.create({ model, messages, tools });
    const responseMessage = response.choices[0].message;

    console.log('finish_reason:', response.choices[0].finish_reason);
    console.log('message:', JSON.stringify(responseMessage, null, 2));

    messages.push(responseMessage);

    if (!responseMessage.tool_calls) {
        console.log('\nFinal answer:', responseMessage.content);
        break;
    }

    for (const call of responseMessage.tool_calls) {
        const handler = handlers[call.function.name];
        let result: string;

        if (!handler) {
            result = `Error: unknown tool '${call.function.name}'`;
        } else {
            try {
                const args = JSON.parse(call.function.arguments);
                result = await handler(args);
            } catch (err) {
                result = `Error running tool '${call.function.name}': ${(err as Error).message}`;
            }
        }

        console.log(`  -> ${call.function.name}(${call.function.arguments}) => ${result}`);

        messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: result
        });
    }
    if (turn === MAX_ITERATIONS) {
        console.log('\n⚠ Hit max iterations without a final answer. Something may be looping.');
        break;
    }
}
