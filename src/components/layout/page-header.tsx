import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, description, className }: Props) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">{description}</p> : null}
    </div>
  );
}
