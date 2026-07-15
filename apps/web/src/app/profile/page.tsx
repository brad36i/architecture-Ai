"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ProfileContent } from "@/widgets/profile-content"

export default function ProfilePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/projects")}
            className="flex size-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
            aria-label="프로젝트로 돌아가기"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-800">내 프로필</h1>
        </div>
      </header>

      <div className="p-6">
        <ProfileContent />
      </div>
    </div>
  )
}
