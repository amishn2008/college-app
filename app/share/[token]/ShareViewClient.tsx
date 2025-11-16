'use client';

import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { Eye, Lock } from 'lucide-react';

interface ShareData {
  shareLink: {
    showEssayContent: boolean;
  };
  colleges: Array<{
    _id: string;
    name: string;
    plan: string;
    deadline: Date;
    progress: {
      readinessScore: number;
      tasksCompleted: number;
      tasksTotal: number;
    };
    essays: Array<{
      _id: string;
      title: string;
      currentContent?: string;
      currentWordCount: number;
      completed: boolean;
    }>;
  }>;
  upcomingTasks: Array<{
    _id: string;
    title: string;
    dueDate?: Date;
    label: string;
    collegeId?: {
      name: string;
    };
  }>;
}

export function ShareViewClient({ data }: { data: ShareData }) {
  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">College Application Progress</h1>
              <p className="text-gray-600 text-sm mt-1">Read-only view</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {data.shareLink.showEssayContent ? (
                <>
                  <Eye className="w-4 h-4" />
                  Full access
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Limited access
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {data.colleges.map((college) => (
            <Card key={college._id}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{college.name}</h3>
                <p className="text-sm text-gray-500">{college.plan}</p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Readiness</span>
                  <span className="font-medium">{college.progress.readinessScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getReadinessColor(
                      college.progress.readinessScore
                    )}`}
                    style={{ width: `${college.progress.readinessScore}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <p>Deadline: {formatDate(college.deadline)}</p>
                <p>Tasks: {college.progress.tasksCompleted}/{college.progress.tasksTotal}</p>
                <p>Essays: {college.essays.filter((e) => e.completed).length}/{college.essays.length}</p>
              </div>

              {college.essays.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">Essays</h4>
                  <div className="space-y-2">
                    {college.essays.map((essay) => (
                      <div key={essay._id} className="bg-gray-50 rounded p-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{essay.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {essay.currentWordCount} words
                              {essay.completed && (
                                <span className="ml-2 text-green-600">✓ Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {data.shareLink.showEssayContent && essay.currentContent && (
                          <div className="mt-2 text-xs text-gray-700 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                            {essay.currentContent}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {data.upcomingTasks.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
            <div className="space-y-2">
              {data.upcomingTasks.map((task) => (
                <div key={task._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      {task.collegeId?.name && `${task.collegeId.name} • `}
                      {task.label}
                    </div>
                  </div>
                  {task.dueDate && (
                    <div className="text-sm text-gray-600">
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

