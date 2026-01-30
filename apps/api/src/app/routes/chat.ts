import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';

export default async function (fastify: FastifyInstance) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  fastify.post('/chat', async (request, reply) => {
    const { message, history } = request.body as {
      message: string;
      history: any[];
    };

    try {
      // Construct messages array from history + new message
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        ...(history || []),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using the requested model
        messages: messages as any,
      });

      const aiMessage = completion.choices[0].message.content;

      return { response: aiMessage };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch AI response' });
    }
  });
}
