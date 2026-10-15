# Validação no navegador — 2026-10-15

Validação manual da aplicação inteira no Google Chrome da máquina de desenvolvimento, contra a **stack de produção local** (`compose.prod.yaml`, http://localhost:8088, Mailpit em http://localhost:8125), recompilada a partir do `main` com o #107 (separação do módulo da foto de perfil).

Conta usada: uma conta de teste criada na própria validação (`ana.validacao@example.test`), mais os vídeos já existentes na stack.

## O que funcionou

| Área | Verificação |
|---|---|
| Home (anônimo) | Grade de vídeos, chips de categoria, navbar com busca e "Entrar" |
| Página do vídeo | Player nativo carrega do storage (`readyState` 4, 8 s), título, visualizações, canal, download, reações, descrição e comentários |
| Cadastro | Dica "É o nome do seu canal", medidor de força, "Conta criada!" |
| Login antes de confirmar | Recusado, com o link "Reenviar e-mail de confirmação" |
| Confirmação | E-mail no Mailpit saudando pelo nome do cadastro; link → `/login?confirmation=confirmed` com o aviso "Conta confirmada" |
| Login | Leva a "Seus vídeos", com "Editar canal" |
| Foto de perfil | Envio em "Editar canal"; foto no seletor, na navbar (após recarregar), na página do canal, na página do vídeo e nos comentários |
| Upload | tus → processamento → "Vídeo pronto!" com "Editar e publicar" / "Meus vídeos" |
| Edição e publicação | Descrição, categoria, "Publicar" → "Vídeo publicado." / "Despublicar" |
| Vídeo próprio | "Editar vídeo" no lugar de "Inscrever-se" |
| Comentários | Comentário, resposta e like no comentário, com a foto do autor |
| Vídeo de outro canal | Inscrição e like persistem após recarregar ("Inscrito", "1 inscrito", "Gostei · 1") |
| Canais seguidos | Lista o canal seguido |
| Busca e categoria | Busca por título com acento e por nickname; filtro "Tecnologia" com os 3 vídeos certos |
| Canal próprio | Foto, contagem e "Editar canal" no lugar de "Inscrever-se" |
| Sair | Volta para `/login` |
| Recuperação de senha | E-mail no Mailpit; link antigo recusado (401) depois de pedir outro; tela "Criar nova senha" → "Senha redefinida"; senha antiga 401, nova 200 |
| Reenvio de confirmação, termos e privacidade | Páginas e rota do BFF respondem |
| Vídeo inexistente | 404 |

## Defeitos encontrados (corrigidos neste PR)

| # | Defeito | Evidência | Causa |
|---|---|---|---|
| 1 | **Thumbnails quebrados** na home, na página do canal, nas sugestões e em "Meus vídeos" | `01`, `02`, `06` | O `<Image>` do Next passa a URL assinada do storage pelo otimizador (`/_next/image`), que responde **400 `"url" parameter is not allowed`**: nenhuma origem remota está liberada, e o servidor do BFF nem alcança `localhost:9200`. No MSW os thumbnails são caminhos locais, por isso nenhum teste pegou. |
| 2 | **Duração invisível** nos cards (caixa preta vazia) | `01`, `06` | `color` e `background` do selo eram ambos `rgb(15,15,15)`: com `--color-overlay` e `--text-overlay` no tema, o Tailwind resolve `text-overlay` como **cor**. Regressão da Fase 07, quando `--color-overlay` entrou no `@theme` para o véu do menu lateral. |
| 3 | **"Mostrar mais" sem nada a mostrar** em descrição de uma linha | `03` | O botão aparece sempre que existe descrição, sem medir se o texto passa das duas linhas. |
| 4 | **Erros de login em inglês** ("Email address has not been confirmed", "Invalid email or password") | `04` | Os formulários de autenticação mostram a `message` crua da API. |
| 5 | **Navbar não atualiza a foto** depois do envio, só ao recarregar | `05` | O avatar da navbar já tinha registrado o 404 e a URL dele não muda; o `router.refresh()` não basta. |
| 6 | **"Voltar para o login" sem ação** em `/forgot-password` | — | O `IconButton` não tem link nem `onClick`. |
| 7 | **E-mails em inglês** (assunto e corpo da confirmação e da recuperação) numa plataforma em português | — | Templates Handlebars e assuntos em inglês. |

## Observações (sem correção)

- **Canal inexistente responde HTTP 200** (`obs-canal-inexistente.jpg`): a tela "Canal não encontrado" aparece certa, mas o status fica 200 porque a resposta já começou a ser transmitida (`loading.tsx`) quando o `notFound()` acontece — limitação do streaming do Next.
- **"Indisponível"** como rótulo de vídeo não listado é decisão registrada (video-channel-management/TD-02, revisão de 2026-08-08), não defeito.
- Responsividade não foi verificada nesta rodada (a extensão não redimensiona a janela); está coberta pelo `responsive-retrofit.e2e-spec.ts`.

## Evidências

Capturas desta pasta, nomeadas pelo número do defeito; `ok-*` são verificações bem-sucedidas e `obs-*` são observações. A captura do aviso de conta confirmada ficou de fora por mostrar dados de login pessoais preenchidos automaticamente pelo navegador.
