
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { PLATFORM_ICONS } from '../constants';
import { Calendar, AlertCircle, Clock, ChevronRight, MoreHorizontal, Trash2, Edit, CheckCircle } from 'lucide-react';

interface LeadBoardProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
  onDeleteLead: (leadId: string) => void;
}

const LeadBoard: React.FC<LeadBoardProps> = ({ leads, onEditLead, onUpdateStatus, onDeleteLead }) => {
  const stages = Object.values(LeadStatus);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<LeadStatus | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Update timer every minute to refresh badges
  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 60000);
      return () => clearInterval(interval);
  }, []);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId);
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setActiveStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    if (activeStage !== stage) {
      setActiveStage(stage);
    }
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      onUpdateStatus(leadId, stage);
    }
    setDraggingId(null);
    setActiveStage(null);
  };

  const toggleMenu = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === leadId ? null : leadId);
  };

  const handleDeleteClick = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    onDeleteLead(leadId);
    setOpenMenuId(null);
  };

  const getResponseStatus = (lead: Lead) => {
     const created = new Date(lead.createdAt).getTime();
     const ONE_DAY = 24 * 60 * 60 * 1000;

     if (lead.status === LeadStatus.NEW) {
         const diff = now - created;
         if (diff > ONE_DAY) {
             return { type: 'LATE', label: 'LATE' };
         } else {
             const hoursLeft = Math.ceil((ONE_DAY - diff) / (60 * 60 * 1000));
             return { type: 'PENDING', label: `Due in ${hoursLeft}h` };
         }
     } else {
         // Check historical response time
         if (lead.respondedAt) {
             const responded = new Date(lead.respondedAt).getTime();
             if (responded - created <= ONE_DAY) {
                 return { type: 'ON_TIME', label: 'On Time' };
             }
         }
     }
     return null;
  };

  return (
    <div className="h-[calc(100vh-120px)] overflow-x-auto p-2" onClick={() => setOpenMenuId(null)}>
        <div className="flex h-full gap-6 pb-4 px-6 min-w-max">
        {stages.map((stage) => (
            <div 
                key={stage} 
                className={`
                    w-[320px] flex flex-col rounded-2xl h-full flex-shrink-0 transition-colors duration-300
                    ${activeStage === stage ? 'bg-primary-50/50' : 'bg-surface-50/0'}
                `}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={(e) => handleDrop(e, stage)}
            >
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-sans font-bold text-sm text-secondary uppercase tracking-wide">{stage}</h3>
                    <span className="bg-surface-200 text-gray-600 text-[10px] font-bold py-0.5 px-2 rounded-full">
                        {leads.filter((l) => l.status === stage).length}
                    </span>
                </div>
            </div>

            <div className={`
                flex-1 overflow-y-auto space-y-3 p-2 rounded-2xl custom-scrollbar transition-all
                ${activeStage === stage ? 'bg-primary-50/50 ring-2 ring-primary-200' : ''}
            `}>
                {leads
                .filter((lead) => lead.status === stage)
                .map((lead) => {
                    const responseStatus = getResponseStatus(lead);
                    return (
                    <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onEditLead(lead)}
                    className={`
                        bg-white p-5 rounded-xl shadow-card border border-transparent hover:border-primary-200 hover:shadow-soft transition-all cursor-grab active:cursor-grabbing group relative overflow-visible
                        ${draggingId === lead.id ? 'opacity-60 rotate-1 scale-95' : ''}
                    `}
                    >
                    {/* Decorative Accent Line */}
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-primary-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl"></div>

                    <div className="flex justify-between items-start mb-3 pl-2 relative">
                        <div>
                            <h4 className="font-bold text-gray-800 text-base leading-tight">{lead.clientName}</h4>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-gray-400 scale-90">
                                    {PLATFORM_ICONS[lead.platform]}
                                </span>
                                <span className="text-xs text-gray-500 font-medium truncate max-w-[140px]">
                                    {lead.contactHandle || 'No handle'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-1">
                            {/* Response Timer Badge */}
                            {responseStatus && (
                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border 
                                    ${responseStatus.type === 'LATE' ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 
                                      responseStatus.type === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-green-50 text-green-600 border-green-100'
                                    }`}
                                    title={responseStatus.type === 'LATE' ? 'Overdue (>24h)' : responseStatus.label}
                                >
                                   {responseStatus.type === 'ON_TIME' && <CheckCircle size={8} />}
                                   {responseStatus.type !== 'ON_TIME' && <Clock size={8} />}
                                   {responseStatus.label}
                                </div>
                            )}

                            {lead.urgency === 'High' && <AlertCircle size={16} className="text-red-500 animate-pulse mt-0.5" />}
                            
                            {/* Menu Button */}
                            <button 
                                onClick={(e) => toggleMenu(e, lead.id)}
                                className="p-1 text-gray-300 hover:text-gray-600 hover:bg-surface-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal size={16} />
                            </button>

                            {/* Context Menu */}
                            {openMenuId === lead.id && (
                                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-floating border border-surface-100 py-1 w-32 z-20 animate-in fade-in zoom-in-95 duration-100">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEditLead(lead); setOpenMenuId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-surface-50 flex items-center gap-2"
                                    >
                                        <Edit size={12} /> Edit
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteClick(e, lead.id)}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pl-2">
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {lead.inquiredItems.slice(0, 3).map((item, idx) => (
                                <span key={idx} className="text-[10px] font-semibold bg-surface-50 text-gray-600 px-2 py-1 rounded border border-surface-100">
                                    {item}
                                </span>
                            ))}
                            {lead.inquiredItems.length > 3 && (
                                <span className="text-[10px] font-semibold bg-surface-50 text-gray-400 px-2 py-1 rounded">+{lead.inquiredItems.length - 3}</span>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-surface-50">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Calendar size={12} />
                                    <span className="font-medium">{lead.eventDate ? new Date(lead.eventDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Date TBD'}</span>
                                </div>
                                {lead.estimatedValue > 0 && (
                                    <span className="font-bold text-gray-800 text-sm">
                                        ₹{lead.estimatedValue?.toLocaleString('en-IN')}
                                    </span>
                                )}
                                {lead.lastContacted && (
                                     <div className="flex items-center gap-1 text-[10px] text-gray-400" title={`Last Contacted: ${new Date(lead.lastContacted).toLocaleString()}`}>
                                        <Clock size={10} />
                                        <span>{new Date(lead.lastContacted).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                     </div>
                                )}
                            </div>
                            
                            {/* Move indicator */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1 rounded-full bg-surface-50 text-gray-400">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                )})}
                {leads.filter((l) => l.status === stage).length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-surface-200 rounded-xl text-gray-300 text-xs bg-surface-50/50">
                        <span className="mb-2 opacity-50">Empty Stage</span>
                    </div>
                )}
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

export default LeadBoard;
