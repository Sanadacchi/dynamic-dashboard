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
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';

interface FileItem {
  id: string;
  name: string;
  type: string;
  uploaded_by: number;
  uploader_name: string;
  created_at: string;
  size: number;
  url: string;
  progress?: number;
}

export const Documents = () => {
  const { currentTenantId, currentUser } = useWorkspaceStore();
  const queryClient = useQueryClient();
  
  const { data: files = [], isLoading } = useQuery<FileItem[]>({ 
    queryKey: ['documents', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*, users(name)')
        .eq('tenant_id', currentTenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(d => ({
        ...d,
        uploader_name: (d as any).users?.name || 'Unknown'
      }));
    },
    enabled: !!currentTenantId
  });
  
  const { addNotification } = useNotificationStore();

  const deleteDocument = useMutation({
    mutationFn: async (file: FileItem) => {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', file.id);
      
      if (dbError) throw dbError;

      // 2. Delete from storage
      const storagePath = file.url.split('/').pop();
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([storagePath]);
        if (storageError) console.error('Failed to delete physical file', storageError);
      }
    },
    onSuccess: () => {
      addNotification('SUCCESS', 'Document deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleFileUpload = async (file: File) => {
    if (!currentTenantId || !currentUser) return;
    
    try {
      try {
        addNotification('INFO', `Uploading ${file.name}...`);
      } catch (e) {
        console.warn('Silent Notification Error:', e);
      }
      
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${currentTenantId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 2. Insert into documents table
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          tenant_id: currentTenantId,
          uploaded_by: currentUser.id,
          name: file.name,
          type: fileExt || 'file',
          url: publicUrl,
          size: file.size
        });

      if (dbError) throw dbError;

      logActivity(currentTenantId, currentUser.id, 'DOC_UPLOADED');

      addNotification('SUCCESS', 'Document stored securely in the cloud.');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err: any) {
      console.error('Upload failed', err);
      addNotification('ERROR', `Upload failed: ${err.message}`);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => handleFileUpload(file));
  }, [currentTenantId, currentUser]);

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

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {file.created_at ? format(new Date(file.created_at), 'MMM d, yyyy') : 'Recently'}
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={file.url} download={file.name} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                        <Download size={16} />
                      </a>
                      {file.uploaded_by == currentUser?.id && (
                        <button 
                          onClick={() => { if(window.confirm('Delete this document?')) deleteDocument.mutate(file); }}
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

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-zinc-800/50">
          {files.map((file) => (
            <div key={file.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate break-all max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {file.uploader_name} • {file.created_at ? format(new Date(file.created_at), 'MMM d, yyyy') : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a href={file.url} download={file.name} className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white">
                    <Download size={18} />
                  </a>
                  {file.uploaded_by == currentUser?.id && (
                    <button 
                      onClick={() => { if(window.confirm('Delete this document?')) deleteDocument.mutate(file); }}
                      className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-rose-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
              {file.progress !== undefined && (
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300" 
                    style={{ width: `${file.progress}%` }} 
                  />
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button className="text-[10px] text-zinc-400 font-bold hover:text-white flex items-center gap-1">
                  DETAILS <MoreHorizontal size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
