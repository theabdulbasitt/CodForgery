import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env['GROQ_API_KEY'] });
export { client };

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 750;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callGroqWithRetry(
    params: Groq.Chat.CompletionCreateParams
): Promise<Groq.Chat.ChatCompletion> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await client.chat.completions.create(params) as Groq.Chat.ChatCompletion;
        } catch (err) {
            lastError = err;
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`⚠ Groq API call failed (attempt ${attempt}/${MAX_RETRIES}): ${message}`);

            if (attempt < MAX_RETRIES) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    throw new Error(`Groq API unavailable after ${MAX_RETRIES} attempts. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}