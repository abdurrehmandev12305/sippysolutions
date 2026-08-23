import {
  Banknote,
  Bitcoin,
  Coins,
  CreditCard,
  Landmark,
  Send,
  type LucideIcon,
} from "lucide-react";

import { site } from "@/lib/site";

/* -------------------------------------------------------------------------- */
/*  About intro                                                                */
/* -------------------------------------------------------------------------- */

export const aboutIntro = {
  label: "About Us",
  heading: "Sippy Solution",
  body: "Sippy Solution Software are easily scalable and designed to be modular. The Sippy Solution is composed of a session border controller (SBC) and a billing platform that you can whitelabel and resell. The most secure, scalable, flexible, and voice technology solutions delivered to global Mobile, MVNO, and Fixed Line Operators; Wholesalers, Call Centers, and Retail/Enterprise SIP solution providers. State-of-the-art technology allows for an overall better user experience over web.",
} as const;

/* -------------------------------------------------------------------------- */
/*  Rich-text blocks used inside the accordions                                */
/* -------------------------------------------------------------------------- */

export type ListItem = {
  text: string;
  /** Nested a) b) c) style sub-points. */
  sub?: string[];
};

export type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered?: boolean; items: ListItem[] };

export type AccordionItem = {
  id: string;
  title: string;
  blocks: Block[];
  /** Renders the payment-method grid after `blocks`. */
  showPaymentMethods?: boolean;
};

/* -------------------------------------------------------------------------- */
/*  Payment methods                                                            */
/* -------------------------------------------------------------------------- */

export type PaymentMethod = {
  label: string;
  note?: string;
  icon: LucideIcon;
};

export const paymentMethods: PaymentMethod[] = [
  { label: "USDT Account", note: "Tether", icon: Coins },
  { label: "PayPal", icon: Banknote },
  { label: "Western Union", icon: Send },
  { label: "Debit / Credit Card", icon: CreditCard },
  { label: "Electronic Bank", icon: Landmark },
  { label: "Binance", icon: Bitcoin },
];

/* -------------------------------------------------------------------------- */
/*  Accordions                                                                 */
/* -------------------------------------------------------------------------- */

export const aboutAccordions: AccordionItem[] = [
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    blocks: [
      {
        kind: "paragraph",
        text: "This privacy policy shows how Sippy Solution uses and protects any information you provide. Sippy Solution is committed to ensuring your privacy is protected. When we ask you to provide specific information by which you are identified, you can be assured it will only be used per this policy. This policy may change from time to time.",
      },
      { kind: "heading", text: "What We Collect" },
      {
        kind: "list",
        ordered: true,
        items: [
          { text: "Name" },
          { text: "Company Name and website" },
          {
            text: "Contact information including Email addresses, Phone numbers, WhatsApp, and Skype IDs",
          },
          {
            text: "Other information relevant to products and services — we may require Time Zone, root password of the server, username of server, IPMI and KVM access of server for installation.",
          },
        ],
      },
      { kind: "heading", text: "What We Do With This Information" },
      {
        kind: "list",
        ordered: true,
        items: [
          { text: "To understand your needs and provide better service" },
          {
            text: "To respond to your queries and manage our relationship with you, and for internal record keeping",
          },
          { text: "To improve our products and services" },
          {
            text: "To periodically send promotional emails about products, offers, or other information",
          },
          { text: "To contact you for market research purposes" },
        ],
      },
    ],
  },
  {
    id: "rent-a-server",
    title: "Rent a Server From Our Company",
    blocks: [
      {
        kind: "list",
        ordered: true,
        items: [
          {
            text: "If you rent a server on a per-month plan, it expires automatically after a month.",
          },
          {
            text: "After payment, you'll receive an email within 24 hours containing:",
            sub: [
              "Web Portal Username and password",
              "Linux server root password will NOT be delivered, because SSH access is blocked by firewall & due to our web portal source code security.",
            ],
          },
          {
            text: "Payment is non-refundable once received. We will only return payment if the server, web portal, desktop client, or mobile application is not working fine during that month (our technical team first checks and evaluates within 24 hours, and may replace the server or server location).",
          },
          {
            text: "For issues during the subscribed period, email support@sippysolution.com — within 24 hours our technical team will join you via Skype, TeamViewer, or any disk ID.",
          },
          {
            text: "During the whole month, our technical team will teach you how to configure the switch on the demo server. However, we do not provide configuration support on your live server (e.g. Rates Adding, Customer Adding, Vendor Adding, Routing Gateway, Mapping Gateway, or any Gateway support).",
          },
          {
            text: "To resubscribe, pay 24 hours prior to server expiry. If payment isn't received before expiry, the server will shut down and the database will be deleted.",
          },
          {
            text: "We don't allow any illegal activities on our hosted servers. In such a case we will terminate the server without further notice.",
          },
        ],
      },
    ],
  },
  {
    id: "payment-method",
    title: "Payment Method",
    showPaymentMethods: true,
    blocks: [
      { kind: "heading", text: "We Have Multiple Payment Methods Which Are:" },
    ],
  },
];

export const paymentNote = `Before making payment, every client needs to confirm our account details via our Skype ID (${site.skype}) or contact us via our support email (${site.email}).`;
