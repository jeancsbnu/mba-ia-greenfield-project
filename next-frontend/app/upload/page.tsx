import { redirect } from "next/navigation"

import { UploadForm } from "@/components/videos/upload-form"
import { getSession } from "@/lib/auth/session"

export default async function UploadPage() {
  const session = await getSession()
  if (!session.isLoggedIn) {
    redirect("/login")
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-6">
      <h1 className="text-h2">Enviar vídeo</h1>
      <UploadForm />
    </main>
  )
}
