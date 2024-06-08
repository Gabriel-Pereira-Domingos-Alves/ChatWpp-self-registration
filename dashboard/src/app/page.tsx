'use client'

import Sidebar from "@/components/page/sidebar"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import axios from "axios"
import { useEffect } from "react"

export default function Home() {

  useEffect(() => {
    axios.get('/api/clients').then(res => console.log(res.data))
  }, [])
  
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Users</h1>
        <Button className="ml-auto" size="sm">
          Add user
        </Button>
      </div>
      <div className="border shadow-sm rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">John Doe</TableCell>
              <TableCell className="text-green-500">Logged In</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Generate QR
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Jane Smith</TableCell>
              <TableCell className="text-green-500">Logged In</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Generate QR
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Bob Johnson</TableCell>
              <TableCell className="text-red-500">Logged Out</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Generate QR
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Alice Williams</TableCell>
              <TableCell className="text-yellow-500">Generating QR Code</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Generate QR
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </main>
  </div>
  )
}