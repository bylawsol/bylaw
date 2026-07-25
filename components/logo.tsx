import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWord = true,
}: {
  className?: string;
  showWord?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Bylaw"
        width={32}
        height={32}
        className="size-8 shrink-0"
      />
      {showWord && (
        <span className="text-lg font-semibold tracking-tight">Bylaw</span>
      )}
    </span>
  );
}
