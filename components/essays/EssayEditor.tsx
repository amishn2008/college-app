'use client';

import { useState, useEffect, useRef, useCallback, type ElementType } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Save,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

interface Essay {
  _id: string;
  title: string;
  prompt: string;
  wordLimit: number;
  currentContent: string;
  currentWordCount: number;
}

interface EssayEditorProps {
  essay: Essay;
  onSave: (content: string) => void;
  onSaveVersion: (name: string) => void;
  onAddFeedback?: (payload: {
    selection: string;
    note: string;
    selectionStart: number;
    selectionEnd: number;
  }) => void;
  canAnnotate?: boolean;
}

interface LivePresence {
  userId: string;
  name: string;
  color: string;
  cursor: number;
  selectionStart: number;
  selectionEnd: number;
  updatedAt: string;
}

export function EssayEditor({
  essay,
  onSave,
  onSaveVersion,
  onAddFeedback,
  canAnnotate = false,
}: EssayEditorProps) {
  const { appendStudentQuery } = useCollaborationContext();
  const [content, setContent] = useState(essay.currentContent);
  const [wordCount, setWordCount] = useState(essay.currentWordCount);
  const [versionName, setVersionName] = useState('');
  const [fontFamily, setFontFamily] = useState<string>('Georgia, Times, "Times New Roman", serif');
  const [fontSize, setFontSize] = useState<number>(16);
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [presence, setPresence] = useState<LivePresence[]>([]);
  const cursorRef = useRef({ selectionStart: 0, selectionEnd: 0 });
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const updateCursorRef = useCallback((target?: HTMLTextAreaElement | null) => {
    if (!target) return;
    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    cursorRef.current = { selectionStart, selectionEnd };
    if (selectionStart !== selectionEnd) {
      setSelectedText(target.value.slice(selectionStart, selectionEnd));
    } else {
      setSelectedText('');
    }
  }, []);

  useEffect(() => {
    setContent(essay.currentContent);
    setWordCount(essay.currentWordCount);
  }, [essay]);

  useEffect(() => {
    let cancelled = false;
    const fetchPresence = async () => {
      try {
        const res = await fetch(appendStudentQuery(`/api/essays/${essay._id}/presence`));
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.presence) {
          setPresence(data.presence);
        }
      } catch (error) {
        console.error('Presence fetch failed', error);
      }
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [appendStudentQuery, essay._id]);

  useEffect(() => {
    let cancelled = false;
    const sendPresence = async () => {
      try {
        const payload = cursorRef.current;
        await fetch(appendStudentQuery(`/api/essays/${essay._id}/presence`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Presence update failed', error);
        }
      }
    };
    sendPresence();
    const interval = setInterval(sendPresence, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [appendStudentQuery, essay._id]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    const words = newContent.trim().split(/\s+/).filter((word) => word.length > 0);
    setWordCount(words.length);
    updateCursorRef(e.target);
    
    // Auto-save after 2 seconds of no typing
    clearTimeout((window as any).saveTimeout);
    (window as any).saveTimeout = setTimeout(() => {
      onSave(newContent);
    }, 2000);
  };

  const handleManualSave = () => {
    onSave(content);
    toast.success('Saved');
  };

  const handleSaveVersion = () => {
    if (!versionName.trim()) {
      toast.error('Please enter a version name');
      return;
    }
    onSaveVersion(versionName);
    setVersionName('');
  };

  const wordCountPercentage = (wordCount / essay.wordLimit) * 100;
  const isOverLimit = wordCount > essay.wordLimit;
  const handleSelectionSnapshot = useCallback(
    (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      updateCursorRef(e.currentTarget);
    },
    [updateCursorRef]
  );
  const fontOptions = [
    { label: 'Serif', value: 'Georgia, Times, "Times New Roman", serif' },
    { label: 'Sans', value: '"Inter", "Helvetica Neue", Arial, sans-serif' },
    { label: 'Mono', value: '"SFMono-Regular", "Courier New", monospace' },
  ];
  const sizeOptions = [14, 16, 18, 20, 22, 24];
  const lineHeights = [
    { label: '1.4', value: 1.4 },
    { label: '1.6', value: 1.6 },
    { label: '1.8', value: 1.8 },
  ];
  const alignmentOptions: Array<{ value: 'left' | 'center' | 'right'; Icon: ElementType; label: string }> = [
    { value: 'left', Icon: AlignLeft, label: 'Align left' },
    { value: 'center', Icon: AlignCenter, label: 'Align center' },
    { value: 'right', Icon: AlignRight, label: 'Align right' },
  ];
  const resolveLineNumber = useCallback(
    (cursorIndex: number) => {
      if (cursorIndex <= 0) return 1;
      const safeIndex = Math.min(cursorIndex, content.length);
      return content.slice(0, safeIndex).split('\n').length;
    },
    [content]
  );

  const handleAddFeedback = () => {
    if (!onAddFeedback) return;
    if (!selectedText.trim()) {
      toast.error('Highlight text in the essay first');
      return;
    }
    if (!feedbackNote.trim()) {
      toast.error('Enter a note before adding feedback');
      return;
    }
    const { selectionStart, selectionEnd } = cursorRef.current;
    onAddFeedback({
      selection: selectedText.trim(),
      note: feedbackNote.trim(),
      selectionStart,
      selectionEnd,
    });
    setFeedbackNote('');
    toast.success('Feedback recorded');
  };

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{essay.title}</h2>
        {essay.prompt && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">{essay.prompt}</p>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className={`text-sm font-medium ${
            isOverLimit ? 'text-red-600' : 
            wordCountPercentage > 90 ? 'text-amber-600' : 
            'text-gray-600'
          }`}>
            {wordCount} / {essay.wordLimit} words
          </div>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isOverLimit ? 'bg-red-500' :
                wordCountPercentage > 90 ? 'bg-amber-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, wordCountPercentage)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleManualSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          {canAnnotate && onAddFeedback && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <textarea
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder={
                  selectedText
                    ? 'Add counselor feedback about this highlight'
                    : 'Highlight essay text before adding feedback'
                }
                rows={2}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddFeedback}
                disabled={!selectedText.trim()}
              >
                Add Comment
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-500" />
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
            >
              {fontOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <select
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
          >
            {lineHeights.map((option) => (
              <option key={option.value} value={option.value}>
                Line {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBold((prev) => !prev)}
              className={`p-2 border rounded-lg text-sm ${
                isBold ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'
              }`}
              aria-pressed={isBold}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsItalic((prev) => !prev)}
              className={`p-2 border rounded-lg text-sm ${
                isItalic ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'
              }`}
              aria-pressed={isItalic}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsUnderline((prev) => !prev)}
              className={`p-2 border rounded-lg text-sm ${
                isUnderline ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'
              }`}
              aria-pressed={isUnderline}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white border border-gray-300 px-1">
            {alignmentOptions.map(({ value, Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTextAlign(value)}
                className={`p-2 rounded-md ${
                  textAlign === value ? 'bg-gray-900 text-white' : 'text-gray-600'
                }`}
                aria-pressed={textAlign === value}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Formatting controls personalize your drafting view while keeping your saved content compatible everywhere else.
      </p>
    </div>

      {presence.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-600">
          {presence.map((person) => (
            <div key={person.userId} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
              <span
                className="inline-flex w-2 h-2 rounded-full"
                style={{ backgroundColor: person.color }}
              />
              <span className="font-medium" style={{ color: person.color }}>
                {person.name}
              </span>
              <span className="text-gray-500">line {resolveLineNumber(person.cursor)}</span>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={editorRef}
        value={content}
        onChange={handleContentChange}
        onSelect={handleSelectionSnapshot}
        onKeyUp={handleSelectionSnapshot}
        onMouseUp={handleSelectionSnapshot}
        placeholder="Start writing your essay..."
        className="w-full min-h-[26rem] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          lineHeight,
          fontWeight: isBold ? 600 : 400,
          fontStyle: isItalic ? 'italic' : 'normal',
          textDecoration: isUnderline ? 'underline' : 'none',
          textAlign,
        }}
      />

      <div className="mt-4 flex gap-3 items-center">
        <input
          type="text"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder="Version name (e.g., 'Draft 1', 'Final')"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <Button onClick={handleSaveVersion} variant="outline">
          Save Version
        </Button>
      </div>
    </Card>
  );
}
