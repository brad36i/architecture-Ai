# 메모리 부족 오류 해결 가이드

## 문제 증상

```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

이 오류는 Node.js 프로세스가 사용 가능한 메모리 한계에 도달했을 때 발생합니다.

## 즉시 해결 방법

### 1. 캐시 삭제 후 재시작

```bash
# 방법 1: 스크립트 사용 (권장)
bun run clean
bun run dev

# 방법 2: 캐시 삭제와 함께 시작
bun run dev:clean

# 방법 3: 수동 삭제 (Windows)
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
bun run dev

# 방법 3: 수동 삭제 (Linux/Mac)
rm -rf .next node_modules/.cache
bun run dev
```

### 2. 메모리 할당량 증가

이미 `package.json`에 설정되어 있습니다:

```json
{
  "scripts": {
    "dev": "cross-env NODE_OPTIONS='--max-old-space-size=8192' next dev"
  }
}
```

- 기본값: 4096MB (4GB)
- 현재 설정: 8192MB (8GB)
- 필요시 더 늘릴 수 있음: 16384 (16GB)

## 근본 원인 및 해결책

### 1. React 컴포넌트 최적화

**문제**: 불필요한 리렌더링으로 인한 메모리 누적

**해결책**: `React.memo`와 `React.useCallback` 사용

```tsx
// ✅ 좋은 예
const MyComponent = React.memo(function MyComponent({ data }) {
  const handleClick = React.useCallback(() => {
    // 핸들러 로직
  }, []);

  return <div onClick={handleClick}>{data}</div>;
});

// ❌ 나쁜 예
function MyComponent({ data }) {
  const handleClick = () => {
    // 매 렌더링마다 새로운 함수 생성
  };

  return <div onClick={handleClick}>{data}</div>;
}
```

### 2. TanStack Query 설정

**문제**: 캐시된 데이터가 메모리에 계속 쌓임

**해결책**: `gcTime` 및 `staleTime` 적절히 설정

```tsx
// src/app/providers.tsx에 이미 적용됨
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      gcTime: 5 * 60 * 1000, // 5분
      refetchOnWindowFocus: false,
      retry: 1,
      structuralSharing: true, // 메모리 최적화
    },
  },
});
```

### 3. Next.js 코드 스플리팅

**문제**: 큰 라이브러리가 한 번에 로드됨

**해결책**: `next.config.ts`에서 청크 분리 설정

```typescript
// next.config.ts에 이미 적용됨
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        reactMarkdown: {
          name: 'react-markdown',
          test: /[\\/]node_modules[\\/](react-markdown|remark|rehype)[\\/]/,
          priority: 40,
        },
        // ... 기타 라이브러리
      },
    };
  }
  return config;
};
```

### 4. 동적 임포트 사용

**문제**: 사용하지 않는 컴포넌트도 초기 로드됨

**해결책**: 필요한 시점에만 로드

```tsx
// ✅ 좋은 예
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <p>로딩 중...</p>,
  ssr: false, // 서버 사이드 렌더링 불필요한 경우
});

// ❌ 나쁜 예
import HeavyComponent from './heavy-component';
```

## 모니터링

### 개발 중 메모리 사용량 확인

```bash
# Windows
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE

# Linux/Mac
ps aux | grep node
```

### 프로덕션 빌드 테스트

```bash
bun run build
bun run start
```

개발 모드(`bun run dev`)는 프로덕션보다 훨씬 많은 메모리를 사용합니다.

## 체크리스트

- [ ] `.next` 폴더 삭제
- [ ] `node_modules/.cache` 폴더 삭제
- [ ] `bun run dev` 재시작
- [ ] 여전히 오류 발생 시 `NODE_OPTIONS` 메모리 할당량 증가
- [ ] React 컴포넌트에 `React.memo` 적용
- [ ] 큰 컴포넌트는 동적 임포트 사용
- [ ] TanStack Query 설정 확인
- [ ] 프로덕션 빌드로 테스트

## 추가 리소스

- [Next.js 메모리 최적화](https://nextjs.org/docs/app/building-your-application/optimizing/memory-usage)
- [React 성능 최적화](https://react.dev/learn/render-and-commit)
- [TanStack Query 메모리 관리](https://tanstack.com/query/latest/docs/framework/react/guides/memory-management)
