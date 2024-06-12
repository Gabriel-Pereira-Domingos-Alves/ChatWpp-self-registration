import { NextResponse, NextRequest } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest, { params }: { params: { clientId: string } }) {
  const { clientId } = params;
  try {
    const response = await axios.get(`http://localhost:3333/whatsapp/close/${clientId}`);
    if (response.status === 200) {
      if (response.data.message) {
        return NextResponse.json({ message: response.data.message }, { status: response.status });
      } else {
        return NextResponse.json({ message: response.statusText }, { status: response.status });
      } 
    } else {  
      return NextResponse.json({ message: response.statusText }, { status: response.status });
    } 
  } catch (error) { 
    return NextResponse.json({ message: 'Internal Server Error', error }, { status: 500 });
  } 
}