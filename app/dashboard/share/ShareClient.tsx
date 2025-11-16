'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy, Share2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCollaborationContext } from '@/components/providers/CollaborationProvider';

interface ShareLink {
  _id: string;
  token: string;
  showEssayContent: boolean;
}

export function ShareClient({ initialShareLink }: { initialShareLink: ShareLink | null }) {
  const { appendStudentQuery } = useCollaborationContext();
  const [shareLink, setShareLink] = useState(initialShareLink);
  const [showEssayContent, setShowEssayContent] = useState(shareLink?.showEssayContent || false);
  const [loading, setLoading] = useState(false);

  const handleCreateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch(appendStudentQuery('/api/share'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showEssayContent }),
      });

      if (res.ok) {
        const newLink = await res.json();
        setShareLink(newLink);
        toast.success('Share link created!');
      } else {
        throw new Error('Failed to create link');
      }
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEssayContent = async () => {
    if (!shareLink) return;

    const newValue = !showEssayContent;
    setLoading(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/share/${shareLink._id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showEssayContent: newValue }),
      });

      if (res.ok) {
        setShowEssayContent(newValue);
        toast.success('Settings updated');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!shareLink) return;

    setLoading(true);
    try {
      const res = await fetch(appendStudentQuery(`/api/share/${shareLink._id}`), {
        method: 'DELETE',
      });

      if (res.ok) {
        setShareLink(null);
        toast.success('Share link deactivated');
      }
    } catch (error) {
      toast.error('Failed to deactivate link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (shareLink) {
      const url = `${window.location.origin}/share/${shareLink.token}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sharing</h1>
        <p className="text-gray-600 mt-1">
          Create a read-only link to share your progress with counselors or parents
        </p>
      </div>

      <Card>
        {!shareLink ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Create Share Link</h2>
            <p className="text-gray-600 mb-6">
              Generate a private link that others can use to view your application progress.
              You control what&rsquo;s visible.
            </p>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEssayContent}
                  onChange={(e) => setShowEssayContent(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium">Show essay content</div>
                  <div className="text-sm text-gray-500">
                    Allow viewers to see essay text (otherwise only titles and status)
                  </div>
                </div>
              </label>
            </div>

            <Button onClick={handleCreateLink} disabled={loading}>
              <Share2 className="w-5 h-5 mr-2" />
              {loading ? 'Creating...' : 'Create Share Link'}
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Active Share Link</h2>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="text"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareLink.token}`}
                  readOnly
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                />
                <Button onClick={copyLink} size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Share this link with counselors or parents. They can view your progress in read-only mode.
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEssayContent}
                  onChange={handleToggleEssayContent}
                  disabled={loading}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div>
                  <div className="font-medium">Show essay content</div>
                  <div className="text-sm text-gray-500">
                    {showEssayContent ? (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Viewers can see essay text
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-4 h-4" />
                        Viewers can only see essay titles and status
                      </span>
                    )}
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDeactivate} variant="outline" disabled={loading}>
                Deactivate Link
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
