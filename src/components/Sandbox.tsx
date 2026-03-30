import React, { useEffect, useRef } from 'react';
import { Test } from '../types';

interface File {
  name: string;
  language: string;
  content: string;
}

interface SandboxProps {
  files: File[];
  onOutput: React.Dispatch<React.SetStateAction<string>>;
  tests?: Test[];
}

export default function Sandbox({ files, onOutput, tests }: SandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        onOutput(prev => prev + event.data.message + '\n');
      } else if (event.data.type === 'testResult') {
        onOutput(prev => prev + `Test: ${event.data.description} - ${event.data.passed ? 'PASSED' : 'FAILED'}\n`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOutput]);

  useEffect(() => {
    if (!iframeRef.current) return;

    const jsFile = files.find(f => f.name === 'index.js');
    const cssFile = files.find(f => f.name === 'style.css');

    const testCode = tests?.map(t => `
      try {
        const passed = ${t.testCode};
        window.parent.postMessage({ type: 'testResult', description: '${t.description}', passed: !!passed }, '*');
      } catch (e) {
        window.parent.postMessage({ type: 'testResult', description: '${t.description}', passed: false }, '*');
      }
    `).join('\n') || '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${cssFile?.content || ''}</style>
        </head>
        <body>
          <script>
            const originalLog = console.log;
            console.log = (...args) => {
              window.parent.postMessage({ type: 'console', message: args.join(' ') }, '*');
              originalLog(...args);
            };
            try {
              ${jsFile?.content || ''}
              ${testCode}
            } catch (e) {
              console.log('Error: ' + e.message);
            }
          </script>
        </body>
      </html>
    `;

    iframeRef.current.srcdoc = htmlContent;
  }, [files, tests]);

  return (
    <iframe
      ref={iframeRef}
      title="sandbox"
      className="w-full h-full border-none"
      sandbox="allow-scripts"
    />
  );
}
