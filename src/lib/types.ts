// Task types
export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignee: string;
  status: 'recurring' | 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  due_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Content Pipeline types
export interface ContentItem {
  id: number;
  title: string;
  stage: 'idea' | 'scripting' | 'thumbnail' | 'filming' | 'editing' | 'done';
  notes: string | null;
  image_url: string | null;
  owner: string;
  platform?: string;
  created_at: Date;
  updated_at: Date;
}

// Calendar types
export interface CalendarEvent {
  id: number;
  title: string;
  starts_at: Date;
  ends_at: Date | null;
  source: string;
  details: string | null;
  color?: string;
  created_at: Date;
  updated_at: Date;
}

// Team types
export interface TeamMember {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'away';
  emoji?: string;
  category?: 'chief' | 'input' | 'output' | 'meta';
  skills?: string[];
  created_at: Date;
  updated_at: Date;
}

// Memory types
export interface MemoryFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: MemoryFile[];
}

export interface MemoryEntry {
  timestamp: string;
  content: string;
}

// Office types
export interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: 'working' | 'chatting' | 'walking' | 'idle';
  position: { x: number; y: number };
  currentTask?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
