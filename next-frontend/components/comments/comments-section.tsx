"use client"

import * as React from "react"

import { CommentItem } from "@/components/comments/comment-item"
import { CommentList } from "@/components/comments/comment-list"
import { CommentReactions } from "@/components/comments/comment-reactions"
import { CommentReply } from "@/components/comments/comment-reply"
import { CommentThread } from "@/components/comments/comment-thread"
import { CommentsLoadMore } from "@/components/comments/comments-load-more"
import { NewCommentForm } from "@/components/comments/new-comment-form"
import { RepliesLoadMore } from "@/components/comments/replies-load-more"
import { ReplyButton } from "@/components/comments/reply-button"
import { ReplyList } from "@/components/comments/reply-list"
import type {
  Comment,
  CommentsPage,
  CommentThread as Thread,
} from "@/lib/api/contracts"
import { formatCount } from "@/lib/format"
import { sendMutation, type MutationOutcome } from "@/lib/social/mutation"

type PendingComment = { body: string; parentId: string | null; tempId: string }

// Item otimista: o comentário recém-enviado entra no topo — a ordenação "mais
// recentes primeiro" (social-interactions/TD-05) torna essa posição correta
// sem mecanismo extra. Resposta entra no topo da lista da thread.
function withPending(threads: Thread[], pending: PendingComment): Thread[] {
  const draft = {
    id: pending.tempId,
    parentId: pending.parentId,
    body: pending.body,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    viewerReaction: null,
    author: { name: "", nickname: "" },
  } satisfies Comment

  if (pending.parentId === null) {
    return [{ ...draft, replies: [], repliesCount: 0 }, ...threads]
  }
  return threads.map((thread) =>
    thread.id === pending.parentId
      ? {
          ...thread,
          replies: [draft, ...thread.replies],
          repliesCount: thread.repliesCount + 1,
        }
      : thread
  )
}

function commentsLabel(count: number): string {
  return count === 1 ? "1 comentário" : `${formatCount(count)} comentários`
}

type CommentsSectionProps = {
  publicId: string
  /** Primeira página, lida no render do Server Component; `null` se falhou. */
  initialPage: CommentsPage | null
  commentsCount: number
  isAuthenticated: boolean
  viewerName?: string
}

/**
 * Seção de comentários da watch page (Figma `comments-section` 77:125): dona
 * da lista de threads, das páginas carregadas e do estado otimista de novos
 * comentários e respostas (social-interactions/TD-05 e TD-08).
 */
function CommentsSection({
  publicId,
  initialPage,
  commentsCount,
  isAuthenticated,
  viewerName,
}: CommentsSectionProps) {
  const [threads, setThreads] = React.useState<Thread[]>(
    initialPage?.items ?? []
  )
  const [total, setTotal] = React.useState(initialPage?.total ?? 0)
  const [count, setCount] = React.useState(commentsCount)
  const [replyOpenFor, setReplyOpenFor] = React.useState<string | null>(null)
  const [optimisticThreads, addPending] = React.useOptimistic(
    threads,
    withPending
  )
  const [, startTransition] = React.useTransition()

  const submitComment = React.useCallback(
    (
      body: string,
      parentId: string | null
    ): Promise<MutationOutcome<Comment>> =>
      new Promise((resolve) => {
        startTransition(async () => {
          addPending({ body, parentId, tempId: `pending-${Date.now()}` })
          const outcome = await sendMutation<Comment>(
            `/api/videos/${encodeURIComponent(publicId)}/comments`,
            "POST",
            parentId === null ? { body } : { body, parentId }
          )
          if (outcome.ok) {
            const created = outcome.data
            // Depois do await, nova transição: o item real substitui o
            // otimista num render só.
            startTransition(() => {
              setThreads((current) =>
                created.parentId === null
                  ? [{ ...created, replies: [], repliesCount: 0 }, ...current]
                  : current.map((thread) =>
                      thread.id === created.parentId
                        ? {
                            ...thread,
                            replies: [created, ...thread.replies],
                            repliesCount: thread.repliesCount + 1,
                          }
                        : thread
                    )
              )
              if (created.parentId === null) setTotal((t) => t + 1)
              setCount((c) => c + 1)
              if (created.parentId !== null) setReplyOpenFor(null)
            })
          }
          resolve(outcome)
        })
      }),
    [addPending, publicId]
  )

  function appendThreads(next: Thread[]) {
    setThreads((current) => [...current, ...next])
  }

  function appendReplies(rootId: string, next: Comment[]) {
    setThreads((current) =>
      current.map((thread) =>
        thread.id === rootId
          ? { ...thread, replies: [...thread.replies, ...next] }
          : thread
      )
    )
  }

  function renderActions(comment: Comment, rootId: string) {
    const pending = comment.id.startsWith("pending-")
    if (pending) {
      return (
        <span className="text-caption text-muted-foreground">Enviando…</span>
      )
    }
    const composerId = `reply-composer-${rootId}`
    return (
      <>
        <CommentReactions
          commentId={comment.id}
          initialReaction={comment.viewerReaction}
          initialLikesCount={comment.likesCount}
          isAuthenticated={isAuthenticated}
        />
        {/* Responder a uma resposta abre o compositor da mesma raiz: a nova
            resposta é irmã, nunca neta (social-interactions/TD-04). */}
        <ReplyButton
          expanded={replyOpenFor === rootId}
          controls={composerId}
          onToggle={(open) => setReplyOpenFor(open ? rootId : null)}
        />
      </>
    )
  }

  return (
    <section
      data-slot="comments-section"
      aria-labelledby="comments-heading"
      className="flex flex-col gap-5"
    >
      <div className="flex items-baseline gap-3">
        <h2 id="comments-heading" className="text-h3 text-foreground">
          {commentsLabel(count)}
        </h2>
        <span className="text-caption text-muted-foreground">
          Mais recentes primeiro
        </span>
      </div>

      <NewCommentForm
        onSubmit={(body) => submitComment(body, null)}
        isAuthenticated={isAuthenticated}
        viewerName={viewerName}
      />

      {initialPage === null ? (
        <p
          role="alert"
          data-slot="comments-error"
          className="text-body-md text-muted-foreground"
        >
          Não foi possível carregar os comentários.
        </p>
      ) : optimisticThreads.length === 0 ? (
        <p
          data-slot="comments-empty"
          className="text-body-md text-muted-foreground"
        >
          Nenhum comentário ainda. Seja o primeiro a comentar.
        </p>
      ) : (
        <CommentList>
          {optimisticThreads.map((thread) => (
            <CommentThread
              key={thread.id}
              aria-busy={thread.id.startsWith("pending-") || undefined}
              className={
                thread.id.startsWith("pending-") ? "opacity-60" : undefined
              }
              root={
                <CommentItem
                  authorName={thread.author.name || viewerName || ""}
                  createdAt={thread.createdAt}
                  body={thread.body}
                  actions={renderActions(thread, thread.id)}
                />
              }
              replies={
                thread.replies.length > 0 || thread.repliesCount > 0 ? (
                  <ReplyList
                    loadMore={
                      <RepliesLoadMore
                        commentId={thread.id}
                        loaded={thread.replies.length}
                        total={thread.repliesCount}
                        onLoaded={(next) => appendReplies(thread.id, next)}
                      />
                    }
                  >
                    {thread.replies.map((reply) => (
                      <CommentReply
                        key={reply.id}
                        authorName={reply.author.name || viewerName || ""}
                        createdAt={reply.createdAt}
                        body={reply.body}
                        actions={renderActions(reply, thread.id)}
                      />
                    ))}
                  </ReplyList>
                ) : undefined
              }
              composer={
                replyOpenFor === thread.id ? (
                  <NewCommentForm
                    id={`reply-composer-${thread.id}`}
                    mode="reply"
                    autoFocus
                    className="ml-12"
                    onSubmit={(body) => submitComment(body, thread.id)}
                    isAuthenticated={isAuthenticated}
                    viewerName={viewerName}
                  />
                ) : undefined
              }
            />
          ))}
        </CommentList>
      )}

      <CommentsLoadMore
        publicId={publicId}
        loaded={threads.length}
        total={total}
        onLoaded={appendThreads}
      />
    </section>
  )
}

export { CommentsSection }
