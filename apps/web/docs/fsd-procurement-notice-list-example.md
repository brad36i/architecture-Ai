# 전자조달 통합공고 목록: FSD(Shared → App) 예시

이 문서는 “전자조달 통합공고 목록” 화면을 가정해 **Feature-Sliced Design(FSD)** 레이어를
`shared → entities → features → widgets → views → app` 순서로 쌓는 예시를 정리합니다.

> 이 레포의 FSD 컨벤션(스킬)에서는 공식 `pages` 대신 **`views`** 레이어를 사용합니다. `src/app`은
> Next.js App Router 라우팅 + FSD `app` 레이어를 합친 형태이며, `page.tsx`는 **`@/views`만 import**
> 하도록 권장합니다.

---

## 핵심 규칙(요약)

- **레이어 방향(import rule)**: 위 레이어는 아래 레이어만 import
  - `app → views → widgets → features → entities → shared`
- **같은 레이어의 slice끼리 직접 import 금지**
  - 예: `features/a`가 `features/b`를 import ❌
  - 대신 `widgets/*`에서 둘을 조합 ✅
- **`widgets`는 `shared/ui`를 직접 써도 OK**
  - `widgets → shared`는 허용 방향

---

## 목표 화면(가정)

전자조달 통합공고 목록 화면:

- **필터/검색 영역**
  - 검색어 입력
  - 상태(전체/진행/마감) 탭
- **목록 영역**
  - 공고 리스트 렌더링
  - “상세” 버튼(상세 페이지 이동/모달 오픈 등)

이 화면을 아래처럼 **위젯 2개**로 나눕니다.

- `widgets/notice-filter-bar`: 검색 + 상태 필터를 한 덩어리 UI 블록으로 조합
- `widgets/notice-list-panel`: 공고 목록 + 상세 열기 액션을 한 덩어리로 조합

---

## 디렉터리 구조(예시)

```txt
src/
  app/
    notices/page.tsx
  views/
    procurement-notice-list/
      ui/procurement-notice-list-view.tsx
      model/useNoticeQuery.ts
      index.ts
  widgets/
    notice-filter-bar/
      ui/notice-filter-bar.tsx
      index.ts
    notice-list-panel/
      ui/notice-list-panel.tsx
      index.ts
  features/
    notice-search/
      ui/notice-search-input.tsx
      index.ts
    notice-status-filter/
      model/types.ts
      ui/notice-status-tabs.tsx
      index.ts
    notice-open-detail/
      ui/open-notice-detail-button.tsx
      index.ts
  entities/
    procurement-notice/
      model/types.ts
      api/list-notices.ts
      index.ts
  shared/
    api/http.ts
    ui/button.tsx
    ui/input.tsx
```

---

## Shared: 앱 전역 기반(재사용 UI, API 클라이언트)

### `src/shared/api/http.ts`

```ts
export async function httpGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return (await res.json()) as T;
}
```

### `src/shared/ui/input.tsx`, `src/shared/ui/button.tsx`

```tsx
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}
```

```tsx
export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}
```

> 실코드에서는 `@/shared/ui`(shadcn 등) 컴포넌트를 그대로 사용하세요. 여기서는 예시를 단순화하기
> 위해 최소 구현 형태로만 표기했습니다.

---

## Entities: 도메인 모델 + 도메인 API

### `src/entities/procurement-notice/model/types.ts`

```ts
export type ProcurementNotice = {
  id: string;
  title: string;
  agencyName: string;
  status: 'OPEN' | 'CLOSED';
  publishedAt: string;
};

// 상태(필터)는 도메인 의미가 강하다고 보고 entities로 올린 예시
export type NoticeStatusFilter = 'ALL' | 'OPEN' | 'CLOSED';
```

### `src/entities/procurement-notice/api/list-notices.ts`

```ts
import { httpGet } from '@/shared/api/http';

import type { ProcurementNotice, NoticeStatusFilter } from '../model/types';

export type ListNoticesParams = {
  q?: string;
  status?: NoticeStatusFilter;
};

export function listNotices(params: ListNoticesParams) {
  const usp = new URLSearchParams();
  if (params.q) usp.set('q', params.q);
  if (params.status && params.status !== 'ALL') usp.set('status', params.status);
  return httpGet<ProcurementNotice[]>(`/api/procurement/notices?${usp.toString()}`);
}
```

### `src/entities/procurement-notice/index.ts`

```ts
export type { ProcurementNotice, NoticeStatusFilter } from './model/types';
export { listNotices } from './api/list-notices';
export type { ListNoticesParams } from './api/list-notices';
```

---

## Features: 사용자 행동(가치) 단위

아래 feature들은 서로를 import 하지 않고(같은 레이어 금지), **위젯에서 조합**합니다.

### `features/notice-search`: 검색 입력(행동/UI)

```tsx
// src/features/notice-search/ui/notice-search-input.tsx
import { Input } from '@/shared/ui/input';

export function NoticeSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder='공고 검색' />;
}
```

```ts
// src/features/notice-search/index.ts
export { NoticeSearchInput } from './ui/notice-search-input';
```

### `features/notice-status-filter`: 상태 필터 탭(행동/UI)

```tsx
// src/features/notice-status-filter/ui/notice-status-tabs.tsx
import type { NoticeStatusFilter } from '@/entities/procurement-notice';

export function NoticeStatusTabs({
  value,
  onChange,
}: {
  value: NoticeStatusFilter;
  onChange: (next: NoticeStatusFilter) => void;
}) {
  return (
    <div>
      <button onClick={() => onChange('ALL')} aria-pressed={value === 'ALL'}>
        전체
      </button>
      <button onClick={() => onChange('OPEN')} aria-pressed={value === 'OPEN'}>
        진행
      </button>
      <button onClick={() => onChange('CLOSED')} aria-pressed={value === 'CLOSED'}>
        마감
      </button>
    </div>
  );
}
```

```ts
// src/features/notice-status-filter/index.ts
export { NoticeStatusTabs } from './ui/notice-status-tabs';
```

### `features/notice-open-detail`: 상세 열기(행동/UI)

```tsx
// src/features/notice-open-detail/ui/open-notice-detail-button.tsx
import { Button } from '@/shared/ui/button';

export function OpenNoticeDetailButton({ onOpen }: { onOpen: () => void }) {
  return <Button onClick={onOpen}>상세</Button>;
}
```

```ts
// src/features/notice-open-detail/index.ts
export { OpenNoticeDetailButton } from './ui/open-notice-detail-button';
```

---

## Widgets: 큰 UI 블록(2개 이상)으로 조합

### Widget 1) `widgets/notice-filter-bar`: 검색 + 상태필터 조합

```tsx
// src/widgets/notice-filter-bar/ui/notice-filter-bar.tsx
import type { NoticeStatusFilter } from '@/entities/procurement-notice';
import { NoticeSearchInput } from '@/features/notice-search';
import { NoticeStatusTabs } from '@/features/notice-status-filter';

export function NoticeFilterBar({
  q,
  status,
  onChangeQ,
  onChangeStatus,
}: {
  q: string;
  status: NoticeStatusFilter;
  onChangeQ: (next: string) => void;
  onChangeStatus: (next: NoticeStatusFilter) => void;
}) {
  return (
    <section>
      <NoticeSearchInput value={q} onChange={onChangeQ} />
      <NoticeStatusTabs value={status} onChange={onChangeStatus} />
    </section>
  );
}
```

```ts
// src/widgets/notice-filter-bar/index.ts
export { NoticeFilterBar } from './ui/notice-filter-bar';
```

### Widget 2) `widgets/notice-list-panel`: 목록 + 상세열기 조합

```tsx
// src/widgets/notice-list-panel/ui/notice-list-panel.tsx
import type { ProcurementNotice } from '@/entities/procurement-notice';
import { OpenNoticeDetailButton } from '@/features/notice-open-detail';

export function NoticeListPanel({
  items,
  onOpenDetail,
}: {
  items: ProcurementNotice[];
  onOpenDetail: (id: string) => void;
}) {
  return (
    <section>
      <ul>
        {items.map((n) => (
          <li key={n.id}>
            <div>{n.title}</div>
            <div>
              {n.agencyName} · {n.status}
            </div>
            <OpenNoticeDetailButton onOpen={() => onOpenDetail(n.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
```

```ts
// src/widgets/notice-list-panel/index.ts
export { NoticeListPanel } from './ui/notice-list-panel';
```

---

## Views: 페이지 단위 상태/오케스트레이션(“pages-first”)

### 중요: `useNoticeQuery`는 feature에 두지 않기

검색어 + 상태필터처럼 **여러 feature를 가로지르는 페이지 상태**는 보통 `features/notice-search` 안이
아니라 `views`(또는 해당 widget)에서 관리하는 게 경계가 깔끔합니다.

아래는 `views/*/model`에 두는 예시입니다.

### `src/views/procurement-notice-list/model/useNoticeQuery.ts`

```ts
import * as React from 'react';

import type { NoticeStatusFilter } from '@/entities/procurement-notice';

export type NoticeQuery = { q: string; status: NoticeStatusFilter };

export function useNoticeQuery() {
  const [query, setQuery] = React.useState<NoticeQuery>({ q: '', status: 'ALL' });
  return { query, setQuery };
}
```

### `src/views/procurement-notice-list/ui/procurement-notice-list-view.tsx`

```tsx
'use client';

import * as React from 'react';

import { listNotices } from '@/entities/procurement-notice';
import { NoticeFilterBar } from '@/widgets/notice-filter-bar';
import { NoticeListPanel } from '@/widgets/notice-list-panel';

import { useNoticeQuery } from '../model/useNoticeQuery';

export function ProcurementNoticeListView() {
  const { query, setQuery } = useNoticeQuery();
  const [items, setItems] = React.useState<Awaited<ReturnType<typeof listNotices>>>([]);

  React.useEffect(() => {
    listNotices({ q: query.q, status: query.status }).then(setItems);
  }, [query]);

  return (
    <main>
      <h1>전자조달 통합공고</h1>

      <NoticeFilterBar
        q={query.q}
        status={query.status}
        onChangeQ={(q) => setQuery((prev) => ({ ...prev, q }))}
        onChangeStatus={(status) => setQuery((prev) => ({ ...prev, status }))}
      />

      <NoticeListPanel
        items={items}
        onOpenDetail={(id) => {
          // 상세 이동/모달 오픈 등 (페이지 수준 오케스트레이션)
          console.log('open detail', id);
        }}
      />
    </main>
  );
}
```

### `src/views/procurement-notice-list/index.ts`

```ts
export { ProcurementNoticeListView } from './ui/procurement-notice-list-view';
```

> `views`에서 `entities` API를 호출하는 것은(위 예시처럼) 이 레포의 컨벤션에서도 허용 범위입니다.
> 다만 pagination/caching/error 등 “로드” 자체가 사용자 가치/상호작용으로 커지면 별도 feature로
> 승격하는 게 실무에서 유리합니다(아래 참고).

---

## App: 라우팅(Next.js) + 인프라, `views`만 import

### `src/app/notices/page.tsx`

```tsx
import { ProcurementNoticeListView } from '@/views/procurement-notice-list';

export default function Page() {
  return <ProcurementNoticeListView />;
}
```

---

## (실무 확장) “목록 로드”가 커지면 feature로 승격하기

아래 상황이 오면 `views`에서 단순 `listNotices()` 호출로 끝내기보다, 별도의 orchestration feature를
고려합니다.

- pagination / infinite scroll
- caching / dedupe / cancelation
- error retry / toast
- URL 쿼리스트링 동기화
- 서버 컴포넌트 + 클라이언트 컴포넌트 경계 최적화

예: `features/load-procurement-notices`를 만들어 `useQuery`(TanStack Query) 등으로 캡슐화하고,
`views`는 그 feature가 제공하는 상태(`data/isLoading/error`)만 소비합니다.

> 단, 처음부터 과하게 쪼개면 “pages-first” 원칙과 충돌할 수 있으니, **재사용/복잡도 증가 시점에만**
> 추출하는 쪽이 안전합니다.

---

## 체크리스트(이 예시가 지키는 것)

- [x] `app/*`은 `views/*`만 import
- [x] `widgets/*`가 여러 `features/*`를 조합(같은 레이어끼리 직접 결합 회피)
- [x] 도메인 모델/API는 `entities/*`에 위치
- [x] `widgets`에서 `shared/ui` 직접 사용 가능
- [x] 페이지(오케스트레이션) 상태는 `views/*`(또는 해당 widget)에서 관리
