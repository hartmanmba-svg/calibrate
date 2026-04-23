import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/study">Study</Link>
        <Link href="/progress">Progress</Link>
        <Link href="/profile">Profile</Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
