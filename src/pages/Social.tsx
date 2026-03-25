import React, { useState } from 'react';
import { MessageSquare, Heart, Share2, Image as ImageIcon, Pencil, Trash2, Plus } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';
import { notificationService } from '../lib/notificationService';

export const Social = () => {
  const { currentTenantId, currentUser } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});

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
      const { data, error } = await supabase
        .from('social_posts')
        .insert([{
          tenant_id: currentTenantId,
          author_id: currentUser?.id,
          author_name: currentUser?.name || 'Unknown',
          author_role: currentUser?.role || 'Team Member',
          content: content
        }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      
      if (data && data[0] && currentTenantId && currentUser) {
        notificationService.notifyTeam(
          currentTenantId,
          currentUser.id,
          'New Social Update 📢',
          `${currentUser.name} just posted a new update.`
        );
        logActivity(currentTenantId, currentUser.id, 'SOCIAL_POST');
      }
    }
  });

  const likePost = useMutation({
    mutationFn: async (postId: number) => {
      const { data, error: fetchError } = await supabase
        .from('social_posts')
        .select('likes, liked_by')
        .eq('id', postId)
        .single();
      if (fetchError) throw fetchError;

      const likedBy = data.liked_by || [];
      const currentLikes = data.likes || 0;
      const isLiked = likedBy.includes(currentUser?.id);

      const newLikedBy = isLiked 
        ? likedBy.filter((id: number) => id !== currentUser?.id)
        : [...likedBy, currentUser?.id];
      
      const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

      const { error: updateError } = await supabase
        .from('social_posts')
        .update({ 
          likes: newLikes,
          liked_by: newLikedBy
        })
        .eq('id', postId);
      if (updateError) throw updateError;
      logActivity(currentTenantId!, currentUser?.id, 'SOCIAL_LIKE');
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socialPosts'] })
  });

  const addComment = useMutation({
    mutationFn: async (args: { postId: number, text: string }) => {
      const { data, error: fetchError } = await supabase
        .from('social_posts')
        .select('comments, comments_count')
        .eq('id', args.postId)
        .single();
      if (fetchError) throw fetchError;

      const comments = data.comments || [];
      const newCommentObj = {
        id: Math.random().toString(36).substring(2, 9),
        author_id: currentUser?.id,
        author_name: currentUser?.name || 'Unknown',
        content: args.text,
        created_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('social_posts')
        .update({ 
          comments: [...comments, newCommentObj],
          comments_count: (data.comments_count || 0) + 1
        })
        .eq('id', args.postId);
      if (updateError) throw updateError;
      logActivity(currentTenantId!, currentUser?.id, 'SOCIAL_COMMENT');
      return { success: true };
    },
    onSuccess: (_, variables) => {
      setNewComment(prev => ({ ...prev, [variables.postId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    }
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
                  <p className="text-[10px] text-zinc-500">
                    {post.author_role} • {post.created_at ? formatDistanceToNow(new Date(post.created_at)) : 'just now'} ago
                  </p>
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
                className={`flex items-center gap-2 text-xs font-bold transition-colors ${post.liked_by?.includes(currentUser?.id) ? 'text-pink-500' : 'text-zinc-500 hover:text-pink-500'}`}
              >
                <Heart size={16} className={post.liked_by?.includes(currentUser?.id) ? "fill-pink-500" : ""} /> {post.likes}
              </button>
              <button 
                onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                className={`flex items-center gap-2 text-xs font-bold transition-colors ${showComments[post.id] ? 'text-blue-500' : 'text-zinc-500 hover:text-blue-500'}`}
              >
                <MessageSquare size={16} /> {post.comments_count}
              </button>
              <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors ml-auto">
                <Share2 size={16} /> Share
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div className="mt-6 pt-6 border-t border-zinc-800/30 space-y-4">
                <div className="space-y-4">
                  {(post.comments || []).map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
                        {comment.author_name.charAt(0)}
                      </div>
                      <div className="flex-1 bg-white/5 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-white">{comment.author_name}</p>
                          <p className="text-[10px] text-zinc-600 italic">
                            {formatDistanceToNow(new Date(comment.created_at))} ago
                          </p>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newComment[post.id]?.trim()) {
                          addComment.mutate({ postId: post.id, text: newComment[post.id] });
                        }
                      }}
                      placeholder="Write a comment..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-pink-500/50 pr-10"
                    />
                    <button 
                      onClick={() => { if(newComment[post.id]?.trim()) addComment.mutate({ postId: post.id, text: newComment[post.id] }) }}
                      disabled={addComment.isPending || !newComment[post.id]?.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-pink-500 hover:text-pink-400 disabled:opacity-30 p-1"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
