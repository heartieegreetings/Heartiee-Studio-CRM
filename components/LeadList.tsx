
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, Platform } from '../types';
import { PLATFORM_ICONS, STATUS_COLORS, USERS } from '../constants';
import { Edit, Trash2, ArrowUpDown, Filter, Calendar, Search, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle, User as UserIcon, Download, FileSpreadsheet, FileText } from 'lucide-react';

interface LeadListProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkStatusUpdate?: (ids: string[], status: LeadStatus) => void;
  onBulkAssign?: (ids: string[], userId: string) => void;
}

type SortField = 'clientName' | 'estimatedValue' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const LeadList: React.FC<LeadListProps> = ({ 
    leads, onEditLead, onDeleteLead, onBulkDelete, onBulkStatusUpdate, onBulkAssign 
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'ALL'>('ALL');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for new field (usually better for dates/values)
    }
  };

  const sortedAndFilteredLeads = useMemo(() => {
    let result = [...leads];

    // Filter
    if (statusFilter !== 'ALL') {
      result = result.filter(l => l.status === statusFilter);
    }
    if (platformFilter !== 'ALL') {
      result = result.filter(l => l.platform === platformFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'clientName') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      } else if (sortField === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, sortField, sortDirection, statusFilter, platformFilter]);

  // --- Export Logic ---

  const getExportData = () => {
    // Export selected items if any, otherwise export all visible items
    const leadsToExport = selectedIds.size > 0 
        ? sortedAndFilteredLeads.filter(l => selectedIds.has(l.id))
        : sortedAndFilteredLeads;

    return leadsToExport.map(l => ({
        'Client Name': l.clientName,
        'Platform': l.platform,
        'Handle': l.contactHandle,
        'Event Date': l.eventDate || 'N/A',
        'Items': l.inquiredItems.join(', '),
        'Status': l.status,
        'Estimated Value': l.estimatedValue,
        'Created At': new Date(l.createdAt).toLocaleDateString(),
        'Notes': l.notes
    }));
  };

  const exportToCSV = () => {
    const data = getExportData();
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const val = (row as any)[header]?.toString() || '';
            // Escape quotes and wrap in quotes to handle commas in data
            return `"${val.replace(/"/g, '""')}"`; 
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `heartiee_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const data = getExportData();
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    
    // Create a simple HTML table for Excel
    const tableContent = `
        <table border="1">
            <thead>
                <tr>${headers.map(h => `<th style="background-color:#FFD700;">${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>${headers.map(h => `<td>${(row as any)[h]}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Heartiee Leads</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        </head>
        <body>
            ${tableContent}
        </body>
        </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `heartiee_leads_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };


  const getResponseStatus = (lead: Lead) => {
     const created = new Date(lead.createdAt).getTime();
     const ONE_DAY = 24 * 60 * 60 * 1000;
     const now = Date.now();

     if (lead.status === LeadStatus.NEW) {
         const diff = now - created;
         if (diff > ONE_DAY) return <span className="text-red-600 flex items-center gap-1 text-xs font-bold"><AlertCircle size={12}/> LATE</span>;
         const hours = Math.ceil((ONE_DAY - diff) / 3600000);
         return <span className="text-amber-600 flex items-center gap-1 text-xs font-bold"><Clock size={12}/> {hours}h left</span>;
     } else if (lead.respondedAt) {
         const responded = new Date(lead.respondedAt).getTime();
         if (responded - created <= ONE_DAY) return <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CheckCircle size={12}/> On Time</span>;
     }
     return <span className="text-gray-400 text-xs">-</span>;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-300 ml-1" />;
    return sortDirection === 'asc' ? 
      <ChevronUp size={14} className="text-primary-600 ml-1" /> : 
      <ChevronDown size={14} className="text-primary-600 ml-1" />;
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          const allIds = new Set(sortedAndFilteredLeads.map(l => l.id));
          setSelectedIds(allIds);
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleSelectRow = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const handleBulkActionReset = () => {
      setSelectedIds(new Set());
  };

  return (
    <div className="h-full p-6 overflow-hidden flex flex-col relative">
      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-xl border border-surface-200 shadow-sm animate-fade-in items-center justify-between">
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filters:</span>
            </div>
            
            <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'ALL')}
            className="bg-surface-50 border border-surface-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2 text-gray-700 outline-none"
            >
            <option value="ALL">All Statuses</option>
            {Object.values(LeadStatus).map(status => (
                <option key={status} value={status}>{status}</option>
            ))}
            </select>

            <select 
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | 'ALL')}
            className="bg-surface-50 border border-surface-200 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2 text-gray-700 outline-none"
            >
            <option value="ALL">All Platforms</option>
            {Object.values(Platform).map(p => (
                <option key={p} value={p}>{p}</option>
            ))}
            </select>
            
            {(statusFilter !== 'ALL' || platformFilter !== 'ALL') && (
                <button 
                    onClick={() => { setStatusFilter('ALL'); setPlatformFilter('ALL'); }}
                    className="text-xs font-bold text-primary-600 hover:underline"
                >
                    Clear Filters
                </button>
            )}
        </div>

        {/* Export Button */}
        <div className="relative">
            <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 bg-white border border-surface-200 hover:bg-surface-50 hover:border-primary-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
                <Download size={16} />
                <span>Export</span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-floating border border-surface-100 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                        <button 
                            onClick={exportToExcel}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-surface-50 hover:text-primary-700 rounded-lg flex items-center gap-3 transition-colors"
                        >
                            <FileSpreadsheet size={16} className="text-green-600" /> 
                            <span>Excel (.xls)</span>
                        </button>
                        <button 
                            onClick={exportToCSV}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-surface-50 hover:text-primary-700 rounded-lg flex items-center gap-3 transition-colors"
                        >
                            <FileText size={16} className="text-blue-600" /> 
                            <span>CSV</span>
                        </button>
                    </div>
                    <div className="bg-surface-50 px-3 py-2 border-t border-surface-100">
                        <p className="text-[10px] text-gray-400">
                            {selectedIds.size > 0 ? `Exporting ${selectedIds.size} selected row(s)` : `Exporting all visible rows`}
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar pb-24">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 w-10">
                    <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                        checked={sortedAndFilteredLeads.length > 0 && selectedIds.size === sortedAndFilteredLeads.length}
                        onChange={handleSelectAll}
                    />
                </th>
                <th onClick={() => handleSort('clientName')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors">
                  <div className="flex items-center">Client <SortIcon field="clientName" /></div>
                </th>
                <th onClick={() => handleSort('status')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors">
                  <div className="flex items-center">Status <SortIcon field="status" /></div>
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Response
                </th>
                <th onClick={() => handleSort('estimatedValue')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors text-right">
                  <div className="flex items-center justify-end">Value <SortIcon field="estimatedValue" /></div>
                </th>
                <th onClick={() => handleSort('createdAt')} className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors">
                   <div className="flex items-center">Date Added <SortIcon field="createdAt" /></div>
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {sortedAndFilteredLeads.length > 0 ? (
                sortedAndFilteredLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-surface-50 transition-colors group ${selectedIds.has(lead.id) ? 'bg-primary-50/30' : ''}`}>
                    <td className="p-4">
                        <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                            checked={selectedIds.has(lead.id)}
                            onChange={() => handleSelectRow(lead.id)}
                        />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold border border-primary-100">
                            {lead.clientName.charAt(0)}
                         </div>
                         <div>
                             <p className="font-bold text-gray-800 text-sm">{lead.clientName}</p>
                             <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                {PLATFORM_ICONS[lead.platform]}
                                <span className="truncate max-w-[120px]">{lead.contactHandle}</span>
                             </div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                        {getResponseStatus(lead)}
                    </td>
                    <td className="p-4 text-right font-mono text-sm font-medium text-gray-700">
                       ₹{lead.estimatedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                       <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                       </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEditLead(lead)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit Lead"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDeleteLead(lead.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400 border-dashed">
                        No leads found matching your criteria.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-surface-200 bg-surface-50 text-xs text-gray-500 flex justify-between items-center sticky bottom-0">
             <span>Showing {sortedAndFilteredLeads.length} leads</span>
             <div className="flex gap-1">
                 <span className="font-medium">Sort by:</span> 
                 <span className="capitalize">{sortField === 'createdAt' ? 'Date' : sortField.replace(/([A-Z])/g, ' $1').trim()}</span>
             </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-floating border border-surface-200 p-2 px-4 flex items-center gap-4 animate-slide-up z-20 max-w-[90%]">
              <div className="flex items-center gap-2 text-sm font-bold text-secondary border-r border-gray-100 pr-4 mr-2">
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-[10px] text-white">
                      {selectedIds.size}
                  </div>
                  Selected
              </div>
              
              {onBulkStatusUpdate && (
                <select 
                    className="bg-surface-50 border border-surface-200 text-xs rounded-lg p-2 outline-none focus:border-primary-300"
                    onChange={(e) => {
                        if (e.target.value) {
                            onBulkStatusUpdate(Array.from(selectedIds), e.target.value as LeadStatus);
                            handleBulkActionReset();
                        }
                    }}
                    defaultValue=""
                >
                    <option value="" disabled>Change Status...</option>
                    {Object.values(LeadStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
              )}

              {onBulkAssign && (
                  <div className="relative">
                      <UserIcon size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <select 
                          className="bg-surface-50 border border-surface-200 text-xs rounded-lg p-2 pl-7 outline-none focus:border-primary-300"
                          onChange={(e) => {
                              if (e.target.value) {
                                  onBulkAssign(Array.from(selectedIds), e.target.value);
                                  handleBulkActionReset();
                              }
                          }}
                          defaultValue=""
                      >
                          <option value="" disabled>Assign To...</option>
                          {USERS.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                      </select>
                  </div>
              )}

              {onBulkDelete && (
                <button 
                    onClick={() => {
                        onBulkDelete(Array.from(selectedIds));
                        handleBulkActionReset();
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                >
                    <Trash2 size={14} /> Delete
                </button>
              )}

              <button onClick={handleBulkActionReset} className="ml-2 text-gray-400 hover:text-gray-600">
                  <span className="text-xs">Cancel</span>
              </button>
          </div>
      )}
    </div>
  );
};

export default LeadList;
