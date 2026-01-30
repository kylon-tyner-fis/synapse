import { useState } from 'react';
import styles from './chat-interface.module.scss';
import { Quiz, QuizData } from './quiz'; // Import your new component

interface Message {
  role: 'user' | 'assistant';
  content: string;
  widget?: { type: 'quiz'; data: QuizData }; // New optional field
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Note: We send the history, but strip out the widget data
      // because the backend only expects role/content strings for history context.
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: historyPayload }),
      });

      const data = await response.json();

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        widget: data.widget, // Capture the widget data from backend
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['chat-container']}>
      <div className={styles['messages']}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles['message']} ${styles[msg.role]}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <p>{msg.content}</p>

            {/* CONDITIONAL RENDERING: If a widget exists, render it! */}
            {msg.widget && msg.widget.type === 'quiz' && (
              <Quiz data={msg.widget.data} />
            )}
          </div>
        ))}
        {isLoading && <div className={styles['loading']}>Thinking...</div>}
      </div>
      {/* ... input area remains the same ... */}
      <div className={styles['input-area']}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
