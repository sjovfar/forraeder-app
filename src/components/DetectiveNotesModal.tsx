import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { BookOpen, X, Search, Check, ShieldCheck, HelpCircle, AlertCircle, FileText } from 'lucide-react';

interface DetectiveNotesModalProps {
  teams: Team[];
  currentTeam: Team;
  onClose: () => void;
}

type SuspicionTag = 'neutral' | 'suspect' | 'trusted' | 'liar' | 'traitor';

interface TeamNote {
  tag: SuspicionTag;
  note: string;
}

export const DetectiveNotesModal: React.FC<DetectiveNotesModalProps> = ({
  teams,
  currentTeam,
  onClose
}) => {
  const storageKey = `forraeder_notes_${currentTeam.id}`;

  const [notesData, setNotesData] = useState<Record<string, TeamNote>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

  const saveNotes = (updated: Record<string, TeamNote>) => {
    setNotesData(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleSetTag = (teamId: string, tag: SuspicionTag) => {
    const existing = notesData[teamId] || { tag: 'neutral', note: '' };
    const updated = {
      ...notesData,
      [teamId]: { ...existing, tag }
    };
    saveNotes(updated);
  };

  const handleSetNoteText = (teamId: string, note: string) => {
    const existing = notesData[teamId] || { tag: 'neutral', note: '' };
    const updated = {
      ...notesData,
      [teamId]: { ...existing, note }
    };
    saveNotes(updated);
  };

  const otherTeams = teams.filter(t => t.id !== currentTeam.id);
  const filteredTeams = otherTeams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.players.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg h-[90vh] overflow-hidden rounded-3xl border-2 border-[#d4af37]/40 bg-gradient-to-b from-[#1c1827] to-[#0d0c13] p-4 sm:p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#d4af37]/20 text-[#f6db7e]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-gothic text-white">
                Detektiv-Noter & Mistænkte
              </h2>
              <p className="text-[10px] text-[#9e9585]">
                🔒 100% private noter kun synlige for jeres eget hold
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/40 text-[#9e9585] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9585]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søg hold..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-[#9e9585]/50 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Scrollable Team Notes List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filteredTeams.map((team) => {
            const entry = notesData[team.id] || { tag: 'neutral', note: '' };
            const firstNames = team.players.map(p => p.trim().split(' ')[0]).join(' & ');

            return (
              <div
                key={team.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  entry.tag === 'suspect'
                    ? 'bg-[#2a0e14] border-[#ff3855]/60'
                    : entry.tag === 'trusted'
                    ? 'bg-[#122416] border-green-700/50'
                    : entry.tag === 'traitor'
                    ? 'bg-[#3b080f] border-red-600'
                    : entry.tag === 'liar'
                    ? 'bg-[#2a1d08] border-yellow-700/50'
                    : 'bg-[#171420] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black ${team.isAlive ? 'text-white' : 'text-gray-400 line-through'}`}>
                        {firstNames}
                      </span>
                      {!team.isAlive && (
                        <span className="text-[9px] text-red-400 font-bold">
                          ☠️ {team.roleRevealed ? (team.role === 'traitor' ? 'Forræder' : 'Loyal') : 'Død'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#9e9585] block truncate">
                      {team.name}
                    </span>
                  </div>
                </div>

                {/* Tags Selector */}
                <div className="flex flex-wrap gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSetTag(team.id, 'neutral')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      entry.tag === 'neutral'
                        ? 'bg-zinc-700 text-white'
                        : 'bg-black/40 text-[#9e9585]'
                    }`}
                  >
                    ❓ Neutral
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetTag(team.id, 'suspect')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      entry.tag === 'suspect'
                        ? 'bg-[#c41e3a] text-white shadow-sm'
                        : 'bg-black/40 text-red-400/70 hover:text-red-300'
                    }`}
                  >
                    🔍 Mistænkt
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetTag(team.id, 'trusted')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      entry.tag === 'trusted'
                        ? 'bg-green-700 text-white shadow-sm'
                        : 'bg-black/40 text-green-400/70 hover:text-green-300'
                    }`}
                  >
                    🛡️ Stoler på
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetTag(team.id, 'liar')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      entry.tag === 'liar'
                        ? 'bg-yellow-700 text-white shadow-sm'
                        : 'bg-black/40 text-yellow-400/70 hover:text-yellow-300'
                    }`}
                  >
                    🤥 Løgner?
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetTag(team.id, 'traitor')}
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      entry.tag === 'traitor'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-black/40 text-red-500/70 hover:text-red-400'
                    }`}
                  >
                    🗡️ 100% Forræder
                  </button>
                </div>

                {/* Scratch Note input */}
                <input
                  type="text"
                  value={entry.note}
                  onChange={(e) => handleSetNoteText(team.id, e.target.value)}
                  placeholder="Skriv privat note (f.eks. 'Undviger øjenkontakt ved råd')..."
                  className="w-full p-2 rounded-xl bg-black/40 border border-white/5 text-xs text-white placeholder:text-[#9e9585]/40 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
