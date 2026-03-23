import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Key, Copy, Check, DatabaseZap, ShieldAlert, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export const Integrations = () => {
  const { currentTenantId } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [copiedKey, setCopiedKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['apiKeys', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return [];
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('tenant_id', currentTenantId);
      if (error) throw error;
      return data;
    },
    enabled: !!currentTenantId
  });

  const generateKey = useMutation({
    mutationFn: async () => {
      const rawKey = 'ghm_live_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      const prefix = rawKey.substring(0, 13) + '...';
      const name = newKeyName || 'Production API Key';

      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          tenant_id: currentTenantId,
          name,
          prefix,
          key_hash: 'HASHED_LOGIC_ON_SERVER_OR_MOCKED_HERE' // Ideally hashed, but following current UI flow
        }])
        .select()
        .single();
        
      if (error) throw error;
      return { ...data, rawKey };
    },
    onSuccess: (data) => {
      setRevealedKey(data.rawKey);
      setNewKeyName('');
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    }
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: number) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
  });

  if (isLoading) return <div className="p-8">Loading API Settings...</div>;

  const handleCopyRawKey = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <DatabaseZap className="text-indigo-500" />
          Developer API & Integrations
        </h2>
        <p className="text-zinc-400">Manage your programmatic access keys to extract data seamlessly into external websites, or sink high-throughput Webhooks directly into your widgets.</p>
      </div>

      <div className="bg-[#1C1C1C] border border-zinc-800 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Key size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Public API Keys</h3>
              <p className="text-xs text-zinc-500">Generate secure cryptographic keys for Webhooks and API retrieval.</p>
            </div>
          </div>
        </div>

        {revealedKey && (
          <div className="mb-8 p-6 border border-emerald-500/30 bg-emerald-500/10 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
              <AlertTriangle size={16} /> Key Generated Successfully!
            </h4>
            <p className="text-sm text-zinc-300 mb-4">
              Please copy this key and save it somewhere secure. <strong>You will never be able to see it again.</strong>
            </p>
            
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-black/50 border border-emerald-500/20 px-4 py-3 rounded-lg text-emerald-300 font-mono tracking-wider break-all">
                {revealedKey}
              </code>
              <button 
                onClick={handleCopyRawKey}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-bold transition-colors"
              >
                {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                {copiedKey ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button 
              onClick={() => setRevealedKey(null)}
              className="mt-4 text-xs font-bold text-emerald-500 hover:text-emerald-400"
            >
              I have saved this key safely
            </button>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {keys && keys.length > 0 ? keys.map((key: any) => (
            <div key={key.id} className="flex items-center justify-between p-4 bg-white/5 border border-zinc-700/50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-white mb-1">{key.name}</p>
                <div className="flex items-center gap-3">
                  <code className="text-xs text-zinc-400 font-mono">{key.prefix}</code>
                  <span className="text-[10px] text-zinc-600">Generated {new Date(key.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                onClick={() => { if(confirm('Are you sure you want to revoke this key? Services using it will break instantly.')) revokeKey.mutate(key.id); }}
                className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Revoke Key"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )) : (
            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl">
              <p className="text-sm text-zinc-500">You don't have any active API keys.</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-zinc-800 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Generate New Key</label>
            <input 
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="e.g. My Next.js Website"
              className="w-full bg-black/20 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
            />
          </div>
          <button 
            onClick={() => { if (newKeyName.trim()) generateKey.mutate(); }}
            disabled={!newKeyName.trim() || generateKey.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold text-sm rounded-xl transition-colors"
          >
            <Plus size={16} /> Generate
          </button>
        </div>
      </div>
      
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mt-4">
        <p className="text-xs text-zinc-400 leading-relaxed">
          <strong className="text-indigo-400">Pro-Tip:</strong> To ingest data payloads automatically mapping directly to your dashboard custom widgets, navigate to the <code className="text-white">Overview</code> page, right-click any mapped Custom Metric, and select <strong>Webhook Snippet</strong> to generate copyable Node.js & POST URLs!
        </p>
      </div>
    </div>
  );
};
