/**
 * Core TypeScript types for the Kanban system
 */

export type KanbanStatus = 'pending' | 'in_progress' | 'completed' | 'parkinglot' | 'deleted';

export interface TaskCard {
  session: string;
  status: KanbanStatus;
  created: string;
  updated: string;
  taskId?: string;          // Link to Claude Code task
  subject: string;
  description: string;
  steps: string[];
}

export interface ProjectAnalysis {
  hasTasksDir: boolean;
  hasTodoMd: boolean;
  hasLessonsMd: boolean;
  isGitRepo: boolean;
  hasClaudeDir: boolean;
  projectRoot: string;
}

export interface Conflict {
  file: string;
  message: string;
  resolution: string;
  severity: 'warning' | 'error';
}

export interface TodoIndexMetadata {
  lastSession: string | null;
  currentSession: string;
  updatedAt: string;
}

export interface HookInput {
  toolName: string;
  toolInput: {
    subject?: string;
    description?: string;
    taskId?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'deleted';
    [key: string]: any;
  };
  toolOutput?: any;
}

export interface HookOutput {
  decision?: 'proceed' | 'block' | 'ask';
  additionalContext?: string;
  systemMessage?: string;
}
