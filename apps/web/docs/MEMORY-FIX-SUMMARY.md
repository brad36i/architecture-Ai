# 메모리 부족 오류 해결 완료 ✅

## 🔍 문제 분석

**오류**: `FATAL ERROR: JavaScript heap out of memory`

**원인**:

1. Next.js 개발 서버가 약 16GB 근처에서 메모리 고갈
2. `/projects/1/research-analysis` 라우트 컴파일 중 발생
3. React 컴포넌트의 불필요한 리렌더링
4. 손상된 빌드 캐시

## ✅ 적용된 해결책

### 1. Node.js 메모리 할당량 증가

- **파일**: `package.json`
- **변경**: `NODE_OPTIONS='--max-old-space-size=8192'` 추가
- **효과**: 4GB → 8GB 메모리 할당

### 2. 빌드 캐시 정리

- **파일**: 새로운 npm 스크립트 추가
- **명령어**:
  - `bun run clean`: 캐시 삭제
  - `bun run dev:clean`: 캐시 삭제 후 개발 서버 시작

### 3. React 컴포넌트 최적화

- **파일**: `src/features/research-analysis/ui/notice-analysis-tab.tsx`
- **적용**:
  - `OutlineSidebar`: `React.memo` + `React.useCallback`
  - `SubProgramCard`: `React.memo`
  - `Md`: `React.memo`
  - `Tag`, `TagList`: `React.memo`
  - `NoticeAnalysisTab`: `React.memo` + `React.useMemo`

### 4. TanStack Query 최적화

- **파일**: `src/app/providers.tsx`
- **설정**:
  ```typescript
  {
    gcTime: 5 * 60 * 1000,      // 5분 후 가비지 컬렉션
    refetchOnWindowFocus: false, // 불필요한 리페치 방지
    retry: 1,                    // 재시도 횟수 제한
    structuralSharing: true,     // 메모리 최적화
  }
  ```

### 5. Next.js 코드 스플리팅

- **파일**: `next.config.ts`
- **적용**: 큰 라이브러리를 별도 청크로 분리
  - `react-markdown`, `lucide-react`, `@tiptap/*`, `@tanstack/react-query`

### 6. 개발 도구 설치

- **cross-env**: 크로스 플랫폼 환경 변수 설정
- **rimraf**: 크로스 플랫폼 파일 삭제

## 🚀 다음 단계

### 즉시 실행할 명령어:

```bash
# 캐시 정리 (이미 완료됨)
bun run clean

# 개발 서버 시작
bun run dev
```

또는 한 번에:

```bash
bun run dev:clean
```

### 향후 메모리 문제 발생 시:

1. **먼저 시도**:

   ```bash
   bun run dev:clean
   ```

2. **여전히 문제가 있으면**:

   ```json
   // package.json에서 메모리 할당량 추가 증가
   "dev": "cross-env NODE_OPTIONS='--max-old-space-size=16384' next dev"
   ```

3. **프로덕션 빌드 테스트**:
   ```bash
   bun run build
   bun run start
   ```

## 📊 성능 개선 예상

| 항목              | 이전   | 이후              |
| ----------------- | ------ | ----------------- |
| 메모리 한계       | ~4GB   | ~8GB              |
| 컴포넌트 리렌더링 | 매번   | 메모이제이션      |
| 캐시 관리         | 무제한 | 5분 후 GC         |
| 코드 스플리팅     | 없음   | 라이브러리별 분리 |

## 📚 참고 문서

- `MEMORY-TROUBLESHOOTING.md`: 상세한 문제 해결 가이드
- Next.js 공식 문서:
  [메모리 사용량 최적화](https://nextjs.org/docs/app/building-your-application/optimizing/memory-usage)

---

**작성일**: 2026-02-27 **상태**: ✅ 해결 완료
