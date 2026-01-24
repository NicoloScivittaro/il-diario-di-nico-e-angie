# Configurazione PWA Completata 🚀

La tua web app è ora una Progressive Web App (PWA) installabile!

## Cosa è stato fatto
1.  **Installato** `next-pwa`.
2.  **Configurato** `next.config.ts` per generare il Service Worker.
3.  **Creato** `public/manifest.json` con nome "Il nostro amore" e tema rosa.
4.  **Aggiornato** `app/layout.tsx` con i meta tag per iOS e Android.
5.  **Ignorato** i file generati in `.gitignore`.

## ⚠️ AZIONE RICHIESTA: Icone
Per completare l'installazione, devi aggiungere DUE immagini nella cartella `public/icons/`:
1.  `icon-192x192.png` (Icona piccola)
2.  `icon-512x512.png` (Icona grande)

*Puoi usare un qualsiasi convertitore online "App Icon Generator" per crearle dal tuo logo.*

## Come Installare l'App

### Android (Chrome)
1.  Apri il sito su Chrome.
2.  Tocca i tre puntini (menu) in alto a destra.
3.  Tocca **"Aggiungi a schermata Home"** o **"Installa app"**.

### iPhone (Safari)
1.  Apri il sito su Safari.
2.  Tocca il tasto **Condividi** (quadrato con freccia in basso).
3.  Scorri e tocca **"Aggiungi alla schermata Home"**.

## Test
In fase di sviluppo (`npm run dev`), la PWA è disabilitata di default per non dare fastidio.
Per testarla, devi fare la build:
```bash
npm run build
npm start
```
Poi apri `localhost:3000` e vedrai che è installabile.
