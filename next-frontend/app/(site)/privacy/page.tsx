import type { Metadata } from "next"

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document"

export const metadata: Metadata = {
  title: "Política de Privacidade — StreamTube",
}

const SECTIONS: LegalSection[] = [
  {
    heading: "Dados da conta",
    paragraphs: [
      "No cadastro guardamos apenas o seu e-mail e a sua senha. A senha é armazenada como hash (Argon2), nunca em texto. O canal nasce com o prefixo do e-mail como nome e apelido, que você pode editar depois.",
    ],
  },
  {
    heading: "O que você publica e faz na plataforma",
    paragraphs: [
      "Guardamos os vídeos e thumbnails que você envia, os dados que você edita (título, descrição, categoria, visibilidade e as informações do canal), seus comentários, likes e dislikes e os canais em que você se inscreve.",
      "As visualizações são guardadas apenas como contagem por vídeo, sem registrar quem assistiu.",
    ],
  },
  {
    heading: "Sessão e cookies",
    paragraphs: [
      "Ao entrar, sua sessão fica num único cookie cifrado e inacessível a scripts da página. Não usamos cookies de publicidade nem de rastreamento.",
    ],
  },
  {
    heading: "Endereço IP",
    paragraphs: [
      "O endereço IP de quem acessa é usado apenas para limitar o volume de requisições e evitar abusos. Ele não é gravado no banco de dados.",
    ],
  },
  {
    heading: "E-mails",
    paragraphs: [
      "Enviamos e-mails apenas para confirmar a conta e para recuperar a senha. Nesta instalação local eles são capturados por um servidor de testes e não chegam a caixas de entrada reais.",
    ],
  },
  {
    heading: "Compartilhamento e retenção",
    paragraphs: [
      "Os dados não são compartilhados com terceiros e ficam no ambiente local onde a plataforma roda, até que esse ambiente seja apagado. Não há backup.",
    ],
  },
]

export default function PrivacyPage() {
  return <LegalDocument title="Política de Privacidade" sections={SECTIONS} />
}
