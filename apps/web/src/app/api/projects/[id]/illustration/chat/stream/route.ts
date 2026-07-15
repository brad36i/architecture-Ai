import { API_BASE } from '@/shared/config/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function previewTextForLog(value: string, limit = 180) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}…`;
}

function serializeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }
  return { value: error };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const upstreamUrl = `${API_BASE}/api/v2/projects/${encodeURIComponent(id)}/illustration/chat/stream?${request.nextUrl.searchParams.toString()}`;
  const content = request.nextUrl.searchParams.get('content') ?? '';
  const visualIntent = request.nextUrl.searchParams.get('visual_intent') ?? '';

  console.info('[illustration-proxy][request][start]', {
    projectId: id,
    upstreamUrlLength: upstreamUrl.length,
    upstreamApiBase: API_BASE,
    contentLength: content.length,
    contentPreview: previewTextForLog(content),
    visualIntentLength: visualIntent.length,
    visualIntentPreview: previewTextForLog(visualIntent),
  });

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: request.headers.get('accept') ?? 'text/event-stream',
      },
      cache: 'no-store',
      signal: request.signal,
    });
  } catch (error) {
    console.error('[illustration-proxy][request][fetch-error]', {
      ...serializeErrorForLog(error),
      projectId: id,
      upstreamUrlLength: upstreamUrl.length,
      upstreamApiBase: API_BASE,
      contentLength: content.length,
      visualIntentLength: visualIntent.length,
    });

    return Response.json(
      {
        message: '도식/표 백엔드 연결에 실패했습니다.',
      },
      { status: 502 }
    );
  }

  console.info('[illustration-proxy][request][response]', {
    projectId: id,
    status: upstream.status,
    ok: upstream.ok,
    contentType: upstream.headers.get('content-type'),
  });

  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  } else if (upstream.ok) {
    headers.set('content-type', 'text/event-stream; charset=utf-8');
  }

  const cacheControl = upstream.headers.get('cache-control');
  headers.set('cache-control', cacheControl ?? 'no-cache, no-transform');
  headers.set('x-accel-buffering', 'no');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
