import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../../../firebase/firebase';
import type { Candidate, FollowUpRecord } from '../../types/crm';

interface FollowUpsTabProps {
  candidate: Candidate;
  onQuickUpdate: () => void;
}

export default function FollowUpsTab({ candidate, onQuickUpdate }: FollowUpsTabProps) {
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowUps() {
      try {
        const ref = collection(db, 'crm_candidates', candidate.id, 'followUps');
        const q = query(ref, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        setFollowUps(snapshot.docs.map(doc => doc.data() as FollowUpRecord));
      } catch (err) {
        console.error('Failed to load follow-ups', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFollowUps();
  }, [candidate.id]);

  if (loading) return <div className="p-4 text-xs text-slate-400">Loading follow-ups...</div>;

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={16} className="text-emerald-600" /> Scheduled Follow Ups ({followUps.length})
        </h4>
        <button
          type="button"
          onClick={onQuickUpdate}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          + Schedule Follow Up
        </button>
      </div>

      {followUps.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 italic">
          No pending scheduled follow-ups for this candidate.
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map((fu) => (
            <div key={fu.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-800 text-xs">{fu.followUpDate}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">{fu.status}</span>
                </div>
                <p className="text-slate-800 mt-1 font-medium">{fu.notes}</p>
                <span className="text-[10px] text-slate-400">Assigned Recruiter: {fu.recruiterName}</span>
              </div>
              <button
                type="button"
                onClick={onQuickUpdate}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Complete Follow Up
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
