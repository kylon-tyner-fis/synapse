import { useState } from 'react';
import styles from './quiz.module.scss'; // We'll create simple styles below

export interface QuizData {
  title: string;
  questions: {
    title: string;
    answers: { title: string; feedback: string; isCorrect: boolean }[];
  }[];
}

export function Quiz({ data }: { data: QuizData }) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    text: string;
    isCorrect: boolean;
  } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = data.questions[currentQIndex];

  const handleAnswer = (answer: any) => {
    setFeedback({ text: answer.feedback, isCorrect: answer.isCorrect });
  };

  const nextQuestion = () => {
    setFeedback(null);
    if (currentQIndex + 1 < data.questions.length) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className={styles.quizCard}>
        <h3>Quiz Complete! Great job.</h3>
      </div>
    );
  }

  return (
    <div className={styles.quizCard}>
      <h3>{data.title}</h3>
      <div className={styles.question}>
        <h4>
          Question {currentQIndex + 1}: {currentQuestion.title}
        </h4>

        <div className={styles.answers}>
          {currentQuestion.answers.map((ans, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(ans)}
              disabled={!!feedback}
              className={
                feedback?.text === ans.feedback && ans.isCorrect
                  ? styles.correct
                  : ''
              }
            >
              {ans.title}
            </button>
          ))}
        </div>

        {feedback && (
          <div
            className={`${styles.feedback} ${feedback.isCorrect ? styles.success : styles.error}`}
          >
            <p>{feedback.text}</p>
            <button onClick={nextQuestion}>
              {currentQIndex + 1 === data.questions.length
                ? 'Finish'
                : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
