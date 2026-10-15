import * as React from "react"

import { cn } from "@/lib/utils"

type LegalSection = {
  heading: string
  paragraphs: string[]
}

type LegalDocumentProps = {
  title: string
  sections: LegalSection[]
} & Omit<React.ComponentProps<"article">, "children">

// Corpo comum de /terms e /privacy: título, o aviso de texto provisório e as
// seções numeradas. O conteúdo fica em cada página.
function LegalDocument({
  title,
  sections,
  className,
  ...props
}: LegalDocumentProps) {
  return (
    <article
      data-slot="legal-document"
      className={cn("mx-auto flex w-full max-w-3xl flex-col gap-8 py-10", className)}
      {...props}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">{title}</h1>
        <p className="text-body-md text-muted-foreground">
          Texto provisório. O StreamTube é um projeto acadêmico do MBA em
          Engenharia de Software com IA da Full Cycle, sem fins comerciais.
        </p>
      </header>

      {sections.map((section, index) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-h3 text-foreground">
            {`${String(index + 1)}. ${section.heading}`}
          </h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-body-md text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  )
}

export { LegalDocument, type LegalSection }
