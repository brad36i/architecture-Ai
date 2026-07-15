# Related Works (선행연구 조사)

## 개요

연구자가 주제별 선행연구를 체계적으로 조사하고 관리하는 페이지입니다.

## 핵심 기능

### 1. 검색 히스토리 관리
- 주제선택 페이지에서 자동 생성 또는 수동 검색
- 검색일시, 키워드, 결과 개수 표시
- 재검색 및 삭제 기능

### 2. 통합 검색 결과
- **주 데이터**: 연구과제보고서 17만건 DB
- **부가 데이터**: 논문, 특허, 신문기사, 블로그
- 탭 구조로 데이터 소스 분류

### 3. 결과 보기 옵션
- **카드 뷰**: 제목, 저자, 초록, 키워드, 유사도 표시
- **테이블 뷰**: 간결한 목록 형식 (추후 구현)
- 필터/정렬: 발행연도, 유사도, 최신순

### 4. 갈무리 (Bookmark)
- **개별 갈무리**: 카드별 북마크 버튼
- **일괄 갈무리**: 체크박스 선택 → "선택 항목 갈무리" 버튼
- 우측 "갈무리" 패널에서 저장된 항목 확인
- 메모 추가 기능

### 5. 미리보기 패널
- 우측 "미리보기" 패널에서 문헌 상세 내용 확인
- 초록 전체 보기, 키워드, 원문 링크

## 연구자 중심 UX

### 정보 구조
```
[검색 히스토리] → [검색 결과 상세] → [갈무리/미리보기]
```

### 주요 워크플로우
1. **검색**: 주제선택 완료 or 수동 검색 → 히스토리 생성
2. **탐색**: 결과 탭 이동 → 카드/테이블 뷰로 문헌 탐색
3. **선별**: 유사도/키워드 기반 필터링 → 관련 문헌 체크
4. **저장**: 선택 항목 일괄 갈무리 → 메모 추가
5. **활용**: 갈무리 패널에서 내보내기 or DB 저장

## 디자인 패턴

- **Compound Component**: `RelatedWorks.Root`, `HistoryList`, `ResultDetail`
- **Headless Hook**: `useRelatedWorks` (상태 관리)
- **shadcn/ui**: Tabs, Checkbox, Badge, Accordion
- **다크 모드**: zinc 팔레트, OKLCH 색상

## 파일 구조

```
related-works/
├── page.tsx              # 메인 페이지 (히스토리 리스트 or 결과 상세)
├── components/
│   ├── HistoryList.tsx   # 검색 히스토리 카드 리스트
│   ├── ResultDetail.tsx  # 검색 결과 상세 (탭 + 카드)
│   ├── ResultCard.tsx    # 개별 결과 카드 (Compound Component)
│   ├── BookmarkPanel.tsx # 갈무리 패널 (우측 Asidebar)
│   └── PreviewPanel.tsx  # 미리보기 패널 (우측 Asidebar)
├── hooks/
│   └── useRelatedWorks.ts # 상태 관리 훅
├── stores/
│   └── related-works-store.ts # Zustand store (갈무리 관리)
├── types/
│   └── index.ts          # 타입 정의
├── mock/
│   └── data.ts           # Mock 검색 결과 데이터
├── PRD.md                # Product Requirements Document
└── README.md             # 이 파일
```

## Mock 데이터

현재는 실제 DB 없이 프론트엔드 개발을 위한 Mock 데이터 사용:
- 검색 히스토리 2-3건
- 각 히스토리당 연구과제 20-50건, 논문 50-100건
- 유사도 점수 (50-100%), 키워드, 초록 포함

## 개발 상태

- [x] PRD 작성
- [x] Mock 데이터 생성
- [x] 히스토리 리스트 UI
- [x] 결과 상세 UI (탭 + 카드 뷰)
- [x] 갈무리 기능 (Zustand store)
- [x] 미리보기 패널
- [x] 우측 Asidebar 패널 연동
- [x] 체크박스 선택 & 일괄 갈무리
- [x] 북마크 개별 추가/제거
- [x] 메모 추가 기능

## 향후 계획

### Phase 2
- 테이블 뷰 추가
- 가상화 스크롤 (대량 데이터 최적화)
- 실제 DB/API 연동

### Phase 3
- AI 추천 (유사 문헌)
- 자동 요약 기능
- 인용 관리 (BibTeX)
- 팀 협업 (갈무리 공유)
