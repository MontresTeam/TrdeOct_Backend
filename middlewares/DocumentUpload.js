const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// ----------------------
// Cloudinary Config
// ----------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ----------------------
// Ensure local upload folder exists
// ----------------------
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ----------------------
// Multer Storage Config
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Accept only certain file types (optional)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, or PDF files are allowed"));
};

const upload = multer({ storage, fileFilter });

// ----------------------
// Document Upload Middleware
// ----------------------
const DocumentUpload = upload.fields([
  { name: "main", maxCount: 1 },   // Main ID document
]);

const uploadToCloudinary = async (req, res, next) => {
  DocumentUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const uploadedFiles = [];

      // ✅ Upload main file
      if (req.files && req.files.main) {
        const mainFile = req.files.main[0];
        const result = await cloudinary.uploader.upload(mainFile.path, {
          folder: "VerificationDocuments",
        });

        uploadedFiles.push({
          url: result.secure_url,
          type: "main",
          name: mainFile.originalname,
        });

        fs.unlinkSync(mainFile.path); // Remove local file
      }

      // ✅ Upload cover files
      if (req.files && req.files.covers) {
        for (const file of req.files.covers) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "VerificationDocuments",
          });

          uploadedFiles.push({
            url: result.secure_url,
            type: "cover",
            name: file.originalname,
          });

          fs.unlinkSync(file.path); // Remove local file
        }
      }

      // Attach uploaded files to request body
      req.body.uploadedFiles = uploadedFiles;

      next();
    } catch (error) {
      console.error("❌ Cloudinary Upload Error:", error);
      return res.status(500).json({ message: "Error uploading documents" });
    }
  });
};

module.exports = uploadToCloudinary;
