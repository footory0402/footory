interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-[10px] border border-border bg-card ${className}`}>
      {children}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon?: string;
  onEdit?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, onEdit, children, className = "" }: SectionCardProps) {
  return (
    <div className={`rounded-[10px] border border-border bg-card ${className}`}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-3">
          {icon && <span className="mr-1">{icon}</span>}
          {title}
        </span>
        {onEdit && (
          <button onClick={onEdit} className="text-text-3 transition-colors hover:text-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}
