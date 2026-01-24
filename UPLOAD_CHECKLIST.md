# Checklist Upload Immagini Supabase

## ✅ Modifiche Implementate

### 1. Sanificazione Filename Aggressiva
- ✅ Rimozione spazi (convertiti in `_`)
- ✅ Rimozione caratteri speciali (`,;:!@#$%^&*()[]{}+=`)
- ✅ Pulizia estensione file
- ✅ Rimozione underscore multipli
- ✅ Trim underscore da inizio/fine

### 2. Upload Robusto
- ✅ Uso bucket `tets`
- ✅ Path: `{userId}/{memoryId}/{timestamp}-{sanitizedName}`
- ✅ **contentType** sempre passato (`file.type` o fallback)
- ✅ Upload paralleli con `Promise.allSettled`
- ✅ Gestione errori per singolo file (non blocca gli altri)

### 3. Logging Dettagliato
- ✅ Log pre-upload: nome originale → sanitizzato
- ✅ Log path completo
- ✅ Log contentType e dimensione file
- ✅ Log errori con statusCode e messaggio
- ✅ Log successo con URL pubblico

### 4. Feedback Utente
- ✅ Alert dettagliato con lista file falliti
- ✅ Messaggio che indica di controllare console (F12)
- ✅ Conteggio immagini caricate vs fallite

---

## 🔧 Configurazione Supabase Richiesta

### Storage Bucket
1. Vai su **Supabase Dashboard** → **Storage**
2. Verifica che esista un bucket chiamato **`tets`**
3. Se non esiste, esegui lo script SQL: `supabase/tets_storage.sql`

### Policy RLS Storage
Assicurati che esistano queste policy sul bucket `tets`:

```sql
-- INSERT (upload)
create policy "Authenticated users can upload to tets"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'tets' );

-- SELECT (view)
create policy "Authenticated users can select from tets"
on storage.objects for select
to authenticated
using ( bucket_id = 'tets' );

-- DELETE
create policy "Users can delete own files in tets"
on storage.objects for delete
to authenticated
using ( bucket_id = 'tets' and auth.uid() = owner );
```

### Database Tables
Esegui anche `supabase/memories.sql` se non l'hai già fatto:
- Tabella `memories`
- Tabella `memory_images`
- Policy RLS per entrambe

---

## 🧪 Come Testare

1. **Apri la Console del Browser** (F12)
2. **Vai su** `/dashboard/memories/new`
3. **Controlla i log iniziali**:
   ```
   [STORAGE] Available buckets: ['tets', ...]
   [STORAGE] Bucket "tets" exists: true
   ```
   
4. **Carica un'immagine con nome complesso**:
   - Es: `Foto Vacanza, Estate 2024!.jpg`
   
5. **Osserva i log durante l'upload**:
   ```
   [UPLOAD START] Original: "Foto Vacanza, Estate 2024!.jpg" -> Sanitized: "Foto_Vacanza_Estate_2024.jpg"
   [UPLOAD PATH] {userId}/{memoryId}/1234567890-Foto_Vacanza_Estate_2024.jpg
   [UPLOAD TYPE] image/jpeg
   [UPLOAD SIZE] 123456 bytes
   [UPLOAD SUCCESS] Foto Vacanza, Estate 2024!.jpg -> https://...
   ```

6. **Se fallisce, vedrai**:
   ```
   [UPLOAD FAILED] filename.jpg: { message: "...", statusCode: 403, ... }
   ```

---

## 🐛 Troubleshooting

### Errore: "new row violates row-level security policy"
- **Causa**: Policy INSERT mancante o errata
- **Soluzione**: Esegui `supabase/tets_storage.sql`

### Errore: "Bucket not found"
- **Causa**: Bucket `tets` non esiste
- **Soluzione**: Crea il bucket manualmente o via SQL

### Errore: "Invalid content type"
- **Causa**: File type non riconosciuto
- **Soluzione**: Ora viene passato `application/octet-stream` come fallback

### Errore generico senza dettagli
- **Causa**: Errore di rete o configurazione Supabase
- **Soluzione**: Controlla `.env.local` per SUPABASE_URL e SUPABASE_ANON_KEY

---

## 📝 Note Finali

- Ogni upload ora logga **tutto** in console
- Gli errori mostrano il **nome file esatto** e il **motivo**
- Il ricordo viene **sempre salvato** (anche se le foto falliscono)
- Le foto che riescono vengono salvate (upload parziale OK)
