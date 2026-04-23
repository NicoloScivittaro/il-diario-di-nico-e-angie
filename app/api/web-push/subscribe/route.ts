import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Mancano le env per Supabase Admin (URL o SERVICE_ROLE_KEY)");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userId, userRole } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Subscription non valida' }, { status: 400 });
    }

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Mancano userId o userRole dal client' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Controlla se esiste già
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    if (selectError) {
      console.error('Errore lettura subscription esistente:', selectError);
    }

    if (!existing) {
      const { error: insertError } = await supabaseAdmin.from('push_subscriptions').insert({
        user_id: userId,
        user_role: userRole,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });

      if (insertError) {
        throw new Error(insertError.message || 'Errore durante insert della subscription');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Errore subscribe push:', error);
    return NextResponse.json({ error: error?.message || 'Errore server' }, { status: 500 });
  }
}
