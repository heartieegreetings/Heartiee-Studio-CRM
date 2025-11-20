
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Estimate, EstimateItem, FollowUpNote, UserRole, TransferLog, Platform } from '../types';
import { USERS } from '../constants';
import { X, Save, Trash2, Calendar, IndianRupee, Plus, Check, User as UserIcon, ChevronDown, ChevronRight, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { PLATFORM_ICONS } from '../constants';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onCreateEstimate: (estimate: Estimate) => void;
  onDeleteEstimate: (id: string) => void;
  existingEstimates: Estimate[];
  currentUserRole: UserRole;
  currentUserId: string;
}

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ 
  lead, isOpen, onClose, onSave, onDelete, onCreateEstimate, onDeleteEstimate, existingEstimates, currentUserRole, currentUserId
}) => {
  const [formData, setFormData] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'estimates'>('details');
  const [newItem, setNewItem] = useState('');
  
  // Reminder State
  const [newReminder, setNewReminder] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const [newFollowUp, setNewFollowUp] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [errors, setErrors] = useState<{clientName?: string, platform?: string}>({});
  
  // Estimate Creation State
  const [isCreatingEstimate, setIsCreatingEstimate] = useState(false);
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);

  useEffect(() => {
    if (lead) {
      setFormData({ 
          ...lead, 
          followUpHistory: lead.followUpHistory || [],
          transferHistory: lead.transferHistory || []
      });
      setActiveTab('details');
      setIsCreatingEstimate(false);
      setShowHistory(false);
      setErrors({});
      
      setNewReminder('');
      setReminderDate('');
      setReminderTime('');
    }
  }, [lead]);

  if (!isOpen || !formData) return null;

  const canEdit = currentUserRole !== UserRole.DATA_ENTRY;
  const isNewLead = formData.id === 'temp_new';

  const handleChange = (field: keyof Lead, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
    if (field === 'clientName' || field === 'platform') {
        setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const handleAddItem = () => {
    if (newItem.trim() && formData) {
      setFormData({
        ...formData,
        inquiredItems: [...formData.inquiredItems, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    if (formData) {
      const updated = [...formData.inquiredItems];
      updated.splice(index, 1);
      setFormData({ ...formData, inquiredItems: updated });
    }
  };

  const handleAddReminder = () => {
    if (newReminder.trim() && reminderDate && reminderTime && formData) {
      const scheduledTime = new Date(`${reminderDate}T${reminderTime}`).toISOString();
      
      const reminder = {
        id: Date.now().toString(),
        text: newReminder,
        dateTime: scheduledTime,
        isCompleted: false
      };
      setFormData({
        ...formData,
        reminders: [...formData.reminders, reminder]
      });
      
      setNewReminder('');
      setReminderDate('');
      setReminderTime('');
    }
  };

  const toggleReminder = (id: string) => {
     if (formData) {
        setFormData({
            ...formData,
            reminders: formData.reminders.map(r => r.id === id ? {...r, isCompleted: !r.isCompleted} : r)
        })
     }
  }

  const handleDeleteReminder = (index: number) => {
      if (formData) {
          const updated = [...formData.reminders];
          updated.splice(index, 1);
          setFormData({ ...formData, reminders: updated });
      }
  }

  const handleAddFollowUp = () => {
    if (newFollowUp.trim() && formData) {
        const note: FollowUpNote = {
            id: Date.now().toString(),
            text: newFollowUp,
            timestamp: new Date().toISOString(),
            authorId: currentUserId
        };
        setFormData({
            ...formData,
            followUpHistory: [note, ...(formData.followUpHistory || [])]
        });
        setNewFollowUp('');
    }
  };

  const handleSaveWithHistory = () => {
      if (!formData || !lead) return;

      const newErrors: any = {};
      if (!formData.clientName || formData.clientName.trim() === '') {
          newErrors.clientName = "Client name is required";
      }
      if (!formData.platform) {
          newErrors.platform = "Platform is required";
      }

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      let updatedLead = { ...formData };

      if (!isNewLead && lead.assignedTo !== formData.assignedTo) {
          const log: TransferLog = {
              id: Date.now().toString(),
              fromUserId: lead.assignedTo || null,
              toUserId: formData.assignedTo || null,
              timestamp: new Date().toISOString(),
              transferredBy: currentUserId
          };
          updatedLead.transferHistory = [log, ...(updatedLead.transferHistory || [])];
      }

      onSave(updatedLead);
  };

  const getUserName = (id: string | null) => {
      if (!id) return 'Unassigned';
      const user = USERS.find(u => u.id === id);
      return user ? user.name : 'Unknown User';
  };

  const getNoteAuthor = (id?: string) => {
      if (!id) return 'Unknown';
      const user = USERS.find(u => u.id === id);
      return user ? user.name : 'Unknown';
  };

  // Estimate Logic
  const initEstimateCreation = () => {
    setIsCreatingEstimate(true);
    const initialItems = formData.inquiredItems.map((item, idx) => ({
        id: `item-${idx}`,
        description: item,
        quantity: 1,
        rate: 0
    }));
    setEstimateItems(initialItems.length ? initialItems : [{id: '1', description: 'Design Services', quantity: 1, rate: 0}]);
  };

  const updateEstimateItem = (index: number, field: keyof EstimateItem, value: any) => {
    const updated = [...estimateItems];
    updated[index] = { ...updated[index], [field]: value };
    setEstimateItems(updated);
  };

  const addEstimateRow = () => {
    setEstimateItems([...estimateItems, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]);
  };

  const saveNewEstimate = () => {
    const subTotal = estimateItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const gstAmount = subTotal * 0.18; // 18% GST
    const totalAmount = subTotal + gstAmount;

    const newEstimate: Estimate = {
        id: Date.now().toString(),
        leadId: formData.id,
        estimateNumber: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days validity
        items: estimateItems,
        notes: '',
        status: 'Draft',
        subTotal,
        gstAmount,
        totalAmount
    };
    onCreateEstimate(newEstimate);
    setIsCreatingEstimate(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl relative flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            {isNewLead ? (
                 <h3 className="text-xl font-sans font-bold text-gray-900">Create New Lead</h3>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="bg-primary-50 p-2 rounded-lg">
                        {PLATFORM_ICONS[formData.platform]}
                    </div>
                    <div>
                        <h3 className="text-xl font-sans font-bold text-gray-900">
                            {formData.clientName || 'New Lead'}
                        </h3>
                        <p className="text-sm text-gray-500">{formData.contactHandle}</p>
                    </div>
                </div>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
            <button 
                onClick={() => setActiveTab('details')}
                className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500'}`}
            >
                Details & Tasks
            </button>
            {!isNewLead && canEdit && (
                <button 
                    onClick={() => setActiveTab('estimates')}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'estimates' ? 'border-primary-500 text-gray-900' : 'border-transparent text-gray-500'}`}
                >
                    Estimates ({existingEstimates.length})
                </button>
            )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            {activeTab === 'details' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    value={formData.clientName}
                                    onChange={(e) => handleChange('clientName', e.target.value)}
                                    disabled={!canEdit}
                                    className={`w-full p-2 border rounded-lg bg-white text-sm outline-none focus:border-primary-500 disabled:bg-gray-100 ${errors.clientName ? 'border-red-500' : 'border-gray-200'}`}
                                    placeholder="Enter client name"
                                />
                                {errors.clientName && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/> {errors.clientName}</span>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Platform <span className="text-red-500">*</span></label>
                                <select 
                                    value={formData.platform}
                                    onChange={(e) => handleChange('platform', e.target.value)}
                                    disabled={!canEdit}
                                    className="p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-primary-500 disabled:bg-gray-100"
                                >
                                    {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Handle / Phone</label>
                                <input 
                                    type="text"
                                    value={formData.contactHandle}
                                    onChange={(e) => handleChange('contactHandle', e.target.value)}
                                    disabled={!canEdit}
                                    className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-primary-500 disabled:bg-gray-100"
                                    placeholder="@handle or Phone"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stage</label>
                                <select 
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    disabled={!canEdit}
                                    className="p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-primary-500 disabled:bg-gray-100"
                                >
                                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</label>
                                <div className="relative">
                                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <select 
                                        value={formData.assignedTo || ''}
                                        onChange={(e) => handleChange('assignedTo', e.target.value)}
                                        // Everyone should be able to assign/transfer leads, including Data Entry
                                        disabled={false} 
                                        className="w-full pl-9 p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-primary-500"
                                    >
                                        <option value="">Unassigned</option>
                                        {USERS.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {!isNewLead && (
                                    <div className="mt-1">
                                        <button 
                                            onClick={() => setShowHistory(!showHistory)} 
                                            className="text-xs text-primary-700 font-medium hover:underline flex items-center gap-1"
                                        >
                                            {showHistory ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                            Transfer History
                                        </button>
                                        
                                        {showHistory && (
                                            <div className="mt-2 bg-white rounded-lg p-3 text-xs space-y-3 border border-gray-200 shadow-sm max-h-32 overflow-y-auto custom-scrollbar">
                                                {formData.transferHistory?.length > 0 ? formData.transferHistory.map(log => (
                                                <div key={log.id} className="border-l-2 border-primary-200 pl-2">
                                                    <div className="flex flex-wrap gap-1 items-center text-gray-700">
                                                        <span className="font-bold">{getUserName(log.transferredBy)}</span> 
                                                        <span>changed to</span>
                                                        <span className="font-bold text-gray-900">{getUserName(log.toUserId)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                                )) : (
                                                    <div className="text-gray-400 italic">No transfers recorded yet.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Est. Value (₹)</label>
                                <div className="relative">
                                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input 
                                        type="number"
                                        value={formData.estimatedValue}
                                        onChange={(e) => handleChange('estimatedValue', Number(e.target.value))}
                                        disabled={!canEdit}
                                        className="w-full pl-9 p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-primary-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Event Date</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input 
                                        type="date"
                                        value={formData.eventDate || ''}
                                        onChange={(e) => handleChange('eventDate', e.target.value)}
                                        disabled={!canEdit}
                                        className="w-full pl-9 p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-primary-500 disabled:bg-gray-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items Inquired</label>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 min-h-[140px]">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.inquiredItems.map((item, idx) => (
                                        <span key={idx} className="bg-primary-50 border border-primary-100 text-gray-900 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                            {item}
                                            {canEdit && <button onClick={() => handleRemoveItem(idx)} className="hover:text-red-500"><X size={12}/></button>}
                                        </span>
                                    ))}
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2 mt-auto">
                                        <input 
                                            value={newItem}
                                            onChange={(e) => setNewItem(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                            placeholder="Add item..."
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-primary-300"
                                        />
                                        <button onClick={handleAddItem} className="bg-primary-100 text-gray-900 p-1 rounded hover:bg-primary-200"><Plus size={16}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">General Notes</label>
                        <textarea 
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            disabled={!canEdit}
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm h-24 outline-none focus:border-primary-500 resize-none bg-white disabled:bg-gray-100"
                            placeholder="Client preferences, color schemes, specific requests..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare size={14} /> Follow-up Notes
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                value={newFollowUp}
                                onChange={(e) => setNewFollowUp(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddFollowUp()}
                                placeholder="Log a conversation or update..."
                                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary-300 bg-white shadow-sm"
                            />
                            <button onClick={handleAddFollowUp} className="bg-primary-100 text-gray-900 px-3 rounded hover:bg-primary-200 text-sm font-medium">Log</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar bg-white rounded-lg border border-gray-100 p-2">
                            {formData.followUpHistory?.length > 0 ? formData.followUpHistory.map(note => (
                                <div key={note.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-700 text-xs">{getNoteAuthor(note.authorId)}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(note.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-gray-800">{note.text}</p>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-400 italic text-center py-2">No history yet.</p>
                            )}
                        </div>
                    </div>

                    {canEdit && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasks & Reminders</label>
                            <div className="space-y-2">
                                {formData.reminders.map((reminder, idx) => (
                                    <div key={reminder.id} className={`flex items-start gap-2 p-2 rounded-lg border border-transparent ${reminder.isCompleted ? 'bg-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}>
                                        <button onClick={() => toggleReminder(reminder.id)} className={`mt-1 p-1 rounded-full ${reminder.isCompleted ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}>
                                            <Check size={16} />
                                        </button>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium text-gray-800 ${reminder.isCompleted ? 'line-through' : ''}`}>{reminder.text}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                                <Clock size={10} />
                                                <span>{new Date(reminder.dateTime).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteReminder(idx)} className="p-1 text-gray-300 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                                    <div className="sm:col-span-4">
                                         <input 
                                            value={newReminder}
                                            onChange={(e) => setNewReminder(e.target.value)}
                                            placeholder="Task description..."
                                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary-300 bg-white"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                         <input 
                                            type="date"
                                            value={reminderDate}
                                            onChange={(e) => setReminderDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary-300 bg-white"
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                         <input 
                                            type="time"
                                            value={reminderTime}
                                            onChange={(e) => setReminderTime(e.target.value)}
                                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary-300 bg-white"
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <button 
                                            onClick={handleAddReminder} 
                                            disabled={!newReminder || !reminderDate || !reminderTime}
                                            className="w-full h-full bg-gray-100 text-gray-700 rounded hover:bg-primary-100 hover:text-primary-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-full flex flex-col">
                    {!isCreatingEstimate ? (
                        <div className="space-y-4">
                            <button 
                                onClick={initEstimateCreation}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-white hover:border-primary-300 hover:text-primary-600 transition-all"
                            >
                                <Plus size={24} className="mb-1" />
                                <span className="font-medium">Create New Estimate</span>
                            </button>

                            {existingEstimates.length > 0 && (
                                <div className="space-y-3">
                                    {existingEstimates.map(est => (
                                        <div key={est.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-gray-800">{est.estimateNumber}</p>
                                                <p className="text-xs text-gray-500">{new Date(est.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div>
                                                    <p className="font-medium">₹{est.totalAmount.toLocaleString('en-IN')}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${est.status === 'Approved' ? 'bg-green-100 text-green-700' : est.status === 'Declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {est.status}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => onDeleteEstimate(est.id)}
                                                    className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100"
                                                    type="button"
                                                    title="Delete Estimate"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-4 rounded-xl border border-gray-100 h-full flex flex-col">
                            <h4 className="font-bold text-gray-800 mb-4">New Estimate</h4>
                            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                                    <div className="col-span-6">Description</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-3 text-right">Rate</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {estimateItems.map((item, idx) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-6">
                                            <input 
                                                value={item.description} 
                                                onChange={(e) => updateEstimateItem(idx, 'description', e.target.value)}
                                                className="w-full p-1 border border-gray-200 rounded text-sm"
                                                placeholder="Item desc"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="number"
                                                value={item.quantity} 
                                                onChange={(e) => updateEstimateItem(idx, 'quantity', Number(e.target.value))}
                                                className="w-full p-1 border border-gray-200 rounded text-sm text-center"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input 
                                                type="number"
                                                value={item.rate} 
                                                onChange={(e) => updateEstimateItem(idx, 'rate', Number(e.target.value))}
                                                className="w-full p-1 border border-gray-200 rounded text-sm text-right"
                                            />
                                        </div>
                                        <div className="col-span-1 text-center">
                                             <button onClick={() => setEstimateItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={14} />
                                             </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addEstimateRow} className="text-sm text-primary-600 hover:underline flex items-center gap-1 mt-2">
                                    <Plus size={14} /> Add Row
                                </button>
                            </div>
                            
                            <div className="flex flex-col items-end pt-4 border-t border-gray-100 gap-1">
                                <div className="flex justify-between w-48 text-sm text-gray-500">
                                    <span>Subtotal:</span>
                                    <span>₹{estimateItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between w-48 text-sm text-gray-500">
                                    <span>GST (18%):</span>
                                    <span>₹{(estimateItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0) * 0.18).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between w-48 text-lg font-bold text-gray-800 border-t border-gray-100 pt-1 mt-1">
                                    <span>Total:</span>
                                    <span>₹{(estimateItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0) * 1.18).toLocaleString('en-IN')}</span>
                                </div>
                                
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setIsCreatingEstimate(false)} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded text-sm">Cancel</button>
                                    <button onClick={saveNewEstimate} className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded text-sm font-bold">Create Estimate</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-white rounded-b-2xl">
             {!isNewLead && canEdit ? (
                <button 
                    type="button"
                    onClick={() => onDelete(formData.id)}
                    className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:scale-105"
                >
                    <Trash2 size={16} /> Delete Lead
                </button>
             ) : (
                <div></div> 
             )}
            <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium text-sm hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button 
                    onClick={handleSaveWithHistory}
                    className="px-6 py-2 bg-primary-500 text-gray-900 font-bold text-sm rounded-lg hover:bg-primary-600 shadow-md shadow-primary-200 flex items-center gap-2 transition-colors"
                >
                    <Save size={16} /> {isNewLead ? 'Create Lead' : (canEdit ? 'Save Changes' : 'Save Update')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;
