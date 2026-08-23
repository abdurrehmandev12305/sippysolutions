import { cn } from "@/lib/cn";

/**
 * Shared section header: optional small uppercase label, a heading with an
 * accent underline, and optional supporting text.
 */
export function SectionHeading({
  label,
  title,
  description,
  align = "center",
  className,
}: {
  label?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col",
        centered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {label ? (
        <span className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
          {label}
        </span>
      ) : null}

      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>

      <span
        aria-hidden
        className="mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-300"
      />

      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-balance text-base leading-relaxed text-night-300",
            centered && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
