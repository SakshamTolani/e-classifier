import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeEmailContent(emailContent: string): Promise<{
    category: 'Interested' | 'Not Interested' | 'More Information';
    suggestedReply: string;
}> {
    const prompt = `\n\nHuman: Analyze the following email content and categorize it as either "Interested", "Not Interested", or "More Information". Then, suggest an appropriate reply based on the content. If the email shows interest, suggest scheduling a demo call.
  
Email content:
${emailContent}

Provide your response in the following JSON format:
{
  "category": "category",
  "suggestedReply": "suggested reply"
}

Make sure your entire response is valid JSON.

\n\nAssistant:`;

    const completion = await anthropic.completions.create({
        model: 'claude-2.1',
        prompt: prompt,
        max_tokens_to_sample: 300,
    });

    try {
        // Attempt to extract JSON from the response
        const jsonMatch = completion.completion.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonString = jsonMatch[0];
            const response = JSON.parse(jsonString);
            return response;
        } else {
            throw new Error('No valid JSON found in the response');
        }
    } catch (error) {
        console.error('Error parsing Anthropic response:', error);
        // Fallback to a default response
        return {
            category: 'More Information',
            suggestedReply: 'Thank you for your email. We need more information to properly address your inquiry. Could you please provide more details?'
        };
    }
}