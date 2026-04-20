import React from "react";

interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  title,
  subtitle,
  align = "center",
  className = "",
}) => {
  const alignClass = align === "left" ? "text-left items-start" : "text-center items-center";

  return (
    <div className={`flex flex-col gap-3 mb-10 sm:mb-14 ${alignClass} ${className}`}>
      {label && (
        <span className="dt-section-label">{label}</span>
      )}
      <h2 className="dt-section-title">{title}</h2>
      {subtitle && (
        <p className={`dt-section-subtitle ${align === "center" ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
