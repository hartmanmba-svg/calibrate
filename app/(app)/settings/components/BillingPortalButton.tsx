'use client'

export function BillingPortalButton() {
  async function handleClick() {
    const res = await fetch('/api/billing-portal', { method: 'POST' })
    if (res.redirected) {
      window.location.href = res.url
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="self-start font-heading text-sm px-5 py-2 rounded-xl bg-teal/10 border border-teal/30 text-teal hover:bg-teal/20 transition"
    >
      Manage subscription
    </button>
  )
}
