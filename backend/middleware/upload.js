const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Prevent dangerous executable and script files
  const disallowedExtensions = /exe|bat|cmd|sh|php|js|msi|vbs/;
  const isBlocked = disallowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (isBlocked) {
    return cb(new Error('Uploading executable or script files is prohibited!'));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: fileFilter,
});

module.exports = upload;
