# ขั้นตอนเชื่อมต่อ Railway

## วิธีเชื่อมต่อโปรเจคกับ Railway

### 1. สร้างโปรเจคใหม่บน Railway
- ไปที่ https://railway.app
- คลิก "New Project" → "Deploy from GitHub"
- เลือก repository นี้ (หรือ fork ก่อน)

### 2. ตั้งค่า Environment Variables
ใน Railway Dashboard → Environment → Add Variable:
```
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/dbname
ADMIN_API_SECRET=your-super-secure-admin-secret-here
INSTALLER_SECRET=your-installer-secret-here
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
CORS_ORIGIN=https://your-domain.com
```

### 3. เพิ่ม PostgreSQL Plugin
- ใน Railway Dashboard → Add Service → PostgreSQL
- Railway จะสร้าง `DATABASE_URL` อัตโนมัติ

### 4. รัน Schema Migration
ใน Railway Shell:
```bash
psql $DATABASE_URL < src/scripts/schema.sql
```

### 5. ตั้ง Start Command
ใน Railway → Settings → Start Command:
```
npm install && npm start
```

### 6. ทดสอบ
```bash
curl https://your-app.up.railway.app/health
```

## การ Deploy จาก Local

หากต้องการ push จาก local:
```bash
git remote add railway https://git.railway.app/your-project-id.git
git push railway main
```

## Troubleshooting

**ปัญหา**: Database connection timeout
- ตรวจสอบ `DATABASE_URL` ถูกต้องหรือไม่
- ตรวจสอบ PostgreSQL plugin ถูก add หรือไม่

**ปัญหา**: Build failed
- ตรวจสอบ `package.json` มี `npm start` script หรือไม่
- ตรวจสอบ Node.js version ใน Railway (แนะนำ 18+)

**ปัญหา**: 502 Bad Gateway
- ตรวจสอบ logs ใน Railway Dashboard
- ตรวจสอบ PORT environment variable ตั้งเป็น 8080 หรือไม่
