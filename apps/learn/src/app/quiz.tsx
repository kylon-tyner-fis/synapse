import { useState, useEffect, useRef } from 'react';
import styles from './quiz.module.scss';

export interface QuizData {
  title: string;
  questions: {
    title: string;
    answers: { title: string; feedback: string; isCorrect: boolean }[];
  }[];
}

export interface QuizResult {
  question: string;
  isCorrect: boolean;
  userAnswer: string;
  feedback: string; // Added this to persist feedback text
}

interface QuizProps {
  data: QuizData;
  onComplete: (results: QuizResult[]) => void;
}

export function Quiz({ data, onComplete }: QuizProps) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const isFinished = results.length === data.questions.length;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the new question when it appears
  useEffect(() => {
    if (results.length > 0) {
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [results.length]);

  const handleAnswer = (questionTitle: string, answer: any) => {
    const newResult: QuizResult = {
      question: questionTitle,
      userAnswer: answer.title,
      isCorrect: answer.isCorrect,
      feedback: answer.feedback,
    };

    const newResults = [...results, newResult];
    setResults(newResults);

    // If this was the last question, trigger completion
    if (newResults.length === data.questions.length) {
      onComplete(newResults);
    }
  };

  return (
    <div className={styles.quizContainer}>
      <h3 className={styles.quizTitle}>{data.title}</h3>

      <div className={styles.questionList}>
        {data.questions.map((q, index) => {
          // Logic: Show past questions AND the current active question.
          // Hide future questions.
          if (index > results.length) return null;

          const result = results[index]; // Exists if we've answered this one
          const isLocked = !!result; // Locked if answered

          return (
            <div
              key={index}
              className={`${styles.questionCard} ${isLocked ? styles.locked : styles.active}`}
            >
              <div className={styles.questionHeader}>
                <span className={styles.number}>{index + 1}</span>
                <h4>{q.title}</h4>
              </div>

              <div className={styles.answers}>
                {q.answers.map((ans, ansIdx) => {
                  // Determine styling based on state
                  let btnClass = styles.answerBtn;
                  if (isLocked) {
                    if (ans.title === result.userAnswer) {
                      btnClass += ans.isCorrect
                        ? ` ${styles.correct}`
                        : ` ${styles.wrong}`;
                    } else if (ans.isCorrect && !result.isCorrect) {
                      // Optional: Highlight the correct answer if they got it wrong
                      btnClass += ` ${styles.missed}`;
                    } else {
                      btnClass += ` ${styles.dimmed}`;
                    }
                  }

                  return (
                    <button
                      key={ansIdx}
                      onClick={() => handleAnswer(q.title, ans)}
                      disabled={isLocked}
                      className={btnClass}
                    >
                      {ans.title}
                      {isLocked && ans.title === result.userAnswer && (
                        <span className={styles.icon}>
                          {ans.isCorrect ? '✅' : '❌'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Show Feedback PERSISTENTLY after answering */}
              {result && (
                <div
                  className={`${styles.feedback} ${result.isCorrect ? styles.success : styles.error}`}
                >
                  <strong>{result.isCorrect ? 'Correct!' : 'Incorrect'}</strong>
                  <p>{result.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isFinished && (
        <div className={styles.completionBanner}>
          <span>🎉 Quiz Complete! Analyzing results...</span>
        </div>
      )}

      {/* Invisible element to help auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
