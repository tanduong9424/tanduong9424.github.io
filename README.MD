Huynh Tan Duong

## Private documents

The `documents.html` page uses Supabase Storage for private PDF, Markdown, and
TXT files. GitHub Pages serves the static frontend; Supabase handles sign-in
and private file storage.

1. Create a Supabase project and create an email/password user for yourself.
   Disable public sign-ups in Supabase Auth so visitors cannot create accounts.
2. In the Supabase SQL Editor, run `supabase-storage.sql` to create the private
   bucket and per-user storage policies.
3. Copy the project URL and the publishable (anon) key into `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` at the top of `documents.js`. Never put a `service_role`
   key in frontend code.
4. Open `documents.html`, sign in, then upload or preview your files.

The policies only allow a signed-in user to access files under their own user
ID folder. The browser limits uploads to PDF, Markdown, and TXT files of at
most 20 MB; the bucket enforces the size and MIME-type limits as well. Keep the
bucket private and do not add broader access policies for this bucket.