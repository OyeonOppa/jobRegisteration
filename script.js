// ==================================================
// Configuration
// ==================================================

// !!! สำคัญ: เปลี่ยน URL นี้เป็น URL ของ Google Apps Script ที่คุณ Deploy แล้ว
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEGz_Bpfwuc7k_51vsRHcGNI-4eN_mVkCibny3VFyQNL6Tf4LIRhsBGVTuAW23uHg/exec';

// ==================================================
// Form Validation
// ==================================================

document.addEventListener('DOMContentLoaded', function() {
    // Bootstrap validation
    const form = document.getElementById('applicationForm');
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();

        // Check form validity
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            
            // Scroll to first invalid field
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
            
            return false;
        }

        // Form is valid, proceed with submission
        form.classList.add('was-validated');
        handleFormSubmit();
    });

    // File size validation
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            validateFileSize(this);
        });
    });

    // ID Card validation (13 digits)
    const idCardInput = document.getElementById('idCard');
    if (idCardInput) {
        idCardInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // Phone validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
});

// ==================================================
// Dynamic Field Management
// ==================================================

// Add Education Entry
function addEducation() {
    const container = document.getElementById('educationContainer');
    const newEntry = document.createElement('div');
    newEntry.className = 'education-entry border p-3 mb-3 rounded fade-in';
    newEntry.innerHTML = `
        <div class="row g-3">
            <div class="col-md-3">
                <label class="form-label">ระดับการศึกษา</label>
                <select class="form-select" name="eduLevel[]">
                    <option value="">เลือก</option>
                    <option value="ปริญญาเอก">ปริญญาเอก</option>
                    <option value="ปริญญาโท">ปริญญาโท</option>
                    <option value="ปริญญาตรี">ปริญญาตรี</option>
                    <option value="ปวส.">ปวส.</option>
                    <option value="ม.6">ม.6</option>
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label">ชื่อสถานศึกษา</label>
                <input type="text" class="form-control" name="eduInstitution[]">
            </div>
            <div class="col-md-3">
                <label class="form-label">ปีที่สำเร็จการศึกษา</label>
                <input type="number" class="form-control" name="eduYear[]" min="1950" max="2030">
            </div>
            <div class="col-md-4">
                <label class="form-label">วุฒิที่ได้รับ</label>
                <input type="text" class="form-control" name="eduDegree[]">
            </div>
            <div class="col-md-4">
                <label class="form-label">สาขาวิชา</label>
                <input type="text" class="form-control" name="eduMajor[]">
            </div>
            <div class="col-md-4">
                <label class="form-label">เกรดเฉลี่ย (GPA)</label>
                <input type="number" class="form-control" name="eduGPA[]" step="0.01" min="0" max="4">
            </div>
            <div class="col-12">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeEntry(this)">
                    ลบรายการนี้
                </button>
            </div>
        </div>
    `;
    container.appendChild(newEntry);
}

// Add Work Entry
function addWork() {
    const container = document.getElementById('workContainer');
    const newEntry = document.createElement('div');
    newEntry.className = 'work-entry border p-3 mb-3 rounded fade-in';
    newEntry.innerHTML = `
        <div class="row g-3">
            <div class="col-md-8">
                <label class="form-label">ชื่อบริษัท/หน่วยงาน</label>
                <input type="text" class="form-control" name="workCompany[]">
            </div>
            <div class="col-md-4">
                <label class="form-label">ตำแหน่ง</label>
                <input type="text" class="form-control" name="workPosition[]">
            </div>
            <div class="col-md-3">
                <label class="form-label">ปีที่เริ่มงาน</label>
                <input type="number" class="form-control" name="workStartYear[]" min="1990" max="2030">
            </div>
            <div class="col-md-3">
                <label class="form-label">ปีที่ออก</label>
                <input type="number" class="form-control" name="workEndYear[]" min="1990" max="2030">
            </div>
            <div class="col-md-6">
                <label class="form-label">เงินเดือนสุดท้าย (บาท)</label>
                <input type="number" class="form-control" name="workSalary[]">
            </div>
            <div class="col-md-12">
                <label class="form-label">สาเหตุที่ออก</label>
                <input type="text" class="form-control" name="workReason[]">
            </div>
            <div class="col-12">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeEntry(this)">
                    ลบรายการนี้
                </button>
            </div>
        </div>
    `;
    container.appendChild(newEntry);
}

// Remove Entry
function removeEntry(button) {
    const entry = button.closest('.education-entry, .work-entry');
    entry.style.opacity = '0';
    setTimeout(() => entry.remove(), 300);
}

// ==================================================
// File Validation
// ==================================================

function validateFileSize(input) {
    const maxSize = input.accept.includes('pdf') ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB for PDF, 2MB for images
    
    if (input.files.length > 0) {
        const file = input.files[0];
        
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
            alert(`ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน ${maxSizeMB} MB`);
            input.value = '';
            return false;
        }
    }
    return true;
}

// ==================================================
// Form Submission
// ==================================================

async function handleFormSubmit() {
    const form = document.getElementById('applicationForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitText.textContent = 'กำลังส่งข้อมูล...';
    submitSpinner.classList.remove('d-none');

    try {
        // Prepare form data
        const formData = new FormData(form);
        
        // Convert files to base64
        const filesPromises = [];
        const fileFields = ['photoUpload', 'resumeUpload', 'transcriptUpload', 'otherDocs'];
        
        for (const fieldName of fileFields) {
            const fileInput = document.getElementById(fieldName);
            if (fileInput && fileInput.files.length > 0) {
                filesPromises.push(fileToBase64(fileInput.files[0], fieldName));
            }
        }

        const filesData = await Promise.all(filesPromises);

        // Collect education history
        const education = collectArrayData([
            'eduLevel', 'eduInstitution', 'eduYear', 
            'eduDegree', 'eduMajor', 'eduGPA'
        ]);

        // Collect work history
        const work = collectArrayData([
            'workCompany', 'workPosition', 'workStartYear', 
            'workEndYear', 'workSalary', 'workReason'
        ]);

        // Prepare final data object
        const data = {
            // Personal Information
            position: formData.get('position'),
            expectedSalary: formData.get('expectedSalary'),
            startDate: formData.get('startDate'),
            title: formData.get('title'),
            firstNameTH: formData.get('firstNameTH'),
            lastNameTH: formData.get('lastNameTH'),
            firstNameEN: formData.get('firstNameEN'),
            lastNameEN: formData.get('lastNameEN'),
            address: formData.get('address'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            birthDate: formData.get('birthDate'),
            idCard: formData.get('idCard'),
            nationality: formData.get('nationality'),
            religion: formData.get('religion'),
            maritalStatus: formData.get('maritalStatus'),
            militaryStatus: formData.get('militaryStatus'),
            
            // Education & Work
            education: education,
            work: work,
            
            // Skills
            computerSkills: formData.get('computerSkills'),
            englishLevel: formData.get('englishLevel'),
            otherLanguages: formData.get('otherLanguages'),
            specialSkills: formData.get('specialSkills'),
            
            // Files
            files: filesData,
            
            // Timestamp
            timestamp: new Date().toISOString()
        };

        // Send to Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Show success modal
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            successModal.show();
            
            // Reset form
            form.reset();
            form.classList.remove('was-validated');
        } else {
            throw new Error(result.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message + '\n\nกรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitText.textContent = 'ส่งใบสมัคร';
        submitSpinner.classList.add('d-none');
    }
}

// ==================================================
// Utility Functions
// ==================================================

// Convert file to base64
function fileToBase64(file, fieldName) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            fieldName: fieldName,
            fileName: file.name,
            mimeType: file.type,
            data: reader.result.split(',')[1] // Get base64 data without prefix
        });
        reader.onerror = error => reject(error);
    });
}

// Collect array data from form
function collectArrayData(fieldNames) {
    const result = [];
    const firstField = document.getElementsByName(fieldNames[0] + '[]');
    
    for (let i = 0; i < firstField.length; i++) {
        const entry = {};
        fieldNames.forEach(fieldName => {
            const elements = document.getElementsByName(fieldName + '[]');
            if (elements[i]) {
                entry[fieldName.replace('edu', '').replace('work', '').toLowerCase()] = 
                    elements[i].value;
            }
        });
        result.push(entry);
    }
    
    return result;
}

// Calculate age from birth date
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}
