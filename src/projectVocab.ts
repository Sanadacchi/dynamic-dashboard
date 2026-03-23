// Multi-tenant vocabulary mapping for Projects page
export const PROJECT_VOCAB: Record<string, {
  pageTitle: string;
  pageSubtitle: string;
  projectLabel: string; // e.g. "Sprint", "Pipeline"
  backlogLabel: string; // e.g. "Bugs", "Cold Leads"
  taskLabel: string;   // e.g. "Issue", "Lead", "Task"
  addProjectCta: string;
  columns: { id: string; label: string }[];
}> = {
  Tech: {
    pageTitle: 'Projects',
    pageSubtitle: 'Manage your active sprints and engineering backlog.',
    projectLabel: 'Sprint',
    backlogLabel: 'Bug Report',
    taskLabel: 'Issue',
    addProjectCta: 'New Sprint',
    columns: [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'review', label: 'Review' },
      { id: 'done', label: 'Done' },
    ],
  },
  Sales: {
    pageTitle: 'Pipelines',
    pageSubtitle: 'Track active pipelines and cold leads.',
    projectLabel: 'Pipeline',
    backlogLabel: 'Cold Lead',
    taskLabel: 'Deal',
    addProjectCta: 'New Pipeline',
    columns: [
      { id: 'todo', label: 'Prospecting' },
      { id: 'in_progress', label: 'Qualifying' },
      { id: 'review', label: 'Proposal' },
      { id: 'done', label: 'Closed Won' },
    ],
  },
  'Robotics/Hardware': {
    pageTitle: 'Build Phases',
    pageSubtitle: 'Track sub-assemblies, firmware tasks, and hardware milestones.',
    projectLabel: 'Build Phase',
    backlogLabel: 'Hardware Bug',
    taskLabel: 'Build Task',
    addProjectCta: 'New Phase',
    columns: [
      { id: 'todo', label: 'Planned' },
      { id: 'in_progress', label: 'Building' },
      { id: 'review', label: 'Testing' },
      { id: 'done', label: 'Verified' },
    ],
  },
  Influencers: {
    pageTitle: 'Campaigns',
    pageSubtitle: 'Manage active content campaigns and deliverables.',
    projectLabel: 'Campaign',
    backlogLabel: 'Content Idea',
    taskLabel: 'Deliverable',
    addProjectCta: 'New Campaign',
    columns: [
      { id: 'todo', label: 'Ideation' },
      { id: 'in_progress', label: 'Creating' },
      { id: 'review', label: 'Editing' },
      { id: 'done', label: 'Published' },
    ],
  },
  Events: {
    pageTitle: 'Event Planning',
    pageSubtitle: 'Manage venues, vendors, and logistics.',
    projectLabel: 'Event',
    backlogLabel: 'Open Item',
    taskLabel: 'Task',
    addProjectCta: 'New Event',
    columns: [
      { id: 'todo', label: 'To Arrange' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'review', label: 'Confirming' },
      { id: 'done', label: 'Locked In' },
    ],
  },
  _default: {
    pageTitle: 'Projects',
    pageSubtitle: 'Manage your active projects and tasks.',
    projectLabel: 'Project',
    backlogLabel: 'Backlog',
    taskLabel: 'Task',
    addProjectCta: 'New Project',
    columns: [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'review', label: 'Review' },
      { id: 'done', label: 'Done' },
    ],
  },
};

export const getVocab = (persona?: string) =>
  PROJECT_VOCAB[persona ?? ''] ?? PROJECT_VOCAB['_default'];
