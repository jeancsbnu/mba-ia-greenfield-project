import type { Metadata } from "next"

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document"

export const metadata: Metadata = {
  title: "Termos de Uso — StreamTube",
}

const SECTIONS: LegalSection[] = [
  {
    heading: "Sobre a plataforma",
    paragraphs: [
      "O StreamTube é uma plataforma de compartilhamento de vídeos construída como projeto de estudo. Ela roda num ambiente local, sem garantia de disponibilidade, e pode ser reiniciada a qualquer momento.",
    ],
  },
  {
    heading: "Sua conta",
    paragraphs: [
      "Para publicar e interagir você precisa de uma conta com um e-mail válido, confirmada pelo link que enviamos. Cada conta ganha um canal, criado a partir do prefixo do e-mail.",
      "Você é responsável por manter sua senha em segredo e por tudo o que for feito com a sua conta.",
    ],
  },
  {
    heading: "O que você publica",
    paragraphs: [
      "Vídeos, títulos, descrições, thumbnails e comentários são de responsabilidade de quem os publica. Publique apenas conteúdo que você tem o direito de compartilhar.",
      "Vídeos públicos ficam visíveis para qualquer pessoa, inclusive sem conta. Vídeos não listados só abrem para quem tiver o link direto.",
    ],
  },
  {
    heading: "Uso aceitável",
    paragraphs: [
      "Não use a plataforma para publicar conteúdo ilegal, ofensivo ou que viole direitos de terceiros, nem tente contornar os limites de requisições ou o acesso de outras contas.",
    ],
  },
  {
    heading: "Sem garantias",
    paragraphs: [
      "Não há backup: contas, vídeos e interações podem ser apagados quando o ambiente for reiniciado. A plataforma é oferecida como está, sem garantia de qualquer tipo.",
    ],
  },
]

export default function TermsPage() {
  return <LegalDocument title="Termos de Uso" sections={SECTIONS} />
}
