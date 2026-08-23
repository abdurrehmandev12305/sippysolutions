import {
  Activity,
  Code2,
  Globe,
  Headset,
  Network,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  HardDrive,
  type LucideIcon,
} from "lucide-react";

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const services: Service[] = [
  {
    title: "Dedicated Server",
    description:
      "Physical server virtual machine that is 100% in the customer's control. Location: Germany, USA, and many more.",
    icon: Server,
  },
  {
    title: "Web Based",
    description:
      "Fully web-based, accessed by Admin, Customer, and vendor through any web browser locally, remotely, through a private network, cloud, or internet.",
    icon: Globe,
  },
  {
    title: "SSL Certificate",
    description:
      "An SSL certificate is a bit of code on your web server that provides security for online communications.",
    icon: ShieldCheck,
  },
  {
    title: "Real-Time Monitoring",
    description:
      "In VOIP business you need to monitor every second. Accurate information increases your business performance between customers and vendors.",
    icon: Activity,
  },
  {
    title: "XML-RPC API Control",
    description:
      "Customers can integrate management solutions, third-party technologies, and networking between different Sippy Solutions and SBC solutions.",
    icon: Code2,
  },
  {
    title: "Class 4/5 Switch",
    description:
      "Sippy Solution is scalable and reliable class 4/5 switch for VoIP carriers.",
    icon: Network,
  },
];

export type Advantage = {
  /** Placeholder copy — swap once the final "Why We Are?" wording is supplied. */
  title: string;
  description: string;
  icon: LucideIcon;
};

export const advantages: Advantage[] = [
  {
    title: "24/7 Support",
    description: "Placeholder text — replace with final copy.",
    icon: Headset,
  },
  {
    title: "Easy Configuration",
    description: "Placeholder text — replace with final copy.",
    icon: SlidersHorizontal,
  },
  {
    title: "Expert Team",
    description: "Placeholder text — replace with final copy.",
    icon: Users,
  },
  {
    title: "Dedicated Servers",
    description: "Placeholder text — replace with final copy.",
    icon: HardDrive,
  },
];
