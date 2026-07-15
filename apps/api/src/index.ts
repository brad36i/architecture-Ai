import { runFlowAgent, runLegalReviewAgent } from "@ezrnd/agent";
import {
  createProject,
  deleteProject,
  getLatestLegalReview,
  getProject,
  getOrCreateProposalDraft,
  initDatabase,
  listProjects,
  recordAgentRun,
  resolveDatabasePath,
  saveLegalReview,
  saveProposalDraft,
  setProjectPinned,
  updateProject,
  type LegalReview,
  type ProjectRecord,
  type ProposalDraft,
} from "@ezrnd/db";
import cors from "cors";
import dotenv from "dotenv";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { z } from "zod";
import {
  displayNameFromStoredFilename,
  normalizeMultipartFilename,
} from "./file-names.js";

function loadEnv(): void {
  const candidateDirs = [
    process.env.INIT_CWD,
    path.resolve(process.cwd(), "../.."),
    process.cwd(),
  ].filter((dir): dir is string => Boolean(dir));

  for (const dir of candidateDirs) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
      return;
    }
  }

  dotenv.config({ override: false });
}

loadEnv();
initDatabase();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const uploadRoot = path.resolve(
  process.env.INIT_CWD ?? process.cwd(),
  "data/uploads",
);
const fileMetadataName = ".file-metadata.json";

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  data: T | null;
};

function ok<T>(res: Response, data: T, statusCode = 200): void {
  res
    .status(statusCode)
    .json({ success: true, statusCode, data } satisfies ApiResponse<T>);
}

function fail(res: Response, statusCode: number, message: string): void {
  res
    .status(statusCode)
    .json({ success: false, statusCode, data: null, message });
}

function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function safeFilename(name: string): string {
  return (
    name
      .normalize("NFKC")
      .replace(/[\\/]/g, "-")
      .replace(/[^\p{L}\p{N}._ -]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "upload"
  );
}

function projectUploadDir(projectId: string): string {
  return path.join(uploadRoot, safeFilename(projectId));
}

type StoredFileMetadata = Record<
  string,
  {
    originalName: string;
    uploadedAt: string;
  }
>;

function readFileMetadata(directory: string): StoredFileMetadata {
  const metadataPath = path.join(directory, fileMetadataName);
  if (!fs.existsSync(metadataPath)) return {};

  try {
    const value = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as unknown;
    return value && typeof value === "object"
      ? (value as StoredFileMetadata)
      : {};
  } catch {
    return {};
  }
}

function writeFileMetadata(
  directory: string,
  metadata: StoredFileMetadata,
): void {
  fs.writeFileSync(
    path.join(directory, fileMetadataName),
    JSON.stringify(metadata, null, 2),
    "utf8",
  );
}

function uploadedFiles(req: Request): Express.Multer.File[] {
  if (Array.isArray(req.files)) return req.files;
  if (!req.files) return [];
  return Object.values(req.files).flat();
}

const projectFileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, callback) => {
      const projectId = routeParam(req, "projectId");
      const destination = projectUploadDir(projectId);
      fs.mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_req, file, callback) => {
      const originalName = normalizeMultipartFilename(file.originalname);
      const parsed = path.parse(safeFilename(originalName));
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${parsed.name || "upload"}-${unique}${parsed.ext}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10,
  },
});

function toProjectApi(project: ProjectRecord) {
  return {
    id: project.id,
    noticeId: project.noticeId,
    url: project.url,
    llmTitle: project.llmTitle,
    keywords: project.keywords,
    elaborationScore: project.elaborationScore ?? 0,
    userId: project.userId,
    currentStep: project.currentStep ?? "research-analysis",
    ministryNames: project.ministryNames,
    budgetProject: project.budgetProject,
    startDate: project.startDate,
    endDate: project.endDate,
    fundings: project.fundings,
    programBudget: project.programBudget,
    noticeTypes: project.noticeTypes,
    isPinned: project.isPinned,
    elaborationDetail: project.elaborationDetail,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    noticeTitle: project.llmTitle,
  };
}

function toProposalApi(proposal: ProposalDraft) {
  return {
    proposalContent: proposal.proposalContent,
    hashlinedContent: proposal.hashlinedContent ?? "",
    proposalFormat: proposal.proposalFormat,
    proposalVersion: proposal.proposalVersion,
  };
}

function parseSessionId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const num = Number(raw ?? 1);
  return Number.isInteger(num) && num > 0 ? num : 1;
}

const projectInitSchema = z.object({
  noticeId: z.string().trim().min(1),
  noticeTitle: z.string().trim().optional(),
  programNames: z.array(z.string()).optional(),
  ministryNames: z.array(z.string()).optional(),
  fundings: z.union([z.array(z.string()), z.string()]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  noticeTypes: z.array(z.string()).optional(),
  url: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const projectPatchSchema = z.object({
  llmTitle: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  ministryNames: z.array(z.string()).nullable().optional(),
  noticeTypes: z.array(z.string()).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budgetProject: z.string().nullable().optional(),
  fundings: z.string().nullable().optional(),
  programBudget: z.string().nullable().optional(),
});

const pinSchema = z.object({
  isPinned: z.boolean(),
});

const agentRunSchema = z.object({
  input: z.string().trim().min(1),
  projectId: z.string().trim().optional(),
});

const proposalSaveSchema = z.object({
  proposalContent: z.string(),
  baseVersion: z.number().int().nullable().optional(),
});

const legalReviewStages = {
  "01": {
    title: "공모 지침 분석",
    focus: [
      "공모 자격 요건",
      "제출물 의무사항",
      "질의응답 및 공고 원문 우선순위",
      "실격 사유",
    ],
  },
  "02": {
    title: "대지 및 법규 검토",
    focus: [
      "용도지역/지구 제한",
      "건폐율/용적률/높이 제한",
      "주차/피난/접근성 기준",
      "인허가 리스크",
    ],
  },
  "03": {
    title: "기능 관계 분석",
    focus: [
      "학교시설 기준",
      "장애인 편의 기준",
      "피난 동선",
      "공간별 인접·분리 조건",
    ],
  },
  "04": {
    title: "키워드 도출",
    focus: [
      "지침 위배 키워드 제외",
      "법정 기준 우선순위",
      "공모 취지 부합성",
      "근거 없는 법적 단정 표현",
    ],
  },
  "05": {
    title: "콘셉트 설정",
    focus: [
      "콘셉트와 법규 충돌",
      "안전·피난 저촉",
      "공공성 요구",
      "공모 지침 부합성",
    ],
  },
  "06": {
    title: "배치대안 계획",
    focus: [
      "대지경계·이격·일조",
      "차량·보행 동선",
      "소방차 진입",
      "인접 대지 영향",
    ],
  },
  "07": {
    title: "매스 계획",
    focus: ["높이 제한", "사선 제한", "일조권", "주변 건축물 영향"],
  },
  "08": {
    title: "조닝 계획",
    focus: ["피난 동선", "방화 구획", "개방시설 분리", "보안 및 접근 통제"],
  },
  "09": {
    title: "평면 계획",
    focus: [
      "복도·계단·출입 기준",
      "채광·환기",
      "장애인 편의시설",
      "피난 및 방화 조건",
    ],
  },
  "10": {
    title: "외부공간 계획",
    focus: ["조경 기준", "주차 기준", "통학 안전", "소방 활동 공간"],
  },
  "11": {
    title: "대안 비교 및 선정",
    focus: [
      "선정안 법규 리스크",
      "공모 지침 적합성",
      "대안별 인허가 가능성",
      "검토 누락 항목",
    ],
  },
  "12": {
    title: "설계안 검토 및 보완",
    focus: [
      "법규와 도면 불일치",
      "심의·허가 리스크",
      "면적·동선 정합성",
      "구조·설비 검토 필요사항",
    ],
  },
  "13": {
    title: "패널 구성",
    focus: [
      "익명성 규정",
      "저작권/이미지 사용권",
      "필수 표기사항",
      "제출 규격 위반",
    ],
  },
} as const;

type LegalReviewStep = keyof typeof legalReviewStages;
const legalReviewStepSchema = z.enum([
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
]);

function legalReviewStep(value: string): LegalReviewStep | null {
  const parsed = legalReviewStepSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function toLegalReviewApi(review: LegalReview) {
  return {
    id: review.id,
    projectId: review.projectId,
    stageStep: review.stageStep,
    stageTitle: review.stageTitle,
    reviewFocus: review.reviewFocus,
    output: review.output,
    provider: review.provider,
    reviewedAt: review.reviewedAt,
  };
}

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "ezrnd-flow-api",
    sqlitePath: resolveDatabasePath(),
  });
});

app.get("/api/v2/users/:userId/projects", (req: Request, res: Response) => {
  const userId = Number(routeParam(req, "userId"));
  if (!Number.isInteger(userId)) {
    fail(res, 400, "userId must be an integer");
    return;
  }

  ok(res, { projects: listProjects(userId).map(toProjectApi) });
});

app.post(
  "/api/v2/workflows/:userId/projects/init-detail",
  (req: Request, res: Response) => {
    const userId = Number(routeParam(req, "userId"));
    if (!Number.isInteger(userId)) {
      fail(res, 400, "userId must be an integer");
      return;
    }

    const parsed = projectInitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        statusCode: 422,
        data: null,
        detail: parsed.error.issues,
      });
      return;
    }

    const project = createProject({ userId, ...parsed.data });
    ok(
      res,
      {
        userId,
        projectId: project.id,
        stepNum: 1,
        step: project.currentStep ?? "research-analysis",
        message: "프로젝트가 생성되었습니다.",
      },
      201,
    );
  },
);

app.get("/api/v2/projects/:projectId/me", (req: Request, res: Response) => {
  const projectId = routeParam(req, "projectId");
  const project = getProject(projectId);
  if (!project) {
    fail(res, 404, "Project not found");
    return;
  }

  ok(res, toProjectApi(project));
});

app.patch("/api/v2/projects/:projectId", (req: Request, res: Response) => {
  const parsed = projectPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      success: false,
      statusCode: 422,
      data: null,
      detail: parsed.error.issues,
    });
    return;
  }

  const project = updateProject(routeParam(req, "projectId"), parsed.data);
  if (!project) {
    fail(res, 404, "Project not found");
    return;
  }

  ok(res, toProjectApi(project));
});

app.delete("/api/v2/projects/:projectId", (req: Request, res: Response) => {
  const projectId = routeParam(req, "projectId");
  const deleted = deleteProject(projectId);
  if (!deleted) {
    fail(res, 404, "Project not found");
    return;
  }

  ok(res, { projectId });
});

app.patch("/api/v2/projects/:projectId/pin", (req: Request, res: Response) => {
  const parsed = pinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      success: false,
      statusCode: 422,
      data: null,
      detail: parsed.error.issues,
    });
    return;
  }

  const project = setProjectPinned(
    routeParam(req, "projectId"),
    parsed.data.isPinned,
  );
  if (!project) {
    fail(res, 404, "Project not found");
    return;
  }

  ok(res, { projectId: project.id, isPinned: project.isPinned });
});

app.get("/api/v2/projects/:projectId/files", (req: Request, res: Response) => {
  const projectId = routeParam(req, "projectId");
  const project = getProject(projectId);
  if (!project) {
    fail(res, 404, "Project not found");
    return;
  }

  const directory = projectUploadDir(projectId);
  if (!fs.existsSync(directory)) {
    ok(res, { files: [] });
    return;
  }

  const metadata = readFileMetadata(directory);
  const files = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name !== fileMetadataName)
    .map((entry) => {
      const fullPath = path.join(directory, entry.name);
      const stat = fs.statSync(fullPath);
      const originalName = metadata[entry.name]?.originalName;
      return {
        id: entry.name,
        fileName: originalName || displayNameFromStoredFilename(entry.name),
        filename: entry.name,
        size: stat.size,
        fileExtension: path.extname(entry.name).slice(1).toLowerCase() || null,
        createdAt: stat.mtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
        uploadedAt: stat.mtime.toISOString(),
        status: "done",
        isPinned: false,
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  ok(res, { files });
});

app.post(
  "/api/v2/projects/:projectId/files",
  (req: Request, res: Response, next: NextFunction) => {
    const project = getProject(routeParam(req, "projectId"));
    if (!project) {
      fail(res, 404, "Project not found");
      return;
    }
    next();
  },
  projectFileUpload.fields([
    { name: "files", maxCount: 10 },
    { name: "file", maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    const files = uploadedFiles(req);
    if (files.length === 0) {
      fail(res, 422, "At least one file is required");
      return;
    }

    const directory = projectUploadDir(routeParam(req, "projectId"));
    const metadata = readFileMetadata(directory);

    for (const file of files) {
      metadata[file.filename] = {
        originalName: normalizeMultipartFilename(file.originalname),
        uploadedAt: new Date().toISOString(),
      };
    }
    writeFileMetadata(directory, metadata);

    ok(
      res,
      {
        projectId: routeParam(req, "projectId"),
        files: files.map((file) => ({
          originalName: normalizeMultipartFilename(file.originalname),
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
        })),
      },
      201,
    );
  },
);

app.get(
  "/api/v2/projects/:projectId/proposals",
  (req: Request, res: Response) => {
    const projectId = routeParam(req, "projectId");
    const project = getProject(projectId);
    if (!project) {
      fail(res, 404, "Project not found");
      return;
    }

    const proposal = getOrCreateProposalDraft(
      projectId,
      parseSessionId(req.query.session_id),
    );
    if (!proposal) {
      fail(res, 404, "Project not found");
      return;
    }

    ok(res, toProposalApi(proposal));
  },
);

app.post(
  "/api/v2/projects/:projectId/proposals",
  (req: Request, res: Response) => {
    const parsed = proposalSaveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        statusCode: 422,
        data: null,
        detail: parsed.error.issues,
      });
      return;
    }

    const proposal = saveProposalDraft({
      projectId: routeParam(req, "projectId"),
      sessionId: parseSessionId(req.query.session_id),
      proposalContent: parsed.data.proposalContent,
      baseVersion: parsed.data.baseVersion ?? null,
      proposalFormat: "markdown",
    });
    if (!proposal) {
      fail(res, 404, "Project not found");
      return;
    }

    ok(res, {
      proposalVersion: proposal.proposalVersion,
      message: "건축 제안서 초안이 저장되었습니다.",
    });
  },
);

app.get(
  "/api/v2/projects/:projectId/legal-reviews/:step",
  (req: Request, res: Response) => {
    const projectId = routeParam(req, "projectId");
    const step = legalReviewStep(routeParam(req, "step"));
    if (!step) {
      fail(res, 400, "step must be one of 01..13");
      return;
    }

    const project = getProject(projectId);
    if (!project) {
      fail(res, 404, "Project not found");
      return;
    }

    const review = getLatestLegalReview(projectId, step);
    ok(res, { review: review ? toLegalReviewApi(review) : null });
  },
);

app.post(
  "/api/v2/projects/:projectId/legal-reviews/:step",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = routeParam(req, "projectId");
      const step = legalReviewStep(routeParam(req, "step"));
      if (!step) {
        fail(res, 400, "step must be one of 01..13");
        return;
      }

      const project = getProject(projectId);
      if (!project) {
        fail(res, 404, "Project not found");
        return;
      }

      const stage = legalReviewStages[step];
      const result = await runLegalReviewAgent({
        project: {
          id: project.id,
          title: project.llmTitle,
          noticeId: project.noticeId,
          url: project.url,
          budgetProject: project.budgetProject,
          programBudget: project.programBudget,
          fundings: project.fundings,
          ministryNames: project.ministryNames,
          noticeTypes: project.noticeTypes,
          startDate: project.startDate,
          endDate: project.endDate,
        },
        stageStep: step,
        stageTitle: stage.title,
        reviewFocus: stage.focus,
      });

      const review = saveLegalReview({
        projectId,
        stageStep: step,
        stageTitle: stage.title,
        reviewFocus: stage.focus,
        output: result.output,
        provider: result.provider,
      });
      if (!review) {
        fail(res, 404, "Project not found");
        return;
      }

      recordAgentRun({
        projectId,
        input: JSON.stringify({
          kind: "legal-review",
          stageStep: step,
          stageTitle: stage.title,
          reviewFocus: stage.focus,
        }),
        output: result.output,
        provider: result.provider,
      });

      ok(res, { review: toLegalReviewApi(review) }, 201);
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  "/api/v2/projects/:projectId/proposals/chat/history",
  (req: Request, res: Response) => {
    const project = getProject(routeParam(req, "projectId"));
    if (!project) {
      fail(res, 404, "Project not found");
      return;
    }

    void req.query.session_id;
    ok(res, []);
  },
);

app.get(
  "/api/:apiVersion/projects/:projectId/proposals/:mode/stream",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mode = routeParam(req, "mode");
      if (mode !== "chat" && mode !== "agent") {
        fail(res, 404, "Stream endpoint not found");
        return;
      }

      const projectId = routeParam(req, "projectId");
      const project = getProject(projectId);
      if (!project) {
        fail(res, 404, "Project not found");
        return;
      }

      const userMessage = String(req.query.user_message ?? "").trim();
      if (!userMessage) {
        fail(res, 422, "user_message is required");
        return;
      }

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const writeSse = (payload: unknown) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      writeSse({
        type: "progress",
        message:
          mode === "agent"
            ? "Agent가 제안서 수정 방향을 검토 중입니다."
            : "질문을 검토 중입니다.",
      });
      const result = await runFlowAgent({
        input: userMessage,
        flow: {
          id: Number.NaN,
          title: project.llmTitle ?? project.noticeId ?? project.id,
          description: [project.budgetProject, ...project.ministryNames]
            .filter(Boolean)
            .join(" / "),
          status: project.currentStep ?? undefined,
        },
      });
      const chat = { type: "chat", role: "assistant", content: result.output };
      writeSse(chat);
      writeSse({
        type: "done",
        data: { chat: [chat], synthesis_summary: result.output },
      });
      res.end();

      recordAgentRun({
        projectId,
        input: userMessage,
        output: result.output,
        provider: result.provider,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  "/api/v2/users/:userId/recommendation",
  (req: Request, res: Response) => {
    const userId = Number(routeParam(req, "userId"));
    if (!Number.isInteger(userId)) {
      fail(res, 400, "userId must be an integer");
      return;
    }

    const now = new Date().toISOString();
    const notices = [
      {
        id: "notice-ai-safety-001",
        noticeId: "notice-ai-safety-001",
        title: "AI 기반 스마트 건축물 에너지 최적화 설계 공고",
        ministryName: "국토교통부",
        orderAgencyName: "한국건설기술연구원",
        announcementNum: "AIARCH-2026-001",
        publishedAt: now,
        status: "접수중",
        noticeType: "자유공모",
        startDate: "2026-07-01",
        endDate: "2026-08-16",
        fund: "최대 5억원",
        managerContact: "arch-notice@example.com",
        isInitiation: "건축사사무소/엔지니어링사/컨소시엄 참여 가능",
        createdAt: now,
        updatedAt: now,
        score: 0.94,
      },
      {
        id: "notice-arch-flow-002",
        noticeId: "notice-arch-flow-002",
        title: "공공건축 설계공모 기획 자동화 서비스 실증",
        ministryName: "서울특별시",
        orderAgencyName: "도시공간본부",
        announcementNum: "AIARCH-2026-002",
        publishedAt: now,
        status: "접수중",
        noticeType: "지정공모",
        startDate: "2026-07-10",
        endDate: "2026-09-01",
        fund: "최대 3억원",
        managerContact: "flow@example.com",
        isInitiation: "컨소시엄 가능",
        createdAt: now,
        updatedAt: now,
        score: 0.89,
      },
    ];

    ok(res, {
      userId,
      generatedAt: now,
      personalized: notices,
      freeCompetition: notices.filter(
        (notice) => notice.noticeType === "자유공모",
      ),
      message: "SQLite/Node API local architecture notice seed",
    });
  },
);

app.post(
  "/api/v2/agent/run",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = agentRunSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          statusCode: 422,
          data: null,
          detail: parsed.error.issues,
        });
        return;
      }

      const project = parsed.data.projectId
        ? getProject(parsed.data.projectId)
        : null;
      if (parsed.data.projectId && !project) {
        fail(res, 404, "Project not found");
        return;
      }

      const result = await runFlowAgent({
        input: parsed.data.input,
        flow: project
          ? {
              id: Number.NaN,
              title: project.llmTitle ?? project.noticeId ?? project.id,
              description: [project.budgetProject, ...project.ministryNames]
                .filter(Boolean)
                .join(" / "),
              status: project.currentStep ?? undefined,
            }
          : null,
      });

      const run = recordAgentRun({
        projectId: project?.id ?? null,
        input: parsed.data.input,
        output: result.output,
        provider: result.provider,
      });

      ok(res, { result, run });
    } catch (error) {
      next(error);
    }
  },
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({
    success: false,
    statusCode: 500,
    data: null,
    message: "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`EZRND Flow API listening on http://localhost:${port}`);
});
