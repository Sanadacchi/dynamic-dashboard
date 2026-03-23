import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  FileText, 
  Upload, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Plus,
  FileCode,
  FileBarChart
} from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { format } from 'date-fns';

interface FileItem {
  id: string;
  name: string;
  type: string;
  uploadedBy: string;
  date: Date;
  size: string;
  progress?: number;
}

export const Documents = () => {
  const { currentTenantId, currentUser } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const { data } = useQuery<any>({ queryKey: ['dashboard', currentTenantId?.toString()] });
  const files = data?.documents || [];
  
  const { addNotification } = useNotificationStore();

  const deleteDocument = useMutation({
    mutationFn: (documentId: number) => fetch(`/api/documents/${documentId}?authorId=${currentUser?.id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  const handleFileUpload = async (file: File) => {
    if (!currentTenantId || !currentUser) return;
    console.log(`[Storage] Uploading ${file.name} to local Multer block...`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', currentUser.id.toString());

    try {
      const res = await fetch(`/api/documents/${currentTenantId}`, {
        method: 'POST',
        body: formData
      });
      
      const result = await res.json();
      if (result.success) {
        addNotification('SUCCESS', 'Document stored securely on the local filesystem.');
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => handleFileUpload(file));
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/csv': ['.csv']
    },
    multiple: true
  } as any);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="text-rose-500" />;
      case 'docx': return <FileCode className="text-indigo-500" />;
      case 'csv': return <FileBarChart className="text-emerald-500" />;
      default: return <FileText className="text-zinc-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Documents</h2>
          <p className="text-zinc-500 text-sm mt-1">Manage shared documents and reports.</p>
        </div>
        <button className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
          <Plus size={18} /> New Folder
        </button>
      </div>

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
          isDragActive ? 'border-emerald-500 bg-emerald-500/5 shadow-inner' : 'border-zinc-800 hover:border-zinc-700 bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload size={32} className={isDragActive ? 'text-emerald-500' : 'text-zinc-500'} />
        </div>
        <h3 className="text-lg font-bold">Drag and drop files here</h3>
        <p className="text-zinc-500 text-sm mt-2">Accepted formats: .pdf, .docx, .csv (Max 50MB)</p>
      </div>

      {/* File List */}
      <div className="bg-white/5 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="w-full bg-white/5 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:border-white/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Uploaded By</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {files.map((file) => (
              <tr key={file.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{file.name}</p>
                      {file.progress !== undefined && (
                        <div className="w-32 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300" 
                            style={{ width: `${file.progress}%` }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-400">{file.uploader_name}</td>
                <td className="px-6 py-4 text-xs text-zinc-400">{format(new Date(file.created_at.replace(' ', 'T') + 'Z'), 'MMM d, yyyy')}</td>
                <td className="px-6 py-4 text-xs text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={file.url} download={file.name} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                      <Download size={16} />
                    </a>
                    {file.uploaded_by == currentUser?.id && (
                      <button 
                        onClick={() => { if(window.confirm('Delete this document?')) deleteDocument.mutate(file.id); }}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
