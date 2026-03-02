import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[16px] bg-[#1C1207]/5 dark:bg-white/5",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
