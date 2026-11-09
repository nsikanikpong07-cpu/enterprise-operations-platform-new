import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export type WorkspaceIconName =
  | "overview"
  | "organization"
  | "staff"
  | "roles"
  | "catalog"
  | "suppliers"
  | "procurement"
  | "audit"
  | "department"
  | "location"
  | "sidebar";

interface WorkspaceIconProps extends IconProps {
  name: WorkspaceIconName;
}

/**
 * Shared icons for the IMPRESSOR workspace.
 * Use the same name wherever the same meaning appears.
 */
export function WorkspaceIcon({ name, ...props }: WorkspaceIconProps) {
  const common: IconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );

    case "organization":
      return (
        <svg {...common}>
          <path d="M4 21V6l8-3v18" />
          <path d="M12 10h7v11M2 21h20" />
          <path d="M7 8h1M7 11h1M7 14h1M7 17h1" />
          <path d="M15 13h1M15 16h1M15 19h1" />
        </svg>
      );

    case "staff":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M17 14a4.5 4.5 0 0 1 3.5 4.4V20" />
        </svg>
      );

    case "roles":
      return (
        <svg {...common}>
          <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
          <circle cx="12" cy="10" r="1.5" />
          <path d="M12 11.5V15" />
        </svg>
      );

    case "catalog":
      return (
        <svg {...common}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 16 9 5 9-5" />
        </svg>
      );

    case "suppliers":
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </svg>
      );

    case "procurement":
      return (
        <svg {...common}>
          <path d="M3 4h2l2 11h10l3-8H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="17" cy="20" r="1" />
        </svg>
      );

    case "audit":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h6" />
        </svg>
      );

    case "department":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="12" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M12 7v5M5 17v-3h14v3M12 12v5" />
        </svg>
      );

    case "location":
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "sidebar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M9 4v16" />
        </svg>
      );
  }
}
