import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadDataset } from '../services/api';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      await uploadDataset(file);
      navigate('/configuring');
    } catch (err) {
      setError("Failed to upload dataset. Ensure backend is running.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center p-6 relative overflow-y-auto text-on-background bg-transparent">
      {/* Background Decal */}
      <div className="absolute top-10 right-10 text-[12rem] font-display font-bold text-surface-low opacity-[0.03] select-none pointer-events-none text-clinical">
        AA
      </div>

      <div className="max-w-xl w-full flex flex-col items-center gap-8 z-10 py-8">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary tracking-tighter flex items-center gap-3">
            Aletheia AI<span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-on-surface-variant font-label font-bold">AI Bias Audit System</p>
        </div>

        <div className="flex gap-10 border-b border-outline-variant/10 w-full justify-center pb-2">
          <button className="text-primary text-xs font-label font-bold tracking-widest border-b-2 border-primary pb-2 -mb-[10px]">Dataset</button>
          <button className="text-on-surface-variant text-xs font-label font-bold tracking-widest pb-2 hover:text-on-surface transition-colors">Model</button>
        </div>

        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full h-48 border-2 border-dashed border-outline-variant/20 rounded-md flex flex-col items-center justify-center gap-3 bg-surface-container/30 hover:bg-surface-container/50 transition-all cursor-pointer group ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv"
          />
          <div className="w-10 h-10 rounded-md bg-surface-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadIcon size={20} />}
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-display font-bold text-on-surface">
              {isUploading ? "Uploading Forensic Artifact..." : "Drop forensic artifacts here"}
            </p>
            <p className="text-[10px] tracking-widest font-label font-medium opacity-70">Supports .csv only for current release</p>
          </div>
          {error && <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">{error}</p>}
        </div>

        <div className="w-full flex flex-col gap-2 opacity-50 pointer-events-none">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-[0.2em]">Clinical Description</label>
          </div>
          <textarea 
            className="w-full h-24 bg-surface-lowest border border-white/[0.03] rounded-md p-4 text-sm text-on-surface placeholder:text-on-surface-variant/20 resize-none font-sans"
            placeholder="Automatic context extraction enabled..."
            readOnly
          />
        </div>

        <div className="flex gap-10">
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant tracking-widest font-label font-medium opacity-50">
            <div className="w-1 h-1 rounded-full bg-primary/40"></div>
            Security: HIPAA Encrypted
          </div>
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant tracking-widest font-label font-medium opacity-50">
            <div className="w-1 h-1 rounded-full bg-primary/40"></div>
            Node: US-EAST-CLINICAL
          </div>
        </div>
      </div>
    </div>
  );
};
