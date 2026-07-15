import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export type FlowStatus = "draft" | "active" | "archived";

export type Flow = {
  id: number;
  title: string;
  description: string;
  status: FlowStatus;
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: number;
  flowId: number | null;
  input: string;
  output: string;
  provider: string;
  createdAt: string;
};

export type CreateFlowInput = {
  title: string;
  description?: string;
  status?: FlowStatus;
};

export type RecordAgentRunInput = {
  flowId?: number | null;
  projectId?: string | null;
  input: string;
  output: string;
  provider: string;
};

export type ProposalDraft = {
  projectId: string;
  sessionId: number;
  proposalContent: string;
  hashlinedContent: string | null;
  proposalFormat: string | null;
  proposalVersion: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SaveProposalDraftInput = {
  projectId: string;
  sessionId: number;
  proposalContent: string;
  proposalFormat?: string | null;
  hashlinedContent?: string | null;
  baseVersion?: number | null;
};

export type LegalReview = {
  id: number;
  projectId: string;
  stageStep: string;
  stageTitle: string;
  reviewFocus: unknown;
  output: string;
  provider: string;
  reviewedAt: string;
};

export type SaveLegalReviewInput = {
  projectId: string;
  stageStep: string;
  stageTitle: string;
  reviewFocus: unknown;
  output: string;
  provider: string;
};

export type ProjectRecord = {
  id: string;
  userId: number;
  noticeId: string | null;
  url: string | null;
  llmTitle: string | null;
  keywords: string[];
  isPinned: boolean;
  budgetProject: string | null;
  programBudget: string | null;
  fundings: string | null;
  ministryNames: string[];
  noticeTypes: string[];
  currentStep: string | null;
  elaborationScore: number | null;
  elaborationDetail: unknown | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProjectInitInput = {
  userId: number;
  noticeId: string;
  noticeTitle?: string;
  programNames?: string[];
  ministryNames?: string[];
  fundings?: string[] | string;
  startDate?: string;
  endDate?: string;
  noticeTypes?: string[];
  url?: string;
  keywords?: string[];
};

export type ProjectPatchInput = Partial<{
  llmTitle: string | null;
  url: string | null;
  keywords: string[] | null;
  ministryNames: string[] | null;
  noticeTypes: string[] | null;
  startDate: string | null;
  endDate: string | null;
  budgetProject: string | null;
  fundings: string | null;
  programBudget: string | null;
}>;

let connection: Database.Database | undefined;

export function resolveDatabasePath(databasePath = process.env.SQLITE_PATH): string {
  const baseDir = process.env.INIT_CWD ?? process.cwd();
  const configuredPath = databasePath?.trim() || "./data/ezrnd-flow.sqlite";
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(baseDir, configuredPath);
}

export function getDatabase(databasePath?: string): Database.Database {
  const resolvedPath = resolveDatabasePath(databasePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  if (!connection) {
    connection = new Database(resolvedPath);
    connection.pragma("journal_mode = WAL");
    connection.pragma("foreign_keys = ON");
  }

  return connection;
}

export function initDatabase(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TRIGGER IF NOT EXISTS flows_updated_at
    AFTER UPDATE ON flows
    FOR EACH ROW
    BEGIN
      UPDATE flows SET updated_at = datetime('now') WHERE id = OLD.id;
    END;

    CREATE TABLE IF NOT EXISTS agent_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flow_id INTEGER REFERENCES flows(id) ON DELETE SET NULL,
      project_id TEXT,
      input TEXT NOT NULL,
      output TEXT NOT NULL,
      provider TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      notice_id TEXT,
      url TEXT,
      llm_title TEXT,
      keywords_json TEXT NOT NULL DEFAULT '[]',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      budget_project TEXT,
      program_budget TEXT,
      fundings TEXT,
      ministry_names_json TEXT NOT NULL DEFAULT '[]',
      notice_types_json TEXT NOT NULL DEFAULT '[]',
      current_step TEXT NOT NULL DEFAULT 'research-analysis',
      elaboration_score REAL,
      elaboration_detail_json TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TRIGGER IF NOT EXISTS projects_updated_at
    AFTER UPDATE ON projects
    FOR EACH ROW
    BEGIN
      UPDATE projects SET updated_at = datetime('now') WHERE id = OLD.id;
    END;

    CREATE TABLE IF NOT EXISTS proposal_drafts (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      session_id INTEGER NOT NULL DEFAULT 1,
      proposal_content TEXT NOT NULL DEFAULT '',
      hashlined_content TEXT,
      proposal_format TEXT,
      proposal_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (project_id, session_id)
    );

    CREATE TRIGGER IF NOT EXISTS proposal_drafts_updated_at
    AFTER UPDATE ON proposal_drafts
    FOR EACH ROW
    BEGIN
      UPDATE proposal_drafts SET updated_at = datetime('now')
      WHERE project_id = OLD.project_id AND session_id = OLD.session_id;
    END;

    CREATE TABLE IF NOT EXISTS legal_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stage_step TEXT NOT NULL,
      stage_title TEXT NOT NULL,
      review_focus_json TEXT NOT NULL,
      output TEXT NOT NULL,
      provider TEXT NOT NULL,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS legal_reviews_project_stage_idx
    ON legal_reviews(project_id, stage_step, reviewed_at DESC, id DESC);
  `);

  const agentColumns = db.prepare("PRAGMA table_info(agent_runs)").all() as { name: string }[];
  if (!agentColumns.some((column) => column.name === "project_id")) {
    db.exec("ALTER TABLE agent_runs ADD COLUMN project_id TEXT");
  }
}

function mapFlow(row: Record<string, unknown>): Flow {
  return {
    id: Number(row.id),
    title: String(row.title),
    description: String(row.description ?? ""),
    status: String(row.status) as FlowStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapAgentRun(row: Record<string, unknown>): AgentRun {
  return {
    id: Number(row.id),
    flowId: row.flow_id === null || row.flow_id === undefined ? null : Number(row.flow_id),
    input: String(row.input),
    output: String(row.output),
    provider: String(row.provider),
    createdAt: String(row.created_at)
  };
}

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseJsonValue(value: unknown): unknown | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function stringifyArray(value: string[] | null | undefined): string {
  return JSON.stringify(value ?? []);
}

function mapProject(row: Record<string, unknown>): ProjectRecord {
  return {
    id: String(row.id),
    userId: Number(row.user_id),
    noticeId: row.notice_id === null ? null : String(row.notice_id),
    url: row.url === null ? null : String(row.url),
    llmTitle: row.llm_title === null ? null : String(row.llm_title),
    keywords: parseJsonArray(row.keywords_json),
    isPinned: Number(row.is_pinned) === 1,
    budgetProject: row.budget_project === null ? null : String(row.budget_project),
    programBudget: row.program_budget === null ? null : String(row.program_budget),
    fundings: row.fundings === null ? null : String(row.fundings),
    ministryNames: parseJsonArray(row.ministry_names_json),
    noticeTypes: parseJsonArray(row.notice_types_json),
    currentStep: row.current_step === null ? null : String(row.current_step),
    elaborationScore: row.elaboration_score === null ? null : Number(row.elaboration_score),
    elaborationDetail: parseJsonValue(row.elaboration_detail_json),
    startDate: row.start_date === null ? null : String(row.start_date),
    endDate: row.end_date === null ? null : String(row.end_date),
    createdAt: row.created_at === null ? null : String(row.created_at),
    updatedAt: row.updated_at === null ? null : String(row.updated_at)
  };
}

function mapProposalDraft(row: Record<string, unknown>): ProposalDraft {
  return {
    projectId: String(row.project_id),
    sessionId: Number(row.session_id),
    proposalContent: String(row.proposal_content ?? ""),
    hashlinedContent: row.hashlined_content === null ? null : String(row.hashlined_content),
    proposalFormat: row.proposal_format === null ? null : String(row.proposal_format),
    proposalVersion: Number(row.proposal_version ?? 1),
    createdAt: row.created_at === null ? null : String(row.created_at),
    updatedAt: row.updated_at === null ? null : String(row.updated_at)
  };
}

function mapLegalReview(row: Record<string, unknown>): LegalReview {
  return {
    id: Number(row.id),
    projectId: String(row.project_id),
    stageStep: String(row.stage_step),
    stageTitle: String(row.stage_title),
    reviewFocus: parseJsonValue(row.review_focus_json),
    output: String(row.output ?? ""),
    provider: String(row.provider),
    reviewedAt: String(row.reviewed_at)
  };
}

function buildInitialProposalContent(project: ProjectRecord): string {
  const title = project.llmTitle ?? project.noticeId ?? "건축 프로젝트";
  const period = [project.startDate, project.endDate].filter(Boolean).join(" ~ ") || "작성 필요";

  return [
    `# ${title} 건축 제안서 초안`,
    "",
    "## 1. 프로젝트 개요",
    `- 프로젝트명: ${title}`,
    `- 공고/관리 번호: ${project.noticeId ?? "작성 필요"}`,
    `- 관련 기관: ${project.ministryNames.length ? project.ministryNames.join(", ") : "작성 필요"}`,
    `- 신청/공고 기간: ${period}`,
    `- 예산/지원 규모: ${project.programBudget ?? project.fundings ?? "작성 필요"}`,
    "",
    "## 2. 공고 요구사항 분석",
    "- 업로드한 공고문과 지침서에서 필수 제출물, 평가 기준, 제한 조건을 정리하세요.",
    "",
    "## 3. 건축 기획 방향",
    "- 대지/공간/사용자/운영 조건을 바탕으로 설계 목표를 작성하세요.",
    "",
    "## 4. 제안 전략",
    "- 차별화 포인트, 구현 가능성, 일정 계획을 정리하세요.",
    "",
    "## 5. 후속 논문화 메모",
    "- 시스템 구현 과정, 공고 분석 절차, AI Agent 활용 결과를 논문 근거로 축적하세요."
  ].join("\n");
}

export function createFlow(input: CreateFlowInput): Flow {
  const db = getDatabase();
  initDatabase();
  const result = db
    .prepare("INSERT INTO flows (title, description, status) VALUES (?, ?, ?)")
    .run(input.title, input.description ?? "", input.status ?? "draft");

  const row = db.prepare("SELECT * FROM flows WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  return mapFlow(row);
}

export function listFlows(): Flow[] {
  const db = getDatabase();
  initDatabase();
  const rows = db.prepare("SELECT * FROM flows ORDER BY created_at DESC, id DESC").all() as Record<string, unknown>[];
  return rows.map(mapFlow);
}

export function getFlow(id: number): Flow | null {
  const db = getDatabase();
  initDatabase();
  const row = db.prepare("SELECT * FROM flows WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapFlow(row) : null;
}

export function recordAgentRun(input: RecordAgentRunInput): AgentRun {
  const db = getDatabase();
  initDatabase();
  const result = db
    .prepare("INSERT INTO agent_runs (flow_id, project_id, input, output, provider) VALUES (?, ?, ?, ?, ?)")
    .run(input.flowId ?? null, input.projectId ?? null, input.input, input.output, input.provider);

  const row = db.prepare("SELECT * FROM agent_runs WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  return mapAgentRun(row);
}

export function listAgentRuns(flowId?: number): AgentRun[] {
  const db = getDatabase();
  initDatabase();
  const rows = typeof flowId === "number"
    ? (db.prepare("SELECT * FROM agent_runs WHERE flow_id = ? ORDER BY created_at DESC, id DESC").all(flowId) as Record<string, unknown>[])
    : (db.prepare("SELECT * FROM agent_runs ORDER BY created_at DESC, id DESC").all() as Record<string, unknown>[]);

  return rows.map(mapAgentRun);
}

export function listProjects(userId: number): ProjectRecord[] {
  const db = getDatabase();
  initDatabase();
  const rows = db
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC, created_at DESC")
    .all(userId) as Record<string, unknown>[];
  return rows.map(mapProject);
}

export function getProject(id: string): ProjectRecord | null {
  const db = getDatabase();
  initDatabase();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? mapProject(row) : null;
}

export function createProject(input: ProjectInitInput): ProjectRecord {
  const db = getDatabase();
  initDatabase();
  const id = randomUUID();
  const fundings = Array.isArray(input.fundings) ? input.fundings.join(", ") : input.fundings ?? null;
  const budgetProject = input.programNames?.[0] ?? null;
  const title = input.noticeTitle?.trim() || `R&D 프로젝트 ${input.noticeId}`;

  db.prepare(`
    INSERT INTO projects (
      id, user_id, notice_id, url, llm_title, keywords_json, budget_project,
      program_budget, fundings, ministry_names_json, notice_types_json, start_date, end_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.userId,
    input.noticeId,
    input.url ?? null,
    title,
    stringifyArray(input.keywords),
    budgetProject,
    fundings,
    fundings,
    stringifyArray(input.ministryNames),
    stringifyArray(input.noticeTypes),
    input.startDate ?? null,
    input.endDate ?? null
  );

  const project = getProject(id);
  if (!project) throw new Error("Failed to create project");
  return project;
}

export function updateProject(id: string, patch: ProjectPatchInput): ProjectRecord | null {
  const db = getDatabase();
  initDatabase();
  const current = getProject(id);
  if (!current) return null;

  db.prepare(`
    UPDATE projects
    SET
      llm_title = ?,
      url = ?,
      keywords_json = ?,
      ministry_names_json = ?,
      notice_types_json = ?,
      start_date = ?,
      end_date = ?,
      budget_project = ?,
      fundings = ?,
      program_budget = ?
    WHERE id = ?
  `).run(
    patch.llmTitle === undefined ? current.llmTitle : patch.llmTitle,
    patch.url === undefined ? current.url : patch.url,
    patch.keywords === undefined ? stringifyArray(current.keywords) : stringifyArray(patch.keywords),
    patch.ministryNames === undefined ? stringifyArray(current.ministryNames) : stringifyArray(patch.ministryNames),
    patch.noticeTypes === undefined ? stringifyArray(current.noticeTypes) : stringifyArray(patch.noticeTypes),
    patch.startDate === undefined ? current.startDate : patch.startDate,
    patch.endDate === undefined ? current.endDate : patch.endDate,
    patch.budgetProject === undefined ? current.budgetProject : patch.budgetProject,
    patch.fundings === undefined ? current.fundings : patch.fundings,
    patch.programBudget === undefined ? current.programBudget : patch.programBudget,
    id
  );

  return getProject(id);
}

export function setProjectPinned(id: string, isPinned: boolean): ProjectRecord | null {
  const db = getDatabase();
  initDatabase();
  db.prepare("UPDATE projects SET is_pinned = ? WHERE id = ?").run(isPinned ? 1 : 0, id);
  return getProject(id);
}

export function deleteProject(id: string): boolean {
  const db = getDatabase();
  initDatabase();
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getProposalDraft(projectId: string, sessionId = 1): ProposalDraft | null {
  const db = getDatabase();
  initDatabase();
  const row = db
    .prepare("SELECT * FROM proposal_drafts WHERE project_id = ? AND session_id = ?")
    .get(projectId, sessionId) as Record<string, unknown> | undefined;
  return row ? mapProposalDraft(row) : null;
}

export function getOrCreateProposalDraft(projectId: string, sessionId = 1): ProposalDraft | null {
  const existing = getProposalDraft(projectId, sessionId);
  if (existing) return existing;

  const project = getProject(projectId);
  if (!project) return null;

  const db = getDatabase();
  initDatabase();
  db.prepare(`
    INSERT INTO proposal_drafts (project_id, session_id, proposal_content, proposal_format, proposal_version)
    VALUES (?, ?, ?, ?, 1)
  `).run(projectId, sessionId, buildInitialProposalContent(project), "markdown");

  return getProposalDraft(projectId, sessionId);
}

export function saveProposalDraft(input: SaveProposalDraftInput): ProposalDraft | null {
  const project = getProject(input.projectId);
  if (!project) return null;

  const current = getProposalDraft(input.projectId, input.sessionId);
  const nextVersion = current ? current.proposalVersion + 1 : 1;
  const db = getDatabase();
  initDatabase();

  if (current) {
    db.prepare(`
      UPDATE proposal_drafts
      SET proposal_content = ?, hashlined_content = ?, proposal_format = ?, proposal_version = ?
      WHERE project_id = ? AND session_id = ?
    `).run(
      input.proposalContent,
      input.hashlinedContent === undefined ? current.hashlinedContent : input.hashlinedContent,
      input.proposalFormat === undefined ? current.proposalFormat : input.proposalFormat,
      nextVersion,
      input.projectId,
      input.sessionId
    );
  } else {
    db.prepare(`
      INSERT INTO proposal_drafts (project_id, session_id, proposal_content, hashlined_content, proposal_format, proposal_version)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      input.projectId,
      input.sessionId,
      input.proposalContent,
      input.hashlinedContent ?? null,
      input.proposalFormat ?? "markdown",
      nextVersion
    );
  }

  return getProposalDraft(input.projectId, input.sessionId);
}

export function getLatestLegalReview(projectId: string, stageStep: string): LegalReview | null {
  const db = getDatabase();
  initDatabase();
  const row = db
    .prepare(`
      SELECT * FROM legal_reviews
      WHERE project_id = ? AND stage_step = ?
      ORDER BY reviewed_at DESC, id DESC
      LIMIT 1
    `)
    .get(projectId, stageStep) as Record<string, unknown> | undefined;
  return row ? mapLegalReview(row) : null;
}

export function saveLegalReview(input: SaveLegalReviewInput): LegalReview | null {
  const project = getProject(input.projectId);
  if (!project) return null;

  const db = getDatabase();
  initDatabase();
  const result = db
    .prepare(`
      INSERT INTO legal_reviews (
        project_id, stage_step, stage_title, review_focus_json, output, provider
      ) VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      input.projectId,
      input.stageStep,
      input.stageTitle,
      JSON.stringify(input.reviewFocus ?? null),
      input.output,
      input.provider
    );

  const row = db.prepare("SELECT * FROM legal_reviews WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
  return mapLegalReview(row);
}
