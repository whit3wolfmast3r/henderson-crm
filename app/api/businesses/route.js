import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// In-memory cache for category pills and counts
let cachedCategories = null;

async function getCategories() {
  if (cachedCategories && cachedCategories.length > 0) {
    return cachedCategories;
  }

  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('primary_category');

    if (error || !data) return [];

    const counts = {};
    for (const item of data) {
      const cat = item.primary_category;
      if (cat && cat.trim() && cat !== 'null' && cat !== 'Uncategorized') {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    }

    cachedCategories = Object.entries(counts)
      .map(([primary_category, count]) => ({ primary_category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    return cachedCategories;
  } catch (err) {
    console.error('Failed to aggregate categories:', err);
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || '';
  const disposition = searchParams.get('disposition') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  try {
    const categories = await getCategories();

    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' });

    if (category && category !== 'All') {
      query = query.eq('primary_category', category);
    }
    if (disposition && disposition !== 'All') {
      query = query.eq('disposition', disposition);
    }
    if (search) {
      query = query.or(
        `entity_name.ilike.%${search}%,dba.ilike.%${search}%,phone_number.ilike.%${search}%,municipal_phone.ilike.%${search}%,address.ilike.%${search}%,decision_maker.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query
      .order('rating', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      businesses: data || [],
      categories: categories || [],
      pagination: {
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}