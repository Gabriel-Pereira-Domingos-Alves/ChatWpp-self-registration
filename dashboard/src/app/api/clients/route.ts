import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch('http://localhost:3333/whatsapp/clients');
  const data = await response.json();
  console.log(data)
  return NextResponse.json(data);
}
