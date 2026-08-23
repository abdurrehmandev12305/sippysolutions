/**
 * Copy for the alternating feature sections on `/services`.
 *
 * Kept separate from the `services` card grid in `./services.ts` — that array
 * feeds the home page + footer and is deliberately short. These are the long
 * form write-ups, in the order they appear down the page.
 */

export type ServiceFeature = {
  /** Anchor id, so other pages can deep-link to a single feature. */
  id: string;
  title: string;
  description: string;
  /** Keys the placeholder illustration in `ServiceIllustration`. */
  illustration:
    | "server"
    | "browser"
    | "shield"
    | "switch"
    | "monitoring"
    | "api";
};

export const serviceFeatures: ServiceFeature[] = [
  {
    id: "dedicated-server",
    title: "Dedicated Server",
    description:
      "Physical server virtual machine that is 100% in the customer's control. Powerful Dedicated Hosting with Full Root Access and Instant Provisioning. Faster, reliable SSD storage increases efficiency, offers tremendous performance boost. Quick Provisioning. 24x7 Support. 30-Day Money Back. Industry Best Prices. Locations: Germany, United States of America, and many more countries.",
    illustration: "server",
  },
  {
    id: "web-based",
    title: "Web Based",
    description:
      "Fully web-based, accessed by Admin, Customer, and vendor through any web browser locally, remotely, through a private network, cloud, or internet. A web-based application is any program accessed over a network connection using HTTP, rather than existing within a device's memory.",
    illustration: "browser",
  },
  {
    id: "ssl-certificate",
    title: "SSL Certificate",
    description:
      "An SSL certificate is a bit of code on your web server that provides security for online communications. SSL keeps internet connections secure and prevents criminals from reading or modifying information transferred between two systems. When you see a padlock icon next to the URL in the address bar, that means SSL protects the website you are visiting.",
    illustration: "shield",
  },
  {
    id: "class-4-5-switch",
    title: "Class 4/5 Switch",
    description:
      "Sippy Solution is scalable and reliable class 4/5 switch for VoIP carriers. A Class 4 softswitch routes large volumes of usually long-distance VoIP calls throughout multiple IP networks. In contrast, a Class 5 routes calls to the correct IP address, SIP address or a DID number of an end user.",
    illustration: "switch",
  },
  {
    id: "real-time-monitoring",
    title: "Real-Time Monitoring",
    description:
      "In VOIP business you need to monitor every second. Accurate information increases your business performance between customers and vendors. Real-time monitoring is the process of collecting and storing performance metrics for data as it traverses your network. It involves polling and streaming data from infrastructure devices so that you know how your networks, applications, and services are performing.",
    illustration: "monitoring",
  },
  {
    id: "xml-rpc-api-control",
    title: "XML-RPC API Control",
    description:
      "Customers can integrate management solutions, third-party technologies, and networking between different Sippy Solutions and SBC solutions.",
    illustration: "api",
  },
];
