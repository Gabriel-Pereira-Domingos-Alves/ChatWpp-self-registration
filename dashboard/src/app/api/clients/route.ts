import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const response = await axios.get('http://localhost:3333/whatsapp/Clients');
    const data = response.data;
    console.log(data);

    const headers = new Headers();
    headers.append('Cache-Control', 'no-store');

    return new NextResponse(JSON.stringify(data), { headers });
  } catch (error) {
    console.error('Error fetching data:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch data' }), { status: 500 });
  }
}
