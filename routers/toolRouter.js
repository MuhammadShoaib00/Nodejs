const express = require('express')
const router  = express.Router()
const path = require('path');
const multer = require('multer');
const {pdfToWord,docxToPdf,pngToJpg,jpgToPng,imageToText} = require('../controller/tools')

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer(
   { storage: storage}
).single('file');
router.post('/pdf-word',upload,pdfToWord)
router.post('/docx-pdf',upload,docxToPdf)
router.post('/png-jpg',upload,pngToJpg)
router.post('/jpg-png',upload,jpgToPng)
router.post('/image-text',upload,imageToText)
module.exports=router