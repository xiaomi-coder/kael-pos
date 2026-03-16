# KAEL POS — Qurilish Materiallari Do'koni Boshqaruv Tizimi

Professional POS (Point of Sale) tizimi React + Vite da yaratilgan.

## Xususiyatlari

- 🛒 **Sotuv (Kassa)** — tez sotuv, chegirma, naqd/nasiya/aralash to'lov
- 📜 **Sotuv tarixi** — mijoz bo'yicha filter, telefon raqam, oylik hisobot
- 🏗️ **Ombor** — mahsulot qo'shish, tahrirlash, o'chirish, kam qoldiq ogohlantirish
- 👥 **Mijozlar** — CRUD, balans, sotuvlar tarixi
- 📋 **Qarzlar** — qarzdorlar ro'yxati, to'lov qabul qilish
- 💸 **Xarajatlar** — moshina, svet, arenda, soliq, ovqat, xodim oyligi
- 🏭 **Dillerlar** — tovar sotib olish, to'lov, hisob-kitob
- 📈 **Hisobotlar** — aqlli sana tanlash (1 kun — 3 oy + maxsus), grafik
- 🖨️ **Chek chiqarish** — professional chek, chop etish
- 💾 **Ma'lumot saqlash** — localStorage (brauzer yopilsa ham saqlanadi)
- 📊 **Excel export** — sotuvlar, qarzlar, xarajatlar
- 🤖 **Telegram bot** — har bir sotuv/to'lov/xarajatda xabar
- 👤 **Ko'p foydalanuvchi** — 3 ta login, faoliyat jurnali

## O'rnatish

```bash
# 1. Paketlarni o'rnatish
npm install

# 2. Ishga tushirish
npm run dev

# 3. Brauzerda ochiladi: http://localhost:3000
```

## Login ma'lumotlari

| Ism | Login | Parol | Rol |
|-----|-------|-------|-----|
| Do'kon egasi | admin | admin123 | admin |
| Sotuvchi | sotuvchi | sotuvchi1 | seller |
| Uka | uka | uka123 | helper |

## Telegram bot sozlash

1. Telegram da @BotFather ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting
4. Token nusxalang
5. KAEL POS → Sozlamalar → Bot Token va Chat ID kiriting
6. "Test xabar" tugmasini bosing

## Deploy qilish

```bash
# Build
npm run build

# dist/ papkasini hosting ga yuklang (Vercel, Netlify, va h.k.)
```

## Texnologiyalar

- React 18
- Vite 6
- localStorage (ma'lumot saqlash)
- Telegram Bot API (xabar yuborish)
- CSV export (Excel)

## Google Antigravity da ishlash

1. Antigravity ni oching
2. "Open Folder" → kael-pos papkasini tanlang
3. Terminal da `npm install && npm run dev`
4. Agent ga aytishingiz mumkin: "Backend qo'sh", "Firebase ulash", "Deploy qil"
