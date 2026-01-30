import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // Import the renderer
import remarkGfm from 'remark-gfm'; // Import the plugin
import styles from './chat-interface.module.scss';
import { Quiz, QuizData, QuizResult } from './quiz';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  widget?: { type: 'quiz'; data: QuizData };
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callApi = async (userMessageStr: string, currentHistory: Message[]) => {
    setIsLoading(true);
    try {
      const historyPayload = currentHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessageStr,
          history: historyPayload,
        }),
      });

      const data = await response.json();
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        widget: data.widget,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = (text = input) => {
    if (!text.trim()) return;
    const msg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    callApi(text, [...messages, msg]);
  };

  const handleQuizComplete = (results: QuizResult[]) => {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const total = results.length;

    let report = `I finished the quiz. I scored ${correctCount} out of ${total}.\n\nDetails:\n`;
    results.forEach((r) => {
      report += `- Question: "${r.question}"\n  My Answer: "${r.userAnswer}" (${r.isCorrect ? 'Correct' : 'Wrong'})\n`;
    });

    callApi(report, messages);
  };

  return (
    <div className={styles['chat-container']}>
      <div className={styles['messages']}>
        {messages.length === 0 && (
          <div className={styles['empty-state']}>
            <div className={styles['icon']}>🧠</div>
            <h2>Welcome to Synapse</h2>
            <p>
              I can help you learn about Nx, React, and Modern Web Development.
            </p>

            <div className={styles['suggestions']}>
              <button onClick={() => sendMessage('I want to take a quiz')}>
                📝 Take a Quiz
              </button>
              <button onClick={() => sendMessage('Tell me about Nx caching')}>
                🚀 Explain Nx Caching
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles['message']} ${styles[msg.role]}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <div className={styles.bubble}>
              {/* RENDER MARKDOWN HERE */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Optional: Override specific elements if needed
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>

              {msg.widget && msg.widget.type === 'quiz' && (
                <Quiz data={msg.widget.data} onComplete={handleQuizComplete} />
              )}
            </div>
          </div>
        ))}

        {isLoading && <div className={styles['loading']}>Thinking</div>}
        <div ref={bottomRef} />
      </div>

      <div className={styles['input-area']}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button onClick={() => sendMessage()} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
