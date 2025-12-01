# 🚨 แก้ปัญหา Railway Deployment - Quick Fix Guide

## ปัญหาที่พบบ่อยที่สุด

### 1. ❌ Error: "ADMIN_API_SECRET is too short"

**สาเหตุ:** Environment variables ไม่ถูกต้องหรือไม่ครบ

**วิธีแก้:**
```bash
# ใน Railway Dashboard → Variables → เพิ่มตัวแปรเหล่านี้:
ADMIN_API_SECRET=my-super-secure-admin-secret-2024-minimum-16-chars
INSTALLER_SECRET=my-installer-secret-key-2024-v1-minimum-16-chars
```

**สำคัญ:** ต้องยาวอย่างน้อย 16 ตัวอักษร!

---

### 2. ❌ Error: "DATABASE_URL is required"

**สาเหตุ:** ไม่ได้เพิ่ม PostgreSQL หรือ variable ไม่ถูกต้อง

**วิธีแก้:**

**ขั้นที่ 1:** เพิ่ม PostgreSQL
- Railway Dashboard → New → Database → Add PostgreSQL

**ขั้นที่ 2:** ตรวจสอบ Variables
- ไปที่ service ของคุณ → Variables
- ตรวจสอบว่ามี `DATABASE_URL` 
- ถ้าไม่มี ให้เพิ่ม:
  ```
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  ```

**ขั้นที่ 3:** Redeploy
- Deployments → คลิก "Redeploy"

---

### 3. ❌ Build Failed / npm install error

**สาเหตุ:** Dependencies ติดตั้งไม่สำเร็จ

**วิธีแก้:**

**ตรวจสอบ package.json:**
- ต้องมี `"engines"` field:
  ```json
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
  ```

**ตรวจสอบ logs:**
- Railway Dashboard → Deployments → คลิกที่ deployment ล่าสุด
- อ่าน error message ใน logs

**ลอง rebuild:**
- Settings → คลิก "Redeploy"

---

### 4. ❌ Application Failed to Respond / 502 Bad Gateway

**สาเหตุ:** App ไม่ start หรือ crash

**วิธีแก้:**

**ขั้นที่ 1:** ดู Logs
```
Railway Dashboard → Deployments → คลิกที่ deployment
```

**ขั้นที่ 2:** ตรวจสอบ Environment Variables
ต้องมีครบทุกตัว:
- ✅ `NODE_ENV=production`
- ✅ `PORT=8080`
- ✅ `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- ✅ `ADMIN_API_SECRET=...` (ยาว >= 16 ตัวอักษร)
- ✅ `INSTALLER_SECRET=...` (ยาว >= 16 ตัวอักษร)
- ✅ `RATE_LIMIT_WINDOW_MS=60000`
- ✅ `RATE_LIMIT_MAX=30`
- ✅ `CORS_ORIGIN=*`

**ขั้นที่ 3:** ตรวจสอบ Database Schema
- ไปที่ PostgreSQL service → Data → Query
- รัน:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public';
  ```
- ต้องมีตาราง: `licenses` และ `license_devices`
- ถ้าไม่มี ให้รัน `src/scripts/schema.sql`

---

### 5. ❌ Database Connection Timeout

**สาเหตุ:** Database ยังไม่พร้อมหรือ connection string ผิด

**วิธีแก้:**

**ตรวจสอบ PostgreSQL Service:**
- Railway Dashboard → คลิกที่ PostgreSQL service
- ตรวจสอบว่า status เป็น "Active" (สีเขียว)
- ถ้าไม่ใช่ รอสักครู่หรือ restart service

**ตรวจสอบ DATABASE_URL:**
- ไปที่ main service → Variables
- `DATABASE_URL` ควรเป็น: `${{Postgres.DATABASE_URL}}`
- หรือ copy จาก PostgreSQL service → Variables → DATABASE_URL

**Test Connection:**
- PostgreSQL service → Data → Query
- ลองรัน: `SELECT 1;`
- ถ้าได้ผลลัพธ์ แสดงว่า database พร้อมใช้งาน

---

### 6. ❌ Schema Tables Not Found

**สาเหตุ:** ยังไม่ได้รัน schema.sql

**วิธีแก้:**

**วิธีที่ 1: ใช้ Railway Web UI**
1. Railway Dashboard → PostgreSQL service
2. Data → Query
3. Copy เนื้อหาจาก `src/scripts/schema.sql`
4. Paste และกด "Run Query"

**วิธีที่ 2: ใช้ Railway CLI**
```bash
# ติดตั้ง CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# รัน schema
railway run psql $DATABASE_URL < src/scripts/schema.sql
```

**ตรวจสอบว่าสำเร็จ:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

ต้องเห็น:
- `licenses`
- `license_devices`

---

### 7. ❌ CORS Error (Frontend ไม่เชื่อมต่อได้)

**สาเหตุ:** CORS_ORIGIN ไม่ถูกต้อง

**วิธีแก้:**

**Development:**
```
CORS_ORIGIN=*
```

**Production:**
```
CORS_ORIGIN=https://yourdomain.com
```

**Multiple domains:**
```
CORS_ORIGIN=https://domain1.com,https://domain2.com
```

---

## 📋 Checklist การแก้ปัญหา

เมื่อ deployment ล้มเหลว ให้ตรวจสอบตามลำดับ:

- [ ] **1. ดู Logs ก่อน** (Deployments → คลิกที่ deployment)
- [ ] **2. ตรวจสอบ Environment Variables** (ต้องมีครบทุกตัว)
- [ ] **3. ตรวจสอบ PostgreSQL Service** (ต้อง Active)
- [ ] **4. ตรวจสอบ Database Schema** (ต้องมีตาราง)
- [ ] **5. ตรวจสอบ package.json** (ต้องมี engines และ start script)
- [ ] **6. Redeploy** (Settings → Redeploy)

---

## 🔍 วิธีดู Logs

1. Railway Dashboard
2. คลิกที่ service ของคุณ
3. ไปที่แท็บ "Deployments"
4. คลิกที่ deployment ล่าสุด
5. Logs จะแสดงแบบ real-time

**ดู error ที่สำคัญ:**
- ❌ `Error: ...` - ข้อความ error หลัก
- ⚠️ `Warning: ...` - คำเตือน
- ✅ `License server listening on port 8080` - สำเร็จ!

---

## 🧪 ทดสอบว่า Deploy สำเร็จ

### Test 1: Health Check
```bash
curl https://your-app.up.railway.app/health
```

**ผลลัพธ์ที่ต้องการ:**
```json
{"status":"ok","timestamp":1234567890}
```

### Test 2: Database Connection
ใน PostgreSQL service → Data → Query:
```sql
SELECT COUNT(*) FROM licenses;
```

**ผลลัพธ์ที่ต้องการ:**
```
count
-----
0
```

---

## 🆘 ยังแก้ไม่ได้?

### ขั้นตอนการ Debug แบบละเอียด:

1. **Export Logs:**
   - Deployments → คลิกที่ deployment
   - Copy logs ทั้งหมด

2. **ตรวจสอบ Variables:**
   - Variables → Screenshot หน้าจอ

3. **ตรวจสอบ Services:**
   - ต้องมี 2 services:
     - Main app service
     - PostgreSQL service

4. **ลอง Redeploy:**
   - Settings → Redeploy
   - รอจน deployment เสร็จ

5. **ลอง Restart:**
   - Settings → Restart

---

## 💡 Tips สำหรับการ Deploy

1. **ใช้ Railway CLI** - สะดวกกว่า web UI
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   ```

2. **ดู Logs แบบ Real-time:**
   ```bash
   railway logs
   ```

3. **Run Commands ใน Railway:**
   ```bash
   railway run node src/scripts/generate-batch.js
   ```

4. **Connect to Database:**
   ```bash
   railway run psql $DATABASE_URL
   ```

---

## 📞 ติดต่อขอความช่วยเหลือ

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

---

**สำเร็จแล้ว! 🎉** ถ้าทำตาม guide นี้แล้วยังไม่ได้ ให้ส่ง logs มาดูครับ
