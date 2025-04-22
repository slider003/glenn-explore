import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/utils/utils";

export function Breadcrumb({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    return (
        <nav
            aria-label="breadcrumb"
            className={cn("flex items-center text-sm text-muted-foreground", className)}
            {...props}
        >
            <ol className="flex items-center gap-2">{children}</ol>
        </nav>
    );
}

interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
    active?: boolean;
}

export function BreadcrumbItem({
    children,
    active,
    className,
    ...props
}: BreadcrumbItemProps) {
    return (
        <li
            className={cn("flex items-center gap-2", className)}
            aria-current={active ? "page" : undefined}
            {...props}
        >
            {children}
            {!active && <ChevronRight className="h-4 w-4" />}
        </li>
    );
}

interface BreadcrumbLinkProps extends React.ComponentProps<typeof Link> {
    asChild?: boolean;
}

export function BreadcrumbLink({
    asChild = false,
    className,
    children,
    ...props
}: BreadcrumbLinkProps) {
    if (asChild) {
        return children;
    }

    return (
        <Link
            className={cn("hover:text-foreground transition-colors", className)}
            {...props}
        >
            {children}
        </Link>
    );
}
