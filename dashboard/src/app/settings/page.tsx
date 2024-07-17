'use client'
import React from "react"
import Sidebar from "@/components/page/sidebar"

const Documentation: React.FC = () => {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <main className="w-full max-w-4xl mx-auto py-12 md:py-16 px-4 md:px-6 overflow-y-auto h-screen">
        <div className="space-y-6 h-full">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">API Documentation</h1>
            <p className="mt-4 text-muted-foreground">
              Explore our powerful API to integrate with our platform and build custom solutions.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Endpoints</h2>
            <div className="mt-4 space-y-8">

              {/* Get Clients */}
              <div>
                <h3 className="text-xl font-semibold">Returns the list of 'User' created from WhatsApp</h3>
                <div className="mt-4">
                  <h4 className="text-base font-medium">Request</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <p className="font-mono text-sm">GET /whatsapp/Clients</p>
                  </div>
                  <h4 className="mt-4 text-base font-medium">Response</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <pre className="font-mono text-sm">{`{
  clients: [
    {
      id: 'teste',
      name: 'teste',
      number: 'clientNumber',
      session: 'isLogged'
    },
    {
      id: 'teste2',
      name: 'teste2',
      number: 'clientNumber',
      session: 'isLogged'
    }
  ]
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Get QR Code */}
              <div>
                <h3 className="text-xl font-semibold">Generate QR Code for Client</h3>
                <div className="mt-4">
                  <h4 className="text-base font-medium">Request</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <p className="font-mono text-sm">GET /whatsapp/qr/:clientId</p>
                  </div>
                  <h4 className="mt-4 text-base font-medium">Response</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <pre className="font-mono text-sm">{`{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
}`}</pre>
                    <pre className="font-mono text-sm mt-2">{`{
  "message": "Client is already logged in"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Close Client */}
              <div>
                <h3 className="text-xl font-semibold">Close Client Session</h3>
                <div className="mt-4">
                  <h4 className="text-base font-medium">Request</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <p className="font-mono text-sm">POST /whatsapp/close/:clientId</p>
                  </div>
                  <h4 className="mt-4 text-base font-medium">Response</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <pre className="font-mono text-sm">{`{
  "message": "Client closed successfully"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Add Number to WhatsApp */}
              <div>
                <h3 className="text-xl font-semibold">Add Number to WhatsApp and Send Message</h3>
                <div className="mt-4">
                  <h4 className="text-base font-medium">Request</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <p className="font-mono text-sm">POST /whatsapp/add-number/:clientId</p>
                    <pre className="font-mono text-sm mt-2">{`{
  "phoneNumber": "5531971108313",
  "message": "Olá, esta é uma mensagem de teste."
}`}</pre>
                  </div>
                  <h4 className="mt-4 text-base font-medium">Response</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <pre className="font-mono text-sm">{`{
  "message": "Number added to WhatsApp successfully"
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Get Messages */}
              <div>
                <h3 className="text-xl font-semibold">Returns the list of Messages</h3>
                <div className="mt-4">
                  <h4 className="text-base font-medium">Request</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <p className="font-mono text-sm">GET /whatsapp/messages</p>
                  </div>
                  <h4 className="mt-4 text-base font-medium">Response</h4>
                  <div className="mt-2 bg-muted rounded-md p-4">
                    <pre className="font-mono text-sm">{`{
  "messages": [
    {
      "id": "3444f10f-4493-480f-ae06-3faabe876460",
      "createdAt": "2024-06-12T00:29:26.170Z",
      "clientId": "teste2",
      "phoneNumber": "553171108313",
      "message": "Mensagem teste",
      "contactName": "Pedro"
    },
    {
      "id": "4aac73fc-7eea-4fe7-82bb-0dd6e96c8141",
      "createdAt": "2024-06-12T00:29:48.619Z",
      "clientId": "teste2",
      "phoneNumber": "5531971108313",
      "message": "Mensagem teste",
      "contactName": "Unknown"
    }
  ]
}`}</pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Documentation
