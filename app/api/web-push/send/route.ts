import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:notifiche@ilnostrodiario.it',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, body: pushBody, link, recipientRole } = body;

    if (!recipientRole) {
      return NextResponse.json({ error: 'Manca recipientRole' }, { status: 400 });
    }

    // Usa la chiave service_role per ignorare RLS e leggere le sub dell'altro utente
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_role', recipientRole);

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log('Nessuna subscription trovata per', recipientRole);
      return NextResponse.json({ success: true, sent: 0 });
    }

    const payload = JSON.stringify({
      title,
      body: pushBody,
      link,
    });

    let sentCount = 0;
    
    // Invia la push a tutti i dispositivi del partner
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          sentCount++;
        } catch (err: any) {
          // Se la sub è scaduta o non valida, la rimuoviamo
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Subscription scaduta, rimozione in corso...');
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error('Errore invio a un device:', err);
          }
        }
      })
    );

    return NextResponse.json({ success: true, sent: sentCount });

  } catch (error) {
    console.error('Errore Web Push API:', error);
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}
