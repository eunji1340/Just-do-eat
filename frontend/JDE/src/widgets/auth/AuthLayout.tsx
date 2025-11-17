interface AuthLayoutProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  alignTop?: boolean;
  topPadding?: number;
}

export default function AuthLayout({
  title,
  children,
  footer,
  alignTop,
  topPadding = 40,
}: AuthLayoutProps) {
  return (
    <div
      className={`min-h-screen flex ${
        // h-screen을 min-h-screen으로 변경
        alignTop ? "items-start" : "items-center"
      } justify-center bg-[var(--color-bg)] overflow-y-auto`} // overflow-y-auto 추가
    >
      <div
        className="max-w-xl mx-auto p-5 grid gap-5 w-full min-w-0 overflow-visible"
        style={
          alignTop
            ? {
                marginTop: `${topPadding}px`,
              }
            : undefined
        }
      >
        {title && (
          <h2 className="m-0 text-2xl font-bold text-center text-[var(--color-fg)]">
            {title}
          </h2>
        )}
        {children}
        {footer && <div className="w-full">{footer}</div>}
      </div>
    </div>
  );
}
