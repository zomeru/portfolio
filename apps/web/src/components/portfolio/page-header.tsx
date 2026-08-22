type PageHeaderProps = {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
};

export function PageHeader({ index, eyebrow, title }: PageHeaderProps) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {index} / {eyebrow}
      </p>
      <h1 className="mt-3 max-w-2xl text-balance text-base font-medium leading-snug tracking-tight sm:text-lg">
        {title}
      </h1>
    </div>
  );
}
