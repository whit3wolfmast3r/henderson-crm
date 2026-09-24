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
  const assignedTo = (searchParams.get('assigned_to') || '').trim();
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  // Dynamic limit: Allows Map view to request up to 250 records while keeping 24 for Cards/Table
  const limitParam = parseInt(searchParams.get('limit') || '24', 10);
  const limit = Math.min(Math.max(limitParam, 1), 500);
  const offset = (page - 1) * limit;

  try {
    const categories = await getCategories();

    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' });

    // 1. Category Filter
    if (category && category !== 'All') {
      query = query.eq('primary_category', category);
    }

    // 2. Disposition Filter
    if (disposition && disposition !== 'All') {
      query = query.eq('disposition', disposition);
    }

    // 3. Rep Assignment Filter (David, Zach, or Unassigned)
    if (assignedTo && assignedTo !== 'All') {
      if (assignedTo.toLowerCase() === 'unassigned') {
        query = query.or('assigned_to.eq.unassigned,assigned_to.is.null');
      } else {
        query = query.eq('assigned_to', assignedTo.toLowerCase());
      }
    }

    // 4. Text Search
    if (search) {
      query = query.or(
        `entity_name.ilike.%${search}%,dba.ilike.%${search}%,phone_number.ilike.%${search}%,municipal_phone.ilike.%${search}%,address.ilike.%${search}%,decision_maker.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    // 5. Order & Paginate
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
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}