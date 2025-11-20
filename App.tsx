
import React, { useState, useEffect, useRef } from 'react';
import { NAV_ITEMS, INITIAL_LEADS, INITIAL_RESOURCES, PLATFORM_ICONS } from './constants';
import { Lead, LeadStatus, Estimate, User, UserRole, Resource, Platform } from './types';
import Dashboard from './components/Dashboard';
import LeadBoard from './components/LeadBoard';
import LeadList from './components/LeadList';
import EstimateManager from './components/InvoiceManager';
import UploadModal from './components/UploadModal';
import LeadDetailsModal from './components/LeadDetailsModal';
import ResourceBoard from './components/ResourceBoard';
import NotificationToast, { Toast } from './components/NotificationToast';
import ConfirmationModal from './components/ConfirmationModal';
import Login from './components/Login';
import { Search, Bell, Plus, LogOut, Upload, LayoutGrid, List, X, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [leadStatusFilter, setLeadStatusFilter] = useState<LeadStatus[] | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  
  // Notification State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notifiedRemindersRef = useRef<Set<string>>(new Set());

  // Confirmation State
  const [deletePrompt, setDeletePrompt] = useState<{
    isOpen: boolean;
    type: 'LEAD' | 'ESTIMATE' | 'RESOURCE' | 'BULK_LEADS' | null;
    id: string | null;
    ids?: string[]; // For bulk delete
    title: string;
    message: string;
  }>({ isOpen: false, type: null, id: null, title: '', message: '' });

  // Load data on mount
  useEffect(() => {
    const savedLeads = localStorage.getItem('heartiee_leads');
    const savedEstimates = localStorage.getItem('heartiee_estimates');
    const savedResources = localStorage.getItem('heartiee_resources');

    if (savedLeads) {
        const parsedLeads = JSON.parse(savedLeads);
        const migratedLeads = parsedLeads.map((l: any) => ({
            ...l,
            followUpHistory: l.followUpHistory || [],
            transferHistory: l.transferHistory || [],
            lastContacted: l.lastContacted || undefined,
            respondedAt: l.respondedAt || (l.status !== LeadStatus.NEW ? (l.lastContacted || l.createdAt) : undefined)
        }));
        setLeads(migratedLeads);
    }
    if (savedEstimates) {
        setEstimates(JSON.parse(savedEstimates));
    } else {
        // Migration attempt: Check for old 'heartiee_invoices'
        const oldInvoices = localStorage.getItem('heartiee_invoices');
        if (oldInvoices) {
            const parsed = JSON.parse(oldInvoices);
            const migratedEstimates = parsed.map((inv: any) => ({
                id: inv.id,
                leadId: inv.leadId,
                estimateNumber: inv.invoiceNumber ? inv.invoiceNumber.replace('INV', 'EST') : `EST-${inv.id.slice(-4)}`,
                date: inv.date,
                validUntil: inv.dueDate,
                items: inv.items,
                notes: inv.notes,
                status: 'Draft', // Reset status or map if possible
                subTotal: inv.totalAmount,
                gstAmount: 0, // Default for migrated
                totalAmount: inv.totalAmount
            }));
            setEstimates(migratedEstimates);
        }
    }

    if (savedResources) setResources(JSON.parse(savedResources));
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('heartiee_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('heartiee_estimates', JSON.stringify(estimates));
  }, [estimates]);

  useEffect(() => {
    localStorage.setItem('heartiee_resources', JSON.stringify(resources));
  }, [resources]);

  // Reminder Check Logic
  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const now = new Date();
      leads.forEach(lead => {
        lead.reminders.forEach(reminder => {
          if (!reminder.isCompleted) {
            const reminderTime = new Date(reminder.dateTime);
            const timeDiff = reminderTime.getTime() - now.getTime();
            
            if (Math.abs(timeDiff) < 60000) { 
               if (!notifiedRemindersRef.current.has(reminder.id)) {
                 addToast(`Reminder: ${reminder.text} for ${lead.clientName}`, 'warning');
                 if ('Notification' in window && Notification.permission === 'granted') {
                   new Notification(`Heartiee CRM Reminder`, { body: `${reminder.text} - ${lead.clientName}` });
                 }
                 notifiedRemindersRef.current.add(reminder.id);
               }
            }
          }
        });
      });
    };
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [leads, user]);

  const addToast = (message: string, type: 'success' | 'warning' | 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper for Copy to Clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  };

  const handleNewLead = (partialLead: Partial<Lead>) => {
    if (!user) return;

    const draftLead: Lead = {
      id: 'temp_new',
      clientName: partialLead.clientName || 'Unknown Client',
      platform: (partialLead.platform as Platform) || Platform.OTHER,
      contactHandle: partialLead.contactHandle || '',
      inquiredItems: partialLead.inquiredItems || [],
      estimatedValue: partialLead.estimatedValue || 0,
      status: LeadStatus.NEW,
      notes: partialLead.notes || '',
      eventDate: partialLead.eventDate,
      urgency: partialLead.urgency,
      
      createdAt: new Date().toISOString(),
      reminders: [],
      followUpHistory: [],
      transferHistory: [],
      createdBy: user.id,
      assignedTo: user.id,
      lastContacted: undefined,
      respondedAt: undefined
    };

    setIsUploadOpen(false);
    setSelectedLead(draftLead);
    addToast('Lead details extracted. Review and assign user.', 'info');
  };

  const handleSaveLead = (lead: Lead) => {
    if (!user) return;

    if (lead.id === 'temp_new') {
      const newLead: Lead = {
        ...lead,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        assignedTo: lead.assignedTo || user.id,
        respondedAt: lead.status !== LeadStatus.NEW ? new Date().toISOString() : undefined
      };
      setLeads(prev => [newLead, ...prev]);
      addToast('Lead created successfully', 'success');
    } else {
      setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
      addToast('Lead details updated', 'success');
    }
    setSelectedLead(null);
  };

  const handleManualEntry = () => {
    if (!user) return;
    setIsUploadOpen(false);
    const blankLead: Lead = {
      id: 'temp_new',
      clientName: '',
      platform: Platform.INSTAGRAM, 
      contactHandle: '',
      inquiredItems: [],
      estimatedValue: 0,
      status: LeadStatus.NEW,
      notes: '',
      createdAt: new Date().toISOString(),
      reminders: [],
      followUpHistory: [],
      transferHistory: [],
      assignedTo: user.id,
      createdBy: user.id
    };
    setSelectedLead(blankLead);
  };

  const handleDeleteLead = (id: string) => {
    setDeletePrompt({
        isOpen: true,
        type: 'LEAD',
        id,
        title: 'Delete Lead',
        message: 'Are you sure you want to permanently delete this lead? This will also remove all associated estimates.'
    });
  };

  // Bulk Handlers
  const handleBulkDelete = (ids: string[]) => {
    setDeletePrompt({
        isOpen: true,
        type: 'BULK_LEADS',
        id: null,
        ids,
        title: 'Delete Multiple Leads',
        message: `Are you sure you want to delete ${ids.length} leads? This action cannot be undone.`
    });
  };

  const handleBulkStatusUpdate = (ids: string[], status: LeadStatus) => {
      const now = new Date().toISOString();
      setLeads(prev => prev.map(l => {
          if (ids.includes(l.id)) {
              const wasNew = l.status === LeadStatus.NEW;
              const isMovingFromNew = wasNew && status !== LeadStatus.NEW;
              const shouldUpdateLastContacted = l.status === LeadStatus.NEW || l.status === LeadStatus.CONTACTED;
              return {
                  ...l,
                  status,
                  lastContacted: shouldUpdateLastContacted ? now : l.lastContacted,
                  respondedAt: isMovingFromNew && !l.respondedAt ? now : l.respondedAt
              };
          }
          return l;
      }));
      addToast(`Updated status for ${ids.length} leads`, 'success');
  };

  const handleBulkAssign = (ids: string[], userId: string) => {
      setLeads(prev => prev.map(l => {
          if (ids.includes(l.id)) {
              return { ...l, assignedTo: userId };
          }
          return l;
      }));
      addToast(`Assigned ${ids.length} leads successfully`, 'success');
  };

  const handleDeleteEstimate = (id: string) => {
    setDeletePrompt({
        isOpen: true,
        type: 'ESTIMATE',
        id,
        title: 'Delete Estimate',
        message: 'Are you sure you want to delete this estimate? This action cannot be undone.'
    });
  };

  const handleDeleteResource = (id: string) => {
    setDeletePrompt({
        isOpen: true,
        type: 'RESOURCE',
        id,
        title: 'Delete Resource',
        message: 'Are you sure you want to remove this item from the library?'
    });
  };

  const performDelete = () => {
      const { type, id, ids } = deletePrompt;
      
      if (type === 'LEAD' && id) {
          setLeads(prev => prev.filter(l => l.id !== id));
          setEstimates(prev => prev.filter(est => est.leadId !== id));
          setSelectedLead(null);
          addToast('Lead deleted successfully', 'info');
      } else if (type === 'BULK_LEADS' && ids) {
          setLeads(prev => prev.filter(l => !ids.includes(l.id)));
          setEstimates(prev => prev.filter(est => !ids.includes(est.leadId)));
          addToast(`${ids.length} leads deleted`, 'info');
      } else if (type === 'ESTIMATE' && id) {
          setEstimates(prev => prev.filter(i => i.id !== id));
          addToast('Estimate deleted successfully', 'info');
      } else if (type === 'RESOURCE' && id) {
          setResources(prev => prev.filter(r => r.id !== id));
          addToast('Resource deleted successfully', 'info');
      }
  };

  const handleStatusUpdate = (id: string, status: LeadStatus) => {
    const now = new Date().toISOString();
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        const wasNew = l.status === LeadStatus.NEW;
        const isMovingFromNew = wasNew && status !== LeadStatus.NEW;
        const shouldUpdateLastContacted = l.status === LeadStatus.NEW || l.status === LeadStatus.CONTACTED;

        return { 
          ...l, 
          status,
          lastContacted: shouldUpdateLastContacted ? now : l.lastContacted,
          respondedAt: isMovingFromNew && !l.respondedAt ? now : l.respondedAt
        };
      }
      return l;
    }));
    addToast(`Status updated to ${status}`, 'info');
  };

  const handleCreateEstimate = (newEstimate: Estimate) => {
    setEstimates(prev => [newEstimate, ...prev]);
    addToast(`Estimate ${newEstimate.estimateNumber} created`, 'success');
  };

  const handleUpdateEstimate = (updatedEstimate: Estimate) => {
    setEstimates(prev => prev.map(est => est.id === updatedEstimate.id ? updatedEstimate : est));
    addToast(`Estimate updated`, 'success');
  };

  const handleCreateResource = (resource: Resource) => {
    setResources(prev => [resource, ...prev]);
    addToast('Resource added to board', 'success');
  };

  const handleDashboardFilter = (statuses: LeadStatus[] | null) => {
      setLeadStatusFilter(statuses);
      setActiveTab('leads');
  };

  const searchResults = searchQuery.trim() 
    ? leads.filter(l => 
        l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.contactHandle.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5) 
    : [];

  if (!user) {
    return <Login onLogin={(u) => { setUser(u); setActiveTab(u.role === UserRole.DATA_ENTRY ? 'upload_view' : 'dashboard'); }} />;
  }

  const accessibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  let visibleLeads = leads.filter(l => 
    l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.contactHandle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (leadStatusFilter) {
      visibleLeads = visibleLeads.filter(l => leadStatusFilter.includes(l.status));
  }

  if (user.role === UserRole.DATA_ENTRY) {
      visibleLeads = visibleLeads.filter(l => l.createdBy === user.id);
  }

  return (
    <div className="flex h-screen bg-[#fafaf9] text-secondary font-sans selection:bg-primary-200">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-surface-200 flex flex-col z-10 shadow-sm">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-primary-500 flex-shrink-0 rounded-sm shadow-sm"></div>
            <h1 className="font-sans text-2xl font-bold text-secondary tracking-tight">
              Heartiee
            </h1>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] pl-11">Design Studio CRM</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
          {accessibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setLeadStatusFilter(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                activeTab === item.id
                  ? 'bg-surface-50 text-secondary font-semibold shadow-sm border border-surface-200'
                  : 'text-gray-500 hover:bg-surface-50 hover:text-gray-800'
              }`}
            >
              {activeTab === item.id && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-lg"></div>
              )}
              <span className={`transition-transform duration-300 ${activeTab === item.id ? 'text-primary-600 scale-110' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}

          {user.role === UserRole.DATA_ENTRY && (
             <button
             onClick={() => setActiveTab('upload_view')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
               activeTab === 'upload_view'
                 ? 'bg-surface-50 text-secondary font-semibold shadow-sm border border-surface-200'
                 : 'text-gray-500 hover:bg-surface-50 hover:text-gray-800'
             }`}
           >
             <span className="text-primary-600"><Upload size={20} /></span>
             Upload Center
           </button>
          )}
        </nav>

        <div className="p-4 border-t border-surface-100 space-y-4 bg-surface-50/50">
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="w-full bg-secondary hover:bg-black text-white font-medium py-3 rounded-lg shadow-lg shadow-gray-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Inquiry</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-1 pt-2">
             <div className="w-9 h-9 bg-primary-100 border border-primary-200 rounded-full text-primary-800 flex items-center justify-center text-xs font-bold">
                {user.avatarInitials}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-secondary truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider truncate">{user.role}</p>
             </div>
             <button onClick={() => setUser(null)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-white" title="Logout">
                <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-20 flex items-center justify-between px-8 z-20 sticky top-0 bg-[#fafaf9]/80 backdrop-blur-md border-b border-transparent">
          <div className="w-96 relative group z-50">
            {user.role !== UserRole.DATA_ENTRY && activeTab !== 'resources' && (
                <>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search clients..." 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="w-full bg-white border border-surface-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all shadow-sm"
                    />
                    
                    {/* Auto-complete Dropdown */}
                    {showSuggestions && searchQuery.trim() !== '' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-floating border border-surface-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {searchResults.length > 0 ? (
                                <div>
                                    <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-surface-50 border-b border-surface-100">
                                        Suggestions
                                    </p>
                                    {searchResults.map(lead => (
                                        <div 
                                            key={lead.id}
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setShowSuggestions(false);
                                                setSearchQuery(''); 
                                            }}
                                            className="p-3 hover:bg-primary-50 cursor-pointer flex items-center justify-between group transition-colors border-b border-surface-50 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-gray-600 font-bold text-xs border border-surface-200 group-hover:border-primary-200 group-hover:bg-white group-hover:text-primary-700">
                                                    {lead.clientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm group-hover:text-primary-800">{lead.clientName}</p>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        {PLATFORM_ICONS[lead.platform]}
                                                        <span className="truncate max-w-[150px]">{lead.contactHandle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-400 text-xs">
                                    No clients found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
             {/* Grid/List Toggle for Leads View */}
             {activeTab === 'leads' && user.role !== UserRole.DATA_ENTRY && (
                <div className="flex bg-white rounded-lg border border-surface-200 p-1 mr-2">
                  <button 
                    onClick={() => setViewMode('board')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-surface-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Board View"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-surface-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
                    title="List View"
                  >
                    <List size={18} />
                  </button>
                </div>
             )}

             {user.role !== UserRole.DATA_ENTRY && (
                <button 
                    onClick={() => setActiveTab('reminders')}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-surface-200 text-gray-400 hover:text-secondary hover:border-gray-300 rounded-full relative transition-all shadow-sm hover:shadow-md"
                >
                    <Bell size={18} />
                    {leads.some(l => l.reminders.some(r => !r.isCompleted)) && (
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                </button>
             )}
          </div>
        </header>

        {/* Viewport Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
          
          {/* Data Entry View */}
          {user.role === UserRole.DATA_ENTRY && activeTab === 'upload_view' && (
              <div className="max-w-4xl mx-auto pt-8 animate-fade-in">
                  <div className="bg-white rounded-2xl p-10 shadow-soft border border-surface-200 text-center mb-8 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300"></div>
                      <div className="w-20 h-20 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 shadow-inner">
                          <Upload size={32} strokeWidth={1.5} />
                      </div>
                      <h2 className="text-3xl font-bold text-secondary mb-3">Upload Inquiry</h2>
                      <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Upload screenshots from social media. AI will extract client details and create a new lead card automatically.
                      </p>
                      <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => setIsUploadOpen(true)}
                            className="bg-secondary hover:bg-black text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-gray-300 transition-all transform hover:scale-105"
                        >
                            Upload Screenshot
                        </button>
                        <button 
                            onClick={handleManualEntry}
                            className="bg-white hover:bg-surface-50 text-gray-700 border border-surface-200 px-8 py-4 rounded-xl font-bold shadow-sm transition-all transform hover:scale-105"
                        >
                            Manual Entry
                        </button>
                      </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-700 mb-4 ml-1">Your Recent Activity</h3>
                  <div className="space-y-3">
                      {visibleLeads.length > 0 ? visibleLeads.map(lead => (
                          <div key={lead.id} onClick={() => setSelectedLead(lead)} className="bg-white p-5 rounded-xl border border-surface-200 flex justify-between items-center cursor-pointer hover:border-primary-300 hover:shadow-md transition-all group">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                                      {lead.clientName.charAt(0)}
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-800 group-hover:text-primary-700 transition-colors">{lead.clientName}</p>
                                      <p className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString()}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className="text-xs font-semibold px-3 py-1.5 bg-surface-100 rounded-full text-gray-600">
                                    {lead.status}
                                  </span>
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-12 border-2 border-dashed border-surface-200 rounded-xl">
                            <p className="text-gray-400 text-sm">No uploads yet.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'dashboard' && user.role !== UserRole.DATA_ENTRY && (
             <Dashboard leads={leads} onFilterChange={handleDashboardFilter} />
          )}
          
          {activeTab === 'leads' && user.role !== UserRole.DATA_ENTRY && (
            <div className="h-full flex flex-col">
                {leadStatusFilter && (
                  <div className="flex items-center gap-2 mb-2 animate-slide-up">
                    <span className="text-xs font-bold bg-primary-100 text-primary-800 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-primary-200">
                      Filtering by Dashboard Selection 
                      <button onClick={() => setLeadStatusFilter(null)} className="hover:bg-primary-200 rounded p-0.5"><X size={12}/></button>
                    </span>
                  </div>
                )}
                {viewMode === 'board' ? (
                  <LeadBoard 
                    leads={visibleLeads} 
                    onEditLead={setSelectedLead}
                    onUpdateStatus={handleStatusUpdate}
                    onDeleteLead={handleDeleteLead}
                  />
                ) : (
                  <LeadList 
                    leads={visibleLeads}
                    onEditLead={setSelectedLead}
                    onDeleteLead={handleDeleteLead}
                    onBulkDelete={handleBulkDelete}
                    onBulkStatusUpdate={handleBulkStatusUpdate}
                    onBulkAssign={handleBulkAssign}
                  />
                )}
            </div>
          )}

          {activeTab === 'estimates' && user.role !== UserRole.DATA_ENTRY && (
            <EstimateManager 
                estimates={estimates} 
                leads={leads}
                onUpdateEstimate={handleUpdateEstimate}
                onCreateEstimate={handleCreateEstimate}
                onViewLead={setSelectedLead}
                onDeleteEstimate={handleDeleteEstimate}
            />
          )}
          
          {activeTab === 'resources' && (
             <ResourceBoard 
               resources={resources}
               onCreateResource={handleCreateResource}
               onDeleteResource={handleDeleteResource}
               currentUserRole={user.role}
               currentUserId={user.id}
               onCopy={handleCopy}
             />
          )}

          {activeTab === 'reminders' && user.role !== UserRole.DATA_ENTRY && (
             <div className="max-w-3xl mx-auto animate-slide-up">
                <h2 className="text-3xl font-sans font-bold text-gray-800 mb-8">Upcoming Tasks</h2>
                <div className="space-y-4">
                    {leads.flatMap(l => l.reminders.map(r => ({...r, clientName: l.clientName, leadId: l.id})))
                          .filter(r => !r.isCompleted)
                          .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                          .map((task, idx) => {
                            const isOverdue = new Date(task.dateTime) < new Date();
                            return (
                            <div key={`${task.leadId}-${idx}`} className={`p-5 rounded-xl border bg-white flex items-center justify-between shadow-sm hover:shadow-md transition-all group ${isOverdue ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-primary-500'}`}>
                                <div>
                                    <p className={`font-semibold text-lg ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>{task.text}</p>
                                    <div className="flex items-center gap-3 text-sm mt-1">
                                        <span className={`font-medium ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                            {isOverdue ? 'Overdue' : new Date(task.dateTime).toLocaleString()}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-gray-500">Client: <span className="text-gray-700">{task.clientName}</span></span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        const lead = leads.find(l => l.id === task.leadId);
                                        if(lead) setSelectedLead(lead);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-surface-50 hover:bg-white border border-surface-200 hover:border-primary-200 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    View Lead
                                </button>
                            </div>
                          )})
                    }
                     {leads.flatMap(l => l.reminders).every(r => r.isCompleted) && (
                        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-surface-200">
                            <Bell className="mx-auto mb-3 opacity-20" size={48} />
                            <p>No pending tasks. You're all caught up!</p>
                        </div>
                    )}
                </div>
             </div>
          )}
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onLeadDetected={handleNewLead}
        onManualEntry={handleManualEntry}
      />

      <LeadDetailsModal 
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        onCreateEstimate={handleCreateEstimate}
        onDeleteEstimate={handleDeleteEstimate}
        existingEstimates={estimates.filter(i => selectedLead && i.leadId === selectedLead.id)}
        currentUserRole={user.role}
        currentUserId={user.id}
      />

      <NotificationToast toasts={toasts} onRemove={removeToast} />
      
      <ConfirmationModal 
        isOpen={deletePrompt.isOpen}
        onClose={() => setDeletePrompt({ ...deletePrompt, isOpen: false })}
        onConfirm={performDelete}
        title={deletePrompt.title}
        message={deletePrompt.message}
      />
    </div>
  );
};

export default App;
