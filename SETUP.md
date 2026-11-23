# 🖍️ ColorMe Toon — كتاب تلوين بطل طفلك

موقع بيرفع فيه العميل صورة طفله واهتماماته، يدفع، والأتمتة بتاعتك بتعمل 10 صفحات تلوين كارتون، وتظهر للعميل يحمّلها.

## الفكرة باختصار

```
العميل يملأ الفورم ويرفع الصورة
        ↓
يدفع (Paymob)  ── أو دفع تجريبي في وضع mock
        ↓
الموقع يبعت الطلب لـ Webhook الأتمتة (n8n / Make / Zapier)
        ↓
الأتمتة تعمل الـ 10 صور بالـ AI وترجّعهم للموقع
        ↓
صفحة الطلب بتتحدث لوحدها → العميل يحمّل الصفحات أو ZIP
```

## التشغيل

```bash
npm install
cp .env.example .env     # وعدّل القيم
npm start                # http://localhost:3000
```

محتاج Node 18 أو أحدث. للتجربة سيب `PAYMENT_MODE=mock` (دفع تجريبي من غير فلوس). ولو عايز الخدمة مجانية مؤقتاً خليها `free`.

## 1) اللي الموقع بيبعته للأتمتة

بعد الدفع، الموقع بيعمل `POST` على `AUTOMATION_WEBHOOK_URL` ومعاه هيدر `x-automation-secret`:

```json
{
  "orderId": "ord_6f23c1f098a8",
  "photoUrl": "https://your-domain.com/files/photo/ord_...?key=...",
  "child": { "name": "يوسف", "age": 5, "gender": "boy" },
  "interests": ["كورة القدم", "الديناصورات"],
  "notes": "عنده كلب اسمه ماكس",
  "imagesCount": 10,
  "style": "black and white coloring book page for kids, ...",
  "suggestedPrompts": ["... 10 برومبتات جاهزة بالإنجليزي ..."],
  "callbackUrl": "https://your-domain.com/api/automation/callback",
  "callbackHeader": "x-automation-secret"
}
```

- `photoUrl`: الأتمتة تحمّل منه صورة الطفل (اللينك فيه مفتاح سري).
- `suggestedPrompts`: 10 برومبتات جاهزة بالإنجليزي، كل واحد بمشهد مختلف من اهتمامات الطفل. تقدر تستخدمها زي ما هي، أو تبعتها لـ LLM يحسّنها. الاهتمامات الجاهزة بتتترجم لوحدها، أما اللي العميل بيكتبه بإيده بيفضل عربي فخلي خطوة AI في الأتمتة تترجمه.

## 2) إزاي الأتمتة ترجّع الصور

`POST` على `callbackUrl`، وحط في الهيدر `x-automation-secret: <نفس AUTOMATION_SECRET>`.

**الطريقة (أ) — روابط (الأسهل):**
```json
{ "orderId": "ord_...", "images": ["https://.../1.png", "https://.../2.png", "..."] }
```
الموقع بيحمّل الصور ويخزنها عنده (فمش مشكلة لو الروابط بتنتهي بعدين).

**الطريقة (ب) — ملفات:** `multipart/form-data` فيه `orderId` والملفات في حقل اسمه `images` (ينفع يتكرر).

**صورة صورة:** ضيف `"append": true` مع كل صورة؛ الطلب بيتقفل لوحده لما يوصل 10 (أو ابعت `"final": true`).

**لو حصل فشل:**
```json
{ "orderId": "ord_...", "status": "failed", "error": "السبب" }
```

**إعادة إرسال طلب للأتمتة:** `POST /api/admin/orders/<id>/retry` ومعاه نفس الهيدر.

## 3) مثال n8n

1. **Webhook** (POST) ← انسخ الـ Production URL وحطه في `AUTOMATION_WEBHOOK_URL`.
2. **IF**: اتأكد إن `{{$json.headers["x-automation-secret"]}}` هو نفس السر بتاعك.
3. **HTTP Request**: حمّل `photoUrl` كـ Binary.
4. **Split Out** على `suggestedPrompts` ← 10 عناصر.
5. لكل برومبت: موديل صور بيقبل صورة مرجعية (image-to-image / character reference)، وابعتله صورة الطفل + البرومبت.
6. **Aggregate** للروابط في array.
7. **HTTP Request** POST على `callbackUrl` بالـ body `{ orderId, images }` والهيدر `x-automation-secret`.

> نصيحة: عشان الصفحة تطلع "تلوين" فعلاً (خطوط سودا على أبيض ومفيش ألوان)، خلي جملة `style` في آخر البرومبت، ولو الموديل بيدعم negative prompt حط فيه: `color, shading, gray, gradient, photo`.

## 4) Paymob

1. من لوحة Paymob: هات **Secret Key** و**Public Key** و**HMAC Secret** و**Integration ID** (كارت / محافظ).
2. حطهم في `.env` وغيّر `PAYMENT_MODE=paymob`.
3. في إعدادات الـ Integration خلي **Transaction processed callback** يبقى:
   `https://your-domain.com/api/paymob/callback`
4. الموقع بيتحقق من الـ HMAC قبل ما يعتبر أي طلب مدفوع، ومش بيبعت للأتمتة غير بعد نجاح الدفع.

## 5) الرفع على سيرفر

أي سيرفر Node بـ **ديسك ثابت** هينفع: Railway، Render (مع Disk)، Fly.io، أو VPS. الطلبات والصور بتتخزن في فولدر `data/`، فلازم الفولدر ده يفضل موجود بعد كل Deploy. ظبّط `BASE_URL` على الدومين الحقيقي بـ https.

## الخصوصية (مهم عشان دي صور أطفال)

- لازم ولي الأمر يوافق قبل الرفع (موجود في الفورم).
- صورة الطفل الأصلية بتتمسح تلقائياً بعد `DELETE_PHOTO_AFTER_DAYS` (افتراضي 7 أيام).
- كل الروابط (صورة الطفل، النتايج، صفحة الطلب) محمية بتوكن عشوائي، ومحدش يقدر يخمّنها.
- اختار موديل AI مش بيستخدم الصور المرفوعة في التدريب، واكتب سياسة خصوصية بسيطة في الموقع.

## الملفات

| الملف | وظيفته |
|---|---|
| `server.js` | الطلبات، الرفع، الدفع، الـ Webhooks، التحميل |
| `lib/paymob.js` | إنشاء صفحة الدفع والتحقق من الـ HMAC |
| `lib/store.js` | تخزين الطلبات (ملف JSON، ابقى انقله لقاعدة بيانات لما الطلبات تكتر) |
| `public/index.html` + `app.js` | الصفحة الرئيسية والفورم |
| `public/order.html` + `order.js` | صفحة حالة الطلب والتحميل |

## الصور

كل صور الموقع في `public/img/` واتولدت من "افهم" (مشروع **ColorMe Toon — صور الموقع**):
`logo.png` · `hero.png` · `step-upload.png` · `step-interests.png` · `step-download.png` · `ex-*.png` (4 أمثلة صفحات تلوين).
لو عايز تغيّر أي صورة، حط واحدة جديدة بنفس الاسم.
