import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

export type AgentProvider = "openai" | "fallback";

export type FlowContext = {
  id?: number;
  title?: string;
  description?: string;
  status?: string;
};

export type RunFlowAgentInput = {
  input: string;
  flow?: FlowContext | null;
};

export type RunFlowAgentResult = {
  output: string;
  provider: AgentProvider;
};

export type LegalReviewProjectContext = {
  id: string;
  title?: string | null;
  noticeId?: string | null;
  url?: string | null;
  budgetProject?: string | null;
  programBudget?: string | null;
  fundings?: string | null;
  ministryNames?: string[];
  noticeTypes?: string[];
  startDate?: string | null;
  endDate?: string | null;
};

export type RunLegalReviewAgentInput = {
  project: LegalReviewProjectContext;
  stageStep: string;
  stageTitle: string;
  reviewFocus: unknown;
};

export type RunLegalReviewAgentResult = RunFlowAgentResult;

const fallbackSteps = [
  "요구사항을 하나의 흐름 목표로 정리합니다.",
  "필요한 입력, 처리 단계, 출력물을 분리합니다.",
  "불확실한 부분은 검증 질문으로 남기고 다음 액션을 제안합니다."
];

function buildFlowSummary(flow?: FlowContext | null): string {
  if (!flow) return "새로운 AI Arch 건축 플로우";
  return [
    flow.id ? `#${flow.id}` : undefined,
    flow.title,
    flow.status ? `(${flow.status})` : undefined,
    flow.description ? `- ${flow.description}` : undefined
  ]
    .filter(Boolean)
    .join(" ");
}

function fallbackAgent(input: RunFlowAgentInput): RunFlowAgentResult {
  const flowSummary = buildFlowSummary(input.flow);
  return {
    provider: "fallback",
    output: [
      `플로우: ${flowSummary}`,
      `요청: ${input.input}`,
      "",
      "초안 응답:",
      ...fallbackSteps.map((step, index) => `${index + 1}. ${step}`),
      "",
      "OPENAI_API_KEY를 설정하면 LangChain ChatOpenAI 기반 응답으로 전환됩니다."
    ].join("\n")
  };
}

function formatReviewFocus(reviewFocus: unknown): string {
  if (Array.isArray(reviewFocus)) {
    return reviewFocus.map((item) => `- ${String(item)}`).join("\n");
  }

  if (reviewFocus && typeof reviewFocus === "object") {
    return JSON.stringify(reviewFocus, null, 2);
  }

  return String(reviewFocus ?? "검토 항목 미지정");
}

function buildLegalProjectSummary(project: LegalReviewProjectContext): string {
  return [
    `프로젝트 ID: ${project.id}`,
    `프로젝트명: ${project.title ?? project.noticeId ?? "미지정"}`,
    project.noticeId ? `공고/관리 번호: ${project.noticeId}` : undefined,
    project.url ? `URL: ${project.url}` : undefined,
    project.budgetProject ? `사업명: ${project.budgetProject}` : undefined,
    project.programBudget ? `예산: ${project.programBudget}` : undefined,
    project.fundings ? `지원/재원: ${project.fundings}` : undefined,
    project.ministryNames?.length ? `기관: ${project.ministryNames.join(", ")}` : undefined,
    project.noticeTypes?.length ? `공고 유형: ${project.noticeTypes.join(", ")}` : undefined,
    [project.startDate, project.endDate].filter(Boolean).length
      ? `기간: ${[project.startDate, project.endDate].filter(Boolean).join(" ~ ")}`
      : undefined
  ]
    .filter(Boolean)
    .join("\n");
}

function fallbackLegalReviewAgent(input: RunLegalReviewAgentInput): RunLegalReviewAgentResult {
  return {
    provider: "fallback",
    output: [
      `단계: ${input.stageStep} ${input.stageTitle}`,
      "",
      "AI 보조 법무 검토 초안입니다. 이 결과는 법적 확실성을 보장하지 않으며, 관련 법령/공고 원문/권한 있는 기관 해석 및 변호사 등 전문가 확인이 필요합니다.",
      "",
      "검토 초점:",
      formatReviewFocus(input.reviewFocus),
      "",
      "프로젝트 맥락:",
      buildLegalProjectSummary(input.project),
      "",
      "확인 필요 사항:",
      "1. 공고문과 지침서 원문에서 해당 단계의 의무 조항과 제출 제한을 대조하세요.",
      "2. 적용 법령, 조례, 발주기관 질의응답 등 권위 있는 출처로 해석을 확인하세요.",
      "3. 계약, 저작권, 이해충돌, 자격요건처럼 법적 효과가 큰 항목은 전문가 검토를 받으세요.",
      "",
      "OPENAI_API_KEY를 설정하면 LangChain ChatOpenAI 기반 법무 검토로 전환됩니다."
    ].join("\n")
  };
}

export async function runFlowAgent(input: RunFlowAgentInput): Promise<RunFlowAgentResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackAgent(input);
  }

  const model = new ChatOpenAI({
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.2
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      [
        "You are the AI Arch architecture planning agent.",
        "Help users turn architecture notices and project ideas into clear executable architecture planning flows.",
        "Respond in Korean unless the user requests another language.",
        "Be concise, structured, and action-oriented."
      ].join(" ")
    ],
    ["human", "Flow context: {flowSummary}\n\nUser request: {userInput}"]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const output = await chain.invoke({
    flowSummary: buildFlowSummary(input.flow),
    userInput: input.input
  });

  return {
    provider: "openai",
    output
  };
}

export async function runLegalReviewAgent(input: RunLegalReviewAgentInput): Promise<RunLegalReviewAgentResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackLegalReviewAgent(input);
  }

  const model = new ChatOpenAI({
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      [
        "당신은 AI Arch의 단계별 법무 검토 보조 에이전트입니다.",
        "반드시 한국어로 답변하고, 신중하고 보수적으로 작성하세요.",
        "법적 확실성, 최종 판단, 적법/위법 단정 표현을 하지 마세요.",
        "항상 AI 보조 검토이며 권위 있는 출처와 전문가 확인이 필요하다고 명시하세요.",
        "프로젝트와 단계 맥락에 근거해 위험 신호, 확인할 원문, 전문가 확인 질문을 구조화하세요."
      ].join(" ")
    ],
    [
      "human",
      [
        "Project context:\n{projectSummary}",
        "",
        "Stage: {stageStep} {stageTitle}",
        "",
        "Legal review focus:\n{reviewFocus}"
      ].join("\n")
    ]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const output = await chain.invoke({
    projectSummary: buildLegalProjectSummary(input.project),
    stageStep: input.stageStep,
    stageTitle: input.stageTitle,
    reviewFocus: formatReviewFocus(input.reviewFocus)
  });

  return {
    provider: "openai",
    output
  };
}
