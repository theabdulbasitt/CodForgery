import Groq from 'groq-sdk';
import 'dotenv/config';

const client = new Groq({ apiKey: process.env['GROQ_API_KEY'] });

const tools: Groq.Chat.CompletionCreateParams['tools'] = [
    { type: 'function', function: { name: 'get_current_time', description: 'Get current time of a city', parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] } } }
];

let messages: Groq.Chat.CompletionCreateParams['messages'] = [
    { role: 'user', content: 'What time it is in Faisalabad right now?' }
];

const model = 'llama-3.3-70b-versatile';

while (true) {
    const response = await client.chat.completions.create({ model, messages, tools });
    const responseMessage = response.choices[0].message;

    messages.push(responseMessage);

    if (!responseMessage.tool_calls) {
        console.log('Final answer:', responseMessage.content);
        break;
    }

    console.log('Model wants to call:', responseMessage.tool_calls.length, 'tool(s)');

    for (const call of responseMessage.tool_calls) {
        console.log('  ->', call.function.name, call.function.arguments);

        // fake result for now — real handler comes later
        const fakeResult = JSON.stringify({ time: '11:34 AM', timezone: 'GMT+5' });

        messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: fakeResult
        });
    }
}