# 로딩 UX 설계 및 구현 스펙

R&D 계획서 생성 플로우에서 AI 처리 중 사용자에게 보여줄 **2단계 로딩 메시지**와 이를 지원하는
서버/프론트 구현 설계, LangGraph 멀티에이전트 구조를 정리한 문서.

---

## 1. 로딩 메시지 카피 (2단계 구조)

### 구조

| 영역             | 역할                   | 변경 주기                                    |
| ---------------- | ---------------------- | -------------------------------------------- |
| **상위(title)**  | 현재 단계 요약 (1문장) | 단계 전환 시 교체                            |
| **하위(detail)** | 해당 단계의 세부 작업  | 2~3초마다 순환 또는 서버 이벤트 수신 시 교체 |

문장 끝은 모두 `합니다` / `중…`으로 통일.

### 단계별 메시지

#### prompt_node 로딩 메시지

- **입력한 연구 아이디어를 분석해 주제 후보를 설계합니다**
  - 입력한 연구 아이디어의 핵심 문제를 추출합니다.
  - 연구 목적과 적용 범위를 구조화합니다.
  - 기존 접근 방식과 차별 포인트를 정리합니다.
  - 하나의 아이디어를 여러 연구 방향으로 분해합니다.
  - 중복 가능성이 높은 개념을 분리 정리합니다.
  - 연구 관점별 확장 가능 영역을 탐색합니다.

```json
{
  "type": "job.progress",
  "jobId": "job_123",
  "progress": {
    "step": 1,
    "stepLabel": "입력한 연구 아이디어를 분석해 주제 후보를 설계합니다",
    "detailIndex": 0,
    "detail": "입력한 연구 아이디어의 핵심 문제를 추출합니다."
  },
  "updatedAt": "2026-02-22T13:00:00Z"
}
```

- **서로 겹치지 않는 연구주제 3개를 확정합니다**
  - 연구 방향이 겹치지 않도록 주제를 분리합니다.
  - 각 주제의 핵심 질문을 1문장으로 정리합니다.
  - 연구 범위가 충돌하지 않도록 경계를 조정합니다.
  - 주제별 차별성 기준을 점검합니다.
  - 실행 가능성을 기준으로 후보를 정제합니다.
  - 후속 에이전트로 전달할 주제 형태로 정리합니다.

#### topic_node

- **아이디어를 연구 관점으로 확장합니다.**
  - 입력한 아이디어의 핵심 개념을 정리합니다.
  - 연구 문제로 해석 가능한 요소를 추출합니다.
  - 다양한 연구 접근 관점을 탐색합니다.
  - 적용 가능한 연구 영역을 확장합니다.

- **주제 분리를 위한 구조를 정리합니다**
  - 연구 방향이 겹치지 않도록 구분합니다.
  - 서로 다른 연구 축을 정의합니다.
  - 독립적인 주제 후보 구조를 생성합니다.
  - 다음 단계에서 생성할 주제를 정리합니다.

## 2. 서버 설계

### 2.1 Progress 상태 모델

```ts
type JobProgress = {
  step: number; // 1..N
  stepLabel: string; // 상위: "사용자의 아이디어를 작업 세션으로 초기화합니다"
  detail: string; // 하위: "계획서 작성 세션을 초기화합니다."
  percent?: number;
  updatedAt: string;
};
```

백엔드(LangGraph 노드)에서 단계 전환 또는 세부 작업 완료 시 `stepLabel` / `detail`을 업데이트한다.

**로딩 메시지 생성 주체: 서버**. Claude의 `thinking` 블록을 UI에 직접 노출하지 않는다. 백엔드가 현재
노드/단계를 알고 있으므로, 해당 단계에 맞는 `{stepLabel, detail}`을 서버가 생성해 progress 이벤트로
내려준다.

### 2.2 API 엔드포인트

#### Job 생성

```
POST /api/research-jobs
→ { jobId }
```

#### Job 조회 (상태 + 결과)

```
GET /api/research-jobs/:id
→ { status, progress: JobProgress, result?, error? }
```

`status` 값: `pending` | `running` | `succeeded` | `failed`

---

## 3. 프론트엔드 설계

### 3.1 데이터 페칭 전략

| 방식                         | 특징                  | 권장 시나리오  |
| ---------------------------- | --------------------- | -------------- |
| **TanStack Query 폴링**      | 구현 단순, MVP에 적합 | 기본 구현      |
| **SSE (Server-Sent Events)** | 진짜 실시간 푸시      | 고급/화려한 UX |

**MVP 기본값: TanStack Query 폴링** (`refetchInterval: 1000`ms)

```ts
const { data } = useQuery({
  queryKey: ['research-job', jobId],
  queryFn: () => fetchJob(jobId),
  refetchInterval: (query) =>
    query.state.data?.status === 'succeeded' || query.state.data?.status === 'failed'
      ? false
      : 1000,
});
```

`status`가 `succeeded` / `failed`가 되면 `refetchInterval: false`로 폴링을 종료한다.

### 3.2 UI 바인딩

```
상위 영역 → data.progress.stepLabel  (고정 표시)
하위 영역 → data.progress.detail     (서버 값 표시)
```

**선택 사항 — 하위 영역 순환 애니메이션**: 같은 step 안에서 detail 후보 3~5개를 클라이언트에 두고
2~3초마다 순환하다가, 서버에서 새 detail이 오면 즉시 서버 값으로 덮어쓴다.

### 3.3 SSE 방식 (선택)

```
GET /api/research-jobs/:id/stream
← event: progress  data: { progress: JobProgress }
```

Next.js Route Handler로 스트리밍 응답을 구성하고, 클라이언트는 `EventSource`로 수신한다.

---

## 4. LangGraph 멀티에이전트 구조

### 4.1 2층 그래프 설계

#### 상위 그래프 (주제 발굴/선정)

| 노드               | 역할                                  |
| ------------------ | ------------------------------------- |
| `seed_node`        | 사용자 아이디어 수신                  |
| `enrich_node`      | 아이디어 구체화 + DB/웹/논문 검색     |
| `spawn_3_sessions` | 브랜치 3개 생성 및 초기 컨텍스트 전달 |
| `pick_branch`      | 최적 브랜치 선택 (자동 or 사용자)     |

`pick_branch`는 supervisor 패턴으로 구현한다. 중앙 supervisor가 브랜치 요약/점수를 보고 하나를
선택하거나, 사용자가 UI에서 직접 선택한다.

#### 하위 그래프 (브랜치별 구체화)

브랜치 A / B / C는 서로 합쳐지지 않고 각자 독립적으로 실행된다.

```
각 브랜치: refine → validate → write_plan → revise (루프)
```

### 4.2 브랜치 격리 (Branch Isolation)

LangGraph에서 한 그래프 안에서 병렬 브랜치를 실행하면 state 업데이트가 merge되어 섞일 수 있다.
**브랜치마다 별도 세션(run/thread)으로 분리**해서 저장/실행한다.

#### 데이터 모델

```
research_job (1)
  └── branch_session (3)
        ├── branch_id
        ├── job_id
        ├── titleCandidate
        ├── status: pending | running | paused | succeeded | canceled
        ├── progress: JobProgress
        └── messageHistory (브랜치 전용, 독립)
```

### 4.3 병렬 실행 정책

기본값은 3개 병렬 실행이지만, 아래 조건에서는 1~2개만 먼저 실행한다.

- 입력이 빈약하거나 스코프가 넓어 `seed/enrich` 단계 정리가 먼저 필요한 경우
- 레이트리밋/비용 압박이 있는 경우

충분한 품질의 브랜치가 나오면 나머지 브랜치는 **throttle** 또는 대기 모드로 전환한다.

### 4.4 로딩 메시지 분리

```
job.progress          → 상위 그래프 로딩 (발굴 단계)
branch_session.progress → 하위 그래프 로딩 (브랜치별 구체화 단계)
```

UI는 상위 로딩 완료 후, 브랜치 A/B/C의 로딩을 탭/카드 형태로 독립 표시한다.

```
[브랜치 A: 진행중] [브랜치 B: 대기] [브랜치 C: 완료]
```

### 4.5 구현 체크리스트

- [ ] `job` 생성 후 `branch_session` 3개 생성 (각각 독립 `branch_id`)
- [ ] 브랜치별 메시지 히스토리/상태/progress 분리 저장
- [ ] 브랜치 워커 병렬 실행 + 동시성 제한 (사용자당 최대 3, 시스템 최대 N)
- [ ] 레이트리밋 대응을 위한 재시도 정책 설정
- [ ] UI: 상위 job 로딩 + 브랜치별 로딩 각각 표시
