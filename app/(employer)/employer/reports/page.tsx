export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <p className="font-heading text-2xl text-white">Reports</p>
      <p className="font-body text-sm text-muted max-w-sm">
        Detailed reporting and analytics are coming soon. Check back after your team has accumulated review data.
      </p>
      <a
        href="/employer/dashboard"
        className="font-body text-sm text-orange hover:underline"
      >
        Back to dashboard
      </a>
    </div>
  )
}
