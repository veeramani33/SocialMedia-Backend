const express = require("express");
const { upload, uploadFile } = require("../controllers/uploadController");
const router = express.Router();

// Use the upload middleware and controller
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
