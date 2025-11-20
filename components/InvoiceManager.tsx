
import React, { useState, useRef, useMemo } from 'react';
import { Estimate, Lead, EstimateItem } from '../types';
import { BUSINESS_DETAILS } from '../constants';
import { Printer, FileText, X, ArrowUpRight, Trash2, Plus, Search, User, Save } from 'lucide-react';

interface EstimateManagerProps {
  estimates: Estimate[];
  leads: Lead[];
  onUpdateEstimate: (estimate: Estimate) => void;
  onCreateEstimate: (estimate: Estimate) => void;
  onViewLead: (lead: Lead) => void;
  onDeleteEstimate: (id: string) => void;
}

const EstimateManager: React.FC<EstimateManagerProps> = ({ 
  estimates, leads, onUpdateEstimate, onCreateEstimate, onViewLead, onDeleteEstimate 
}) => {
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Creation State
  const [newEstimateLeadId, setNewEstimateLeadId] = useState('');
  const [newEstimateItems, setNewEstimateItems] = useState<EstimateItem[]>([{ id: '1', description: '', quantity: 1, rate: 0 }]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estimate-${selectedEstimate?.estimateNumber || 'Print'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: {
                        50: '#fffbeb',
                        100: '#fef3c7',
                        200: '#fde68a',
                        300: '#fcd34d',
                        400: '#fbbf24',
                        500: '#FFD700',
                        600: '#eab308',
                        700: '#ca8a04',
                        800: '#a16207',
                        900: '#854d0e',
                    }
                  },
                  fontFamily: {
                    sans: ['Parkinsans', 'sans-serif'],
                  }
                }
              }
            }
          </script>
           <link href="https://fonts.googleapis.com/css2?family=Parkinsans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
           <style>
             body { font-family: 'Parkinsans', sans-serif; -webkit-print-color-adjust: exact; padding: 20px; }
           </style>
        </head>
        <body>
          ${content.outerHTML}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 800);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.clientName : 'Unknown Client';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Declined': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const filteredEstimates = estimates.filter(est => {
      const clientName = getLeadName(est.leadId).toLowerCase();
      const number = est.estimateNumber.toLowerCase();
      const query = searchQuery.toLowerCase();
      return clientName.includes(query) || number.includes(query);
  });

  // Creation Logic
  const addItemRow = () => {
      setNewEstimateItems([...newEstimateItems, { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }]);
  };

  const updateItem = (index: number, field: keyof EstimateItem, value: any) => {
      const updated = [...newEstimateItems];
      updated[index] = { ...updated[index], [field]: value };
      setNewEstimateItems(updated);
  };

  const removeItem = (index: number) => {
      setNewEstimateItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = (items: EstimateItem[]) => {
      const subTotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
      const gstAmount = subTotal * 0.18;
      const totalAmount = subTotal + gstAmount;
      return { subTotal, gstAmount, totalAmount };
  };

  const handleCreateSave = () => {
      if (!newEstimateLeadId) {
          alert("Please select a client.");
          return;
      }

      const { subTotal, gstAmount, totalAmount } = calculateTotals(newEstimateItems);

      const newEstimate: Estimate = {
          id: Date.now().toString(),
          leadId: newEstimateLeadId,
          estimateNumber: `EST-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          items: newEstimateItems,
          notes: '',
          status: 'Draft',
          subTotal,
          gstAmount,
          totalAmount
      };

      onCreateEstimate(newEstimate);
      setIsCreating(false);
      // Reset form
      setNewEstimateLeadId('');
      setNewEstimateItems([{ id: '1', description: '', quantity: 1, rate: 0 }]);
  };

  const { subTotal: newSubTotal, gstAmount: newGst, totalAmount: newTotal } = calculateTotals(newEstimateItems);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-sans font-bold text-gray-800">Estimates</h2>
        <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary-500 hover:bg-primary-600 text-secondary font-bold py-2 px-4 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
        >
            <Plus size={18} /> Create New Estimate
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
             type="text" 
             placeholder="Search by client or estimate #..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
      </div>

      {filteredEstimates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Estimates Found</h3>
          <p className="text-gray-500 mt-1">Create a new estimate or adjust your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Estimate #</th>
                <th className="p-4 font-semibold text-gray-600">Client</th>
                <th className="p-4 font-semibold text-gray-600">Date</th>
                <th className="p-4 font-semibold text-gray-600">Amount</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstimates.map(est => (
                <tr key={est.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{est.estimateNumber}</td>
                  <td className="p-4 text-gray-600">{getLeadName(est.leadId)}</td>
                  <td className="p-4 text-gray-500">{new Date(est.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-gray-900">₹{est.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(est.status)}`}>
                      {est.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                     <div className="flex items-center justify-end gap-2">
                        <button 
                        onClick={() => setSelectedEstimate(est)}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                        View / Print
                        </button>
                        <button 
                        onClick={() => onDeleteEstimate(est.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete Estimate"
                        >
                            <Trash2 size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Estimate Modal */}
      {isCreating && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900">Create New Estimate</h3>
                      <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Client <span className="text-red-500">*</span></label>
                          <div className="relative">
                              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <select 
                                value={newEstimateLeadId} 
                                onChange={(e) => setNewEstimateLeadId(e.target.value)}
                                className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-500 bg-white"
                              >
                                  <option value="">-- Choose a Client --</option>
                                  {leads.map(lead => (
                                      <option key={lead.id} value={lead.id}>{lead.clientName}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase mb-2">
                                <div className="col-span-6">Description</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-3 text-right">Rate</div>
                                <div className="col-span-1"></div>
                          </div>
                          {newEstimateItems.map((item, idx) => (
                              <div key={item.id} className="grid grid-cols-12 gap-2 items-center mb-2">
                                  <div className="col-span-6">
                                      <input 
                                          value={item.description} 
                                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                          className="w-full p-2 border border-gray-200 rounded text-sm"
                                          placeholder="Item desc"
                                      />
                                  </div>
                                  <div className="col-span-2">
                                      <input 
                                          type="number"
                                          value={item.quantity} 
                                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                          className="w-full p-2 border border-gray-200 rounded text-sm text-center"
                                      />
                                  </div>
                                  <div className="col-span-3">
                                      <input 
                                          type="number"
                                          value={item.rate} 
                                          onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                                          className="w-full p-2 border border-gray-200 rounded text-sm text-right"
                                      />
                                  </div>
                                  <div className="col-span-1 text-center">
                                      {newEstimateItems.length > 1 && (
                                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                              <Trash2 size={14} />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                          <button onClick={addItemRow} className="text-sm text-primary-600 hover:underline flex items-center gap-1 mt-2">
                                <Plus size={14} /> Add Item
                          </button>
                      </div>

                      <div className="flex flex-col items-end pt-4 gap-1 mt-4">
                            <div className="flex justify-between w-48 text-sm text-gray-500">
                                <span>Subtotal:</span>
                                <span>₹{newSubTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between w-48 text-sm text-gray-500">
                                <span>GST (18%):</span>
                                <span>₹{newGst.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between w-48 text-lg font-bold text-gray-800 border-t border-gray-200 pt-2 mt-1">
                                <span>Total:</span>
                                <span>₹{newTotal.toLocaleString('en-IN')}</span>
                            </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                      <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                      <button 
                        onClick={handleCreateSave}
                        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-secondary font-bold rounded-lg shadow-sm flex items-center gap-2"
                      >
                          <Save size={16} /> Save Estimate
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Estimate Modal for Print/View */}
      {selectedEstimate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
               <h3 className="font-bold text-gray-700">Estimate Details</h3>
               <div className="flex gap-2">
                  <select 
                    value={selectedEstimate.status}
                    onChange={(e) => onUpdateEstimate({...selectedEstimate, status: e.target.value as any})}
                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Declined">Declined</option>
                  </select>
                  <button onClick={handlePrint} className="flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded hover:bg-primary-200 transition-colors">
                    <Printer size={16} /> Print
                  </button>
                  <button onClick={() => setSelectedEstimate(null)} className="text-gray-400 hover:text-gray-600 px-2">
                    <X size={20} />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              {/* Printable Area */}
              <div ref={printRef} className="bg-white p-10 shadow-sm mx-auto max-w-[210mm] min-h-[297mm] text-sm relative">
                 <div className="flex justify-between mb-8 border-b pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary-500"></div>
                            <h1 className="font-sans text-3xl font-bold tracking-tight text-gray-900">Heartiee</h1>
                        </div>
                        <div className="text-gray-500 text-xs leading-relaxed">
                            <p className="font-bold text-gray-700 mb-1">{BUSINESS_DETAILS.address}</p>
                            <p>GST: {BUSINESS_DETAILS.gst}</p>
                            <p>Ph: {BUSINESS_DETAILS.contact}</p>
                            <p>Email: {BUSINESS_DETAILS.email}</p>
                            <p>Web: {BUSINESS_DETAILS.website}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-light text-gray-200 uppercase tracking-widest mb-4">Estimate</h2>
                        <table className="w-full text-right">
                            <tbody>
                                <tr>
                                    <td className="text-gray-500 pr-4 py-1">Estimate No:</td>
                                    <td className="font-bold text-gray-800">{selectedEstimate.estimateNumber}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 pr-4 py-1">Date:</td>
                                    <td className="text-gray-800">{new Date(selectedEstimate.date).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td className="text-gray-500 pr-4 py-1">Valid Until:</td>
                                    <td className="text-gray-800">{new Date(selectedEstimate.validUntil).toLocaleDateString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                 </div>

                 <div className="mb-10">
                     <div className="flex justify-between items-end mb-2">
                         <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Bill To</p>
                         <button 
                           onClick={() => {
                             const lead = leads.find(l => l.id === selectedEstimate.leadId);
                             if (lead) {
                               setSelectedEstimate(null);
                               onViewLead(lead);
                             }
                           }}
                           className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-800 font-bold hover:underline transition-colors"
                         >
                           View Client Profile <ArrowUpRight size={14} />
                         </button>
                     </div>
                     <h3 className="font-bold text-xl text-gray-800">{getLeadName(selectedEstimate.leadId)}</h3>
                 </div>

                 <table className="w-full mb-8">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider border-y border-gray-100">
                            <th className="p-4 text-left">Description</th>
                            <th className="p-4 text-center w-24">Qty</th>
                            <th className="p-4 text-right w-32">Rate</th>
                            <th className="p-4 text-right w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {selectedEstimate.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50">
                                <td className="p-4">{item.description}</td>
                                <td className="p-4 text-center">{item.quantity}</td>
                                <td className="p-4 text-right">₹{item.rate.toLocaleString()}</td>
                                <td className="p-4 text-right font-medium">₹{(item.quantity * item.rate).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>

                 <div className="flex justify-end">
                    <div className="w-64">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">₹{selectedEstimate.subTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">GST (18%)</span>
                            <span className="font-medium">₹{selectedEstimate.gstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between py-3 mt-1">
                            <span className="font-bold text-lg text-gray-800">Total</span>
                            <span className="font-bold text-lg text-gray-900 bg-primary-50 px-2 rounded">₹{selectedEstimate.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                 </div>

                 {selectedEstimate.notes && (
                    <div className="mt-12 border-t border-gray-100 pt-6">
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2 font-bold">Notes / Terms</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{selectedEstimate.notes}</p>
                    </div>
                 )}

                 <div className="absolute bottom-10 left-10 right-10 text-center text-gray-400 text-xs border-t border-gray-100 pt-6">
                     <p className="font-bold text-gray-500">Thank you for choosing Heartiee!</p>
                     <p className="mt-1">Please contact us for any queries regarding this estimate.</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimateManager;
