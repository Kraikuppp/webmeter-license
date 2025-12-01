# คู่มือ Deploy บน Railway - WebMeter License Server

## 📋 สิ่งที่ต้องเตรียม

1. บัญชี Railway (สมัครฟรีที่ https://railway.app)
2. บัญชี GitHub (เพื่อเชื่อม repository)
3. โปรเจคนี้ต้อง push ขึ้น GitHub repository

---

## 🚀 ขั้นตอนการ Deploy (แบบละเอียด)

### ขั้นที่ 1: สร้างโปรเจคใหม่บน Railway

1. เข้า https://railway.app และ Login
2. คลิก **"New Project"**
3. เลือก **"Deploy from GitHub repo"**
4. เลือก repository ของโปรเจคนี้
   - ถ้ายังไม่มี repository ให้ push โค้ดขึ้น GitHub ก่อน
5. Railway จะเริ่ม deploy อัตโนมัติ (แต่จะ fail เพราะยังไม่มี database)

### ขั้นที่ 2: เพิ่ม PostgreSQL Database

1. ใน Railway Dashboard → คลิก **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway จะสร้าง PostgreSQL instance และตั้งค่า `DATABASE_URL` ให้อัตโนมัติ
3. รอประมาณ 30 วินาที จนกว่า database จะพร้อม

### ขั้นที่ 3: ตั้งค่า Environment Variables

1. คลิกที่ service ของคุณ (ไม่ใช่ database)
2. ไปที่แท็บ **"Variables"**
3. เพิ่มตัวแปรต่อไปนี้:

```bash
# Required Variables
NODE_ENV=production
PORT=8080

# Database (Railway จะสร้างให้อัตโนมัติ แต่ต้องตรวจสอบว่ามี)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security Secrets (⚠️ เปลี่ยนเป็นค่าของคุณเอง!)
ADMIN_API_SECRET=your-super-secure-admin-secret-minimum-16-chars
INSTALLER_SECRET=your-installer-secret-minimum-16-chars-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30

# CORS (ใส่ domain ของคุณ หรือใช้ * สำหรับทุก domain)
CORS_ORIGIN=*
```

**⚠️ สำคัญมาก:**
- `ADMIN_API_SECRET` และ `INSTALLER_SECRET` ต้องยาวอย่างน้อย 16 ตัวอักษร
- อย่าใช้ค่า example ข้างบน ให้สร้างค่าใหม่ที่ปลอดภัย

### ขั้นที่ 4: รัน Database Schema

1. ใน Railway Dashboard → คลิกที่ PostgreSQL service
2. ไปที่แท็บ **"Data"** → คลิก **"Query"**
3. Copy เนื้อหาจากไฟล์ `src/scripts/schema.sql` ทั้งหมด
4. Paste ลงใน Query editor และกด **"Run Query"**
5. ตรวจสอบว่าตาราง `licenses` และ `license_devices` ถูกสร้างแล้ว

**หรือใช้ Railway CLI:**
```bash
# ติดตั้ง Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link โปรเจค
railway link

# รัน schema
railway run psql $DATABASE_URL < src/scripts/schema.sql
```

### ขั้นที่ 5: Redeploy Service

1. กลับไปที่ service หลัก (ไม่ใช่ database)
2. ไปที่แท็บ **"Deployments"**
3. คลิก **"Redeploy"** บน deployment ล่าสุด
4. รอจน deployment สำเร็จ (สถานะเป็น "Success" สีเขียว)

### ขั้นที่ 6: ทดสอบ API

1. ใน Railway Dashboard → คลิกที่ service
2. ไปที่แท็บ **"Settings"**
3. ใน **"Networking"** จะมี **"Public Domain"** (เช่น `your-app.up.railway.app`)
4. ทดสอบด้วย:

```bash
# ทดสอบ health check
curl https://your-app.up.railway.app/health

# ควรได้ response:
# {"status":"ok","timestamp":1234567890}
```

---

## 🔧 การตั้งค่าเพิ่มเติม

### เปิดใช้ Custom Domain (ถ้าต้องการ)

1. ไปที่ **Settings** → **Networking** → **Custom Domain**
2. เพิ่ม domain ของคุณและตั้งค่า DNS ตามที่ Railway แนะนำ
3. อัพเดท `CORS_ORIGIN` ให้ตรงกับ domain ใหม่

### ดู Logs

1. ไปที่แท็บ **"Deployments"**
2. คลิกที่ deployment ที่ต้องการดู
3. Logs จะแสดงแบบ real-time

---

## 🐛 แก้ปัญหาที่พบบ่อย

### ❌ Build Failed

**อาการ:** Deployment ล้มเหลวตั้งแต่ขั้น build

**วิธีแก้:**
1. ตรวจสอบ logs ใน Railway Dashboard
2. ตรวจสอบว่า `package.json` มี `"start"` script
3. ตรวจสอบว่า Node.js version ใน Railway เป็น 18+
   - ไปที่ Settings → ดูที่ "Build & Deploy"

### ❌ Application Failed to Respond

**อาการ:** Build สำเร็จแต่ app ไม่ตอบสนอง

**วิธีแก้:**
1. ตรวจสอบว่า `PORT` environment variable ตั้งเป็น `8080`
2. ตรวจสอบว่า app ใช้ `process.env.PORT` ไม่ใช่ hardcode port
3. ดู logs ว่ามี error อะไร

### ❌ Database Connection Error

**อาการ:** Error: `DATABASE_URL is required` หรือ connection timeout

**วิธีแก้:**
1. ตรวจสอบว่า PostgreSQL service ถูกเพิ่มแล้ว
2. ตรวจสอบว่า `DATABASE_URL` ถูกตั้งค่าใน Variables
3. ลอง reference แบบนี้: `${{Postgres.DATABASE_URL}}`
4. ตรวจสอบว่า schema ถูกรันแล้ว

### ❌ Validation Error: ADMIN_API_SECRET is too short

**อาการ:** App crash ทันทีหลัง deploy

**วิธีแก้:**
1. ตรวจสอบว่า `ADMIN_API_SECRET` และ `INSTALLER_SECRET` ยาวอย่างน้อย 16 ตัวอักษร
2. อย่าใช้ค่า example จาก `.env.example`
3. สร้างค่าใหม่ที่ปลอดภัย เช่น:
   ```
   ADMIN_API_SECRET=my-super-secure-admin-secret-2024
   INSTALLER_SECRET=my-installer-secret-key-2024-v1
   ```

### ❌ 502 Bad Gateway

**อาการ:** เข้า URL แล้วเจอ 502 error

**วิธีแก้:**
1. ดู logs ว่า app start สำเร็จหรือไม่
2. ตรวจสอบว่า app listen บน port ที่ถูกต้อง
3. ตรวจสอบว่าไม่มี error ใน startup

### ❌ CORS Error

**อาการ:** Frontend ไม่สามารถเรียก API ได้

**วิธีแก้:**
1. ตั้ง `CORS_ORIGIN=*` สำหรับ development
2. สำหรับ production ให้ระบุ domain ที่อนุญาต:
   ```
   CORS_ORIGIN=https://yourdomain.com
   ```

---

## 📊 ตรวจสอบสถานะ

### Health Check
```bash
curl https://your-app.up.railway.app/health
```

### ทดสอบ Validate License (ต้องมี license key ก่อน)
```bash
curl -X POST https://your-app.up.railway.app/api/v1/licenses/validate \
  -H "Content-Type: application/json" \
  -H "x-installer-secret: your-installer-secret-here" \
  -d '{
    "licenseKey": "WM-XXXX-XXXX-XXXX-XXXX",
    "hwid": "test-hardware-id",
    "installerVersion": "1.0.0"
  }'
```

---

## 🔄 การ Deploy ครั้งต่อไป

เมื่อมีการแก้ไขโค้ด:

1. **Push ไปยัง GitHub:**
   ```bash
   git add .
   git commit -m "Update code"
   git push origin main
   ```

2. **Railway จะ auto-deploy** ทันทีที่ detect การ push

3. **หรือ deploy manual:**
   - ไปที่ Railway Dashboard
   - คลิก "Redeploy"

---

## 📝 Checklist ก่อน Deploy

- [ ] Push โค้ดขึ้น GitHub แล้ว
- [ ] สร้าง Railway project แล้ว
- [ ] เพิ่ม PostgreSQL database แล้ว
- [ ] ตั้งค่า Environment Variables ครบทุกตัว
- [ ] `ADMIN_API_SECRET` และ `INSTALLER_SECRET` ยาวอย่างน้อย 16 ตัวอักษร
- [ ] รัน schema.sql ใน database แล้ว
- [ ] Redeploy service แล้ว
- [ ] ทดสอบ `/health` endpoint สำเร็จ
- [ ] บันทึก URL และ secrets ไว้ในที่ปลอดภัย

---

## 🆘 ต้องการความช่วยเหลือ?

1. ดู logs ใน Railway Dashboard → Deployments → คลิกที่ deployment
2. ตรวจสอบ [Railway Documentation](https://docs.railway.app)
3. ตรวจสอบ [Railway Discord](https://discord.gg/railway)

---

**สำเร็จแล้ว! 🎉** API ของคุณพร้อมใช้งานบน Railway แล้ว

