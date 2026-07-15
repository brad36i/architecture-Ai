# Research Analysis (연구과제 분석)

## 개요

통합공고 서비스에서 공고 내용과 첨부파일을 가져와 **AI가 요약**하고, **공고문 원문을 미리보기**하는 페이지입니다.  
또한 **연구계획서 작성 전 사전 지침**(CLAUDE.md와 유사한 역할)을 정의하는 곳입니다.

## 핵심 기능

### 1. 지원사업 요약
- AI가 공고문·지침서 등을 읽어 **간단하게 요약**
- 지원 조건, 예산, 일정 등 핵심 정보 한눈에 파악

### 2. 공고문 원문
- **사이드바 (200px)**: 첨부파일 목록 (제목만 표시, 클릭 시 해당 문서 표시)
- **우측 콘텐츠 영역**: 선택된 첨부파일의 원문 표시
- 원문은 `public/docs`의 HTML 파일 (PDF → HTML 변환본)을 iframe 또는 직접 렌더링

### 3. 연구계획서 지침 (GUIDELINES.md)
- AI가 연구계획서 작성 시 필요한 **skill·지침**을 자동 생성
- 사용자가 **마크다운 편집**으로 추가/수정 가능
- CLAUDE.md처럼 이후 연구계획서 작성 단계에서 참조되는 메타 지침

## 페이지 구조

```
연구과제 분석 (헤더)
├── [탭 1] 지원사업 요약     → AI 요약 콘텐츠
├── [탭 2] 공고문 원문       → [사이드바 200px | 원문 뷰어]
└── [탭 3] GUIDELINES.md → 마크다운 에디터
```

## 데이터 소스

- **공고·첨부파일**: 통합공고 서비스 API (추후 연동)
- **원문 HTML**: `public/docs/*.html` (PDF 변환본, 현재 `notice0201020.html` 예시)
- **지침 마크다운**: 프로젝트별 저장소 (로컬/DB, 추후 정의)

## 디자인 패턴

- **Compound Component**: 탭별 패널 컴포넌트
- **shadcn/ui**: Tabs
- **의존성 규칙**: app → views/widgets ← features ← shared

## 파일 구조

```
research-analysis/
├── page.tsx                    # 메인 페이지 (헤더 + 탭)
├── components/
│   ├── SummaryTab.tsx          # 지원사업 요약 탭
│   ├── AnnouncementTab.tsx      # 공고문 원문 탭 (사이드바 + 뷰어)
│   │   └── AttachmentSidebar   # 첨부파일 목록 (200px)
│   │   └── DocumentViewer      # HTML 원문 렌더링
│   └── GuidelinesTab.tsx       # GUIDELINES.md 마크다운 에디터
├── mock/
│   └── data.ts                 # Mock 공고/첨부파일 데이터 (추후 API 연동)
└── README.md                   # 이 파일
```

## 개발 상태

- [x] README 작성
- [x] 탭 구조 및 지원사업 요약
- [x] 공고문 원문 (사이드바 + HTML 뷰어)
- [x] 연구계획서 지침 마크다운 에디터
