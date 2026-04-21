export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="font-heading font-semibold text-4xl text-orange tracking-tight">
            calibrate.
          </span>
          <p className="text-muted text-sm mt-2 font-body">Sharpen your edge.</p>
        </div>

        {/* Card */}
        <div className="bg-navy rounded-2xl p-8 border border-[rgba(255,255,255,0.10)]">
          {children}
        </div>
      </div>
    </div>
  )
}
