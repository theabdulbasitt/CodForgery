import readline from 'readline/promises';

export async function confirmWrite(promptText: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const answer = await rl.question(`\n${promptText}\nAllow? (y/n): `);
    rl.close();
    return answer.trim().toLowerCase() === 'y';
}