import { cn } from "@/lib/utils";

export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded-[5px] border border-black/10 bg-background px-1.5 font-mono text-[11px] font-medium text-muted-foreground shadow-[0_1px_0_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
