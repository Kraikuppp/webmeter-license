# ⚡ Quick Start - Deploy บน Railway ใน 5 นาที

## 🎯 สำหรับคนที่รีบ

### ขั้นที่ 1: Push โค้ดขึ้น GitHub (1 นาที)
```bash
cd "d:\WebMeter-Production\license key"
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### ขั้นที่ 2: สร้าง Railway Project (1 นาที)
1. ไป https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. เลือก repository นี้

### ขั้นที่ 3: เพิ่ม Database (30 วินาที)
1. **New** → **Database** → **Add PostgreSQL**
2. รอ 30 วินาที

### ขั้นที่ 4: ตั้งค่า Variables (1 นาที)
คลิกที่ main service → **Variables** → เพิ่มทีละตัว:

```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_API_SECRET=my-super-secure-admin-secret-2024-minimum-16
INSTALLER_SECRET=my-installer-secret-key-2024-v1-minimum-16
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
CORS_ORIGIN=*
```

⚠️ **เปลี่ยน ADMIN_API_SECRET และ INSTALLER_SECRET เป็นของคุณเอง!**

### ขั้นที่ 5: รัน Schema (1 นาที)
1. คลิกที่ **PostgreSQL service** → **Data** → **Query**
2. Copy เนื้อหาจาก `src/scripts/schema.sql`
3. Paste และกด **Run Query**

### ขั้นที่ 6: Redeploy (30 วินาที)
1. คลิกที่ **main service** → **Deployments**
2. คลิก **Redeploy**
3. รอจนสถานะเป็น "Success" (สีเขียว)

### ขั้นที่ 7: ทดสอบ (30 วินาที)
```bash
curl https://your-app.up.railway.app/health
```

**ผลลัพธ์ที่ต้องการ:**
```json
{"status":"ok","timestamp":1234567890}
```

---

## ✅ เสร็จแล้ว!

**URL ของคุณ:** https://your-app.up.railway.app

**API Endpoints:**
- `GET /health` - Health check
- `POST /api/v1/licenses/validate` - Validate license
- `POST /api/v1/admin/licenses` - Create license (admin)

---

## 🐛 มีปัญหา?

### ❌ Build Failed
→ ดู logs ใน **Deployments** → คลิกที่ deployment

### ❌ "ADMIN_API_SECRET is too short"
→ ตรวจสอบว่ายาวอย่างน้อย 16 ตัวอักษร

### ❌ "DATABASE_URL is required"
→ ตรวจสอบว่าเพิ่ม PostgreSQL แล้ว และตั้ง `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### ❌ 502 Bad Gateway
→ ดู logs และตรวจสอบว่ารัน schema แล้ว

---

## 📚 เอกสารเพิ่มเติม

- **RAILWAY_SETUP.md** - คู่มือแบบละเอียด
- **RAILWAY_TROUBLESHOOTING.md** - แก้ปัญหาทุกแบบ
- **DEPLOYMENT_SUMMARY.md** - สรุปการแก้ไขทั้งหมด

---

**เวลาทั้งหมด:** ~5 นาที  
**ความยาก:** ⭐⭐☆☆☆ (ง่าย)
