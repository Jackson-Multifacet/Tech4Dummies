import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { FileCode, Terminal, Play, Save } from 'lucide-react';

interface File {
  name: string;
  language: string;
  content: string;
}

interface IDEProps {
  files: File[];
  onSave: (files: File[]) => void;
  onRun: (files: File[]) => void;
  onChange?: (files: File[]) => void;
  output: string;
}

export default function IDE({ files: initialFiles, onSave, onRun, onChange, output }: IDEProps) {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<File>(files[0]);

  // Sync internal state if external files change (for multiplayer)
  React.useEffect(() => {
    setFiles(initialFiles);
    // Keep active file valid
    if (!initialFiles.find(f => f.name === activeFile.name)) {
      setActiveFile(initialFiles[0]);
    } else {
      setActiveFile(initialFiles.find(f => f.name === activeFile.name)!);
    }
  }, [initialFiles]);

  const handleCodeChange = (value: string | undefined) => {
    const updatedFiles = files.map(f => f.name === activeFile.name ? { ...f, content: value || '' } : f);
    setFiles(updatedFiles);
    if (onChange) {
      onChange(updatedFiles);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          {files.map(file => (
            <button
              key={file.name}
              onClick={() => setActiveFile(file)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${activeFile.name === file.name ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <FileCode size={14} />
              {file.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onSave(files)} className="p-2 text-zinc-400 hover:text-white"><Save size={18} /></button>
          <button onClick={() => onRun(files)} className="p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400"><Play size={18} /></button>
        </div>
      </div>

      {/* Editor & Output */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
        <div className="w-1/3 border-l border-zinc-800 bg-zinc-950 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Terminal size={16} />
            <span className="text-xs font-bold uppercase">Output</span>
          </div>
          <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      </div>
    </div>
  );
}
