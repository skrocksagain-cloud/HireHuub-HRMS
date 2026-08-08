import { useState } from 'react';
import { X, MapPin, Briefcase, Building2, PhoneCall, Edit3, ShieldAlert } from 'lucide-react';
import type { Candidate } from '../../types/crm';
import OverviewTab from './OverviewTab';
import TimelineTab from './TimelineTab';
import CareerJourneyTab from './CareerJourneyTab';
import PlacementHistoryTab from './PlacementHistoryTab';
import AssignmentHistoryTab from './AssignmentHistoryTab';
import FollowUpsTab from './FollowUpsTab';
import DocumentsTab from './DocumentsTab';
import HistoryTab from './HistoryTab';
import AttachmentsTab from './AttachmentsTab';

interface CandidateProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onQuickUpdate: (candidate: Candidate) => void;
  onToggleBlacklist: (candidateId: string, isBlacklisted: boolean, reason: string) => void;
  onOpenClientPreview: (clientId: string) => void;
}

type TabType =
  | 'overview'
  | 'timeline'
  | 'career'
  | 'placement'
  | 'assignment'
  | 'followups'
  | 'documents'
  | 'history'
  | 'attachments';

export default function CandidateProfileDrawer({
  isOpen,
  onClose,
  candidate,
  onQuickUpdate,
  onToggleBlacklist,
  onOpenClientPreview,
}: CandidateProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen || !candidate) return null;

  const tabs: Array<{ key: TabType; label: string; count?: number }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Interaction Timeline', count: candidate.interactionTimeline?.length },
    { key: 'career', label: 'Career Journey' },
    { key: 'placement', label: 'Placement History', count: candidate.placementHistory?.length },
    { key: 'assignment', label: 'Assignment History', count: candidate.assignmentHistory?.length },
    { key: 'followups', label: 'Follow Ups', count: candidate.followUps?.length },
    { key: 'documents', label: 'Documents', count: candidate.documents?.length },
    { key: 'history', label: 'System Audit', count: candidate.systemAudit?.length },
    { key: 'attachments', label: 'Attachments', count: candidate.attachments?.length },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Profile Drawer Top Bar */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                {candidate.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-white leading-none">{candidate.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    {candidate.status}
                  </span>
                  {candidate.isBlacklisted && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                      <ShieldAlert size={10} /> Blacklisted
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  {candidate.id} • {candidate.phone} • {candidate.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQuickUpdate(candidate)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 size={14} /> Quick Update
              </button>

              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Header Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Briefcase size={14} className="text-emerald-400 shrink-0" />
              <span className="truncate">Role: {candidate.role}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin size={14} className="text-emerald-400 shrink-0" />
              <span className="truncate">{candidate.area}, {candidate.city}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Building2 size={14} className="text-emerald-400 shrink-0" />
              {candidate.currentClientName ? (
                <button
                  type="button"
                  onClick={() => onOpenClientPreview(candidate.currentClientId || candidate.currentClientName!)}
                  className="text-emerald-300 hover:underline font-semibold truncate cursor-pointer"
                >
                  {candidate.currentClientName}
                </button>
              ) : (
                <span className="italic text-slate-400">No active placement</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <PhoneCall size={14} className="text-emerald-400 shrink-0" />
              <span>Assigned: {candidate.assignedRecruiterName.split(' ')[0]}</span>
            </div>
          </div>

          {/* Horizontal Profile Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-800/60 custom-scrollbar whitespace-nowrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    isActive ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-300'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <OverviewTab
              candidate={candidate}
              onQuickUpdate={() => onQuickUpdate(candidate)}
              onToggleBlacklist={() =>
                onToggleBlacklist(candidate.id, !candidate.isBlacklisted, 'Operational policy violation')
              }
            />
          )}

          {activeTab === 'timeline' && <TimelineTab candidate={candidate} />}

          {activeTab === 'career' && <CareerJourneyTab candidate={candidate} />}

          {activeTab === 'placement' && <PlacementHistoryTab candidate={candidate} />}

          {activeTab === 'assignment' && <AssignmentHistoryTab candidate={candidate} />}

          {activeTab === 'followups' && (
            <FollowUpsTab candidate={candidate} onQuickUpdate={() => onQuickUpdate(candidate)} />
          )}

          {activeTab === 'documents' && <DocumentsTab candidate={candidate} />}

          {activeTab === 'history' && <HistoryTab candidate={candidate} />}

          {activeTab === 'attachments' && <AttachmentsTab candidate={candidate} />}
        </div>
      </div>
    </div>
  );
}
