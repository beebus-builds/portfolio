import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const contactPath = path.join(process.cwd(), 'src', 'data', 'contact.json');
    const raw = await fs.readFile(contactPath, 'utf-8');
    const messages = JSON.parse(raw);

    const entry = {
      id: Date.now(),
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };

    messages.push(entry);
    await fs.writeFile(contactPath, JSON.stringify(messages, null, 2), 'utf-8');

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!', entry },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
