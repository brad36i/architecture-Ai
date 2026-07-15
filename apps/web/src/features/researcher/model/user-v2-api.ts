import { API_BASE } from '@/shared/config/api';

import type {
  ExpertiseKeywordItem,
  ExpertiseMajorItem,
  ExpertiseTechItem,
  PaperItem,
  PatentItem,
  PersonalInfoItem,
  Researcher,
  TaskItem,
} from '@/entities/researcher';

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data: T | null;
}

export interface UserV2Data {
  id: number;
  email: string;
  isActive: boolean;
  isSuperuser: boolean;
  firstName: string;
  lastName: string;
  organizationId: number;
  userLevelId: number;
  docAccessLevelId: number;
  attachedOrg: string;
  birth: string | null;
  sex: string | null;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserEducationItem {
  degree: string;
  department: string;
  graduationYear: number;
}

export interface UserCareerItem {
  organization: string;
  role: string;
  startYear: number;
  endYear: number | null;
  isCurrent: boolean;
}

export interface UserPaperApiItem {
  title: string;
  year: number;
  authorCount: number;
  venue: string;
}

export interface UserIpItem {
  ipType: string;
  title: string;
  year: number;
  registrationNo: string;
}

export interface UserTechFieldItem {
  techGroupName: string;
  techCode: string;
  techName: string;
  krKeywords: string | null;
  enKeywords: string | null;
}

export interface UserProfileV2Data {
  userId: number;
  orgTypeCode: string;
  orgTypeName: string;
  regionCode: string;
  regionName: string;
  createdAt: string;
  updatedAt: string;
  education: UserEducationItem[];
  career: UserCareerItem[];
  papers: UserPaperApiItem[];
  ip: UserIpItem[];
  majorFields: string[];
  majorKeywords: string[];
  techFields: UserTechFieldItem[];
}

function yn(v: boolean): string {
  return v ? '예' : '아니오';
}

export function mapV2UserToResearcher(user: UserV2Data, profile: UserProfileV2Data): Researcher {
  const personal: PersonalInfoItem[] = [
    { key: '이메일', value: user.email },
    { key: '이름', value: `${user.lastName}${user.firstName}`.trim() || '-' },
    { key: '소속', value: user.attachedOrg || '-' },
    { key: '기관 유형', value: profile.orgTypeName || '-' },
    { key: '지역', value: profile.regionName || '-' },
    { key: '활성 계정', value: yn(user.isActive) },
    { key: '슈퍼유저', value: yn(user.isSuperuser) },
    { key: '조직 ID', value: String(user.organizationId) },
    { key: '사용자 등급 ID', value: String(user.userLevelId) },
    { key: '문서 접근 등급 ID', value: String(user.docAccessLevelId) },
    { key: '생년월일', value: user.birth ?? '-' },
    { key: '성별', value: user.sex ?? '-' },
    { key: '인증 수단', value: user.authProvider || '-' },
    { key: '가입일', value: user.createdAt },
    { key: '수정일', value: user.updatedAt },
  ];

  profile.education?.forEach((edu, i) => {
    personal.push({
      key: `학력 ${i + 1}`,
      value: `${edu.degree} · ${edu.department} · ${edu.graduationYear}년`,
    });
  });

  const expertiseMajor: ExpertiseMajorItem[] = (profile.majorFields ?? []).map((name) => ({
    type: '주요 전공분야',
    name,
  }));

  const expertiseKeywords: ExpertiseKeywordItem[] = (profile.majorKeywords ?? []).map((keyword) => ({
    type: '전공 핵심어',
    keyword,
  }));

  const expertiseTech: ExpertiseTechItem[] = (profile.techFields ?? []).map((t) => ({
    group: t.techGroupName,
    code: t.techCode,
    name: t.techName,
    koKeyword: t.krKeywords ?? '',
  }));

  const papers: PaperItem[] = (profile.papers ?? []).map((p, i) => ({
    no: i + 1,
    reg: '-',
    title: p.title,
    journal: p.venue,
    journalType: '-',
    authors: p.authorCount,
    authorType: '-',
    date: String(p.year),
    major: '-',
  }));

  const patents: PatentItem[] = (profile.ip ?? []).map((item, i) => ({
    no: i + 1,
    reg: '-',
    type: item.ipType,
    name: item.title,
    country: '-',
    appNo: item.registrationNo,
    appDate: String(item.year),
    applicant: '-',
    major: '-',
  }));

  const tasks: TaskItem[] = (profile.career ?? []).map((c) => {
    const period =
      c.endYear == null || c.isCurrent
        ? `${c.startYear} ~ 현재`
        : `${c.startYear} ~ ${c.endYear}`;
    return {
      period,
      role: c.role,
      name: c.organization,
      lead: '-',
      participating: c.organization,
      instType: '-',
      major: c.isCurrent ? '진행 중' : '-',
    };
  });

  return {
    id: String(user.id),
    personal,
    expertiseMajor,
    expertiseKeywords,
    expertiseTech,
    papers,
    patents,
    tasks,
  };
}

export async function fetchUserV2(userId: number): Promise<UserV2Data> {
  const res = await fetch(`${API_BASE}/api/v2/users/${userId}`);
  const json = (await res.json()) as ApiEnvelope<UserV2Data>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error('Failed to fetch user');
  }
  return json.data;
}

export async function fetchUserProfileV2(userId: number): Promise<UserProfileV2Data> {
  const res = await fetch(`${API_BASE}/api/v2/users/${userId}/profile`);
  const json = (await res.json()) as ApiEnvelope<UserProfileV2Data>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error('Failed to fetch user profile');
  }
  return json.data;
}
