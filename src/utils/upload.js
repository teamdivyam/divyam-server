import multer from "multer";

// store files in memory (not on disk) before uploading to S3
const storage = multer.memoryStorage();

// 5 MB per file (you can adjust the limit)
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    // Optional: allow only images
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

export default upload;
