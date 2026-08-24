import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxtbkhsgbswwmvmwwmib.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_mgLLAcFCjxi8npt8v2FEIQ_GjEM1aQR';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(request) {
  try {
    const { id, notes, disposition, decision_maker } = await request.json();

    const { data, error } = await supabase
      .from('businesses')
      .update({
        notes: notes ?? '',
        disposition: disposition ?? 'Not Contacted',
        decision_maker: decision_maker ?? '',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, record: data ? data[0] : null });
  } catch (error) {
    console.error('Supabase update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}