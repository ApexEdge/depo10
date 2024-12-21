import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(
      JSON.stringify({ data: data || [] }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch ratings' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('ratings')
      .insert([{
        rating: body.rating,
        comment: body.comment,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ data }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create rating' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
