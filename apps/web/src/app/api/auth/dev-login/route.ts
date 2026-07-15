// TODO: 향후 삭제 — 임시 dev-login API 전체·.env 자격 증명 방식
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body: { userId?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expectedId = process.env.LOGIN_USER_ID ?? '';
  const expectedPw = process.env.LOGIN_USER_PASSWORD ?? '';
  const inputId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const inputPw = typeof body.password === 'string' ? body.password : '';

  if (inputId === expectedId && inputPw === expectedPw) {
    // TODO: 향후 삭제 — 실제 인증 연동 시 서버가 내려주는 사용자 id로 대체
    const userId = 1;
    return NextResponse.json({ ok: true as const, userId });
  }

  return NextResponse.json({ ok: false as const }, { status: 401 });
}
