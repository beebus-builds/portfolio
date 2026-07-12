import { NextResponse } from 'next/server';
import about from '@/data/about.json';

export async function GET() {
  return NextResponse.json(about);
}
