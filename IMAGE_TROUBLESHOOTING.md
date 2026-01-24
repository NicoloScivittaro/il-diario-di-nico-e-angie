# Troubleshooting Visualizzazione Immagini

## ✅ Modifiche Implementate

### 1. Next.js Configuration
- ✅ Aggiunto `remotePatterns` in `next.config.ts` per permettere immagini da `**.supabase.co`
- ⚠️ **IMPORTANTE**: Devi riavviare il server Next.js dopo aver modificato `next.config.ts`

### 2. Storage Policy Aggiornata
- ✅ Policy SELECT cambiata da `authenticated` a `public` (permette accesso anonimo alle immagini)
- ⚠️ **IMPORTANTE**: Esegui nuovamente `supabase/tets_storage.sql` se non l'hai già fatto

### 3. Logging Dettagliato
Ora ogni pagina logga informazioni utili:

**Lista Ricordi (`/dashboard/memories`)**:
```
[MEMORIES LIST] Fetched memories: 3
[MEMORY 0] "Titolo" has 2 images
[MEMORY 0] First image URL: https://...
[IMAGE LOADED] https://...
```

**Dettaglio Ricordo (`/dashboard/memories/[id]`)**:
```
[MEMORY DETAIL] Loaded memory: uuid-here
[MEMORY DETAIL] Images: [{image_url: "https://..."}]
[MEMORY DETAIL] First image URL: https://...
```

**Errori Immagini**:
```
[IMAGE ERROR] Failed to load: https://...
```

### 4. Miglioramenti UI
- ✅ Altezza fissa per cover image (320px nel dettaglio, aspect-video nella lista)
- ✅ `object-fit: cover` e `object-position: center` per centrare le immagini
- ✅ Overlay gradiente più leggero (40% invece di 50%)
- ✅ Placeholder visibile se l'immagine fallisce
- ✅ Background gradiente rosa invece di grigio

---

## 🔍 Come Verificare

### Step 1: Riavvia il Server
```bash
# Ferma il server (Ctrl+C)
npm run dev
```

### Step 2: Verifica Policy Storage
1. Vai su **Supabase Dashboard** → **Storage** → **Policies**
2. Verifica che esista la policy: **"Public can view files in tets"**
3. Se non esiste, esegui `supabase/tets_storage.sql`

### Step 3: Testa Upload
1. Vai su `/dashboard/memories/new`
2. Carica un'immagine
3. Controlla la console (F12):
   ```
   [UPLOAD SUCCESS] filename.jpg -> https://xxx.supabase.co/storage/v1/object/public/tets/...
   ```
4. **Copia l'URL** e aprilo in una nuova tab del browser
5. Se vedi l'immagine → Storage OK ✅
6. Se vedi errore 403/404 → Policy problema ❌

### Step 4: Verifica Visualizzazione
1. Vai su `/dashboard/memories`
2. Apri la console (F12)
3. Dovresti vedere:
   ```
   [MEMORIES LIST] Fetched memories: X
   [MEMORY 0] First image URL: https://...
   [IMAGE LOADED] https://...
   ```
4. Se vedi `[IMAGE ERROR]` → Problema con l'URL

---

## 🐛 Possibili Problemi e Soluzioni

### Problema: Immagine non si carica (riquadro grigio/rosa)

**Verifica 1: URL Salvato nel DB**
```sql
-- Esegui in Supabase SQL Editor
SELECT m.title, mi.image_url 
FROM memories m
LEFT JOIN memory_images mi ON m.id = mi.memory_id
ORDER BY m.created_at DESC
LIMIT 5;
```
- Se `image_url` è NULL → Problema upload
- Se `image_url` è un path (es: `userId/memoryId/file.jpg`) → Problema: dovrebbe essere URL completo
- Se `image_url` è URL completo → Vai a Verifica 2

**Verifica 2: URL Accessibile**
1. Copia l'URL dalla query sopra
2. Aprilo in una nuova tab del browser
3. Se vedi l'immagine → Policy OK, problema Next.js
4. Se vedi errore 403 → Policy mancante (esegui `tets_storage.sql`)
5. Se vedi errore 404 → File non esiste in Storage

**Verifica 3: Next.js Config**
1. Controlla che `next.config.ts` contenga:
   ```typescript
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: '**.supabase.co',
         ...
       }
     ]
   }
   ```
2. **Riavvia il server** (`npm run dev`)

**Verifica 4: Console Browser**
1. Apri F12 → Console
2. Cerca errori tipo:
   - `CORS error` → Problema Supabase CORS (raro)
   - `403 Forbidden` → Policy mancante
   - `404 Not Found` → File non esiste
   - `net::ERR_BLOCKED_BY_CLIENT` → AdBlock/Privacy extension

---

## 📝 Checklist Completa

- [ ] Bucket `tets` esiste e `public = true`
- [ ] Policy "Public can view files in tets" esiste
- [ ] `next.config.ts` ha `remotePatterns` configurato
- [ ] Server Next.js riavviato dopo modifica config
- [ ] Upload salva URL completo (non solo path)
- [ ] URL è accessibile direttamente nel browser
- [ ] Console mostra `[IMAGE LOADED]` (non `[IMAGE ERROR]`)

---

## 🎯 URL Corretto vs Sbagliato

### ✅ Corretto (Salvato nel DB)
```
https://abcdefgh.supabase.co/storage/v1/object/public/tets/userId/memoryId/1234567890-foto.jpg
```

### ❌ Sbagliato (Solo Path)
```
userId/memoryId/1234567890-foto.jpg
```

Se nel DB hai solo il path, il codice attuale dovrebbe già salvare l'URL completo. Verifica con la query SQL sopra.

---

## 🔧 Fix Rapido se le Immagini Esistono ma non si Vedono

Se hai già caricato immagini e sono nel bucket ma non si vedono:

1. **Verifica che siano URL completi nel DB**
2. **Esegui la policy pubblica**:
   ```sql
   create policy "Public can view files in tets"
   on storage.objects for select
   to public
   using ( bucket_id = 'tets' );
   ```
3. **Riavvia Next.js**
4. **Ricarica la pagina con Ctrl+Shift+R** (hard refresh)
