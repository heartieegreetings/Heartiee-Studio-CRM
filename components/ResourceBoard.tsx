import React, { useState, useRef } from 'react';
import { Resource, ResourceType, UserRole } from '../types';
import { USERS } from '../constants';
import { 
  Link as LinkIcon, 
  MessageSquare, 
  Mail, 
  Image as ImageIcon, 
  Copy, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Search,
  X
} from 'lucide-react';

interface ResourceBoardProps {
  resources: Resource[];
  onCreateResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  currentUserRole: UserRole;
  currentUserId: string;
  onCopy: (text: string) => void;
}

const ResourceBoard: React.FC<ResourceBoardProps> = ({ 
  resources, onCreateResource, onDeleteResource, currentUserRole, currentUserId, onCopy 
}) => {
  const [filterType, setFilterType] = useState<ResourceType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ResourceType>('MESSAGE');
  const [newContent, setNewContent] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredResources = resources.filter(r => {
    const matchesType = filterType === 'ALL' || r.type === filterType;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewContent(result); 
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!newTitle || !newContent) return;

    const resource: Resource = {
      id: Date.now().toString(),
      title: newTitle,
      type: newType,
      content: newContent,
      description: newDesc,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId
    };

    onCreateResource(resource);
    setIsModalOpen(false);
    setNewTitle('');
    setNewType('MESSAGE');
    setNewContent('');
    setNewDesc('');
    setImagePreview(null);
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'LINK': return <LinkIcon size={16} className="text-blue-500" />;
      case 'MESSAGE': return <MessageSquare size={16} className="text-emerald-500" />;
      case 'EMAIL': return <Mail size={16} className="text-purple-500" />;
      case 'IMAGE': return <ImageIcon size={16} className="text-pink-500" />;
    }
  };

  return (
    <div className="pt-8 px-8 pb-20 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-sans font-bold text-secondary">Library</h2>
          <p className="text-gray-500 mt-1">Templates, assets, and quick links for the team.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-secondary hover:bg-black text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-gray-300 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={18} /> Add to Library
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 items-center sticky top-0 bg-[#fafaf9]/90 backdrop-blur py-4 z-10 border-b border-transparent">
        <div className="flex bg-white rounded-xl shadow-sm border border-surface-200 p-1 overflow-x-auto max-w-full">
          {(['ALL', 'MESSAGE', 'LINK', 'EMAIL', 'IMAGE'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                filterType === type ? 'bg-secondary text-white shadow' : 'text-gray-400 hover:bg-surface-50 hover:text-gray-700'
              }`}
            >
              {type === 'ALL' ? 'All' : type}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 w-full md:w-auto group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Masonry-like Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredResources.map(resource => (
          <div key={resource.id} className="bg-white rounded-2xl border border-surface-100 shadow-sm hover:shadow-floating hover:border-primary-100 transition-all duration-300 flex flex-col overflow-hidden group h-full relative">
            
            {/* Header */}
            <div className="p-5 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-50 rounded-lg border border-surface-100">
                        {getTypeIcon(resource.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-secondary text-sm line-clamp-1" title={resource.title}>{resource.title}</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{resource.type}</p>
                    </div>
                </div>
                <button 
                    onClick={() => onDeleteResource(resource.id)} 
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Preview Content */}
            <div className="px-5 pb-2 flex-1">
                <div className="bg-surface-50 rounded-xl p-4 text-sm text-gray-600 mb-3 min-h-[100px] relative border border-surface-100 group-hover:bg-white transition-colors">
                    {resource.type === 'IMAGE' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <img src={resource.content} alt={resource.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ) : (
                        <p className="line-clamp-4 font-mono text-xs leading-relaxed">{resource.content}</p>
                    )}
                </div>
                {resource.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 px-1">{resource.description}</p>
                )}
            </div>

            {/* Action Footer */}
            <div className="p-4 mt-auto flex items-center gap-2 justify-end border-t border-surface-50">
              {resource.type === 'LINK' && (
                <a 
                  href={resource.content.startsWith('http') ? resource.content : `https://${resource.content}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Open <ExternalLink size={12} />
                </a>
              )}
              {resource.type !== 'IMAGE' && (
                 <button 
                   onClick={() => onCopy(resource.content)}
                   className="text-xs font-bold text-gray-500 hover:text-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                 >
                   <Copy size={12} /> Copy
                 </button>
              )}
              {resource.type === 'IMAGE' && (
                <button 
                  onClick={() => {
                      const w = window.open("");
                      w?.document.write(`<img src="${resource.content}" style="max-width:100%"/>`);
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-secondary flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink size={12} /> View
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal (Keep similar structure but refined styles) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-secondary">Add to Library</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-surface-50 p-1 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Title</label>
                <input 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
                  placeholder="e.g. Pricing PDF"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                    {(['MESSAGE', 'LINK', 'EMAIL', 'IMAGE'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setNewType(t); setNewContent(''); setImagePreview(null); }}
                            className={`p-2 rounded-lg text-xs font-semibold border ${newType === t ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-surface-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Content</label>
                {newType === 'IMAGE' ? (
                  <div className="border-2 border-dashed border-surface-300 rounded-xl p-8 text-center cursor-pointer hover:bg-surface-50 hover:border-primary-300 transition-all" onClick={() => fileInputRef.current?.click()}>
                     <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                     {imagePreview ? (
                         <img src={imagePreview} alt="Preview" className="h-32 mx-auto object-contain rounded shadow-sm" />
                     ) : (
                         <div className="text-gray-400 text-sm flex flex-col items-center">
                             <ImageIcon size={24} className="mb-2" />
                             <span>Click to upload image</span>
                         </div>
                     )}
                  </div>
                ) : (
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full p-3 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 h-28 resize-none font-mono"
                    placeholder={newType === 'LINK' ? 'https://...' : 'Type your text here...'}
                  />
                )}
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!newTitle || !newContent}
                className="w-full bg-primary-500 hover:bg-primary-600 text-secondary font-bold py-3.5 rounded-xl shadow-lg shadow-primary-200/50 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceBoard;