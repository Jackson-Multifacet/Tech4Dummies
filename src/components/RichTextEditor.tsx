import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-800 transition-colors",
          editor.isActive('bold') ? "text-orange-500 bg-zinc-800" : "text-zinc-400"
        )}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-800 transition-colors",
          editor.isActive('italic') ? "text-orange-500 bg-zinc-800" : "text-zinc-400"
        )}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <div className="w-px h-6 bg-zinc-800 mx-1 self-center" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-800 transition-colors",
          editor.isActive('bulletList') ? "text-orange-500 bg-zinc-800" : "text-zinc-400"
        )}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-800 transition-colors",
          editor.isActive('orderedList') ? "text-orange-500 bg-zinc-800" : "text-zinc-400"
        )}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>
      <div className="w-px h-6 bg-zinc-800 mx-1 self-center" />
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-800 transition-colors",
          editor.isActive('codeBlock') ? "text-orange-500 bg-zinc-800" : "text-zinc-400"
        )}
        title="Code Block"
      >
        <Code size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "p-1.5 rounded hover:bg-zinc-800 transition-colors",
          editor.isActive('blockquote') ? "text-orange-500 bg-zinc-800" : "text-zinc-400"
        )}
        title="Quote"
      >
        <Quote size={18} />
      </button>
      <div className="w-px h-6 bg-zinc-800 mx-1 self-center" />
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition-colors"
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition-colors"
        title="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-orange max-w-none focus:outline-none min-h-[150px] p-4 text-zinc-300',
      },
    },
  });

  return (
    <div className={cn("border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40 backdrop-blur-sm focus-within:border-orange-500/50 transition-colors", className)}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
