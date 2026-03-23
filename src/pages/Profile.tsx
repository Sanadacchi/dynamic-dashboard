import React, { useState } from 'react';
import { UserCircle, Mail, Briefcase, MapPin, Trash2, Edit2, Check, X } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { supabase } from '../lib/supabase';

export const Profile = () => {
  const { currentUser, setCurrentUser, setTenantId } = useWorkspaceStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editRole, setEditRole] = useState(currentUser?.role || '');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string, role: string }) => {
      const { data: user, error } = await supabase
        .from('users')
        .update({ name: data.name, role: data.role })
        .eq('id', currentUser?.id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, user };
    },
    onSuccess: (data) => {
      if (data.success && currentUser) {
        setCurrentUser({ ...currentUser, name: data.user.name, role: data.user.role });
        addNotification('SUCCESS', 'Profile updated successfully.');
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    }
  });

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUser?.id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (data) => {
      if (data.success) {
        addNotification('SUCCESS', 'Account deleted successfully.');
        setCurrentUser(null);
        setTenantId(null);
        navigate('/');
      }
    }
  });

  const handleSave = () => {
    if (editName.trim()) {
      updateProfile.mutate({ name: editName, role: editRole });
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserCircle className="text-indigo-500" /> User Profile
        </h2>
        <p className="text-zinc-500 text-sm mt-1">Manage your personal information and preferences.</p>
      </div>

      <div className="bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 mt-2">
          
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-3xl font-bold border border-indigo-500/30 shrink-0">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3 w-full max-w-[200px] md:max-w-xs">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-200/50 dark:bg-black/20 border border-indigo-500/50 rounded-xl px-3 md:px-4 py-2 text-lg md:text-xl font-bold text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                    placeholder="Your Name"
                  />
                  <input 
                    type="text" 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-black/20 border border-indigo-500/50 rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-zinc-300 outline-none focus:border-indigo-500"
                    placeholder="Your Role"
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white break-words">{currentUser?.name || 'Unknown User'}</h3>
                  <p className="text-sm md:text-base text-zinc-400 font-medium mt-1">{currentUser?.role || 'Contributor'}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 pt-2 sm:pt-0">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-zinc-900 dark:text-white rounded-xl text-xs md:text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Edit2 size={14} className="md:w-4 md:h-4" /> Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(currentUser?.name || '');
                    setEditRole(currentUser?.role || '');
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-xs md:text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <X size={14} className="md:w-4 md:h-4" /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs md:text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Check size={14} className="md:w-4 md:h-4" /> Save
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Mail size={14} /> Email Address
              </label>
              <div className="bg-zinc-200/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-700 dark:text-zinc-300">
                {currentUser?.name?.toLowerCase().replace(' ', '.') || 'user'}@grahamly.com
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Briefcase size={14} /> Department
              </label>
              <div className="bg-zinc-200/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-700 dark:text-zinc-300">
                Engineering
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <MapPin size={14} /> Location
              </label>
              <div className="bg-zinc-200/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-700 dark:text-zinc-300">
                Remote
              </div>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-rose-500 font-bold mb-2 flex items-center gap-2">
              <Trash2 size={18} /> Danger Zone
            </h4>
            <p className="text-sm text-zinc-500 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            
            {showDeleteConfirm ? (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-sm font-bold text-rose-500">Are you absolutely sure?</span>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => deleteAccount.mutate()}
                    disabled={deleteAccount.isPending}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    Yes, delete my account
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-sm font-bold transition-colors"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
