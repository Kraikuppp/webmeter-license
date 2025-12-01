# 📖 คู่มือการใช้งาน WebMeter License Server

หลังจาก Deploy เสร็จแล้ว คุณสามารถใช้งาน API ได้ดังนี้

## 1. เตรียมข้อมูลที่ต้องใช้
ก่อนอื่นต้องไปเอา **Secret Key** จาก Render Dashboard มาก่อน:
1. ไปที่ Render Dashboard -> เลือกโปรเจค `webmeter-license`
2. ไปที่เมนู **Environment**
3. หาค่าของ:
   - `ADMIN_API_SECRET` (ใช้สำหรับสร้างคีย์)
   - `INSTALLER_SECRET` (ใช้สำหรับโปรแกรม Installer)
   - `URL` ของเว็บคุณ (เช่น `https://webmeter-license.onrender.com`)

---

## 2. ทดสอบว่า Server ทำงานปกติ
ลองเข้า URL นี้ใน Browser:
`https://webmeter-license.onrender.com/health`

ถ้าปกติจะขึ้นว่า:
```json
{"status":"ok","timestamp":1701234567890}
```

---

## 3. วิธีสร้าง License Key (สำหรับ Admin)
ใช้โปรแกรม **Postman** หรือ **Insomnia** ยิง Request ไปที่:

**Endpoint:** `POST /api/v1/admin/licenses`
**Headers:**
- `Content-Type`: `application/json`
- `x-admin-secret`: *(ใส่รหัส ADMIN_API_SECRET ของคุณ)*

**Body (JSON):**
```json
{
  "count": 1,
  "maxDevices": 1,
  "expiryDate": "2025-12-31",
  "type": "full",
  "metadata": {
    "customer": "บริษัท ABC จำกัด"
  }
}
```

**Response:**
คุณจะได้ `license_key` กลับมา (เช่น `WM-XXXX-XXXX-XXXX`)

---

## 4. วิธีใช้งานในโปรแกรม Installer (Client)
ในโค้ดโปรแกรม Installer ของคุณ ให้ยิง API ไปตรวจสอบ License ดังนี้:

**Endpoint:** `POST /api/v1/licenses/validate`
**Headers:**
- `Content-Type`: `application/json`
- `x-installer-secret`: *(ใส่รหัส INSTALLER_SECRET ของคุณ)*

**Body (JSON):**
```json
{
  "licenseKey": "WM-XXXX-XXXX-XXXX",
  "hwid": "DISK-SERIAL-NUMBER-OR-UUID",
  "installerVersion": "1.0.0"
}
```

**Response (ถ้าผ่าน):**
```json
{
  "status": "valid",
  "license": { ... }
}
```

**Response (ถ้าไม่ผ่าน):**
```json
{
  "status": "invalid_key" // หรือ "expired", "max_devices_reached"
}
```
