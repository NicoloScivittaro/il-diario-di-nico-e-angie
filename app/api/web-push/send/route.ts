import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

function isSupabaseDebugEnabled() {
  return process.env.SUPABASE_DEBUG === "1";
}

function getSafeKeyPrefix(key: string) {
  return `${key.slice(0, 8)}…(len:${key.length})`;
}

function getSafeSupabaseHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid_url";
  }
}

function toPublicErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message || "Errore server";
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

function getRequiredEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject =
    process.env.VAPID_SUBJECT || "mailto:notifiche@ilnostrodiario.it";

  if (!supabaseUrl) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!vapidPublicKey) {
    throw new Error("Missing env: NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  }

  if (!vapidPrivateKey) {
    throw new Error("Missing env: VAPID_PRIVATE_KEY");
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    vapidPublicKey,
    vapidPrivateKey,
    vapidSubject,
  };
}

function getWebPush() {
  const { vapidSubject, vapidPublicKey, vapidPrivateKey } = getRequiredEnv();

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  return webpush;
}

function getSupabaseAdmin() {
  const { supabaseUrl, serviceRoleKey } = getRequiredEnv();

  if (isSupabaseDebugEnabled()) {
    console.log("[supabase-admin][send] urlHost=", getSafeSupabaseHost(supabaseUrl));
    console.log(
      "[supabase-admin][send] serviceRoleKey=",
      getSafeKeyPrefix(serviceRoleKey)
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    const { title, body: pushBody, link, recipientRole } = requestBody;

    if (!recipientRole) {
      return NextResponse.json(
        { error: "Manca recipientRole" },
        { status: 400 }
      );
    }

    if (!title || !pushBody) {
      return NextResponse.json(
        { error: "Mancano title o body" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const wp = getWebPush();

    if (isSupabaseDebugEnabled()) {
      const { error: healthError } = await supabaseAdmin
        .from("push_subscriptions")
        .select("id")
        .limit(1);

      if (healthError) {
        console.error("[supabase-admin][send] health-check error:", {
          message: healthError.message,
          code: (healthError as any).code,
        });
      } else {
        console.log("[supabase-admin][send] health-check ok");
      }
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, user_role")
      .eq("user_role", recipientRole);

    if (error) {
      console.error("Errore lettura subscriptions:", error);
      return NextResponse.json(
        { error: error.message || "Errore lettura subscriptions" },
        { status: getStatusFromErrorMessage(error.message || "") }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("Nessuna subscription trovata per", recipientRole);
      return NextResponse.json({ success: true, sent: 0 });
    }

    const payload = JSON.stringify({
      title,
      body: pushBody,
      link: link || "/",
    });

    let sentCount = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await wp.sendNotification(
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
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            console.log("Subscription scaduta, rimozione in corso...", sub.id);

            await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          } else {
            console.error("Errore invio a un device:", err);
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      sent: sentCount,
    });
  } catch (error: any) {
    console.error("Errore Web Push API:", error);
    const message = toPublicErrorMessage(error);
    return NextResponse.json({ error: message }, { status: getStatusFromErrorMessage(message) });
  }
}