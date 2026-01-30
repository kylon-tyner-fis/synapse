import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

// 1. Define the Quiz Data
const QUIZ_DATA = {
  title: 'Synapse Knowledge Check',
  questions: [
    {
      title: 'What is the primary purpose of Nx?',
      answers: [
        {
          title: 'To manage databases',
          feedback: 'Incorrect. Nx is a build system, not a database manager.',
          isCorrect: false,
        },
        {
          title: 'To manage monorepos and build tasks',
          feedback: 'Correct! Nx is a powerful build system for monorepos.',
          isCorrect: true,
        },
        {
          title: 'To replace React',
          feedback: 'Incorrect. Nx works with React, it does not replace it.',
          isCorrect: false,
        },
        {
          title: 'To style CSS',
          feedback:
            'Incorrect. Nx is for architecture and builds, not styling.',
          isCorrect: false,
        },
      ],
    },
  ],
};

// 2. Define the Tool
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_quiz_data',
      description:
        'Retrieves the quiz questions. Use this when the user wants to start a quiz.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

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
      // 3. System Prompt to force tool usage
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a helpful AI assistant.
          IMPORTANT: If the user indicates they want to take a quiz, call the 'get_quiz_data' tool immediately. Do not ask for confirmation.`,
        },
        ...(history || []),
        { role: 'user', content: message },
      ];

      // 4. Call OpenAI with tools
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
      });

      const aiMessage = completion.choices[0].message;

      // 5. Check for Tool Calls
      if (aiMessage.tool_calls) {
        for (const toolCall of aiMessage.tool_calls) {
          // Strict type check to satisfy TypeScript
          if (
            toolCall.type === 'function' &&
            toolCall.function.name === 'get_quiz_data'
          ) {
            // Return the widget data (JSON) directly to the frontend
            return {
              response: 'Sure! Here is the quiz.',
              widget: { type: 'quiz', data: QUIZ_DATA },
            };
          }
        }
      }

      // If no tool was used, return the text response
      return { response: aiMessage.content, widget: null };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch AI response' });
    }
  });
}
