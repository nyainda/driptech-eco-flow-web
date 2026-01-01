import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
    className?: string;
}

const Breadcrumbs = ({ className }: BreadcrumbsProps) => {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter((x) => x);

    if (pathnames.length === 0) return null;

    // Generate schema data for GEO
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.dripstech.co.ke"
            },
            ...pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
                const displayName = name
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                return {
                    "@type": "ListItem",
                    "position": index + 2,
                    "name": displayName,
                    "item": `https://www.dripstech.co.ke${routeTo}`
                };
            })
        ]
    };

    return (
        <nav className={`flex items-center space-x-2 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 py-4 ${className}`}>
            <script type="application/ld+json">
                {JSON.stringify(schemaData)}
            </script>

            <Link
                to="/"
                className="flex items-center hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
                <Home className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Home</span>
            </Link>

            {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
                const isLast = index === pathnames.length - 1;
                const displayName = name
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                return (
                    <React.Fragment key={name}>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                        {isLast ? (
                            <span className="text-slate-900 dark:text-white font-bold truncate max-w-[150px] sm:max-w-none">
                                {displayName}
                            </span>
                        ) : (
                            <Link
                                to={routeTo}
                                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors capitalize"
                            >
                                {displayName}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
