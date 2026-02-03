import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './chat-interface.module.scss';
import { Quiz, QuizData, QuizResult } from './quiz';
import { CodingChallenge, ChallengeData, FileData } from './coding-challenge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  widget?:
    | { type: 'quiz'; data: QuizData }
    | { type: 'coding_challenge'; data: ChallengeData };
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
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

  const handleChallengeSubmit = (files: FileData[], description: string) => {
    let report = `I have completed the coding challenge. Here are my files:\n\n`;
    files.forEach((f) => {
      report += `--- FILE: ${f.name} (${f.language}) ---\n`;
      report += `${f.content}\n\n`;
    });

    report += `\n\n--- ORIGINAL REQUIREMENTS ---\n${description}\n`;
    report += `\n(Please verify if the code meets these specific requirements. Do not offer outside suggestions.)`;

    callApi(report, messages);
  };

  return (
    <div
      className={`${styles['chat-container']} ${isFullScreen ? styles['full-screen'] : ''}`}
    >
      <button
        className={styles['fullscreen-toggle']}
        onClick={() => setIsFullScreen(!isFullScreen)}
        title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
      >
        {isFullScreen ? '↙️ Minimize' : '↗️ Full Screen'}
      </button>

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
              <button
                onClick={() => sendMessage('Give me a React coding challenge')}
              >
                💻 Coding Challenge
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles['message']} ${styles[msg.role]}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <div className={styles.bubble}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>

              {msg.widget && msg.widget.type === 'quiz' && (
                <Quiz data={msg.widget.data} onComplete={handleQuizComplete} />
              )}

              {msg.widget && msg.widget.type === 'coding_challenge' && (
                <CodingChallenge
                  data={msg.widget.data}
                  // FIX APPLIED HERE:
                  // 1. msg.widget! asserts it's not null (safe because of the && check)
                  // 2. as ChallengeData ensures TS knows it has a 'description'
                  onSubmit={(files) =>
                    handleChallengeSubmit(
                      files,
                      (msg.widget!.data as ChallengeData).description,
                    )
                  }
                />
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
