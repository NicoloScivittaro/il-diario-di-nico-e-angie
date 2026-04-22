import { getSupabaseClient } from './supabaseClient';

export async function sendNotification(
  title: string,
  body: string,
  link: string,
  currentPartnerRole: string | undefined | null
) {
  if (!currentPartnerRole) return;

  const supabase = getSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;

  if (!userId) return;

  // L'altro partner riceverà la notifica
  const recipient_role = currentPartnerRole === 'nicolo' ? 'angelica' : 'nicolo';

  try {
    await supabase.from('notifications').insert({
      actor_id: userId,
      recipient_role,
      title,
      body,
      link
    });

    // 2. Invia la vera Push Notification al telefono
    await fetch('/api/web-push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        link,
        recipientRole
      })
    });

  } catch (error) {
    console.error('Errore invio notifica:', error);
  }
}
