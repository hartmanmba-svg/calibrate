export default function CheckoutSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center max-w-md mx-auto">

      {/* Green checkmark */}
      <div className="w-16 h-16 rounded-full bg-green/10 border border-green/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl text-white">You&apos;re all set!</h1>
        <p className="font-body text-sm text-muted">
          Your subscription is now active. It may take a moment to reflect.
        </p>
      </div>

      {/* CTA */}
      <a
        href="/study"
        className="font-heading text-sm px-8 py-3 rounded-xl bg-orange hover:bg-orange/90 text-white transition"
      >
        Start studying
      </a>

    </div>
  )
}
