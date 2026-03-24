import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Briefcase, Plus, Layers, Clock, ChevronRight, Pencil, Trash2, X, Check } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { useProjectStore } from '../store/projectStore';
import { supabase } from '../lib/supabase';
import { getVocab } from '../projectVocab';
import { PERSONA_DATA, PersonaType } from '../personaConfig';
import { AddProjectModal } from '../components/ProjectModals';
import { format } from 'date-fns';

const PROJECT_COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
};

export const Projects = () => {
  useRealtimeSync();
  const { tenantId } = useParams<{ tenantId: string }>();
  const { currentTenantId } = useWorkspaceStore();
  const { projects, tasks, addProject, deleteProject, updateProject } = useProjectStore();
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', currentTenantId],
    queryFn: async () => {
      if (!currentTenantId) return null;
      const [tenantRes, usersRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', currentTenantId).single(),
        supabase.from('users').select('*').eq('tenant_id', currentTenantId)
      ]);
      if (tenantRes.error) throw tenantRes.error;
      return { tenant: tenantRes.data, users: usersRes.data || [] };
    },
    enabled: !!currentTenantId,
  });

  const users = dashboardData?.users || [];
  const tenant = dashboardData?.tenant;
  const personaKey = (tenant?.persona || tenant?.company_type) as PersonaType | undefined;
  
  // Fuzzy match for persona key if needed
  const normalizedPersonaKey = personaKey ? (Object.keys(PERSONA_DATA).find(k => 
    k === personaKey || k.includes(personaKey) || personaKey.includes(k)
  ) as PersonaType) : undefined;

  const vocab = getVocab(normalizedPersonaKey);
  const personaConfig = normalizedPersonaKey ? PERSONA_DATA[normalizedPersonaKey] : null;

  const tenantProjects = projects.filter(p => p.tenantId === currentTenantId);

  React.useEffect(() => {
    if (currentTenantId) {
      useProjectStore.getState().fetchData(currentTenantId);
    }
  }, [currentTenantId]);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Briefcase className="text-yellow-500" /> {vocab.pageTitle}
          </h2>
          <p className="text-zinc-500 text-sm mt-1">{vocab.pageSubtitle}</p>
        </div>
        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} /> {vocab.addProjectCta}
        </button>
      </div>

      {/* Project Cards */}
      {tenantProjects.length === 0 ? (
        <div
          onClick={() => setShowAddProject(true)}
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <Layers className="text-indigo-500" size={24} />
          </div>
          <p className="font-bold text-zinc-900 dark:text-white">No {vocab.projectLabel}s yet</p>
          <p className="text-sm text-zinc-500 mt-1">Click here or <span className="text-indigo-500 font-medium">"{vocab.addProjectCta}"</span> to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantProjects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const doneTasks = projectTasks.filter(t => t.status === 'done').length;
            const progress = projectTasks.length ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
            const colorClasses = PROJECT_COLOR_MAP[project.color] ?? PROJECT_COLOR_MAP['indigo'];

            return (
              <Link
                key={project.id}
                to={`/space/${tenantId}/projects/${project.id}`}
                className="group bg-white dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${colorClasses}`}>
                    <div className={`w-2 h-2 rounded-full bg-${project.color}-500`} />
                    {vocab.projectLabel}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingProject(project.id);
                          setEditTitle(project.title);
                          setEditDesc(project.description || "");
                        }}
                        className="p-1.5 text-zinc-500 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                        title="Edit Project"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${project.title}"? All associated tasks will also be removed.`)) {
                            deleteProject(project.id);
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <h3 className="font-bold text-zinc-900 dark:text-white mb-1">{project.title}</h3>
                {project.description && (
                  <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{project.description}</p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{doneTasks}/{projectTasks.length} {vocab.taskLabel}s complete</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-${project.color}-500 transition-all duration-700`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <Clock size={10} /> Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showAddProject && (
        <AddProjectModal
          vocab={vocab}
          users={users}
          tenantId={currentTenantId!}
          onSave={(data) => addProject({ ...data, tenantId: currentTenantId! })}
          onClose={() => setShowAddProject(false)}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1C] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Pencil size={18} className="text-indigo-500" />
                Edit {vocab.projectLabel}
              </h3>
              <button 
                onClick={() => setEditingProject(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Title</label>
                <input
                  autoFocus
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500/50 transition-colors"
                  placeholder="Project Title"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500/50 transition-colors min-h-[100px]"
                  placeholder="Project Description"
                />
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-white/[0.02] flex items-center gap-3">
              <button
                onClick={() => setEditingProject(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editTitle.trim()) {
                    updateProject(editingProject, { title: editTitle, description: editDesc });
                    setEditingProject(null);
                  }
                }}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
