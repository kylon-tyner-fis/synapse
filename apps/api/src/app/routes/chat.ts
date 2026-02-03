import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'generate_quiz',
      description:
        "Generates a multiple choice quiz based on the user's request.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                answers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      feedback: { type: 'string' },
                      isCorrect: { type: 'boolean' },
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
  {
    type: 'function',
    function: {
      name: 'generate_coding_challenge',
      description: 'Generates or updates a coding challenge.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the challenge' },
          description: {
            type: 'string',
            description:
              'The static requirements/instructions. On RETRY, must be the ORIGINAL requirements.',
          },
          feedback: {
            type: 'string',
            description: 'Markdown string containing the structured review.',
          },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                language: { type: 'string' },
                content: { type: 'string', description: 'The code content.' },
              },
              required: ['name', 'language', 'content'],
            },
          },
        },
        required: ['title', 'description', 'files'],
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
          content: `You are a helpful AI Tutor and Senior Developer.

          RULES:
          1. **Quizzes**: Use 'generate_quiz' if the user asks for a quiz.

          2. **New Challenges**: Use 'generate_coding_challenge'.
             - **CRITICAL: PROVIDE BOILERPLATE CODE ONLY.**
             - Leave 'feedback' empty.

          3. **Reviewing Code (CRITICAL)**:
             - **FRESHNESS PROTOCOL**: Ignore previous errors. Analyze ONLY the current code.
             - **Distinguish Errors**:
                - **Syntax Error**: Code that crashes or won't compile (e.g., missing brackets).
                - **Logic/Requirement Error**: Code that runs but is incomplete (e.g., **Empty Functions** are logic errors, NOT syntax errors).

             - **IF THE CODE FAILS:**
               - **DO NOT** reply with text.
               - **CALL \`generate_coding_challenge\` AGAIN.**
               - **Title:** "Retry: [Original Title]".
               - **description:** [Copy EXACTLY from the user's original requirements].
               - **files:** Populate with the **EXACT CODE** the user submitted.
               - **feedback:** You MUST use the markdown format below:

               ### FEEDBACK TEMPLATE (Use this exact structure for the 'feedback' argument):
               **Summary**
               [1-2 sentences summarizing the status]

               **✅ Passing Requirements**
               - [Specific requirement met]
               - [Specific logic that is correct]

               **❌ Issues / Missing**
               - [Specific Syntax Error or Crash (if any)]
               - [Specific Missing Requirement or Logic Gap]

             - **IF THE CODE PASSES:**
               - Reply with text. Congratulate them.
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

      if (aiMessage.tool_calls) {
        for (const toolCall of aiMessage.tool_calls) {
          if (toolCall.type !== 'function') continue;

          const fn = toolCall.function;
          const args = JSON.parse(fn.arguments);

          if (fn.name === 'generate_quiz') {
            return {
              response: `I've generated a quiz about "${args.title}".`,
              widget: { type: 'quiz', data: args },
            };
          }

          if (fn.name === 'generate_coding_challenge') {
            // If feedback is present, we use a different response message
            const responseText = args.feedback
              ? `I've reviewed your code. See the results below.`
              : `Here is a coding challenge: **${args.title}**.`;

            return {
              response: responseText,
              widget: { type: 'coding_challenge', data: args },
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
