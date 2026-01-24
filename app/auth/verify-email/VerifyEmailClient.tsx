"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifica in corso...");

  useEffect(() => {
    const run = async () => {
      try {
        // esempi parametri comuni: token, code, type, next...
        const token = searchParams.get("token");
        const code = searchParams.get("code");
        const type = searchParams.get("type") ?? "signup";

        // Se usi Supabase email link, spesso arriva "code"
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          setStatus("ok");
          setMessage("Email verificata! 🎉 Ti porto nella dashboard...");
          setTimeout(() => router.push("/dashboard"), 1200);
          return;
        }

        // Se usi token custom (dipende dal tuo flow)
        if (!token) {
          setStatus("error");
          setMessage("Token mancante o link non valido.");
          return;
        }

        // Se non ti serve davvero token, puoi anche solo mostrare OK
        setStatus("ok");
        setMessage("Link valido! Puoi tornare all’app.");
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message ?? "Errore durante la verifica.");
      }
    };

    run();
  }, [searchParams, router, supabase]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center border border-white/60">
        <h1 className="text-3xl font-handwritten font-bold text-rose-800 mb-3">
          Verifica Email
        </h1>

        <p className="text-gray-600 mb-6">{message}</p>

        {status === "loading" && (
          <div className="text-rose-400 font-medium">Sto controllando...</div>
        )}

        {status === "error" && (
          <a
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-rose-500 text-white font-bold hover:bg-rose-600 transition"
            href="/auth/login"
          >
            Torna al login
          </a>
        )}
      </div>
    </div>
  );
}
