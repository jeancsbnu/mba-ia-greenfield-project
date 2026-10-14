import { UploadForm } from "@/components/videos/upload-form"

// Dentro do route group (studio): o layout já exige a sessão e traz a navbar
// do site, o caminho de volta que a tela não tinha fora dele.
export default function UploadPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6 lg:px-6">
      <h1 className="text-h2">Enviar vídeo</h1>
      <UploadForm />
    </div>
  )
}
