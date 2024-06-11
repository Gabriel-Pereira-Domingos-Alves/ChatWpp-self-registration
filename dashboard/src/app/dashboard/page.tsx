'use client'

import Sidebar from "@/components/page/sidebar"

export default function Dashboard() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <h1>Dashboard</h1>
    </div>
  )
}