import React, { useState } from 'react';
import { MessageSquare, Heart, Share2, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';

export const Social = () => {
  const { currentTenantId, currentUser } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: postsData } = useQuery<any>({ 
    queryKey: ['socialPosts', currentTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('tenant_id', currentTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentTenantId
  });
  const posts = postsData || [];

  const createPost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('social_posts')
        .insert([{
          tenant_id: currentTenantId,
          author_id: currentUser?.id,
          author_name: currentUser?.name || 'Unknown',
          author_role: currentUser?.role || 'Team Member',
          content: content
        }]);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    }
  });

  const likePost = useMutation({
    mutationFn: async (postId: number) => {
      const { data, error: fetchError } = await supabase
        .from('social_posts')
        .select('likes')
        .eq('id', postId)
        .single();
      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('social_posts')
        .update({ likes: (data.likes || 0) + 1 })
        .eq('id', postId);
      if (updateError) throw updateError;
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socialPosts'] })
  });

  const editPost = useMutation({
    mutationFn: async (args: { postId: number, content: string }) => {
      const { error } = await supabase
        .from('social_posts')
        .update({ content: args.content })
        .eq('id', args.postId);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      setEditingPostId(null);
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    }
  });

  const deletePost = useMutation({
    mutationFn: async (postId: number) => {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socialPosts'] })
  });

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="text-pink-500" /> Team Social
        </h2>
        <p className="text-zinc-500 text-sm mt-1">Connect, share updates, and celebrate wins with the team.</p>
      </div>

      {/* Composer */}
      <div className="bg-white/5 border border-zinc-800 rounded-3xl p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center font-bold shrink-0">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 space-y-4">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update or milestone..." 
              className="w-full bg-transparent border-none outline-none resize-none text-white placeholder:text-zinc-600 min-h-[80px]"
            />
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
              <button className="p-2 text-zinc-500 hover:text-pink-500 transition-colors rounded-lg hover:bg-white/5">
                <ImageIcon size={18} />
              </button>
              <button 
                onClick={() => { if(content.trim()) createPost.mutate() }}
                disabled={createPost.isPending || !content.trim()}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                Post Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Mockup */}
      <div className="space-y-6">
        {posts.map((post: any) => (
          <div key={post.id} className="bg-white/5 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 shrink-0">
                  {post.author_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{post.author_name}</p>
                  <p className="text-[10px] text-zinc-500">{post.author_role} • {formatDistanceToNow(new Date(post.created_at.replace(' ', 'T') + 'Z'))} ago</p>
                </div>
              </div>
              {post.author_id === currentUser?.id && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setEditingPostId(post.id); setEditContent(post.content); }} 
                    className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => { if(window.confirm('Delete this post?')) deletePost.mutate(post.id); }} 
                    className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            
            {editingPostId === post.id ? (
              <div className="mb-6 space-y-3">
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-black/20 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none focus:border-pink-500 resize-none min-h-[80px]"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setEditingPostId(null)} className="px-4 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors">Cancel</button>
                  <button 
                    onClick={() => { if(editContent.trim()) editPost.mutate({ postId: post.id, content: editContent }); }} 
                    disabled={editPost.isPending}
                    className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-zinc-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">
                {post.content}
              </p>
            )}
            
            <div className="flex items-center gap-6 pt-4 border-t border-zinc-800/50">
              <button 
                onClick={() => likePost.mutate(post.id)}
                className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-pink-500 transition-colors"
              >
                <Heart size={16} className={post.likes > 0 ? "fill-pink-500 text-pink-500" : ""} /> {post.likes}
              </button>
              <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-blue-500 transition-colors">
                <MessageSquare size={16} /> {post.comments_count}
              </button>
              <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors ml-auto">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
