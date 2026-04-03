import React from "react";

/** Full-page shell: sidebar + main content area */
export interface AppShellProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {sidebar ? (
        <aside className="hidden w-64 flex-shrink-0 border-r border-neutral-200 bg-white md:flex md:flex-col">
          {sidebar}
        </aside>
      ) : null}
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

/** Centered, max-width constrained wrapper */
export interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const containerSizes: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function Container({
  children,
  className = "",
  size = "xl",
}: ContainerProps) {
  return (
    <div
      className={[
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        containerSizes[size],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Consistent page header with title and optional actions */
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
        {description ? (
          <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}

/** Top navigation bar */
export interface NavbarProps {
  logo?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Navbar({ logo, actions }: NavbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">{logo}</div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
