'use client'

import Sidebar from "@/components/page/sidebar"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import axios from "axios"
import React, { useEffect, useState } from "react"
import Spinner from "@/components/page/spinner"
import { TrashIcon } from "@radix-ui/react-icons"
import LoadingDots from "@/components/page/loadingClose"

interface Contas {
  id: string
  name: string
  number: string
  session: string
}

const Home: React.FC = () => {
  const [contas , setContas] = useState<Contas[]>([])
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [close, setClose] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false) 
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserName, setNewUserName] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    axios.get('/api/clients').then(res => { 
      setContas(res.data.clients)
    })
    setLoading(false)
  }, [])

  const handleQrCode = async (clientId: string) => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/qrcode/${clientId}`)

      if (response.status === 200) {
        if (response.data.qrCode) {
          setMessage(null)
          setQrCode(response.data.qrCode)
        }
        if (response.data.message) {
          setMessage(response.data.message)
          setQrCode(null)
        }
        setIsModalOpen(true)
      } else {
          console.error("Failed to get QR code", response.statusText);
      }
    } catch (error) {
        console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseClient = async (clientId: string) => {
    try {
      setClose(clientId)
      const response = await axios.get(`/api/close/${clientId}`)
      if (response.status === 200) {
        setContas(contas.filter((conta) => conta.id !== clientId))
      }
    } catch (error) {
      console.error('Error closing client:', error)
    }
    setClose(null)
  }

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      alert("Please enter a name for the new user.")
      return
    }

    setLoading(true)
    try {
      const response = await axios.get(`/api/qrcode/${newUserName}`)

      if (response.status === 200) {
        if (response.data.qrCode) {
          setMessage(null)
          setQrCode(response.data.qrCode)
        }
        if (response.data.message) {
          setMessage(response.data.message)
          setQrCode(null)
        }
        setContas([...contas, { id: newUserName, name: newUserName, number: 'clientNumber', session: 'notLogged' }])
        setIsModalOpen(true)
        setNewUserName('')
        setIsAddUserOpen(false)
      } else {
        console.error("Failed to add user", response.statusText)
      }
    } catch (error) {
      console.error('Error adding user:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Users</h1>
        <Button className="ml-auto" size="sm" onClick={() => setIsAddUserOpen(true)}>
          Add user
        </Button>
      </div>
      {isAddUserOpen && (
        <div className="flex gap-2 items-center my-4">
          <input 
            type="text" 
            placeholder="Enter user name" 
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="p-2 border rounded"
          />
          <Button size="sm" onClick={handleAddUser}>
            Confirm
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAddUserOpen(false)}>
            Cancel
          </Button>
        </div>
      )}
      <div className="border shadow-sm rounded-lg">
        <Table className="rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell>{conta.name}</TableCell>
                <TableCell className={conta.session === 'isLogged' ? 'text-green-500' : 'text-red-500'}>
                  {conta.session === 'isLogged' ? 'Logado' : 'Não logado'}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button variant={"outline"} className="mr-2" size="sm" onClick={() => handleQrCode(conta.id)}>
                    QRcode generate
                  </Button>
                  <Button variant={"outline"} size="sm" onClick={() => handleCloseClient(conta.id)}>
                    {close === conta.id ? <LoadingDots /> : <TrashIcon className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>  
            ))}
          </TableBody>
        </Table>
      </div>
      {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <button 
                className="text-red-500 float-right" 
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
              <div className="mt-4">
                {qrCode ? (
                  <img src={qrCode} alt="QR Code" />
                ) : (
                  <p>{message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      {loading && <Spinner />}
    </main>
  </div>
  )
}

export default Home
