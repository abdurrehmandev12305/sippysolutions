import type { Block } from "@/content/about";

/** Renders the structured content blocks used inside the About accordions. */
export function RichText({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.kind === "paragraph") {
          return (
            <p key={index} className="text-sm leading-relaxed text-white sm:text-[0.95rem]">
              {block.text}
            </p>
          );
        }

        if (block.kind === "heading") {
          return (
            <h4
              key={index}
              className="text-sm font-bold uppercase tracking-[0.14em] text-white"
            >
              {block.text}
            </h4>
          );
        }

        return (
          <ol key={index} className="space-y-3">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-white/10 text-xs font-bold text-white">
                  {itemIndex + 1}
                </span>

                <div className="text-sm leading-relaxed text-white sm:text-[0.95rem]">
                  <span>{item.text}</span>

                  {item.sub ? (
                    <ul className="mt-2.5 space-y-2 border-l border-night-700 pl-4">
                      {item.sub.map((sub, subIndex) => (
                        <li key={subIndex} className="flex gap-2 text-white/80">
                          <span className="font-semibold text-brand-500">
                            {String.fromCharCode(97 + subIndex)})
                          </span>
                          <span>{sub}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}
