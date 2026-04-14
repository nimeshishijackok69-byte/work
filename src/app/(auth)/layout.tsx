export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(180deg,_#f8faff_0%,_#eef2ff_45%,_#ffffff_100%)] px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_transparent_60%)]" />
      <div className="relative z-10 w-full max-w-6xl">{children}</div>
    </div>
  )
}
