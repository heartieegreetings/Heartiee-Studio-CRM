import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, PenTool } from 'lucide-react';
import { analyzeLeadScreenshot } from '../services/geminiService';
import { Lead } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadDetected: (lead: Partial<Lead>) => void;
  onManualEntry: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onLeadDetected, onManualEntry }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError("The pasted file is not an image.");
        return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const leadData = await analyzeLeadScreenshot(file);
      onLeadDetected(leadData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen || isAnalyzing) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault(); // Prevent default paste behavior
            processFile(file);
            return; // Only process the first image found
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, isAnalyzing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
            <Upload size={24} />
          </div>
          <h3 className="text-xl font-sans font-bold text-gray-900">Capture New Lead</h3>
          <p className="text-gray-500 text-sm mt-2">
            Upload a screenshot from Instagram, WhatsApp, or Email. 
            <br/>AI will extract the details automatically.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary-200"
             onClick={() => !isAnalyzing && fileInputRef.current?.click()}
             tabIndex={0}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
            disabled={isAnalyzing}
          />
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 size={32} className="animate-spin text-primary-500 mb-3" />
              <p className="text-sm font-medium text-gray-700">Analyzing Screenshot...</p>
              <p className="text-xs text-gray-400 mt-1">Extracting name, items, and dates</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <ImageIcon size={32} className="text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Click to upload or Paste (Ctrl+V)</p>
              <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="relative w-full flex items-center py-2">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-300 text-xs font-medium">OR</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button 
            onClick={onManualEntry}
            className="w-full py-3 rounded-xl bg-surface-50 hover:bg-surface-100 text-gray-700 text-sm font-bold border border-surface-200 transition-colors flex items-center justify-center gap-2"
          >
            <PenTool size={16} /> Enter Details Manually
          </button>

          <p className="text-xs text-gray-400">
            Powered by Gemini Vision AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;