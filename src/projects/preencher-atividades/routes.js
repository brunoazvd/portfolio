import { Router } from "express";
import express from "express"
import multer from "multer";
import { dirname } from "path";
import path from "path";
import { fileURLToPath } from "url";
import TemplateController from "./src/api/controllers/TemplateController.js";


const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();
const upload = multer().single('image')

router.use(express.static(path.join(__dirname, "build")));

router.post("/templates/atividade", upload, TemplateController.generateAtividade)

router.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

export default router