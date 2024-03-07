import { Router } from "express";
import multer from "multer";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import fs from "fs";
import archiver from "archiver"
import PDFDocument from 'pdfkit';
import express from "express";


const __dirname = dirname(fileURLToPath(import.meta.url));


const upload = multer().single('image');
const router = Router();

router.use(express.static(path.join(__dirname, "build")));

router.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

router.post("/upload-zip", upload, async (req, res) => {
    const imageBuffer = req.file.buffer;
    const slices = JSON.parse(req.body.slices);
    const outputDir = path.join(__dirname, 'temp', req.body.request_id);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    slices.forEach((slice, index) => {
        const filename = `${index}_${req.body.filename}`
        sharp(imageBuffer).extract({
            left: slice.x,
            top: slice.y,
            width: slice.width,
            height: slice.height
        }).toFile(path.join(outputDir, filename))
    });

    const archive = archiver("zip");
    const zipPath = path.join(outputDir, `${req.body.request_id}.zip`)
    const output = fs.createWriteStream(zipPath);

    archive.pipe(output);
    archive.directory(outputDir, false);
    await archive.finalize();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${req.body.request_id}.zip`);

    fs.createReadStream(zipPath).pipe(res);
    res.on("finish", () => {
        fs.unlinkSync(zipPath);
        fs.rmSync(outputDir, { recursive: true });
    })
})

router.post("/upload-pdf", upload, async (req, res) => {
    const imageBuffer = req.file.buffer;
    const { orientation } = req.body;
    const slices = JSON.parse(req.body.slices);

    const doc = new PDFDocument({
        size: "A4",
        margin: 14.1732,
        autoFirstPage: false,
        layout: req.body.orientation
    });

    const fitArray = orientation === "landscape" ? [813, 567] : [567, 813];

    const imagePromises = slices.map((slice, index) => {
        return new Promise((resolve, reject) => {
            sharp(imageBuffer).extract({
                left: slice.x,
                top: slice.y,
                width: slice.width,
                height: slice.height
            }).flatten({
                background: { r: 255, g: 255, b: 255 }
            }).jpeg({
                quality: 100,
                progressive: true,
                chromaSubsampling: '4:4:4'
            }).toBuffer((err, buffer, info) => {
                if (err) reject(err);
                doc.addPage().image(buffer, {
                    fit: fitArray,
                    align: 'center',
                    valign: 'center'
                });
                resolve();
            })
        })
    })

    Promise.all(imagePromises)
        .then(() => {
            doc.end();
            doc.pipe(res);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Algum erro aconteceu")
        })
})


export default router;