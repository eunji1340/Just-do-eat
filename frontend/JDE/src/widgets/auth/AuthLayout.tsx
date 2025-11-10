interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="max-w-xl mx-auto p-5 grid gap-5 w-full">
        <h2 className="m-0 text-2xl font-bold text-center text-[var(--color-fg)]">
          {title}
        </h2>
        {children}
        {footer && (
          <div className="text-center text-sm text-[var(--color-muted)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

