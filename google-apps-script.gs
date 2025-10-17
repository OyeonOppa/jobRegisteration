// ==================================================
// Configuration - กรุณาแก้ไขค่าเหล่านี้
// ==================================================

const CONFIG = {
  // Google Spreadsheet ID (จาก URL ของ Spreadsheet)
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  
  // Google Drive Folder ID สำหรับเก็บเอกสารผู้สมัคร
  MAIN_FOLDER_ID: 'YOUR_MAIN_FOLDER_ID_HERE',
  
  // อีเมลของแอดมินที่จะได้รับการแจ้งเตือน
  ADMIN_EMAIL: 'admin@example.com',
  
  // ชื่อหน่วยงาน
  ORGANIZATION_NAME: 'สถาบันพระปกเกล้า',
  ORGANIZATION_NAME_EN: 'King Prajadhipok\'s Institute'
};

// ==================================================
// Main Function - รับข้อมูลจากฟอร์ม
// ==================================================

function doPost(e) {
  try {
    // Parse JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Generate unique applicant ID
    const applicantId = generateApplicantId();
    
    // Create folder for applicant
    const applicantFolder = createApplicantFolder(applicantId, data);
    
    // Upload files to Google Drive
    const uploadedFiles = uploadFilesToDrive(data.files, applicantFolder);
    
    // Save data to Google Sheets
    saveToSpreadsheet(data, applicantId, uploadedFiles);
    
    // Create PDF application form
    const pdfFile = createPDFForm(data, applicantId, applicantFolder);
    
    // Send confirmation email to applicant
    sendApplicantEmail(data, applicantId);
    
    // Send notification email to admin
    sendAdminEmail(data, applicantId, applicantFolder, pdfFile);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'ส่งใบสมัครสำเร็จ',
        applicantId: applicantId
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================================================
// Generate Applicant ID
// ==================================================

function generateApplicantId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = ('0' + (now.getMonth() + 1)).slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `APP${year}${month}${random}`;
}

// ==================================================
// Create Folder Structure
// ==================================================

function createApplicantFolder(applicantId, data) {
  const mainFolder = DriveApp.getFolderById(CONFIG.MAIN_FOLDER_ID);
  
  // Create folder name with applicant info
  const folderName = `${applicantId}_${data.firstNameTH}_${data.lastNameTH}`;
  const applicantFolder = mainFolder.createFolder(folderName);
  
  // Add description
  applicantFolder.setDescription(`ผู้สมัคร: ${data.firstNameTH} ${data.lastNameTH}\nตำแหน่ง: ${data.position}\nวันที่สมัคร: ${new Date().toLocaleDateString('th-TH')}`);
  
  return applicantFolder;
}

// ==================================================
// Upload Files to Google Drive
// ==================================================

function uploadFilesToDrive(files, folder) {
  const uploadedFiles = {};
  
  if (!files || files.length === 0) {
    return uploadedFiles;
  }
  
  files.forEach(file => {
    try {
      // Decode base64
      const blob = Utilities.newBlob(
        Utilities.base64Decode(file.data),
        file.mimeType,
        file.fileName
      );
      
      // Upload to folder
      const driveFile = folder.createFile(blob);
      
      uploadedFiles[file.fieldName] = {
        id: driveFile.getId(),
        name: driveFile.getName(),
        url: driveFile.getUrl()
      };
      
      Logger.log(`Uploaded ${file.fileName} successfully`);
      
    } catch (error) {
      Logger.log(`Error uploading ${file.fileName}: ${error.toString()}`);
    }
  });
  
  return uploadedFiles;
}

// ==================================================
// Save to Google Sheets
// ==================================================

function saveToSpreadsheet(data, applicantId, uploadedFiles) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName('ผู้สมัครงาน');
  
  // Create sheet if not exists
  if (!sheet) {
    sheet = ss.insertSheet('ผู้สมัครงาน');
    
    // Add headers
    const headers = [
      'รหัสผู้สมัคร', 'วันที่สมัคร', 'ตำแหน่ง', 'คำนำหน้า', 'ชื่อ (TH)', 'นามสกุล (TH)',
      'ชื่อ (EN)', 'นามสกุล (EN)', 'อีเมล', 'เบอร์โทร', 'ที่อยู่', 'วันเกิด',
      'บัตรประชาชน', 'สัญชาติ', 'ศาสนา', 'สถานภาพสมรส', 'สถานภาพทหาร',
      'เงินเดือนที่ต้องการ', 'วันที่เริ่มงานได้', 'ทักษะคอมพิวเตอร์', 'ภาษาอังกฤษ',
      'ภาษาอื่นๆ', 'ความสามารถพิเศษ', 'ประวัติการศึกษา', 'ประวัติการทำงาน',
      'ลิงก์โฟลเดอร์', 'สถานะ'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  // Prepare education history
  const educationText = data.education.map((edu, index) => 
    `${index + 1}. ${edu.level || ''} ${edu.degree || ''} ${edu.major || ''} จาก ${edu.institution || ''} (${edu.year || ''})`
  ).join('\n');
  
  // Prepare work history
  const workText = data.work.map((work, index) => 
    `${index + 1}. ${work.position || ''} ที่ ${work.company || ''} (${work.startyear || ''}-${work.endyear || ''})`
  ).join('\n');
  
  // Get folder URL
  const folderId = uploadedFiles.photoUpload?.id || uploadedFiles.resumeUpload?.id;
  const folderUrl = folderId ? DriveApp.getFileById(folderId).getParents().next().getUrl() : '';
  
  // Add new row
  const newRow = [
    applicantId,
    new Date().toLocaleDateString('th-TH'),
    data.position || '',
    data.title || '',
    data.firstNameTH || '',
    data.lastNameTH || '',
    data.firstNameEN || '',
    data.lastNameEN || '',
    data.email || '',
    data.phone || '',
    data.address || '',
    data.birthDate || '',
    data.idCard || '',
    data.nationality || '',
    data.religion || '',
    data.maritalStatus || '',
    data.militaryStatus || '',
    data.expectedSalary || '',
    data.startDate || '',
    data.computerSkills || '',
    data.englishLevel || '',
    data.otherLanguages || '',
    data.specialSkills || '',
    educationText,
    workText,
    folderUrl,
    'รอพิจารณา'
  ];
  
  sheet.appendRow(newRow);
  
  Logger.log('Data saved to spreadsheet successfully');
}

// ==================================================
// Create PDF Application Form
// ==================================================

function createPDFForm(data, applicantId, folder) {
  try {
    // Create a Google Doc first
    const doc = DocumentApp.create(`ใบสมัคร_${applicantId}_${data.firstNameTH}_${data.lastNameTH}`);
    const body = doc.getBody();
    
    // Add header
    body.appendParagraph(CONFIG.ORGANIZATION_NAME)
      .setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    body.appendParagraph(CONFIG.ORGANIZATION_NAME_EN)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    body.appendParagraph('ใบสมัครงาน / Application for Employment')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    body.appendParagraph(''); // Spacer
    
    // Add applicant information
    body.appendParagraph(`รหัสผู้สมัคร: ${applicantId}`).setBold(true);
    body.appendParagraph(`วันที่สมัคร: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    
    body.appendParagraph(''); // Spacer
    
    // Section 1: Position
    body.appendParagraph('1. ตำแหน่งที่สมัคร').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph(`ตำแหน่ง: ${data.position || '-'}`);
    body.appendParagraph(`เงินเดือนที่ต้องการ: ${data.expectedSalary || '-'} บาท`);
    body.appendParagraph(`วันที่พร้อมเริ่มงาน: ${data.startDate || '-'}`);
    
    body.appendParagraph(''); // Spacer
    
    // Section 2: Personal Information
    body.appendParagraph('2. ข้อมูลส่วนตัว').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph(`ชื่อ-นามสกุล: ${data.title || ''} ${data.firstNameTH || ''} ${data.lastNameTH || ''}`);
    body.appendParagraph(`Name: ${data.firstNameEN || ''} ${data.lastNameEN || ''}`);
    body.appendParagraph(`ที่อยู่: ${data.address || '-'}`);
    body.appendParagraph(`โทรศัพท์: ${data.phone || '-'}`);
    body.appendParagraph(`อีเมล: ${data.email || '-'}`);
    body.appendParagraph(`วันเกิด: ${data.birthDate || '-'}`);
    body.appendParagraph(`เลขบัตรประชาชน: ${data.idCard || '-'}`);
    body.appendParagraph(`สัญชาติ: ${data.nationality || '-'}`);
    body.appendParagraph(`ศาสนา: ${data.religion || '-'}`);
    body.appendParagraph(`สถานภาพสมรส: ${data.maritalStatus || '-'}`);
    body.appendParagraph(`สถานภาพทหาร: ${data.militaryStatus || '-'}`);
    
    body.appendParagraph(''); // Spacer
    
    // Section 3: Education
    body.appendParagraph('3. ประวัติการศึกษา').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    if (data.education && data.education.length > 0) {
      data.education.forEach((edu, index) => {
        body.appendParagraph(`${index + 1}. ${edu.level || ''} - ${edu.degree || ''} ${edu.major || ''}`);
        body.appendParagraph(`   สถาบัน: ${edu.institution || ''} (${edu.year || ''})`);
        body.appendParagraph(`   เกรดเฉลี่ย: ${edu.gpa || '-'}`);
      });
    } else {
      body.appendParagraph('-');
    }
    
    body.appendParagraph(''); // Spacer
    
    // Section 4: Work Experience
    body.appendParagraph('4. ประวัติการทำงาน').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    if (data.work && data.work.length > 0) {
      data.work.forEach((work, index) => {
        body.appendParagraph(`${index + 1}. ${work.position || ''} ที่ ${work.company || ''}`);
        body.appendParagraph(`   ระยะเวลา: ${work.startyear || ''} - ${work.endyear || ''}`);
        body.appendParagraph(`   เงินเดือน: ${work.salary || '-'} บาท`);
        body.appendParagraph(`   เหตุผลที่ออก: ${work.reason || '-'}`);
      });
    } else {
      body.appendParagraph('-');
    }
    
    body.appendParagraph(''); // Spacer
    
    // Section 5: Skills
    body.appendParagraph('5. ความสามารถพิเศษ').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendParagraph(`ทักษะคอมพิวเตอร์: ${data.computerSkills || '-'}`);
    body.appendParagraph(`ภาษาอังกฤษ: ${data.englishLevel || '-'}`);
    body.appendParagraph(`ภาษาอื่นๆ: ${data.otherLanguages || '-'}`);
    body.appendParagraph(`ความสามารถพิเศษอื่นๆ: ${data.specialSkills || '-'}`);
    
    // Save and close the document
    doc.saveAndClose();
    
    // Convert to PDF
    const docFile = DriveApp.getFileById(doc.getId());
    const pdfBlob = docFile.getAs('application/pdf');
    pdfBlob.setName(`ใบสมัคร_${applicantId}.pdf`);
    
    // Save PDF to folder
    const pdfFile = folder.createFile(pdfBlob);
    
    // Delete the temporary Doc file
    docFile.setTrashed(true);
    
    Logger.log('PDF created successfully');
    
    return pdfFile;
    
  } catch (error) {
    Logger.log('Error creating PDF: ' + error.toString());
    return null;
  }
}

// ==================================================
// Send Email to Applicant
// ==================================================

function sendApplicantEmail(data, applicantId) {
  const subject = `ยืนยันการรับใบสมัครงาน - ${CONFIG.ORGANIZATION_NAME}`;
  
  const htmlBody = `
    <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${CONFIG.ORGANIZATION_NAME}</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">${CONFIG.ORGANIZATION_NAME_EN}</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e3a5f; margin-top: 0;">เรียน คุณ${data.firstNameTH} ${data.lastNameTH}</h2>
        
        <p>ขอบคุณที่สนใจสมัครงานกับ${CONFIG.ORGANIZATION_NAME}</p>
        
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>รายละเอียดการสมัคร:</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096;">รหัสผู้สมัคร:</td>
              <td style="padding: 8px 0; font-weight: bold;">${applicantId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;">ตำแหน่งที่สมัคร:</td>
              <td style="padding: 8px 0;">${data.position}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096;">วันที่สมัคร:</td>
              <td style="padding: 8px 0;">${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>
        
        <p>เราได้รับใบสมัครของท่านเรียบร้อยแล้ว ทีมงานจะพิจารณาและติดต่อกลับภายใน 7-14 วันทำการ</p>
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          หากมีข้อสงสัยประการใด กรุณาติดต่อกลับมาที่อีเมลนี้<br>
          พร้อมระบุรหัสผู้สมัคร: <strong>${applicantId}</strong>
        </p>
        
        <p style="margin-top: 30px; color: #1e3a5f;">
          ขอแสดงความนับถือ<br>
          <strong>${CONFIG.ORGANIZATION_NAME}</strong>
        </p>
      </div>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      htmlBody: htmlBody
    });
    
    Logger.log(`Confirmation email sent to ${data.email}`);
    
  } catch (error) {
    Logger.log('Error sending applicant email: ' + error.toString());
  }
}

// ==================================================
// Send Email to Admin
// ==================================================

function sendAdminEmail(data, applicantId, folder, pdfFile) {
  const subject = `[ผู้สมัครใหม่] ${data.firstNameTH} ${data.lastNameTH} - ${data.position}`;
  
  const htmlBody = `
    <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="background: #e53e3e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🔔 มีผู้สมัครงานใหม่</h2>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <h3 style="color: #1e3a5f; margin-top: 0;">ข้อมูลผู้สมัคร</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; background: #f7fafc; font-weight: bold; width: 200px;">รหัสผู้สมัคร:</td>
            <td style="padding: 10px; background: #f7fafc;">${applicantId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">ชื่อ-นามสกุล:</td>
            <td style="padding: 10px;">${data.title} ${data.firstNameTH} ${data.lastNameTH}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background: #f7fafc; font-weight: bold;">ตำแหน่งที่สมัคร:</td>
            <td style="padding: 10px; background: #f7fafc;">${data.position}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">อีเมล:</td>
            <td style="padding: 10px;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; background: #f7fafc; font-weight: bold;">เบอร์โทร:</td>
            <td style="padding: 10px; background: #f7fafc;">${data.phone}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">วันที่สมัคร:</td>
            <td style="padding: 10px;">${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        </table>
        
        <div style="margin: 30px 0; padding: 20px; background: #f7fafc; border-radius: 8px;">
          <h4 style="margin-top: 0; color: #1e3a5f;">เอกสารและลิงก์</h4>
          <p style="margin: 10px 0;">
            📁 <a href="${folder.getUrl()}" style="color: #4a90e2; text-decoration: none;">ดูโฟลเดอร์เอกสารผู้สมัคร</a>
          </p>
          ${pdfFile ? `<p style="margin: 10px 0;">📄 <a href="${pdfFile.getUrl()}" style="color: #4a90e2; text-decoration: none;">ดาวน์โหลดใบสมัคร PDF</a></p>` : ''}
        </div>
        
        <p style="color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          อีเมลนี้ถูกส่งอัตโนมัติจากระบบรับสมัครงานออนไลน์
        </p>
      </div>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: subject,
      htmlBody: htmlBody
    });
    
    Logger.log(`Admin notification sent to ${CONFIG.ADMIN_EMAIL}`);
    
  } catch (error) {
    Logger.log('Error sending admin email: ' + error.toString());
  }
}

// ==================================================
// Test Function
// ==================================================

function testCreatePDF() {
  const testData = {
    position: 'นักวิชาการ',
    title: 'นาย',
    firstNameTH: 'สมชาย',
    lastNameTH: 'ใจดี',
    firstNameEN: 'Somchai',
    lastNameEN: 'Jaidee',
    email: 'test@example.com',
    phone: '0812345678',
    address: '123 ถนนพระราม 4 กรุงเทพฯ 10500',
    birthDate: '1990-01-01',
    idCard: '1234567890123',
    nationality: 'ไทย',
    religion: 'พุทธ',
    maritalStatus: 'โสด',
    militaryStatus: 'ผ่านการเกณฑ์แล้ว',
    expectedSalary: '30000',
    startDate: '2024-01-01',
    computerSkills: 'Microsoft Office, Photoshop',
    englishLevel: 'ดี',
    otherLanguages: 'จีนกลาง - พอใช้',
    specialSkills: 'การนำเสนอ',
    education: [
      {
        level: 'ปริญญาตรี',
        institution: 'มหาวิทยาลัยธรรมศาสตร์',
        year: '2555',
        degree: 'บธ.บ.',
        major: 'การจัดการ',
        gpa: '3.50'
      }
    ],
    work: [
      {
        company: 'บริษัท ABC จำกัด',
        position: 'เจ้าหน้าที่ฝ่ายทรัพยากรบุคคล',
        startyear: '2556',
        endyear: '2560',
        salary: '25000',
        reason: 'ต้องการก้าวหน้าในอาชีพ'
      }
    ]
  };
  
  const applicantId = 'TEST001';
  const folder = DriveApp.getFolderById(CONFIG.MAIN_FOLDER_ID);
  
  createPDFForm(testData, applicantId, folder);
}
