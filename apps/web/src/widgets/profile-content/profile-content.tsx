"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { useResearcher } from "@/features/researcher"

const PROFILE_TABS = [
  { value: "personal", label: "개인정보" },
  { value: "expertise", label: "전문분야" },
  { value: "papers", label: "포트폴리오" },
  { value: "patents", label: "수상/인증" },
  { value: "projects", label: "경력" },
] as const

function KeyValueRow({ key_: keyLabel, value }: { key_: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-zinc-100 py-3">
      <span className="w-40 shrink-0 text-sm font-medium text-zinc-600">{keyLabel}</span>
      <span className="text-sm text-zinc-800">{value}</span>
    </div>
  )
}

export function ProfileContent() {
  const { data, isPending, isError } = useResearcher()

  if (isPending) {
    return <p className="text-sm text-zinc-500">로딩 중...</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500">
        건축가 정보를 불러올 수 없습니다. API 서버 연결을 확인해 주세요.
      </p>
    )
  }

  if (!data) return null

  const {
    personal,
    expertiseMajor,
    expertiseKeywords,
    expertiseTech,
    papers,
    patents,
    tasks,
  } = data

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList variant="line" className="mb-6 w-full justify-start gap-1 border-b border-zinc-200 bg-transparent">
        {PROFILE_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="!border-0 data-[state=active]:text-zinc-900"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="personal">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-6 flex items-start gap-6">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">
              사진
            </div>
            <div className="text-xs text-zinc-500">
              <p>권장 사이즈: 120px × 120px</p>
              <p>사진 크기: 1M 이하</p>
              <p>파일 형식: png/jpg</p>
            </div>
          </div>
          <div className="space-y-0">
            {personal.map((item) => (
              <KeyValueRow key={item.key} key_={item.key} value={item.value} />
            ))}
            <div className="mt-4 pt-4">
              <KeyValueRow key_="소개사항" value="" />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="expertise">
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-zinc-800">전문분야(전공분야)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">순번</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">전문분야명구분</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">전문분야명</th>
                  </tr>
                </thead>
                <tbody>
                  {expertiseMajor.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{row.type}</td>
                      <td className="px-3 py-2">{row.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-zinc-800">전문분야(전공핵심어)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">순번</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">전공핵심어분야명구분</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">전공핵심어</th>
                  </tr>
                </thead>
                <tbody>
                  {expertiseKeywords.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{row.type}</td>
                      <td className="px-3 py-2">{row.keyword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 font-semibold text-zinc-800">기술분야</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">기술분류그룹명</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">기술분류코드</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">기술분류명</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">한글키워드</th>
                  </tr>
                </thead>
                <tbody>
                  {expertiseTech.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="px-3 py-2">{row.group}</td>
                      <td className="px-3 py-2">{row.code}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.koKeyword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="papers">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 text-sm text-zinc-500">전체 {papers.length}건</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">번호</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">구분</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">포트폴리오명</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">발표/전시명</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">분야 구분</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">참여자 수</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">역할구분</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">수행년월</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">주요실적</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((row) => (
                  <tr key={row.no} className="border-b border-zinc-100">
                    <td className="px-3 py-2">{row.no}</td>
                    <td className="px-3 py-2">{row.reg}</td>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2">{row.journal}</td>
                    <td className="px-3 py-2">{row.journalType}</td>
                    <td className="px-3 py-2">{row.authors}</td>
                    <td className="px-3 py-2">{row.authorType}</td>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.major}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="patents">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 text-sm text-zinc-500">전체 {patents.length}건</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">번호</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">구분</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">수상/인증 구분</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">수상/인증명</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">발행국가</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">등록번호</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">등록일자</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">주관/발행기관</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">주요실적</th>
                </tr>
              </thead>
              <tbody>
                {patents.map((row) => (
                  <tr key={row.no} className="border-b border-zinc-100">
                    <td className="px-3 py-2">{row.no}</td>
                    <td className="px-3 py-2">{row.reg}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.country}</td>
                    <td className="px-3 py-2">{row.appNo}</td>
                    <td className="px-3 py-2">{row.appDate}</td>
                    <td className="px-3 py-2">{row.applicant}</td>
                    <td className="px-3 py-2">{row.major}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="projects">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 text-sm text-zinc-500">전체 {tasks.length}건 (경력)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">수행기간</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">참여역할</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">건축 프로젝트명</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">발주/주관기관</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">참여기관</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">기관구분</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-600">주요실적</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-100">
                    <td className="px-3 py-2">{row.period}</td>
                    <td className="px-3 py-2">{row.role}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.lead}</td>
                    <td className="px-3 py-2">{row.participating}</td>
                    <td className="px-3 py-2">{row.instType}</td>
                    <td className="px-3 py-2">{row.major}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
