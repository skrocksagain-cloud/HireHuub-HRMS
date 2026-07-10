interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({
  size = "md",
  text = "Loading...",
  fullScreen = false,
}: LoaderProps) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
  };

  const loader = (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div
        className={`
          animate-spin
          rounded-full
          border-slate-200
          border-t-emerald-600
          ${sizes[size]}
        `}
      />

      <p className="text-sm text-slate-500">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        {loader}
      </div>
    );
  }

  return loader;
}