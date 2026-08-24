"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type { Post } from "@/lib/news";

const ENDPOINT = "/api/admin/news";
const UPLOAD_ENDPOINT = "/api/admin/news/upload";

/** Mirrors the server's allow-list in `src/lib/news.ts`. */
const ACCEPT = ".jpg,.jpeg,.png,.webp";

const field =
  "w-full rounded-xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-night-400 transition-colors hover:border-night-600 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60";

const label =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-night-300";

/** A post being edited. `publishedAt` stays `YYYY-MM-DD` so it binds to a date input. */
type Draft = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  publishedAt: string;
};

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Mirrors `slugify` in `src/lib/news.ts` — this side only needs it for the live preview as the admin types. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function blankDraft(): Draft {
  return {
    id: null,
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    publishedAt: todayInputValue(),
  };
}

function toDraft(post: Post): Draft {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt.slice(0, 10),
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Notice = { kind: "success" | "error"; text: string } | null;

export function NewsManager({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter();
  const uid = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [draft, setDraft] = useState<Draft | null>(null);
  // Once the admin hand-edits the slug, title changes stop overwriting it.
  const [slugEdited, setSlugEdited] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const editing = draft?.id != null;

  /** Applies a server response: refresh local state and the RSC cache. */
  function applyPosts(next: Post[], text: string) {
    setPosts(next);
    setNotice({ kind: "success", text });
    // Keeps the server-rendered copy (and `/news`) in step with the edit.
    router.refresh();
  }

  function fail(errors: string[] | undefined, fallback: string) {
    setNotice({ kind: "error", text: errors?.join(" ") ?? fallback });
  }

  function offline() {
    setNotice({
      kind: "error",
      text: "Network error. Check your connection and try again.",
    });
  }

  /* ---- Cover image upload ---------------------------------------------- */

  async function onUploadCover(file: File) {
    setUploading(true);
    setNotice(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch(UPLOAD_ENDPOINT, { method: "POST", body });
      const result: { ok?: boolean; url?: string; errors?: string[] } =
        await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.url) {
        fail(result.errors, "Couldn't upload that image. Please try again.");
        return;
      }

      const url = result.url;
      setDraft((current) => (current ? { ...current, coverImageUrl: url } : current));
    } catch {
      offline();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ---- Save / delete ----------------------------------------------------- */

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    setSaving(true);
    setNotice(null);

    const payload = {
      ...(draft.id ? { id: draft.id } : {}),
      title: draft.title,
      slug: draft.slug,
      excerpt: draft.excerpt,
      content: draft.content,
      coverImageUrl: draft.coverImageUrl,
      publishedAt: draft.publishedAt,
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: { ok?: boolean; posts?: Post[]; errors?: string[] } =
        await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.posts) {
        fail(result.errors, "Couldn't save that post. Please try again.");
        return;
      }

      applyPosts(
        result.posts,
        draft.id ? "Post updated." : `“${draft.title}” published.`,
      );
      setDraft(null);
    } catch {
      offline();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(post: Post) {
    setPendingId(post.id);
    setNotice(null);

    try {
      const response = await fetch(
        `${ENDPOINT}?id=${encodeURIComponent(post.id)}`,
        { method: "DELETE" },
      );

      const result: { ok?: boolean; posts?: Post[]; errors?: string[] } =
        await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.posts) {
        fail(result.errors, "Couldn't delete that post. Please try again.");
        return;
      }

      applyPosts(result.posts, `“${post.title}” deleted.`);
      // Drop the editor if it was open on the post that just vanished.
      if (draft?.id === post.id) setDraft(null);
    } catch {
      offline();
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
            News Manager
          </h2>
          <p className="mt-1.5 text-sm text-night-300">
            {posts.length} {posts.length === 1 ? "post" : "posts"} live on{" "}
            <a
              href="/news"
              className="font-medium text-brand-400 hover:text-brand-300"
            >
              /news
            </a>
            . Changes save straight to Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDraft(blankDraft());
            setSlugEdited(false);
            setNotice(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0"
        >
          <Plus className="size-4" aria-hidden />
          New post
        </button>
      </header>

      {notice ? (
        <p
          role="status"
          className={cn(
            "mt-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            notice.kind === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200",
          )}
        >
          {notice.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {notice.text}
        </p>
      ) : null}

      {/* ---- Editor -------------------------------------------------------- */}
      {draft ? (
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-brand-500/30 bg-[#0a0a0f] p-6 shadow-card sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white">
              {editing ? "Edit post" : "New post"}
            </h3>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="grid size-9 place-items-center rounded-lg border border-night-700 text-night-300 transition-colors hover:border-night-500 hover:text-white"
              aria-label="Close editor"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-title`} className={label}>
                Title
              </label>
              <input
                id={`${uid}-title`}
                value={draft.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          title,
                          slug: slugEdited ? current.slug : slugify(title),
                        }
                      : current,
                  );
                }}
                placeholder="Sippy Solution launches a new POP in Frankfurt"
                required
                className={field}
              />
            </div>

            <div>
              <label htmlFor={`${uid}-slug`} className={label}>
                Slug <span className="normal-case">(the /news/… URL)</span>
              </label>
              <input
                id={`${uid}-slug`}
                value={draft.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setDraft({ ...draft, slug: slugify(event.target.value) });
                }}
                placeholder="new-frankfurt-pop"
                required
                className={field}
              />
            </div>

            <div>
              <label htmlFor={`${uid}-date`} className={label}>
                Published date
              </label>
              <input
                id={`${uid}-date`}
                type="date"
                value={draft.publishedAt}
                onChange={(event) =>
                  setDraft({ ...draft, publishedAt: event.target.value })
                }
                required
                className={field}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-excerpt`} className={label}>
                Excerpt <span className="normal-case">(shown on the /news grid)</span>
              </label>
              <textarea
                id={`${uid}-excerpt`}
                value={draft.excerpt}
                onChange={(event) =>
                  setDraft({ ...draft, excerpt: event.target.value })
                }
                placeholder="A short summary, a sentence or two."
                rows={2}
                className={cn(field, "resize-y")}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={`${uid}-content`} className={label}>
                Content{" "}
                <span className="normal-case">
                  (plain text — leave a blank line between paragraphs)
                </span>
              </label>
              <textarea
                id={`${uid}-content`}
                value={draft.content}
                onChange={(event) =>
                  setDraft({ ...draft, content: event.target.value })
                }
                placeholder={"First paragraph.\n\nSecond paragraph."}
                rows={10}
                className={cn(field, "resize-y font-mono text-[0.8rem] leading-relaxed")}
              />
            </div>

            <div className="sm:col-span-2">
              <span className={label}>Cover image</span>

              {draft.coverImageUrl ? (
                <div className="flex items-center gap-4 rounded-xl border border-night-700 bg-night-900/70 p-4">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-night-900">
                    <Image
                      src={draft.coverImageUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-xs text-night-300">
                    {draft.coverImageUrl}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, coverImageUrl: "" })}
                    className="grid size-9 shrink-0 place-items-center rounded-lg border border-night-700 text-night-300 transition-colors hover:border-red-500/60 hover:text-red-300"
                    aria-label="Remove cover image"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`${uid}-cover`}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-night-700 px-6 py-8 text-center transition-colors hover:border-brand-500/60",
                    uploading && "pointer-events-none opacity-60",
                  )}
                >
                  {uploading ? (
                    <LoaderCircle className="size-6 animate-spin text-brand-400" aria-hidden />
                  ) : (
                    <Upload className="size-6 text-brand-400" aria-hidden />
                  )}
                  <span className="mt-3 text-sm font-semibold text-white">
                    {uploading ? "Uploading…" : "Click to upload a cover image"}
                  </span>
                  <span className="mt-1 text-xs text-night-400">
                    JPG, PNG or WebP up to 10 MB
                  </span>

                  <input
                    ref={fileInputRef}
                    id={`${uid}-cover`}
                    type="file"
                    accept={ACCEPT}
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void onUploadCover(file);
                    }}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden />
                  {editing ? "Save changes" : "Publish post"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setDraft(null)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-night-600 px-7 py-3 text-sm font-semibold text-night-100 transition-colors hover:border-night-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* ---- Post list ------------------------------------------------------ */}
      <div className="mt-8 space-y-3">
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0a0a0f] px-6 py-10 text-center text-sm text-night-300">
            No posts yet. Use <strong className="text-white">New post</strong> to
            publish the first one.
          </p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className={cn(
                "rounded-2xl border bg-[#0a0a0f] p-5 transition-colors sm:p-6",
                draft?.id === post.id
                  ? "border-brand-500/60"
                  : "border-white/10 hover:border-white/20",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-night-900">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <Newspaper
                        className="absolute inset-0 m-auto size-5 text-night-600"
                        aria-hidden
                      />
                    )}
                  </span>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white">{post.title}</h3>

                    <p className="mt-1 text-sm font-semibold text-brand-400">
                      {formatDate(post.publishedAt)}
                      <a
                        href={`/news/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 font-medium text-night-400 hover:text-white"
                      >
                        /news/{post.slug}
                      </a>
                    </p>

                    {post.excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm text-night-300">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(toDraft(post));
                      setSlugEdited(true);
                      setConfirmingId(null);
                      setNotice(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-night-600 px-4 py-2 text-xs font-semibold text-night-100 transition-colors hover:border-brand-500 hover:text-white"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </button>

                  {confirmingId === post.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onDelete(post)}
                        disabled={pendingId === post.id}
                        className="inline-flex items-center gap-2 rounded-full bg-red-500/90 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingId === post.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden />
                        )}
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="inline-flex items-center rounded-full border border-night-600 px-4 py-2 text-xs font-semibold text-night-200 transition-colors hover:text-white"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(post.id);
                        setNotice(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-night-600 px-4 py-2 text-xs font-semibold text-night-100 transition-colors hover:border-red-500/60 hover:text-red-300"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
