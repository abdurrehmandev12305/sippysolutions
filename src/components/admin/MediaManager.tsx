"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type DragEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GripVertical,
  ImageIcon,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type { MediaItem } from "@/lib/media";

const ENDPOINT = "/api/admin/media";

/** Mirrors the server's allow-list in `src/lib/media.ts`. */
const ACCEPT = ".jpg,.jpeg,.png,.webp";

type Notice = { kind: "success" | "error"; text: string } | null;

type Reply = {
  ok?: boolean;
  media?: MediaItem[];
  errors?: string[];
};

export function MediaManager({ initialMedia }: { initialMedia: MediaItem[] }) {
  const router = useRouter();
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [notice, setNotice] = useState<Notice>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [confirmingFile, setConfirmingFile] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  /** Index of the tile currently being dragged, for the reorder affordance. */
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const busy = uploading || reordering || pendingFile !== null;

  /** Applies a server response: refresh local state and the RSC cache. */
  function apply(next: MediaItem[], text: string) {
    setMedia(next);
    setNotice({ kind: "success", text });
    // Keeps the server-rendered copy (and `/user-interface`) in step.
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

  /* ---- Upload ---------------------------------------------------------- */

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    setNotice(null);
    setConfirmingFile(null);

    const body = new FormData();
    for (const file of list) body.append("file", file);

    try {
      const response = await fetch(ENDPOINT, { method: "POST", body });
      const result: Reply & { uploaded?: MediaItem[] } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !result.ok || !result.media) {
        fail(result.errors, "Couldn't upload those files. Please try again.");
        return;
      }

      const added = result.uploaded?.length ?? 0;
      const skipped = result.errors ?? [];

      apply(
        result.media,
        `${added} ${added === 1 ? "file" : "files"} uploaded.${
          skipped.length > 0 ? ` ${skipped.join(" ")}` : ""
        }`,
      );

      // A partial success is still worth flagging as a problem.
      if (skipped.length > 0) {
        setNotice({
          kind: "error",
          text: `${added} uploaded, ${skipped.length} rejected. ${skipped.join(" ")}`,
        });
      }
    } catch {
      offline();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragOver(false);
    // Ignore a tile being dragged for reorder — those carry no files.
    if (event.dataTransfer.files.length > 0) void upload(event.dataTransfer.files);
  }

  /* ---- Delete ---------------------------------------------------------- */

  async function onDelete(item: MediaItem) {
    setPendingFile(item.file);
    setNotice(null);

    try {
      const response = await fetch(
        `${ENDPOINT}?file=${encodeURIComponent(item.file)}`,
        { method: "DELETE" },
      );

      const result: Reply = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.media) {
        fail(result.errors, "Couldn't delete that file. Please try again.");
        return;
      }

      apply(result.media, `“${item.file}” deleted.`);
    } catch {
      offline();
    } finally {
      setPendingFile(null);
      setConfirmingFile(null);
    }
  }

  /* ---- Reorder --------------------------------------------------------- */

  /** Optimistic: the grid moves now, the server confirms the new order after. */
  async function commitOrder(next: MediaItem[]) {
    const previous = media;
    setMedia(next);
    setReordering(true);
    setNotice(null);

    try {
      const response = await fetch(ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((item) => item.file) }),
      });

      const result: Reply = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok || !result.media) {
        setMedia(previous);
        fail(result.errors, "Couldn't save the new order. Please try again.");
        return;
      }

      apply(result.media, "Display order saved.");
    } catch {
      setMedia(previous);
      offline();
    } finally {
      setReordering(false);
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= media.length) return;

    const next = [...media];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void commitOrder(next);
  }

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
            User Interface Manager
          </h2>
          <p className="mt-1.5 text-sm text-night-300">
            {media.length} {media.length === 1 ? "item" : "items"} live on{" "}
            <a
              href="/user-interface"
              className="font-medium text-brand-400 hover:text-brand-300"
            >
              /user-interface
            </a>
            , in the order shown. Changes save straight to Supabase.
          </p>
        </div>
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

      {/* ---- Uploader ------------------------------------------------------ */}
      <label
        htmlFor={`${uid}-files`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragOver
            ? "border-brand-500 bg-brand-500/10"
            : "border-night-700 bg-[#0a0a0f] hover:border-brand-500/60",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        {uploading ? (
          <LoaderCircle className="size-8 animate-spin text-brand-400" aria-hidden />
        ) : (
          <Upload className="size-8 text-brand-400" aria-hidden />
        )}

        <span className="mt-4 text-sm font-semibold text-white">
          {uploading ? "Uploading…" : "Drop files here, or click to browse"}
        </span>

        <span className="mt-1.5 text-xs text-night-400">
          JPG, PNG or WebP up to 10 MB
        </span>

        <input
          ref={inputRef}
          id={`${uid}-files`}
          type="file"
          multiple
          accept={ACCEPT}
          disabled={uploading}
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
          }}
          className="sr-only"
        />
      </label>

      {/* ---- Media grid ---------------------------------------------------- */}
      {media.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-white/10 bg-[#0a0a0f] px-6 py-10 text-center text-sm text-night-300">
          No media yet. Upload a screenshot to fill the{" "}
          <strong className="text-white">/user-interface</strong> gallery.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item, index) => (
            <li
              key={item.file}
              draggable={!busy}
              onDragStart={(event) => {
                setDraggingIndex(index);
                event.dataTransfer.effectAllowed = "move";
                // Firefox refuses to start a drag without payload.
                event.dataTransfer.setData("text/plain", item.file);
              }}
              onDragEnd={() => setDraggingIndex(null)}
              onDragOver={(event) => {
                if (draggingIndex !== null) event.preventDefault();
              }}
              onDrop={(event) => {
                if (draggingIndex === null) return;
                event.preventDefault();
                event.stopPropagation();
                move(draggingIndex, index);
                setDraggingIndex(null);
              }}
              className={cn(
                "overflow-hidden rounded-2xl border bg-[#0a0a0f] transition-all",
                draggingIndex === index
                  ? "border-brand-500 opacity-50"
                  : "border-white/10 hover:border-white/20",
                !busy && "cursor-grab active:cursor-grabbing",
              )}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-night-900">
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top"
                />

                <span
                  aria-hidden
                  className="absolute left-3 top-3 grid size-7 place-items-center rounded-full bg-night-950/70 text-[0.65rem] font-bold tabular-nums text-night-100 backdrop-blur-sm"
                >
                  {index + 1}
                </span>

                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-night-950/75 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-night-100 backdrop-blur-sm">
                  <ImageIcon className="size-3" aria-hidden />
                  {item.type}
                </span>

                <GripVertical
                  className="absolute bottom-3 right-3 size-4 text-night-300/70"
                  aria-hidden
                />
              </div>

              <div className="p-4">
                <p
                  className="truncate text-sm font-semibold text-white"
                  title={item.file}
                >
                  {item.file}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  {/* Native drag isn't reachable from a keyboard — these are. */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => move(index, index - 1)}
                      disabled={busy || index === 0}
                      aria-label={`Move ${item.file} earlier`}
                      className="grid size-8 place-items-center rounded-lg border border-night-700 text-night-300 transition-colors hover:border-brand-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-night-700"
                    >
                      <ArrowLeft className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, index + 1)}
                      disabled={busy || index === media.length - 1}
                      aria-label={`Move ${item.file} later`}
                      className="grid size-8 place-items-center rounded-lg border border-night-700 text-night-300 transition-colors hover:border-brand-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-night-700"
                    >
                      <ArrowRight className="size-3.5" aria-hidden />
                    </button>
                  </div>

                  {confirmingFile === item.file ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={pendingFile === item.file}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingFile === item.file ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden />
                        )}
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingFile(null)}
                        className="inline-flex items-center rounded-full border border-night-600 px-3 py-1.5 text-xs font-semibold text-night-200 transition-colors hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingFile(item.file);
                        setNotice(null);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-night-600 px-3 py-1.5 text-xs font-semibold text-night-100 transition-colors hover:border-red-500/60 hover:text-red-300"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {media.length > 1 ? (
        <p className="mt-4 text-xs text-night-400">
          Drag a tile onto another to reorder, or use the arrows. The order here
          is the order visitors see.
        </p>
      ) : null}
    </section>
  );
}
