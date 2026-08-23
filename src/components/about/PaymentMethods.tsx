import { Info } from "lucide-react";

import { paymentMethods, paymentNote } from "@/content/about";

// Custom SVG logo components in their authentic brand colors

function TetherLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.723-.03-1.923-.042v.002c-3.822-.16-6.69-1.22-6.69-2.497 0-1.277 2.868-2.338 6.69-2.497v2.897c.2.013.912.043 1.923.043 1.265 0 1.832-.03 1.942-.043v-2.897c3.822.16 6.69 1.22 6.69 2.497 0 1.277-2.868 2.338-6.69 2.497m0-5.837V8.5h4.86V5.5H9.218v3h4.86v3.046c-4.914.218-8.578 1.564-8.578 3.165 0 1.6 3.664 2.947 8.578 3.165V26.5h3.844V17.876c4.914-.218 8.578-1.564 8.578-3.165 0-1.6-3.664-2.947-8.578-3.165" fill="#FFF" />
    </svg>
  );
}

function PaypalLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.8 1.9H5.2c-.5 0-1 .4-1.1.9L1.6 19.3c-.1.5.3.9.8.9h3.7l1-6.5c0-.4.4-.7.9-.7h1.6c3.2 0 5.6-1.3 6.3-4.8.4-1.7.1-3.1-.7-4.1-.8-.9-2.2-1.3-4.4-1.3z" fill="#003087" />
      <path d="M12.4 5.9H7.6c-.4 0-.8.3-.9.7l-1.3 8.3c-.1.5.3.9.8.9h2.9l.9-5.7c.1-.4.4-.7.9-.7h1.2c2.7 0 4.7-1.1 5.3-4.1.3-1.4.1-2.6-.6-3.4-.6-.8-1.9-1.1-3.7-1.1z" fill="#0079C1" />
      <path d="M11.9 6.7c-.4 2-.9 2.9-2.5 2.9H6.9c-.3 0-.6.3-.7.6L5.3 16.1c0 .3.2.5.5.5h2.9c.4 0 .7-.3.8-.7l.9-5.7c.1-.4.4-.7.9-.7h.9c2.2 0 3.8-.9 4.3-3.3.3-1.2.1-2.1-.5-2.7-.4-.4-.9-.6-1.5-.7-.4.5-.8 1.4-1.1 2.3z" fill="#00457C" opacity="0.2" />
    </svg>
  );
}

function WesternUnionLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#FFCC00" />
      <path d="M5.5 7.5h3.2L10.3 14l1.6-6.5h2.8l1.6 6.5 1.6-6.5h3.2l-2.8 10h-3.2L13.5 11l-1.6 6.5H8.7L5.5 7.5z" fill="#000000" />
    </svg>
  );
}

function CardLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#141416" />
      <circle cx="14" cy="12" r="7" fill="#EB001B" />
      <circle cx="22" cy="12" r="7" fill="#F79E1B" />
      <path d="M18 6.7c1.3 1.3 2.1 3.1 2.1 5.3s-.8 4-2.1 5.3c-1.3-1.3-2.1-3.1-2.1-5.3s.8-4 2.1-5.3z" fill="#FF5F00" />
    </svg>
  );
}

function BankLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#0A2540" />
      <path d="M12 5.5L4 10.5v1.5h16v-1.5L12 5.5zm-6 8v5h2v-5H6zm4 0v5h2v-5h-2zm4 0v5h2v-5h-2zm4 0v5h2v-5h-2zm-14 6v1.5h16v-1.5H4z" fill="#F59E0B" />
    </svg>
  );
}

function BinanceLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.004 7.643l-4.36 4.36 4.36 4.363 4.36-4.363-4.36-4.36zm8.723 4.36l-2.181-2.183-2.18 2.183 2.18 2.181 2.181-2.181zM3.28 12.003l2.18-2.182-2.18-2.182-2.182 2.182 2.182 2.182zm8.724 5.45l-4.36-4.36-2.183 2.18 6.543 6.543 6.543-6.542-2.181-2.181-4.362 4.36zm0-10.903l4.362 4.36 2.181-2.181-6.543-6.543-6.543 6.543 2.183 2.181 4.36-4.36z" fill="#F3BA2F" />
    </svg>
  );
}

const logoMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "USDT Account": TetherLogo,
  "PayPal": PaypalLogo,
  "Western Union": WesternUnionLogo,
  "Debit / Credit Card": CardLogo,
  "Electronic Bank": BankLogo,
  "Binance": BinanceLogo,
};

export function PaymentMethods() {
  return (
    <div className="mt-6">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {paymentMethods.map((method) => {
          const LogoComponent = logoMap[method.label];
          const Icon = method.icon;

          return (
            <li key={method.label}>
              <div className="group flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-night-700 bg-night-900/70 px-4 py-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/60 hover:bg-night-900">
                {LogoComponent ? (
                  <LogoComponent className="size-12 shrink-0" />
                ) : (
                  <Icon className="size-12 shrink-0 text-white" aria-hidden />
                )}

                <span className="text-xs font-bold uppercase tracking-[0.1em] text-white sm:text-sm">
                  {method.label}
                </span>

                {method.note ? (
                  <span className="-mt-3 text-[0.7rem] uppercase tracking-wider text-night-500">
                    {method.note}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 flex gap-3 rounded-xl border border-brand-500/25 bg-brand-500/[0.07] px-4 py-4 text-sm leading-relaxed text-night-200">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden />
        <span>{paymentNote}</span>
      </p>
    </div>
  );
}
