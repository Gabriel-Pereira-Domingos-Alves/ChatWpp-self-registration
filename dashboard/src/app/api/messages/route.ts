import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const response = await axios.get("http://localhost:3333/whatsapp/messages");
  console.log(response.data);
  return NextResponse.json(response.data);
}