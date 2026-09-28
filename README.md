# Tech Store — Online Database + Secure Admin + Email

ეს ვერსია იყენებს:
- Supabase/Postgres ონლაინ მონაცემთა ბაზას
- Supabase Auth-ს Admin შესვლისთვის
- Express backend-ს
- Resend-ს ახალი შეკვეთის ელფოსტის შეტყობინებისთვის
- Helmet + rate limiting-ს

## 1) Supabase

შექმენი Supabase პროექტი და გახსენი SQL Editor.
`supabase.sql` მთლიანად გაუშვი.

შემდეგ Authentication > Users-ში შექმენი შენი Admin მომხმარებელი:
- Email: შენი ელფოსტა
- Password: ძლიერი პაროლი

## 2) Environment

`.env.example` გადაარქვი `.env` და ჩასვი:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- ADMIN_EMAIL
- RESEND_API_KEY
- ADMIN_NOTIFICATION_EMAIL
- MAIL_FROM

**SUPABASE_SECRET_KEY არასოდეს ჩასვა frontend-ში ან GitHub-ში.**
Supabase-ის დოკუმენტაცია პირდაპირ ამბობს, რომ secret key მხოლოდ სერვერზე უნდა იყოს. 

## 3) Install/run

npm install
npm start

## 4) URLs

მაღაზია:
http://localhost:3000

Admin:
http://localhost:3000/admin.html

## 5) Email

Resend-ის API-ით ახალი შეკვეთისას იგზავნება შეტყობინება ADMIN_NOTIFICATION_EMAIL-ზე.
პირველი ტესტისთვის Resend-ის onboarding sender შეიძლება გამოიყენო; საკუთარი დომენისთვის დაამატე/დაადასტურე დომენი Resend-ში.

## უსაფრთხოება

- მომხმარებელი ვერ კითხულობს orders ცხრილს პირდაპირ ბრაუზერიდან.
- Admin API მოითხოვს Supabase Auth access token-ს.
- backend ამოწმებს, რომ token-ის email ემთხვევა ADMIN_EMAIL-ს.
- database secret key მხოლოდ backend-შია.
- API-ს აქვს rate limit.
