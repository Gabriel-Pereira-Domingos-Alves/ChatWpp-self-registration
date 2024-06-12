'use client'

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/page/sidebar'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu'
import axios from 'axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Message {
  id: string;
  createdAt: string;
  clientId: string;
  phoneNumber: string;
  message: string;
  contactName: string;
}

const Dashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    // Fetch messages data from API
    axios.get('/api/messages').then((res) => {
      if (res.data && Array.isArray(res.data.messages)) {
        setMessages(res.data.messages)
      } else {
        console.error('API response is not as expected', res.data)
      }
    }).catch((error) => {
      console.error('Failed to fetch messages:', error)
    })
  }, [])

  const handleUserSelect = (user: string) => {
    setSelectedUser(user)
  }

  const filteredMessages = selectedUser
    ? messages.filter((message) => message.clientId === selectedUser)
    : messages

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center">
          <h1 className="font-semibold text-lg md:text-2xl">Dashboard</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="ml-auto" size="sm">
                {selectedUser ? selectedUser : "Select User"}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select User</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {messages.map((message) => (
                <DropdownMenuItem key={message.clientId} onClick={() => handleUserSelect(message.clientId)}>
                  {message.clientId}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="border shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Client (User)</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Contact Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => (
                <TableRow key={`${message.createdAt}-${message.clientId}`}>
                  <TableCell>{new Date(message.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{message.clientId}</TableCell>
                  <TableCell>{message.phoneNumber}</TableCell>
                  <TableCell>{message.message}</TableCell>
                  <TableCell>{message.contactName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{messages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{messages.filter((message) => message.phoneNumber).length}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

function ChevronDownIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
