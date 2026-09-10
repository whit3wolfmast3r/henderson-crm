import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Create a brand-new off-platform business
    if (body.action === 'create') {
      const newRecord = {
        id: body.id || `manual_${Date.now()}`,
        entity_name: body.entity_name || '',
        dba: body.dba || body.entity_name || '',
        phone_number: body.phone_number || '',
        address: body.address || '',
        formatted_address: body.formatted_address || body.address || '',
        city: body.city || '',
        state: body.state || 'NV',
        zip_code: body.zip_code || '',
        assigned_to: body.assigned_to || 'unassigned',
        decision_maker: body.decision_maker || '',
        disposition: body.disposition || 'Not Contacted',
        notes: body.notes || '',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert([newRecord])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, record: data ? data[0] : newRecord });
    }

    // 2. Update existing business record (Auto-save / Disposition / Rep assignment)
    const { id, notes, disposition, decision_maker, assigned_to, last_called_at } = body;

    const updatePayload = {
      notes: notes ?? '',
      disposition: disposition ?? 'Not Contacted',
      decision_maker: decision_maker ?? '',
      updated_at: new Date().toISOString()
    };

    if (assigned_to !== undefined) {
      updatePayload.assigned_to = assigned_to;
    }

    if (last_called_at !== undefined) {
      updatePayload.last_called_at = last_called_at;
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, record: data ? data[0] : null });
  } catch (error) {
    console.error('Supabase CRM API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}