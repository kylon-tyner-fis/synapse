import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Make sure to import this
import styles from './coding-challenge.module.scss';

export interface FileData {
  name: string;
  language: string;
  content: string;
}

export interface ChallengeData {
  title: string;
  description: string;
  feedback?: string;
  files: FileData[];
}

interface CodingChallengeProps {
  data: ChallengeData;
  onSubmit: (files: FileData[]) => void;
}

export function CodingChallenge({ data, onSubmit }: CodingChallengeProps) {
  const [files, setFiles] = useState<FileData[]>(data.files);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'reviewing'>('idle');

  useEffect(() => {
    setFiles(data.files);
    setStatus('idle');
  }, [data]);

  const activeFile = files[activeFileIndex];

  const handleCodeChange = (newContent: string) => {
    const updatedFiles = [...files];
    updatedFiles[activeFileIndex] = { ...activeFile, content: newContent };
    setFiles(updatedFiles);
  };

  const handleSubmit = () => {
    setStatus('reviewing');
    onSubmit(files);
  };

  if (!activeFile) return <div>Loading...</div>;

  return (
    <div className={styles.ideContainer}>
      <div className={styles.header}>
        <h3>💻 {data.title}</h3>
        {status === 'reviewing' && (
          <span className={styles.badge}>Analyzing...</span>
        )}
      </div>

      {/* FEEDBACK SECTION - Now uses ReactMarkdown */}
      {data.feedback && (
        <div className={styles.feedbackAlert}>
          <div className={styles.feedbackHeader}>⚠️ Analysis Result</div>
          <div className={styles.feedbackContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.feedback}
            </ReactMarkdown>
          </div>
        </div>
      )}

      <div className={styles.description}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {data.description}
        </ReactMarkdown>
      </div>

      <div className={styles.editorWorkspace}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>FILES</div>
          {files.map((file, idx) => (
            <button
              key={idx}
              className={`${styles.fileTab} ${idx === activeFileIndex ? styles.active : ''}`}
              onClick={() => setActiveFileIndex(idx)}
            >
              <span className={styles.icon}>
                {file.name.endsWith('css') ? '#' : '{ }'}
              </span>
              {file.name}
            </button>
          ))}
        </div>

        <div className={styles.editorArea}>
          <div className={styles.breadcrumbs}>
            {activeFile.name}{' '}
            <span className={styles.langBadge}>{activeFile.language}</span>
          </div>
          <textarea
            className={styles.codeInput}
            value={activeFile.content}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={status === 'reviewing'}
        >
          {status === 'reviewing' ? 'Analyzing...' : '▶ Run & Submit'}
        </button>
      </div>
    </div>
  );
}
