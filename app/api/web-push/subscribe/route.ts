import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = "nodejs";

function isSupabaseDebugEnabled() {
  return process.env.SUPABASE_DEBUG === '1';
}

function getSafeKeyPrefix(key: string) {
  return `${key.slice(0, 8)}…(len:${key.length})`;
}

function getSafeSupabaseHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid_url';
  }
}

function toPublicErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message || 'Errore server';
}

function getStatusFromErrorMessage(message: string) {
  if (/invalid api key/i.test(message)) {
    return 401;
  }

  if (/missing env/i.test(message)) {
    return 500;
  }

  return 500;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');
  }

  if (isSupabaseDebugEnabled()) {
    console.log('[supabase-admin][subscribe] urlHost=', getSafeSupabaseHost(supabaseUrl));
    console.log('[supabase-admin][subscribe] serviceRoleKey=', getSafeKeyPrefix(serviceRoleKey));
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

    if (isSupabaseDebugEnabled()) {
      const { error: healthError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('id')
        .limit(1);

      if (healthError) {
        console.error('[supabase-admin][subscribe] health-check error:', {
          message: healthError.message,
          code: (healthError as any).code,
        });
      } else {
        console.log('[supabase-admin][subscribe] health-check ok');
      }
    }

    // Controlla se esiste già
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    if (selectError) {
      throw new Error(selectError.message || 'Errore lettura subscription esistente');
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
    const message = toPublicErrorMessage(error);
    return NextResponse.json({ error: message }, { status: getStatusFromErrorMessage(message) });
  }
}
