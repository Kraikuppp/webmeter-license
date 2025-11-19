# บริการไลเซนส์ WebMeter

ศูนย์กลางจัดการไลเซนส์สำหรับตัวติดตั้ง WebMeter ทำหน้าที่ออกคีย์ ตรวจสอบสิทธิ์ติดตั้ง ติดตามการใช้งาน HWID และออกแบบมาให้ดีพลอยบน Railway ได้ทันที พร้อมตัวอย่างการเชื่อมต่อกับ Inno Setup

## ภาพรวมระบบ (System Overview)

1. **License Key Generator (Keygen)**
   - สร้างคีย์ทีละชุดหรือครั้งละหลาย ๆ คีย์ (batch)
   - กำหนดจำนวนเครื่องสูงสุด วันหมดอายุ ประเภทไลเซนส์ (demo/full/OEM) ได้
   - มี checksum และลายเซ็นเพื่อกันคีย์ปลอม
   - บันทึกลง PostgreSQL อัตโนมัติ
2. **License Validation Server (API)**
   - REST API ให้ฝั่ง installer และเครื่องมือแอดมินเรียกใช้งาน
   - ตรวจสอบ installer secret, สถานะคีย์, วันหมดอายุ และจำนวนเครื่องที่เปิดใช้
   - เก็บ log ทุกการ activate พร้อม HWID/metadata
   - มี endpoint จัดการคีย์ (revoke/suspend) และรายงานสถานะ
3. **การเชื่อมกับ Inno Setup**
   - Installer ส่ง `{licenseKey, hwid, installerSecret, installerVersion}` มาที่ `/api/v1/licenses/validate`
   - รับผลตอบกลับเป็นโค้ด (`VALID`, `INVALID_INSTALLER`, `KEY_EXPIRED`, ฯลฯ)
   - ถ้าถูกปฏิเสธ จะแสดงข้อความแจ้งผู้ใช้ทันทีและยุติการติดตั้ง

## โครงสร้างโฟลเดอร์

```
license key/
├─ README.md
├─ package.json
├─ .env.example
└─ src/
   ├─ server.js                 # จุดเริ่ม Express
   ├─ config/
   │  ├─ env.js                # โหลดตัวแปรสภาพแวดล้อม (Zod validate)
   │  └─ database.js           # ตัวช่วยเชื่อม PostgreSQL
   ├─ middleware/
   │  ├─ auth.js               # ตรวจสอบ installer/admin secret
   │  └─ rateLimit.js          # ตั้ง rate limit แยกฝั่ง installer/admin
   ├─ services/
   │  ├─ keygen.js             # สร้างคีย์ + checksum
   │  └─ licenseService.js     # ธุรกิจหลัก: create/validate/activate
   ├─ routes/
   │  ├─ admin.js              # Endpoint สำหรับแอดมิน
   │  └─ installer.js          # Endpoint สำหรับ installer
   ├─ utils/
   │  ├─ crypto.js             # ฟังก์ชัน checksum/token
   │  └─ logger.js             # ตัว logger (Pino)
   └─ scripts/
      └─ generate-batch.js     # CLI สร้างคีย์เป็นล็อต (เพิ่มภายหลัง)
```

## โครงสร้างฐานข้อมูล

### ตาราง `licenses`
| คอลัมน์      | ชนิดข้อมูล  | รายละเอียด                                |
|---------------|-------------|--------------------------------------------|
| id            | UUID PK     | สร้างฝั่งเซิร์ฟเวอร์อัตโนมัติ            |
| license_key   | TEXT UNIQUE | รูปแบบ `WM-XXXX-XXXX-XXXX-CHK`             |
| checksum      | TEXT        | SHA256 ใช้ตรวจจับการปลอมแปลง              |
| expiry_date   | DATE        | วันหมดอายุ                                 |
| max_devices   | INT         | จำนวนเครื่องที่อนุญาต                     |
| used_devices  | INT         | ตัวนับเครื่องที่ใช้จริง                   |
| status        | TEXT        | `active`, `suspended`, `revoked`           |
| type          | TEXT        | `demo`, `full`, `oem`                      |
| metadata      | JSONB       | เก็บข้อมูลลูกค้า/หมายเหตุ                 |
| created_at    | TIMESTAMP   | ค่าเริ่มต้น `NOW()`                       |
| updated_at    | TIMESTAMP   | อัปเดตอัตโนมัติด้วย trigger               |

### ตาราง `license_devices`
| คอลัมน์        | ชนิดข้อมูล | รายละเอียด                                 |
|-----------------|------------|---------------------------------------------|
| id              | UUID PK    |                                             |
| license_id      | UUID FK    | FK ไปยัง `licenses.id`                      |
| hwid            | TEXT       | ลายนิ้วมือเครื่อง (Hardware ID)           |
| installer_ver   | TEXT       | เวอร์ชัน installer ที่ใช้ activate        |
| activated_at    | TIMESTAMP  | เวลาที่เริ่ม activate                      |
| last_used       | TIMESTAMP  | อัปเดตเมื่อ heartbeat                      |
| status          | TEXT       | `active`, `blocked`                         |

## API พื้นฐาน (Initial Surface)

| Endpoint | Method | คำอธิบาย |
|----------|--------|----------|
| `/api/v1/licenses/validate` | POST | ตรวจสอบคีย์ + HWID ตอนติดตั้ง |
| `/api/v1/licenses/heartbeat` | POST | แจ้งว่ายังใช้งานเครื่องเดิม (update `last_used`) |
| `/api/v1/admin/licenses` | POST | แอดมินสร้างคีย์ (รองรับ batch) |
| `/api/v1/admin/licenses/:key/revoke` | POST | เปลี่ยนสถานะไลเซนส์ (revoke/suspend) |
| `/api/v1/admin/licenses/:key/devices` | GET | ดูรายชื่อเครื่องที่ activate |

## มาตรการความปลอดภัย (Security Controls)

- **Installer Secret**: ทุกคำขอจาก installer ต้องส่ง header `x-installer-secret` ที่ตรงกับค่าในเซิร์ฟเวอร์
- **Checksum + Signature**: คีย์ทุกตัวมี checksum เฉพาะ ป้องกันการเดาสุ่ม
- **Rate Limit**: จำกัดจำนวนคำขอต่อช่วงเวลา แยกฝั่ง installer และ admin เพื่อลดการ brute force
- **Tokenized Response**: เมื่อคีย์ผ่าน จะได้ token สั้น ๆ ให้ installer ใช้ยืนยันผลลัพธ์
- **Logging**: ใช้ Pino บันทึกทุกการสร้างคีย์และการ validate เพื่อ audit

## ขั้นตอนดีพลอยบน Railway
1. สร้างโปรเจกต์ใหม่บน Railway แล้วเพิ่ม PostgreSQL add-on
2. ตั้งค่า Environment Variables ตามไฟล์ `.env.example`
3. เปิด Railway Shell แล้วรัน `psql < scripts/schema.sql` เพื่อสร้าง schema
4. ตั้ง Start Command เป็น `npm run start`
5. ทดสอบเรียก `/health` ให้ได้ `{"status":"ok"}` ก่อนเชื่อมกับ installer

## ขั้นตอนถัดไป
1. ติดตั้ง dependency (`npm install`) แล้วสร้างไฟล์ `.env`
2. สร้าง CLI สำหรับ batch generator (ไฟล์ `scripts/generate-batch.js`)
3. เพิ่ม endpoint เสริม เช่น รายงานสถิติ หรือ webhook แจ้งเตือน
4. เขียนตัวอย่างโค้ด Inno Setup ที่เรียก API พร้อม mapping error message เป็นภาษาไทย
