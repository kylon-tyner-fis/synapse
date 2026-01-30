// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { useEffect, useState } from 'react';
import NxWelcome from './nx-welcome';
import { Route, Routes, Link } from 'react-router-dom';

export function App() {
  // 1. Use useState so React knows to re-render when data changes
  const [responseData, setResponseData] = useState(null);

  useEffect(() => {
    fetch('/api/')
      .then((r) => r.json())
      .then((data) => {
        // 2. Update state via the setter function
        setResponseData(data);
        console.log(data);
      });
  }, []); // 3. Add empty dependency array to run this only once on mount

  return <div>{JSON.stringify(responseData)}</div>;
}

export default App;
