import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { TimeFormatProvider } from './contexts/TimeFormatContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <TimeFormatProvider>
        <App />
      </TimeFormatProvider>
    </ThemeProvider>
  </React.StrictMode>
);