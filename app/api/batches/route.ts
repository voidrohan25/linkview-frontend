import { NextResponse } from 'next/server';
import { getBatchesByTenant, createBatch } from '@/server/repositories/batchRepository';

export async function GET() {
  try {
    const batches = await getBatchesByTenant('t-default');
    return NextResponse.json({ success: true, data: batches });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ success: false, error: 'Name and Code are required' }, { status: 400 });
    }

    const created = await createBatch({
      tenant_id: 't-default',
      name: body.name,
      code: body.code.toUpperCase(),
      description: body.description || '',
      status: 'active',
      created_by: 'trainer-active',
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
