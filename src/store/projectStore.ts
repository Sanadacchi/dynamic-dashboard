import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

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
  activity: ActivityEntry[];
  createdAt: string;
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
  addTask: (task: Omit<Task, 'id' | 'comments' | 'activity' | 'createdAt'>) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, actorName: string) => Promise<void>;
  addComment: (taskId: string, authorId: number, authorName: string, text: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
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
            projects: projectsRes.data as Project[], 
            tasks: (tasksRes.data || []).map(t => ({
              ...t,
              comments: typeof t.comments === 'string' ? JSON.parse(t.comments) : (t.comments || []),
              activity: typeof t.activity === 'string' ? JSON.parse(t.activity) : (t.activity || [])
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
          return null;
        }

        const newProject = data as Project;
        set((state) => ({ projects: [...state.projects, newProject] }));
        return newProject.id;
      },

      addTask: async (task) => {
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
          return;
        }

        const newTask = {
          ...data,
          comments: [],
          activity: activity
        } as Task;
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      moveTask: async (taskId, newStatus, actorName) => {
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
          .update({ status: newStatus, activity: newActivity })
          .eq('id', taskId);

        if (error) {
          console.error('Failed to move task', error);
          return;
        }

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
    }),
    { name: 'project-storage' }
  )
);
