'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Sparkles, Lightbulb, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

interface Essay {
  _id: string;
  title: string;
  prompt: string;
  wordLimit: number;
  currentContent: string;
  rewriteApprovals?: RewriteApproval[];
}

interface AIPanelProps {
  essay: Essay;
  mode: 'critique' | 'rewrite' | 'coach';
  onModeChange: (mode: 'critique' | 'rewrite' | 'coach') => void;
  onRewriteApplied?: (content: string) => void;
}

interface RewriteApproval {
  _id?: string;
  instruction?: string;
  content: string;
  approvedAt?: string;
  approvedBy?: {
    name?: string;
  };
}

export function AIPanel({ essay, mode, onModeChange, onRewriteApplied }: AIPanelProps) {
  const { appendStudentQuery } = useCollaborationContext();
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState<any>(null);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [rewritten, setRewritten] = useState('');
  const [coaching, setCoaching] = useState('');
  const [approvals, setApprovals] = useState<RewriteApproval[]>(essay.rewriteApprovals || []);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    setApprovals(essay.rewriteApprovals || []);
  }, [essay.rewriteApprovals]);

  const handleCritique = async () => {
    if (!essay.currentContent.trim()) {
      toast.error('Please write something first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${essay._id}/critique`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'critique' }),
      });

      if (res.ok) {
        const data = await res.json();
        setCritique(data);
      } else {
        throw new Error('Failed to get critique');
      }
    } catch (error) {
      toast.error('Failed to get critique');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!essay.currentContent.trim()) {
      toast.error('Please write something first');
      return;
    }
    if (!rewriteInstruction.trim()) {
      toast.error('Please enter an instruction');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${essay._id}/critique`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'rewrite', instruction: rewriteInstruction }),
      });

      if (res.ok) {
        const data = await res.json();
        setRewritten(data.rewritten);
      } else {
        throw new Error('Failed to rewrite');
      }
    } catch (error) {
      toast.error('Failed to rewrite');
    } finally {
      setLoading(false);
    }
  };

  const handleCoach = async () => {
    if (!essay.currentContent.trim()) {
      toast.error('Please write something first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${essay._id}/critique`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'coach' }),
      });

      if (res.ok) {
        const data = await res.json();
        setCoaching(data.coaching);
      } else {
        throw new Error('Failed to get coaching');
      }
    } catch (error) {
      toast.error('Failed to get coaching');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRewrite = async () => {
    if (!rewritten.trim()) return;
    setAccepting(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/essays/${essay._id}/rewrites`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rewritten, instruction: rewriteInstruction }),
      });

      if (!res.ok) {
        throw new Error('Failed to apply rewrite');
      }

      const data = await res.json();
      setApprovals(data.rewriteApprovals || []);
      onRewriteApplied?.(rewritten);
      setRewritten('');
      toast.success('Rewrite applied');
    } catch (error) {
      toast.error('Could not apply rewrite');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">AI Assistant</h3>
        <div className="flex flex-col gap-2">
          <Button
            variant={mode === 'critique' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onModeChange('critique')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Critique
          </Button>
          <Button
            variant={mode === 'rewrite' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onModeChange('rewrite')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Rewrite
          </Button>
          <Button
            variant={mode === 'coach' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onModeChange('coach')}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Coach
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {mode === 'critique' && (
          <div>
            <Button
              onClick={handleCritique}
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Get Critique'
              )}
            </Button>
            {critique && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {critique.strengths?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-700 mb-2">Areas to Improve</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {critique.issues?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                {critique.lineEdits && critique.lineEdits.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Suggested Edits</h4>
                    <div className="space-y-2 text-sm">
                      {critique.lineEdits.map((edit: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600 italic">&ldquo;{edit.line}&rdquo;</div>
                          <div className="text-gray-900">→ &ldquo;{edit.suggestion}&rdquo;</div>
                          <div className="text-xs text-gray-500">{edit.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {critique.overallFeedback && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-700">{critique.overallFeedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'rewrite' && (
          <div>
            <textarea
              value={rewriteInstruction}
              onChange={(e) => setRewriteInstruction(e.target.value)}
              placeholder="e.g., 'Tighten to 500 words', 'Punchier intro', 'Show, don&rsquo;t tell'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
              rows={3}
            />
            <Button
              onClick={handleRewrite}
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : (
                'Rewrite'
              )}
            </Button>
            {rewritten && (
              <div className="bg-gray-50 p-3 rounded space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Rewritten Version:</h4>
                  <Button
                    size="sm"
                    onClick={handleAcceptRewrite}
                    disabled={accepting}
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      'Accept rewrite'
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{rewritten}</p>
              </div>
            )}
          </div>
        )}

        {mode === 'coach' && (
          <div>
            <Button
              onClick={handleCoach}
              disabled={loading}
              className="w-full mb-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                'Get Coaching'
              )}
            </Button>
            {coaching && (
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-semibold mb-2">Coaching Suggestions:</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{coaching}</div>
              </div>
            )}
          </div>
        )}
      </div>
      {approvals.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Approval log</h4>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {[...approvals].reverse().map((approval) => (
              <div key={approval._id} className="border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{approval.approvedBy?.name || 'Unknown reviewer'}</span>
                  <span>
                    {approval.approvedAt
                      ? new Date(approval.approvedAt).toLocaleString()
                      : ''}
                  </span>
                </div>
                {approval.instruction && (
                  <p className="text-xs text-gray-500 mb-1 italic">
                    “{approval.instruction}”
                  </p>
                )}
                <p className="line-clamp-3 text-gray-700 whitespace-pre-wrap">{approval.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
