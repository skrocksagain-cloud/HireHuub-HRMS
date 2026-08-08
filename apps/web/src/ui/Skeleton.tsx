export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'table';
}

export default function Skeleton({ className = '', variant = 'text' }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-slate-200/80 rounded-xl';

  if (variant === 'circle') {
    return <div className={`${baseClass} rounded-full h-10 w-10 ${className}`} />;
  }

  if (variant === 'card') {
    return <div className={`${baseClass} h-32 w-full rounded-2xl ${className}`} />;
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3 w-full">
        <div className={`${baseClass} h-10 w-full`} />
        <div className={`${baseClass} h-8 w-full`} />
        <div className={`${baseClass} h-8 w-full`} />
      </div>
    );
  }

  return <div className={`${baseClass} h-4 w-full ${className}`} />;
}
