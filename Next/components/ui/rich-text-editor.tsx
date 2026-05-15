'use client'
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useEffect, ReactNode, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  richPlaceholder?: ReactNode;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Skriv här...",
  richPlaceholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2",
      },
    },
  });

  // Handle paste events - strip formatting but preserve paragraph structure
  const handlePaste = useCallback((event: ClipboardEvent) => {
    if (!editor) return;
    
    // Get plain text from clipboard - this strips ALL formatting
    const text = event.clipboardData?.getData('text/plain');
    
    if (text) {
      // Prevent default paste (which would include HTML formatting)
      event.preventDefault();
      
      // Normalize line breaks
      const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Split by double newlines (paragraph breaks)
      const paragraphs = cleanedText.split(/\n\n+/);
      
      // Convert to HTML with proper paragraph tags
      const html = paragraphs
        .map(p => {
          // Replace single newlines with <br> within paragraphs
          const content = p.replace(/\n/g, '<br>');
          return `<p>${content}</p>`;
        })
        .join('');
      
      // Use editor commands to insert HTML content
      editor.chain().focus().insertContent(html).run();
    }
  }, [editor]);

  // Attach paste handler to editor DOM element
  useEffect(() => {
    if (!editor) return;
    
    const editorElement = editor.view.dom;
    editorElement.addEventListener('paste', handlePaste);
    
    return () => {
      editorElement.removeEventListener('paste', handlePaste);
    };
  }, [editor, handlePaste]);

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const isEmpty = editor.isEmpty;
  const showPlaceholder = isEmpty && (!!richPlaceholder || !!placeholder);

  return (
    <div
      className={cn(
        "border border-input rounded-md bg-background overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("bold") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("italic") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("bulletList") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", editor.isActive("orderedList") && "bg-muted")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor content with placeholder overlay (single source of truth) */}
      <div
        className="relative"
        onMouseDown={() => {
          if (showPlaceholder) editor.chain().focus().run();
        }}
      >
        <EditorContent editor={editor} />
        {showPlaceholder && (
          <div className="absolute inset-0 px-3 py-2 pointer-events-none text-muted-foreground/60 text-sm whitespace-pre-wrap">
            {richPlaceholder ?? placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

