const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const markdown = require('markdown').markdown;
const Tesseract = require('tesseract.js');
const HTMLtoDOCX = require('html-docx-js');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const Jimp = require('jimp');
const pdfToWord = async (req, res) => {
  const filePath = req.file.path;

  try {
    if (!fs.existsSync(filePath)) {
      res.status(400).send('File not found.');
      return;
    }

    // Read PDF file
    const pdfData = fs.readFileSync(filePath);
   

    // Extract text from PDF using pdf-parse
    const data = await pdfParse(pdfData);
    const pdfText = data.text;


    // Convert extracted text to HTML using markdown
    const html = markdown.toHTML(pdfText);
 

    // Convert HTML to Word document using html-docx-js
    const docx = HTMLtoDOCX.asBlob(html);

    // Convert Blob to Buffer
    const arrayBuffer = await docx.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Respond with the DOCX file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.docx"');
    res.send(buffer);

    // Clean up after response is sent
    fs.unlinkSync(filePath);
  } catch (err) {
    res.status(500).send('An error occurred while processing the file.');
  }
};
const convertDocxToPdf = async (inputPath, outputPath, res) => {
  try {
      const { value: html } = await mammoth.convertToHtml({ path: inputPath });
      console.log('HTML content generated from DOCX');

      // Save HTML content to a file for inspection
      const htmlPath = `./uploads/${path.parse(inputPath).name}.html`;
      fs.writeFileSync(htmlPath, html);
      console.log(html)
      console.log(`HTML content saved to ${htmlPath}`);

      if (!html || html.trim() === '') {
          console.error('Generated HTML is empty');
          res.status(500).send('Error converting file: Generated HTML is empty');
          return;
      }

      const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      const page = await browser.newPage();

      // Optimize HTML (example: remove all images)
      const optimizedHtml = html.replace(/<img[^>]*>/g, '');
      await page.setContent(optimizedHtml, { waitUntil: 'networkidle0' });
      console.log('HTML content set in Puppeteer');

      const startTime = Date.now();
      await page.pdf({ path: outputPath, format: 'A4', timeout: 60000 }); // Increased timeout to 60 seconds
      const endTime = Date.now();

      console.log(`PDF generated successfully in ${endTime - startTime}ms`);

      await browser.close();

      res.download(outputPath, (err) => {
          if (err) {
              console.log('Error sending file:', err);
              res.status(500).send('Error sending file');
          }
      });
  } catch (err) {
      console.log('Error converting DOCX to PDF:', err);
      res.status(500).send('Error converting file');
  }
};

const docxToPdf= (req, res) => {
 const inputPath = req.file.path;
  const outputPath = `./uploads/${path.parse(req.file.filename).name}.pdf`;
  convertDocxToPdf(inputPath, outputPath, res);
          }
  
const pngToJpg=(req,res)=>{
  const imagePath = req.file.path;
  const outputImagePath = `./uploads/${path.parse(req.file.filename).name}.jpg`;

  Jimp.read(imagePath)
      .then(image => {
          return image.quality(80) // Set JPEG quality to 80%
                       .write(outputImagePath); // Write the image in JPEG format
      })
      .then(() => {
          res.status(200).json({ message: 'File converted successfully', convertedFile: outputImagePath });
      })
      .catch(err => {
          console.error('Error converting:', err);
          res.status(500).json({ error: 'Error converting file' });
      });
}

const jpgToPng=(req,res)=>{
  const imagePath = req.file.path;
  const outputImagePath = `./uploads/${path.parse(req.file.filename).name}.png`;

  Jimp.read(imagePath)
      .then(image => {
          return image.write(outputImagePath); // Write the image in PNG format
      })
      .then(() => {
          res.status(200).json({ message: 'File converted successfully', convertedFile: outputImagePath });
      })
      .catch(err => {
          console.error('Error converting:', err);
          res.status(500).json({ error: 'Error converting file' });
      });
}
const imageToText =(req,res)=>{
  const imagePath = path.join(__dirname, req.file.path);

  Tesseract.recognize(
    imagePath,
    'eng',
    {
      logger: m => console.log(m), // Optional: add logger to see progress
    }
  ).then(({ data: { text } }) => {
    // Delete the uploaded file after processing
    fs.unlinkSync(imagePath);
    
    res.send(`
      <h2>Recognized text:</h2>
      <pre>${text}</pre>
      <a href="/">Go back</a>
    `);
  }).catch(err => {
    console.error('Error:', err);
    res.status(500).send('An error occurred while processing the image.');
  });
}
module.exports={pdfToWord,docxToPdf,pngToJpg,jpgToPng,imageToText}