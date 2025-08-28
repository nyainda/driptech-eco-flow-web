
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  centered?: boolean;
  className?: string;
}

export const SectionHeader = ({ 
  title, 
  subtitle, 
  description, 
  centered = true,
  className = "" 
}: SectionHeaderProps) => {
  return (
    <div className={`mb-16 ${centered ? 'text-center' : ''} ${className}`}>
      {subtitle && (
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
          {subtitle}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl font-bold mb-4">
        {title}
      </h2>
      {description && (
        <p className={`text-xl text-muted-foreground ${centered ? 'max-w-2xl mx-auto' : ''}`}>
          {description}
        </p>
      )}
    </div>
  );
};
