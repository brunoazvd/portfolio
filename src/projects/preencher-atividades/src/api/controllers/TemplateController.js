import fs from 'fs'
import path from 'path'
import preencherAtividade from '../../services/templates/preencherAtividade.js'
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const generateAtividade = async (req, res) => {
    console.log(req.body)
    const { professor, turma } = req.body;
    const [modifiedBuffer, filename] = await preencherAtividade(req.file.buffer, professor, turma);

    const tempPath = `./temp/${filename}`
    const fullPath = path.join(__dirname, "..", "..", "..", "temp", filename)

    fs.writeFile(tempPath, modifiedBuffer, err => {
        if (err) console.log(err, 'onWriteFile');
        res.sendFile(fullPath, err => {
            if (err) console.log(err, 'onDownload');
            fs.unlink(tempPath, err => {
                if (err) console.log(err, 'onUnlink');
                console.log(`FILE REMOVED: ${filename}`)
            })
        })
    })
}

export default {
    generateAtividade
};