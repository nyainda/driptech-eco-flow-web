import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEOHead from "@/components/common/SEOHead";
import { SITE_COMPANY } from "@/config/company";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <SEOHead
        title={`404 - Page Not Found | ${SITE_COMPANY.name}`}
        description={`The page you requested could not be found. Browse irrigation kits, driplines, sprinklers and farm equipment from ${SITE_COMPANY.name}.`}
        url={`${SITE_COMPANY.url}${location.pathname}`}
        noindex
      />
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <Link to="/" className="dt-btn-primary inline-flex">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
