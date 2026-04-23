export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <a href="/dashboard">Dashboard</a>
        <a href="/study">Study</a>
        <a href="/progress">Progress</a>
        <a href="/profile">Profile</a>
      </header>
      <main>{children}</main>
    </div>
  )
}
