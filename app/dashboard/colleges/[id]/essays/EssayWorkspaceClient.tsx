'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { EssayEditor } from '@/components/essays/EssayEditor';
import { AIPanel } from '@/components/essays/AIPanel';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

interface Essay {
  _id: string;
  title: string;
  prompt: string;
  wordLimit: number;
  currentContent: string;
  currentWordCount: number;
  versions: Array<{
    name: string;
    content: string;
    wordCount: number;
    createdAt: Date;
  }>;
  completed: boolean;
  rewriteApprovals?: Array<{
    _id?: string;
    instruction?: string;
    content: string;
    approvedAt?: string;
    approvedBy?: {
      name?: string;
    };
  }>;
}

interface College {
  _id: string;
  name: string;
}

interface EssayWorkspaceClientProps {
  college: College;
  essays: Essay[];
}

export function EssayWorkspaceClient({ college, essays: initialEssays }: EssayWorkspaceClientProps) {
  const { appendStudentQuery } = useCollaborationContext();
  const [essays, setEssays] = useState(initialEssays);
  const [selectedEssay, setSelectedEssay] = useState<Essay | null>(
    initialEssays.length > 0 ? initialEssays[0] : null
  );
  const [showNewEssayModal, setShowNewEssayModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiMode, setAiMode] = useState<'critique' | 'rewrite' | 'coach' | 'chat'>('critique');

  const handleSave = async (content: string) => {
    if (!selectedEssay) return;

    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${selectedEssay._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentContent: content }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedEssay(updated);
        setEssays(essays.map((e) => (e._id === updated._id ? updated : e)));
        toast.success('Saved');
      }
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleSaveVersion = async (name: string) => {
    if (!selectedEssay) return;

    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${selectedEssay._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveVersion: true, versionName: name }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedEssay(updated);
        setEssays(essays.map((e) => (e._id === updated._id ? updated : e)));
        toast.success('Version saved');
      }
    } catch (error) {
      toast.error('Failed to save version');
    }
  };

  const handleCreateEssay = async (title: string, prompt: string, wordLimit: number) => {
    try {
      const res = await fetch(appendStudentQuery('/api/essays'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collegeId: college._id,
          title,
          prompt,
          wordLimit,
        }),
      });

      if (res.ok) {
        const newEssay = await res.json();
        setEssays([...essays, newEssay]);
        setSelectedEssay(newEssay);
        setShowNewEssayModal(false);
        toast.success('Essay created');
      }
    } catch (error) {
      toast.error('Failed to create essay');
    }
  };

  const handleRewriteApplied = (newContent: string) => {
    if (!selectedEssay) return;
    const updatedEssay = {
      ...selectedEssay,
      currentContent: newContent,
      currentWordCount: newContent.trim().split(/\s+/).filter((word) => word.length > 0).length,
    };
    setSelectedEssay(updatedEssay);
    setEssays((prev) => prev.map((essay) => (essay._id === updatedEssay._id ? updatedEssay : essay)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{college.name}</h1>
          <p className="text-gray-600 mt-1">Essay Workspace</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAIPanel(!showAIPanel)}
          >
            {showAIPanel ? 'Hide' : 'Show'} AI Panel
          </Button>
          <Button onClick={() => setShowNewEssayModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            New Essay
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Essays</h2>
            <div className="space-y-2">
              {essays.map((essay) => (
                <button
                  key={essay._id}
                  onClick={() => setSelectedEssay(essay)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEssay?._id === essay._id
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{essay.title}</div>
                  <div className="text-sm text-gray-500">
                    {essay.currentWordCount}/{essay.wordLimit} words
                  </div>
                  {essay.versions.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {essay.versions.length} version{essay.versions.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {selectedEssay && selectedEssay.versions.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-md font-semibold mb-3">Versions</h3>
              <div className="space-y-2">
                {selectedEssay.versions.map((version, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedEssay({
                        ...selectedEssay,
                        currentContent: version.content,
                        currentWordCount: version.wordCount,
                      });
                    }}
                    className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm"
                  >
                    <div className="font-medium">{version.name}</div>
                    <div className="text-xs text-gray-500">
                      {version.wordCount} words • {new Date(version.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedEssay ? (
            <EssayEditor
              essay={selectedEssay}
              onSave={handleSave}
              onSaveVersion={handleSaveVersion}
            />
          ) : (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Select an essay or create a new one</p>
              <Button onClick={() => setShowNewEssayModal(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Create Essay
              </Button>
            </Card>
          )}
        </div>

        {showAIPanel && selectedEssay && (
          <div className="lg:col-span-1">
            <AIPanel
              essay={selectedEssay}
              mode={aiMode}
              onModeChange={setAiMode}
              onRewriteApplied={handleRewriteApplied}
            />
          </div>
        )}
      </div>

      {showNewEssayModal && (
        <NewEssayModal
          onClose={() => setShowNewEssayModal(false)}
          onSubmit={handleCreateEssay}
        />
      )}
    </div>
  );
}

function NewEssayModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (title: string, prompt: string, wordLimit: number) => void;
}) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [wordLimit, setWordLimit] = useState(650);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, prompt, wordLimit);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">New Essay</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Personal Statement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter the essay prompt..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Word Limit
            </label>
            <input
              type="number"
              value={wordLimit}
              onChange={(e) => setWordLimit(parseInt(e.target.value))}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
