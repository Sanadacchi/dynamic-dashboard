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
  FileBarChart,
  Folder,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  folder_id: string | null;
  progress?: number;
}

interface FolderItem {
  id: string;
  name: string;
  created_at: string;
  tenant_id: number;
}

export const Documents = () => {
  const { currentTenantId, currentUser } = useWorkspaceStore();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const { data: folders = [], isLoading: loadingFolders } = useQuery<FolderItem[]>({
    queryKey: ['folders', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('tenant_id', currentTenantId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!currentTenantId
  });

  const { data: files = [], isLoading: loadingFiles } = useQuery<FileItem[]>({ 
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

  const addFolder = useMutation({
    mutationFn: async (name: string) => {
      if (!currentTenantId) return;
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name, tenant_id: currentTenantId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setIsCreatingFolder(false);
      setNewFolderName('');
      addNotification('SUCCESS', 'Folder created successfully.');
    }
  });

  const moveFileToFolder = useMutation({
    mutationFn: async ({ fileId, folderId }: { fileId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from('documents')
        .update({ folder_id: folderId })
        .eq('id', fileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addNotification('SUCCESS', 'File moved successfully.');
    }
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const fileId = active.id;
      const folderId = over.id === 'root' ? null : over.id;
      moveFileToFolder.mutate({ fileId, folderId });
    }
  };

  const filteredFolders = folders.filter((f: any) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredFiles = files.filter((f: any) => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DraggableFileRow = ({ file, currentUser, deleteDocument, getFileIcon }: any) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: file.id,
    });
    const style = transform ? {
      transform: CSS.Translate.toString(transform),
      zIndex: isDragging ? 999 : undefined,
    } : undefined;

    return (
      <tr 
        ref={setNodeRef} 
        style={style} 
        className={`group hover:bg-white/[0.02] transition-colors ${isDragging ? 'opacity-50' : ''}`}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 touch-none">
              <GripVertical size={14} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              {getFileIcon(file.type)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
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
          </div>
        </td>
      </tr>
    );
  };

  const DroppableFolder = ({ folder }: any) => {
    const { isOver, setNodeRef } = useDroppable({
      id: folder.id,
    });

    const folderFiles = files.filter(f => f.folder_id === folder.id);

    return (
      <div 
        ref={setNodeRef}
        className={`p-4 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer group ${
          isOver ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-zinc-800 bg-white/5 hover:border-zinc-700'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          isOver ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20'
        }`}>
          <Folder size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{folder.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {folderFiles.length} files
          </p>
        </div>
        <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400" />
      </div>
    );
  };

  const { addNotification } = useNotificationStore();

  const DraggableFileCard = ({ file, currentUser, deleteDocument, getFileIcon }: any) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: file.id,
    });
    const style = transform ? {
      transform: CSS.Translate.toString(transform),
      zIndex: isDragging ? 999 : undefined,
    } : undefined;

    return (
      <div 
        ref={setNodeRef}
        style={style}
        className={`p-4 space-y-3 ${isDragging ? 'opacity-50 bg-indigo-500/5' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 touch-none">
              <GripVertical size={16} />
            </div>
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
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          <button className="text-[10px] text-zinc-400 font-bold hover:text-white flex items-center gap-1">
            DETAILS <MoreHorizontal size={12} />
          </button>
        </div>
      </div>
    );
  };

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
          size: file.size,
          folder_id: selectedFolderId
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
          <h2 className="text-xl font-bold">
            {selectedFolderId ? (
              <button 
                onClick={() => setSelectedFolderId(null)}
                className="hover:text-indigo-500 transition-colors flex items-center gap-2"
              >
                Documents <ChevronRight size={18} className="rotate-180" /> {folders.find(f => f.id === selectedFolderId)?.name}
              </button>
            ) : "Documents"}
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            {selectedFolderId ? "Viewing files in folder" : "Manage shared documents and reports."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreatingFolder(true)}
            className="bg-white/5 border border-zinc-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Plus size={18} /> New Folder
          </button>
          <button className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
            <Plus size={18} /> Upload File
          </button>
        </div>
      </div>

      {isCreatingFolder && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
              <Folder size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">Create New Folder</h4>
              <input 
                autoFocus
                type="text" 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && newFolderName && addFolder.mutate(newFolderName)}
                placeholder="Enter folder name..."
                className="w-full bg-transparent border-b border-indigo-500/50 py-1 text-sm outline-none focus:border-indigo-500 mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCreatingFolder(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => newFolderName && addFolder.mutate(newFolderName)}
                disabled={!newFolderName || addFolder.isPending}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {addFolder.isPending ? 'Creating...' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders Grid (Only show if not in a folder) */}
      {!selectedFolderId && filteredFolders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DndContext onDragEnd={handleDragEnd}>
            {filteredFolders.map(folder => (
              <div key={folder.id} onClick={() => setSelectedFolderId(folder.id)}>
                <DroppableFolder folder={folder} />
              </div>
            ))}
          </DndContext>
        </div>
      )}

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
              placeholder="Search files and folders..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {filteredFiles.filter(f => f.folder_id === selectedFolderId).map((file: any) => (
                  <DraggableFileRow 
                    key={file.id} 
                    file={file} 
                    currentUser={currentUser} 
                    deleteDocument={deleteDocument} 
                    getFileIcon={getFileIcon} 
                  />
                ))}
              </DndContext>
              {filteredFiles.filter(f => f.folder_id === selectedFolderId).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-xs italic">
                    {selectedFolderId ? "This folder is empty." : "No individual files found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-zinc-800/50">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {filteredFiles.filter(f => f.folder_id === selectedFolderId).map((file: any) => (
              <DraggableFileCard 
                key={file.id} 
                file={file} 
                currentUser={currentUser} 
                deleteDocument={deleteDocument} 
                getFileIcon={getFileIcon} 
              />
            ))}
          </DndContext>
          {filteredFiles.filter(f => f.folder_id === selectedFolderId).length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-xs italic">
               {selectedFolderId ? "This folder is empty." : "No individual files found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
