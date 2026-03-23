import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, ArrowLeft, Flag, User, GripVertical } from 'lucide-react';
import { useProjectStore, Task, TaskStatus } from '../store/projectStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useQuery } from '@tanstack/react-query';
import { getVocab } from '../projectVocab';
import { PERSONA_DATA, PersonaType } from '../personaConfig';
import { AddTaskModal } from './ProjectModals';
import { TaskDetailDrawer } from './TaskDetailDrawer';

const PRIORITY_BADGE: Record<string, string> = {
  Low: 'text-zinc-400 bg-zinc-400/10',
  Medium: 'text-blue-400 bg-blue-400/10',
  High: 'text-amber-400 bg-amber-400/10',
  Critical: 'text-rose-500 bg-rose-500/10',
};

const COLUMN_COLORS: Record<string, string> = {
  todo: 'border-zinc-400/30',
  in_progress: 'border-blue-500/40',
  review: 'border-amber-500/40',
  done: 'border-emerald-500/40',
};

const COLUMN_HEADER_COLORS: Record<string, string> = {
  todo: 'text-zinc-400',
  in_progress: 'text-blue-400',
  review: 'text-amber-400',
  done: 'text-emerald-400',
};

// Single draggable task card
const TaskCard: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl p-3 group cursor-pointer hover:border-indigo-500/40 hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900 dark:text-white leading-snug flex-1">{task.title}</p>
        <button
          {...listeners}
          {...attributes}
          onClick={e => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-grab active:cursor-grabbing shrink-0 mt-0.5 transition-opacity"
        >
          <GripVertical size={14} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-3 gap-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${PRIORITY_BADGE[task.priority]}`}>
          {task.priority}
        </span>
        {task.assigneeName && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-bold">
              {task.assigneeName.charAt(0)}
            </div>
            <span className="hidden sm:inline">{task.assigneeName}</span>
          </div>
        )}
      </div>

      {task.comments.length > 0 && (
        <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
          💬 {task.comments.length} comment{task.comments.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

// Droppable column
const KanbanColumn: React.FC<{
  columnId: string;
  label: string;
  tasks: Task[];
  onAddTask: () => void;
  vocab: any;
  onClickTask: (t: Task) => void;
}> = ({ columnId, label, tasks, onAddTask, vocab, onClickTask }) => {
  const { setNodeRef } = useDroppable({ id: columnId });

  return (
    <div className="flex flex-col min-h-[300px] w-72 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${COLUMN_HEADER_COLORS[columnId]}`}>{label}</span>
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-0.5">{tasks.length}</span>
        </div>
        <button onClick={onAddTask} className="text-zinc-400 hover:text-indigo-500 transition-colors p-1 rounded-lg hover:bg-indigo-500/10">
          <Plus size={14} />
        </button>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-2xl border ${COLUMN_COLORS[columnId]} p-3 bg-zinc-50 dark:bg-zinc-900/30 space-y-2.5 min-h-[200px] transition-colors`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => onClickTask(task)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-20 flex items-center justify-center text-xs text-zinc-500 italic">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------
// Main ProjectBoard Page
// -------------------------------------------------------
export const ProjectBoard = () => {
  const { tenantId, projectId } = useParams<{ tenantId: string; projectId: string }>();
  const { currentUser, currentTenantId } = useWorkspaceStore();
  const { projects, tasks, addTask, moveTask } = useProjectStore();

  const { data: dashboardData } = useQuery<any>({
    queryKey: ['dashboard', currentTenantId?.toString()],
    queryFn: () => currentTenantId ? fetch(`/api/dashboard/${currentTenantId}`).then(r => r.json()) : null,
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

  const project = projects.find(p => p.id === projectId);
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  React.useEffect(() => {
    if (currentTenantId) {
      useProjectStore.getState().fetchData(currentTenantId);
    }
  }, [currentTenantId]);

  const [addTaskColumn, setAddTaskColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    // Determine which column was dropped into
    const overColumnId = vocab.columns.find(c => c.id === over.id)?.id
      ?? tasks.find(t => t.id === over.id)?.status;

    if (overColumnId && overColumnId !== tasks.find(t => t.id === active.id)?.status) {
      moveTask(active.id as string, overColumnId as TaskStatus, currentUser?.name ?? 'Someone');
    }
  };

  const activeTask = tasks.find(t => t.id === activeId);

  if (!project) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-64">
        <p className="text-zinc-500">Project not found.</p>
        <Link to={`/space/${tenantId}/projects`} className="text-indigo-500 hover:underline text-sm">← Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/space/${tenantId}/projects`} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-${project.color}-500`} />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{project.title}</h2>
            </div>
            {project.description && <p className="text-sm text-zinc-500 mt-0.5 ml-5">{project.description}</p>}
          </div>
        </div>
        <div className="text-xs text-zinc-500 bg-zinc-100 dark:bg-white/5 rounded-xl px-3 py-1.5 font-medium">
          {projectTasks.length} {vocab.taskLabel}{projectTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max">
            {vocab.columns.map(col => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                label={col.label}
                tasks={projectTasks.filter(t => t.status === col.id)}
                vocab={vocab}
                onAddTask={() => setAddTaskColumn(col.id)}
                onClickTask={task => setSelectedTask(task)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-white dark:bg-zinc-800 border border-indigo-500/50 rounded-xl p-3 shadow-2xl w-72 rotate-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{activeTask.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Task Modal */}
      {addTaskColumn && (
        <AddTaskModal
          projectId={projectId!}
          vocab={vocab}
          users={users}
          onSave={(taskData) => addTask({
            ...taskData,
            tenantId: currentTenantId!,
            projectId: projectId!,
            status: addTaskColumn as TaskStatus,
          })}
          onClose={() => setAddTaskColumn(null)}
        />
      )}

      {/* Task Detail Drawer */}
      {/* Re-derive selected task from store to get latest comments */}
      <TaskDetailDrawer
        task={tasks.find(t => t.id === selectedTask?.id) ?? null}
        vocab={vocab}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};
