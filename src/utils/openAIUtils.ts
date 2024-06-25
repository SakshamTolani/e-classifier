// src/utils/openAiUtils.ts
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';


dotenv.config();
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
  });

  export const analyzeEmailContent = async (emailContent: string): Promise<string> => {
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        temperature: 0,
        system: "Email analysis",
        messages: [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": emailContent
              }
            ]
          }
        ]
      });
      console.log(response);
      
      return '';
    } catch (error) {
      console.error('Error analyzing email content:', error);
      throw new Error('Failed to analyze email content');
    }
  };
  
  export const categorizeEmail = (emailText: string): string => {
    // Implement logic to categorize email based on content
    // Example logic:
    if (emailText.includes('interested')) {
      return 'Interested';
    } else if (emailText.includes('more information')) {
      return 'More information';
    } else {
      return 'Not Interested';
    }
  };

