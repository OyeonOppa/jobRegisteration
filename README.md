# ระบบรับสมัครงานออนไลน์ - สถาบันพระปกเกล้า

ระบบรับสมัครงานออนไลน์ที่ทันสมัย เป็นทางการ และเรียบหรู สำหรับหน่วยงานภาครัฐ

## ✨ คุณสมบัติ

- 📝 ฟอร์มกรอกข้อมูลที่ครบถ้วนและใช้งานง่าย
- 📊 บันทึกข้อมูลอัตโนมัติลง Google Sheets
- 📁 จัดเก็บเอกสารแยกตามผู้สมัครใน Google Drive
- 📄 สร้างไฟล์ PDF ใบสมัครอัตโนมัติ
- ✉️ ส่งอีเมลยืนยันให้ผู้สมัครและแอดมิน
- 🎨 ออกแบบให้เป็นทางการและเรียบหรู
- 📱 รองรับการใช้งานบนมือถือ

## 📋 ไฟล์ในโปรเจกต์

```
project/
├── index.html              # หน้าเว็บฟอร์มหลัก
├── styles.css              # ไฟล์ CSS สำหรับตกแต่ง
├── script.js               # JavaScript สำหรับ validation และส่งข้อมูล
├── google-apps-script.gs   # Backend Google Apps Script
└── README.md               # คู่มือการใช้งาน (ไฟล์นี้)
```

## 🚀 วิธีการติดตั้งและใช้งาน

### ขั้นตอนที่ 1: เตรียม Google Drive และ Sheets

1. **สร้าง Google Spreadsheet ใหม่**
   - เปิด Google Drive
   - สร้าง Google Sheets ใหม่
   - ตั้งชื่อว่า "ระบบรับสมัครงาน"
   - คัดลอก Spreadsheet ID จาก URL (ส่วนที่อยู่ระหว่าง `/d/` และ `/edit`)
   
   ตัวอย่าง URL:
   ```
   https://docs.google.com/spreadsheets/d/1ABC...XYZ/edit
                                          ^^^^^^^^^ (Spreadsheet ID)
   ```

2. **สร้างโฟลเดอร์ใน Google Drive**
   - สร้างโฟลเดอร์ชื่อ "ผู้สมัครงาน"
   - คลิกขวาที่โฟลเดอร์ > เลือก "Get link"
   - คัดลอก Folder ID จาก URL (ส่วนสุดท้ายของ URL)
   
   ตัวอย่าง URL:
   ```
   https://drive.google.com/drive/folders/1DEF...UVW
                                           ^^^^^^^^^ (Folder ID)
   ```

### ขั้นตอนที่ 2: Deploy Google Apps Script

1. **เปิด Google Apps Script**
   - ไปที่ https://script.google.com/
   - สร้างโปรเจกต์ใหม่ (New Project)
   - ตั้งชื่อโปรเจกต์ว่า "ระบบรับสมัครงาน Backend"

2. **คัดลอกโค้ด**
   - ลบโค้ดเดิมใน Code.gs ทั้งหมด
   - คัดลอกโค้ดจากไฟล์ `google-apps-script.gs` ไปวาง
   - **แก้ไขค่า CONFIG** ที่ด้านบนของไฟล์:
   
   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: 'ใส่ Spreadsheet ID ของคุณ',
     MAIN_FOLDER_ID: 'ใส่ Folder ID ของคุณ',
     ADMIN_EMAIL: 'ใส่อีเมลแอดมิน เช่น hr@kpi.ac.th',
     ORGANIZATION_NAME: 'สถาบันพระปกเกล้า',
     ORGANIZATION_NAME_EN: 'King Prajadhipok\'s Institute'
   };
   ```

3. **Deploy เป็น Web App**
   - คลิก **Deploy** > **New deployment**
   - เลือก type: **Web app**
   - ตั้งค่า:
     - Description: "ระบบรับสมัครงาน v1"
     - Execute as: **Me**
     - Who has access: **Anyone** (สำคัญ!)
   - คลิก **Deploy**
   - **คัดลอก Web App URL** ที่ได้

4. **อนุญาตการเข้าถึง**
   - ครั้งแรกจะมีหน้าต่างขออนุญาต
   - คลิก **Review permissions**
   - เลือกบัญชี Google ของคุณ
   - คลิก **Advanced** > **Go to [ชื่อโปรเจกต์] (unsafe)**
   - คลิก **Allow**

### ขั้นตอนที่ 3: ตั้งค่าหน้าเว็บ

1. **แก้ไขไฟล์ script.js**
   - เปิดไฟล์ `script.js`
   - แก้ไขบรรทัดที่ 7 โดยใส่ Web App URL ที่คัดลอกมา:
   
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/ABC.../exec';
   ```

2. **อัปโหลดไฟล์ขึ้น Web Hosting**
   - อัปโหลดไฟล์ทั้ง 3 ไฟล์: `index.html`, `styles.css`, `script.js`
   - ไปยัง web hosting ของคุณ (เช่น GitHub Pages, Netlify, Vercel, หรือ hosting ของหน่วยงาน)

### ขั้นตอนที่ 4 (ทางเลือก): ทดสอบบนเครื่องก่อน

หากต้องการทดสอบก่อนอัปโหลด:

1. เปิด Command Prompt หรือ Terminal
2. ไปยังโฟลเดอร์ที่เก็บไฟล์
3. รันคำสั่ง:
   ```bash
   python -m http.server 8000
   ```
   หรือหากใช้ Node.js:
   ```bash
   npx http-server -p 8000
   ```
4. เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost:8000`

## 📧 การตั้งค่าอีเมล

อีเมลที่ส่งจะใช้บัญชี Google ที่ Deploy Google Apps Script ดังนั้น:

- ตรวจสอบว่าบัญชีนั้นมีชื่อและรูปโปรไฟล์ที่เหมาะสม
- หากต้องการใช้อีเมลขององค์กร ควร Deploy จากบัญชี Google Workspace ขององค์กร

## 🎨 การปรับแต่งสีสันและโลโก้

### แก้ไขสีในไฟล์ styles.css:

```css
:root {
    --primary-color: #1e3a5f;      /* สีหลัก - น้ำเงินเข้ม */
    --secondary-color: #2c5282;    /* สีรอง */
    --accent-color: #4a90e2;       /* สีเน้น */
}
```

### เปลี่ยนโลโก้:

แก้ไขใน `index.html` บรรทัดที่ 23:
```html
<img src="URL_ของโลโก้ของคุณ" alt="KPI Logo" class="logo">
```

## 📝 ข้อมูลที่เก็บใน Google Sheets

ระบบจะสร้างชีทชื่อ "ผู้สมัครงาน" พร้อมคอลัมน์:

- รหัสผู้สมัคร
- วันที่สมัคร
- ข้อมูลส่วนตัว (ชื่อ, อีเมล, เบอร์โทร, ฯลฯ)
- ประวัติการศึกษา
- ประวัติการทำงาน
- ความสามารถพิเศษ
- ลิงก์โฟลเดอร์เอกสาร
- สถานะ (รอพิจารณา)

## 🔒 ความปลอดภัย

- ข้อมูลทั้งหมดเก็บใน Google Drive และ Sheets ของคุณ
- สามารถตั้งค่าสิทธิ์การเข้าถึงได้
- ไม่มีการเก็บข้อมูลบนเซิร์ฟเวอร์ภายนอก
- ไฟล์ที่อัปโหลดจะถูกเก็บแยกตามโฟลเดอร์ของแต่ละคน

## 🐛 การแก้ปัญหา

### ปัญหา: ส่งฟอร์มแล้วไม่มีอะไรเกิดขึ้น
**วิธีแก้:**
1. เปิด Developer Console (F12)
2. ดูข้อผิดพลาดในแท็บ Console
3. ตรวจสอบว่าใส่ `GOOGLE_SCRIPT_URL` ถูกต้องหรือไม่

### ปัญหา: ได้รับข้อผิดพลาด "Unauthorized"
**วิธีแก้:**
1. ตรวจสอบว่า Deploy แบบ "Anyone" ได้หรือไม่
2. ตรวจสอบว่าอนุญาตการเข้าถึงแล้วหรือไม่

### ปัญหา: ไม่ได้รับอีเมล
**วิธีแก้:**
1. ตรวจสอบกล่องข้อความขยะ (Spam)
2. ตรวจสอบว่าอีเมลในแบบฟอร์มถูกต้องหรือไม่
3. ตรวจสอบ Logs ใน Google Apps Script (View > Logs)

### ปัญหา: ข้อมูลไม่บันทึกลง Sheets
**วิธีแก้:**
1. ตรวจสอบ SPREADSHEET_ID ถูกต้องหรือไม่
2. ตรวจสอบว่า Script มีสิทธิ์เข้าถึง Sheets หรือไม่

## 📞 การติดต่อและสนับสนุน

หากพบปัญหาในการใช้งาน:
1. ตรวจสอบ Developer Console (F12) ในเว็บเบราว์เซอร์
2. ดู Execution Log ใน Google Apps Script
3. อ่านคู่มือนี้อีกครั้งอย่างละเอียด

## 📄 License

โปรเจกต์นี้สามารถนำไปใช้ได้ฟรีสำหรับหน่วยงานภาครัฐและองค์กรไม่แสวงหาผลกำไร

---

สร้างด้วย ❤️ สำหรับสถาบันพระปกเกล้า
