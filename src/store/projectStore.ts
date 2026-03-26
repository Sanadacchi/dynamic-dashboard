import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Comment {
  id: string;
  authorId: number;
  authorName: string;
  text: string;
  timestamp: string;
}

export interface ActivityEntry {
  id: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  projectId: string;
  tenantId: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: number | null;
  assigneeName: string | null;
  comments: Comment[];
  activity: any[]; // Changed from ActivityEntry[] to any[] for flexibility if needed, or keeping it as is. Actually I saw ActivityEntry interface above.
  createdAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  tenantId: number;
  title: string;
  description: string;
  color: string;
  tasksCount?: number;
  createdAt: string;
}

interface ProjectState {
  projects: Project[];
  tasks: Task[];
  isLoading: boolean;
  fetchData: (tenantId: number) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<string | null>;
  addTask: (task: Omit<Task, 'id' | 'comments' | 'activity' | 'createdAt'>, actorId?: number | null) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, actorName: string, actorId?: number | null) => Promise<void>;
  addComment: (taskId: string, authorId: number, authorName: string, text: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      tasks: [],
      isLoading: false,

      fetchData: async (tenantId) => {
        set({ isLoading: true });
        try {
          const [projectsRes, tasksRes] = await Promise.all([
            supabase.from('projects').select('*').eq('tenant_id', tenantId),
            supabase.from('tasks').select('*').eq('tenant_id', tenantId)
          ]);

          if (projectsRes.error) throw projectsRes.error;
          if (tasksRes.error) throw tasksRes.error;

          set({ 
            projects: (projectsRes.data || []).map(p => ({
              id: p.id,
              tenantId: p.tenant_id,
              title: p.title,
              description: p.description,
              color: p.color,
              createdAt: p.created_at || p.createdAt
            })) as Project[], 
            tasks: (tasksRes.data || []).map(t => ({
              id: t.id,
              projectId: t.project_id,
              tenantId: t.tenant_id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              assigneeId: t.assignee_id,
              assigneeName: t.assignee_name,
              comments: typeof t.comments === 'string' ? JSON.parse(t.comments) : (t.comments || []),
              activity: typeof t.activity === 'string' ? JSON.parse(t.activity) : (t.activity || []),
              createdAt: t.created_at || t.createdAt
            })) as Task[],
            isLoading: false 
          });
        } catch (err) {
          console.error('Failed to fetch data from Supabase', err);
          set({ isLoading: false });
        }
      },

      addProject: async (project) => {
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            tenant_id: project.tenantId,
            title: project.title,
            description: project.description,
            color: project.color
          }])
          .select()
          .single();

        if (error) {
          console.error('Failed to add project', error);
          alert('Failed to add project: ' + error.message);
          return null;
        }

        const newProject = {
          id: data.id,
          tenantId: data.tenant_id,
          title: data.title,
          description: data.description,
          color: data.color,
          createdAt: data.created_at || data.createdAt
        } as Project;
        set((state) => ({ projects: [...state.projects, newProject] }));
        return newProject.id;
      },

      addTask: async (task, actorId) => {
        const activity = [{ id: generateId(), text: 'Task created', timestamp: new Date().toISOString() }];
        const { data, error } = await supabase
          .from('tasks')
          .insert([{
            tenant_id: task.tenantId,
            project_id: task.projectId,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assignee_id: task.assigneeId,
            assignee_name: task.assigneeName,
            comments: [],
            activity: activity
          }])
          .select()
          .single();

        if (error) {
          console.error('Failed to add task', error);
          alert('Failed to add task: ' + error.message);
          return;
        }

        // Log Activity
        logActivity(task.tenantId, actorId || undefined, 'TASK_CREATED');

        const newTask = {
          id: data.id,
          projectId: data.project_id,
          tenantId: data.tenant_id,
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assigneeId: data.assignee_id,
          assigneeName: data.assignee_name,
          comments: [],
          activity: activity,
          createdAt: data.created_at || data.createdAt
        } as Task;
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      moveTask: async (taskId, newStatus, actorName, actorId) => {
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newActivity = [
          {
            id: generateId(),
            text: `${actorName} moved this to ${newStatus.replace('_', ' ')}`,
            timestamp: new Date().toISOString(),
          },
          ...task.activity,
        ];

        const { error } = await supabase
          .from('tasks')
          .update({ 
            status: newStatus, 
            activity: newActivity,
            completed_at: newStatus === 'done' ? new Date().toISOString() : null 
          })
          .eq('id', taskId);

        if (error) {
          console.error('Failed to move task', error);
          return;
        }

        // Log Activity
        const actionType = newStatus === 'done' ? 'TASK_DONE' : 'TASK_MOVED';
        logActivity(task.tenantId, actorId || undefined, actionType);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus, activity: newActivity } : t
          ),
        }));
      },

      addComment: async (taskId, authorId, authorName, text) => {
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newComments = [
          ...task.comments,
          { id: generateId(), authorId, authorName, text, timestamp: new Date().toISOString() },
        ];

        const { error } = await supabase
          .from('tasks')
          .update({ comments: newComments })
          .eq('id', taskId);

        if (error) {
          console.error('Failed to add comment', error);
          return;
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, comments: newComments } : t
          ),
        }));
      },

      deleteTask: async (taskId) => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) {
          console.error('Failed to delete task', error);
          return;
        }

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      },

      deleteProject: async (projectId) => {
        // Supabase tasks should ideally have ON DELETE CASCADE on project_id
        // But we'll filter local state too
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) {
          console.error('Failed to delete project', error);
          alert('Failed to delete project: ' + error.message);
          return;
        }

        set((state) => ({
          projects: state.projects.filter(p => p.id !== projectId),
          tasks: state.tasks.filter(t => t.projectId !== projectId)
        }));
      },

      updateProject: async (projectId, updates) => {
        const { error } = await supabase
          .from('projects')
          .update({
            title: updates.title,
            description: updates.description,
            color: updates.color
          })
          .eq('id', projectId);

        if (error) {
          console.error('Failed to update project', error);
          alert('Failed to update project: ' + error.message);
          return;
        }

        set((state) => ({
          projects: state.projects.map(p => 
            p.id === projectId ? { ...p, ...updates } : p
          )
        }));
      },
    }),
    { name: 'project-storage' }
  )
);
