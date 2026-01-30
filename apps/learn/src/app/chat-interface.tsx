import { useState } from 'react';
import styles from './chat-interface.module.scss';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages, // Send history for context
        }),
      });

      const data = await response.json();
      const aiMessage: Message = { role: 'assistant', content: data.response };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't reach the server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles['chat-container']}>
      <div className={styles['messages']}>
        {messages.length === 0 && (
          <p className={styles['empty-state']}>Start a conversation!</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles['message']} ${styles[msg.role]}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className={styles['loading']}>AI is thinking...</div>
        )}
      </div>

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
