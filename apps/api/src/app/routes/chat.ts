import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

// 1. DEFINE THE TOOL SCHEMA
// We describe exactly what the data structure should look like.
// This forces the LLM to generate valid JSON matching our Frontend's expectations.
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'generate_quiz',
      description:
        "Generates a multiple choice quiz based on the user's request or conversation context.",
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'A creative title for the quiz based on the topic.',
          },
          questions: {
            type: 'array',
            description: 'A list of 3-5 multiple choice questions.',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'The question text.' },
                answers: {
                  type: 'array',
                  description: 'A list of 3-4 possible answers.',
                  items: {
                    type: 'object',
                    properties: {
                      title: {
                        type: 'string',
                        description: 'The answer text.',
                      },
                      feedback: {
                        type: 'string',
                        description:
                          'Explanation of why this answer is correct or incorrect.',
                      },
                      isCorrect: {
                        type: 'boolean',
                        description: 'True if this is the correct answer.',
                      },
                    },
                    required: ['title', 'feedback', 'isCorrect'],
                  },
                },
              },
              required: ['title', 'answers'],
            },
          },
        },
        required: ['title', 'questions'],
      },
    },
  },
];

export default async function (fastify: FastifyInstance) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  fastify.post('/chat', async (request, reply) => {
    const { message, history } = request.body as {
      message: string;
      history: any[];
    };

    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are a helpful AI Tutor.

          RULES:
          1. If the user asks for a quiz, use the 'generate_quiz' tool.
             - Contextualize the quiz: If they were just talking about "React Hooks", generate a quiz about React Hooks.
             - If no context exists, ask them what topic they want or generate a general "Web Development" quiz.
             - Generate a quiz based on the user's request
          2. When generating a quiz:
             - Create challenging but fair questions.
             - Provide helpful feedback for BOTH correct and incorrect answers.
          3. If the user provides QUIZ RESULTS (e.g., "I scored 2/3..."):
             - Analyze their performance.
             - Suggest the next logical topic to learn.
          `,
        },
        ...(history || []),
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
      });

      const aiMessage = completion.choices[0].message;

      // 2. HANDLE THE GENERATED DATA
      if (aiMessage.tool_calls) {
        for (const toolCall of aiMessage.tool_calls) {
          if (
            toolCall.type === 'function' &&
            toolCall.function.name === 'generate_quiz'
          ) {
            // The LLM generated the quiz content inside 'arguments' string.
            // We parse it into real JSON.
            const generatedQuizData = JSON.parse(toolCall.function.arguments);

            // Send it to the frontend just like before
            return {
              response: `I've generated a quiz about "${generatedQuizData.title}" for you. Good luck!`,
              widget: { type: 'quiz', data: generatedQuizData },
            };
          }
        }
      }

      return { response: aiMessage.content, widget: null };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch AI response' });
    }
  });
}
