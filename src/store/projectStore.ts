import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from './nanoid';

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
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => string;
  addTask: (task: Omit<Task, 'id' | 'comments' | 'activity' | 'createdAt'>) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, actorName: string) => void;
  addComment: (taskId: string, authorId: number, authorName: string, text: string) => void;
  deleteTask: (taskId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      tasks: [],

      addProject: (project) => {
        const id = generateId();
        set((state) => ({
          projects: [
            ...state.projects,
            { ...project, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      addTask: (task) => set((state) => ({
        tasks: [
          ...state.tasks,
          {
            ...task,
            id: generateId(),
            comments: [],
            activity: [{ id: generateId(), text: 'Task created', timestamp: new Date().toISOString() }],
            createdAt: new Date().toISOString(),
          },
        ],
      })),

      moveTask: (taskId, newStatus, actorName) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                activity: [
                  {
                    id: generateId(),
                    text: `${actorName} moved this to ${newStatus.replace('_', ' ')}`,
                    timestamp: new Date().toISOString(),
                  },
                  ...t.activity,
                ],
              }
            : t
        ),
      })),

      addComment: (taskId, authorId, authorName, text) => set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                comments: [
                  ...t.comments,
                  { id: generateId(), authorId, authorName, text, timestamp: new Date().toISOString() },
                ],
              }
            : t
        ),
      })),

      deleteTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      })),
    }),
    { name: 'project-storage' }
  )
);
