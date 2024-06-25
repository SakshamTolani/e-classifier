import Queue from 'bull';
import { analyzeEmailContent } from './anthropicService';
import { RedisOptions } from 'ioredis';

const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const emailAnalysisQueue = new Queue('email-analysis', {
  redis: redisOptions,
  limiter: {
    max: 5,
    duration: 60000, // 1 minute
  },
});

export async function queueEmailAnalysis(emailContent: string): Promise<{
  category: 'Interested' | 'Not Interested' | 'More Information';
  suggestedReply: string;
}> {
  const job = await emailAnalysisQueue.add({ emailContent });
  const result = await job.finished();
  return result;
}

emailAnalysisQueue.process(async (job) => {
  const { emailContent } = job.data;
  return await analyzeEmailContent(emailContent);
});

emailAnalysisQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

export { emailAnalysisQueue };