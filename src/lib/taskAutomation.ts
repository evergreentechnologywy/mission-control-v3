import { promises as fs } from 'fs';
import path from 'path';
import { queryOne } from '@/lib/db';

const DATA_DIR = path.join(process.cwd(), '.data');
const RULES_FILE = path.join(DATA_DIR, 'task-automation-rules.json');
const DECISIONS_FILE = path.join(DATA_DIR, 'task-automation-decisions.json');
const METADATA_FILE = path.join(DATA_DIR, 'task-automation-task-metadata.json');

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  assignTo: string;
  keywords: string[];
  tags: string[];
  projects: string[];
  types: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAutomationMetadata {
  taskId: number;
  tags?: string[];
  project?: string;
  type?: string;
  manualOverride?: string | null;
  updatedAt: string;
}

export interface AutomationDecision {
  taskId: number;
  matchedRuleId: string | null;
  matchedRuleName: string | null;
  assignedAgent: string;
  confidence: number;
  reason: string;
  timestamp: string;
  manualOverride?: string | null;
}

export interface AutomationDraft {
  title?: string;
  description?: string;
  tags?: string[];
  project?: string;
  type?: string;
  manualOverride?: string | null;
}

const defaultRulesSeed: Omit<AutomationRule, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'rule-work-friday',
    name: 'Work / Business / Client / Ops / Admin → FRIDAY',
    enabled: true,
    priority: 100,
    assignTo: 'FRIDAY',
    keywords: ['work', 'business', 'client', 'ops', 'admin'],
    tags: ['work', 'business', 'client', 'ops', 'admin'],
    projects: [],
    types: [],
  },
  {
    id: 'rule-personal-veronica',
    name: 'Personal / Home / Errand / Social → VERONICA',
    enabled: true,
    priority: 90,
    assignTo: 'VERONICA',
    keywords: ['personal', 'home', 'errand', 'social'],
    tags: ['personal', 'home', 'errand', 'social'],
    projects: [],
    types: [],
  },
  {
    id: 'rule-pc1-karen',
    name: 'PC1 / Files / Browser / Local Machine 1 → KAREN',
    enabled: true,
    priority: 80,
    assignTo: 'KAREN',
    keywords: ['pc1', 'files', 'browser', 'local machine 1'],
    tags: ['pc1', 'files', 'browser', 'local-machine-1'],
    projects: ['pc1'],
    types: ['pc1'],
  },
  {
    id: 'rule-pc2-tadashi',
    name: 'PC2 / Files / Browser / Local Machine 2 → TADASHI',
    enabled: true,
    priority: 70,
    assignTo: 'TADASHI',
    keywords: ['pc2', 'files', 'browser', 'local machine 2'],
    tags: ['pc2', 'files', 'browser', 'local-machine-2'],
    projects: ['pc2'],
    types: ['pc2'],
  },
];

async function ensureFile<T>(file: string, fallback: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, JSON.stringify(fallback, null, 2), 'utf-8');
  }
}

function normalizeArray(input?: string[]): string[] {
  return (input || []).map((x) => x.trim().toLowerCase()).filter(Boolean);
}

function normalizeText(input?: string | null): string {
  return (input || '').toLowerCase().trim();
}

export async function getRules(): Promise<AutomationRule[]> {
  const now = new Date().toISOString();
  const seeded = defaultRulesSeed.map((r) => ({ ...r, createdAt: now, updatedAt: now }));
  await ensureFile(RULES_FILE, seeded);
  const raw = await fs.readFile(RULES_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as AutomationRule[];
  return parsed.sort((a, b) => b.priority - a.priority);
}

async function saveRules(rules: AutomationRule[]) {
  await ensureFile(RULES_FILE, rules);
  await fs.writeFile(RULES_FILE, JSON.stringify(rules, null, 2), 'utf-8');
}

export async function createRule(input: Partial<AutomationRule>): Promise<AutomationRule> {
  const rules = await getRules();
  const now = new Date().toISOString();
  const rule: AutomationRule = {
    id: input.id || `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name || 'Untitled rule',
    enabled: input.enabled ?? true,
    priority: Number(input.priority ?? 50),
    assignTo: input.assignTo || 'assistant',
    keywords: normalizeArray(input.keywords),
    tags: normalizeArray(input.tags),
    projects: normalizeArray(input.projects),
    types: normalizeArray(input.types),
    createdAt: now,
    updatedAt: now,
  };
  rules.push(rule);
  await saveRules(rules);
  return rule;
}

export async function updateRule(id: string, patch: Partial<AutomationRule>): Promise<AutomationRule | null> {
  const rules = await getRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const prev = rules[idx];
  const next: AutomationRule = {
    ...prev,
    ...patch,
    keywords: patch.keywords ? normalizeArray(patch.keywords) : prev.keywords,
    tags: patch.tags ? normalizeArray(patch.tags) : prev.tags,
    projects: patch.projects ? normalizeArray(patch.projects) : prev.projects,
    types: patch.types ? normalizeArray(patch.types) : prev.types,
    updatedAt: new Date().toISOString(),
  };

  rules[idx] = next;
  await saveRules(rules);
  return next;
}

export async function deleteRule(id: string): Promise<boolean> {
  const rules = await getRules();
  const next = rules.filter((r) => r.id !== id);
  if (next.length === rules.length) return false;
  await saveRules(next);
  return true;
}

async function ensureMetadataStore() {
  await ensureFile<Record<string, TaskAutomationMetadata>>(METADATA_FILE, {});
}

async function readMetadataStore(): Promise<Record<string, TaskAutomationMetadata>> {
  await ensureMetadataStore();
  const raw = await fs.readFile(METADATA_FILE, 'utf-8');
  return JSON.parse(raw) as Record<string, TaskAutomationMetadata>;
}

async function writeMetadataStore(data: Record<string, TaskAutomationMetadata>) {
  await ensureMetadataStore();
  await fs.writeFile(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function upsertTaskMetadata(taskId: number, patch: Omit<Partial<TaskAutomationMetadata>, 'taskId' | 'updatedAt'>) {
  const all = await readMetadataStore();
  const prev = all[String(taskId)] || { taskId, updatedAt: new Date().toISOString() };
  all[String(taskId)] = {
    ...prev,
    ...patch,
    taskId,
    tags: patch.tags ? normalizeArray(patch.tags) : prev.tags,
    project: patch.project !== undefined ? normalizeText(patch.project) : prev.project,
    type: patch.type !== undefined ? normalizeText(patch.type) : prev.type,
    manualOverride: patch.manualOverride !== undefined ? patch.manualOverride : prev.manualOverride,
    updatedAt: new Date().toISOString(),
  };
  await writeMetadataStore(all);
  return all[String(taskId)];
}

export async function getTaskMetadata(taskId: number): Promise<TaskAutomationMetadata | null> {
  const all = await readMetadataStore();
  return all[String(taskId)] || null;
}

export async function getAllTaskMetadata(): Promise<Record<string, TaskAutomationMetadata>> {
  return readMetadataStore();
}

async function ensureDecisionStore() {
  await ensureFile<Record<string, AutomationDecision>>(DECISIONS_FILE, {});
}

async function readDecisionsStore(): Promise<Record<string, AutomationDecision>> {
  await ensureDecisionStore();
  const raw = await fs.readFile(DECISIONS_FILE, 'utf-8');
  return JSON.parse(raw) as Record<string, AutomationDecision>;
}

async function writeDecisionsStore(data: Record<string, AutomationDecision>) {
  await ensureDecisionStore();
  await fs.writeFile(DECISIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAllDecisions() {
  return readDecisionsStore();
}

export async function getDecision(taskId: number): Promise<AutomationDecision | null> {
  const all = await readDecisionsStore();
  return all[String(taskId)] || null;
}

export async function saveDecision(decision: AutomationDecision) {
  const all = await readDecisionsStore();
  all[String(decision.taskId)] = decision;
  await writeDecisionsStore(all);
  return decision;
}

export async function previewAssignment(draft: AutomationDraft) {
  const rules = (await getRules()).filter((r) => r.enabled);
  const text = `${normalizeText(draft.title)} ${normalizeText(draft.description)}`.trim();
  const tags = normalizeArray(draft.tags);
  const project = normalizeText(draft.project);
  const type = normalizeText(draft.type);

  if (draft.manualOverride) {
    return {
      matchedRuleId: null,
      matchedRuleName: 'Manual override',
      assignedAgent: draft.manualOverride,
      confidence: 1,
      reason: `Manual override set to ${draft.manualOverride}`,
      score: 999,
    };
  }

  const scored = rules
    .map((rule) => {
      const keywordMatches = rule.keywords.filter((k) => text.includes(k));
      const tagMatches = rule.tags.filter((t) => tags.includes(t));
      const projectMatch = rule.projects.some((p) => p === project);
      const typeMatch = rule.types.some((t) => t === type);
      const score = keywordMatches.length * 3 + tagMatches.length * 4 + (projectMatch ? 5 : 0) + (typeMatch ? 5 : 0);
      const matched = score > 0;
      const reasonBits = [
        keywordMatches.length ? `keywords: ${keywordMatches.join(', ')}` : '',
        tagMatches.length ? `tags: ${tagMatches.join(', ')}` : '',
        projectMatch ? `project: ${project}` : '',
        typeMatch ? `type: ${type}` : '',
      ].filter(Boolean);
      return {
        rule,
        score,
        matched,
        reason: reasonBits.join(' • ') || 'No match',
      };
    })
    .filter((x) => x.matched)
    .sort((a, b) => (b.score - a.score) || (b.rule.priority - a.rule.priority));

  if (!scored.length) {
    return {
      matchedRuleId: null,
      matchedRuleName: null,
      assignedAgent: 'assistant',
      confidence: 0,
      reason: 'No automation rule matched. Falling back to assistant.',
      score: 0,
    };
  }

  const winner = scored[0];
  const confidence = Math.min(1, winner.score / 12);
  return {
    matchedRuleId: winner.rule.id,
    matchedRuleName: winner.rule.name,
    assignedAgent: winner.rule.assignTo,
    confidence,
    reason: winner.reason,
    score: winner.score,
  };
}

export async function assignTask(taskId: number, draft?: AutomationDraft): Promise<AutomationDecision | null> {
  const task = await queryOne<{ id: number; title: string; description: string | null }>('SELECT id, title, description FROM board_tasks WHERE id = $1', [taskId]);
  if (!task) return null;

  const metadata = (await getTaskMetadata(taskId)) || null;
  const payload: AutomationDraft = {
    title: draft?.title ?? task.title,
    description: draft?.description ?? task.description ?? undefined,
    tags: draft?.tags ?? metadata?.tags ?? [],
    project: draft?.project ?? metadata?.project,
    type: draft?.type ?? metadata?.type,
    manualOverride: draft?.manualOverride ?? metadata?.manualOverride ?? null,
  };

  const preview = await previewAssignment(payload);
  const decision: AutomationDecision = {
    taskId,
    matchedRuleId: preview.matchedRuleId,
    matchedRuleName: preview.matchedRuleName,
    assignedAgent: preview.assignedAgent,
    confidence: preview.confidence,
    reason: preview.reason,
    timestamp: new Date().toISOString(),
    manualOverride: payload.manualOverride ?? null,
  };

  await saveDecision(decision);
  return decision;
}
