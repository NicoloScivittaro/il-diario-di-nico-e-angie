import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center border border-white/60">
            <h1 className="text-3xl font-handwritten font-bold text-rose-800 mb-3">
              Verifica Email
            </h1>
            <p className="text-gray-600">Caricamento...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
