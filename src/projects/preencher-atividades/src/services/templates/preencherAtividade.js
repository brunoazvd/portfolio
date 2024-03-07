import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import sharp from 'sharp';
import fontkit from '@pdf-lib/fontkit';
import generateFilename from '../../helpers/generateFilename.js'

async function fillPDFTemplate(imageBuffer, professor = '', turma = '') {
	// Verifica se a imagem é valida e obtem extensão
	const metadata = await sharp(imageBuffer).metadata();

	if (!metadata.format) {
		console.log('Invalid Image Buffer');
		return null;
	}
	const ext = metadata.format;

	// Carrega o Template do formulário PDF
	const pdfDoc = await PDFDocument.load(fs.readFileSync('./src/assets/templates/atividade.pdf'));

	// Cria referencias a fonte Candara que está salva no servidor
	const fontBytes = fs.readFileSync('./src/assets/fonts/Candarab.ttf');
	pdfDoc.registerFontkit(fontkit)
	const candara = await pdfDoc.embedFont(fontBytes)


	// Obter o formulário e os campos preenchíveis do mesmo
	const form = pdfDoc.getForm();
	const professorField = form.getTextField('Professor');
	const turmaField = form.getTextField('Turma');
	const atividadeField = form.getField('Atividade');

	// Preenchimento dos campos
	professorField.setText(professor);
	turmaField.setText(turma);

	// Aplica o estilo necessário nos campos
	turmaField.updateAppearances(candara);
	professorField.updateAppearances(candara);
	turmaField.setFontSize(16)
	professorField.setFontSize(16)



	// Switch para preenchimento da imagem
	if (ext == 'jpeg' || ext == 'jpg') {
		console.log('Case JPG or JPEG');
		const pdfImage = await pdfDoc.embedJpg(imageBuffer);
		atividadeField.setImage(pdfImage);
	} else if (ext == 'webp' || ext == 'png' || ext == 'gif') {
		const convertedBytes = await sharp(imageBuffer).toFormat('jpeg', { quality: 90 }).toBuffer();
		const pdfImage = await pdfDoc.embedJpg(convertedBytes);
		atividadeField.setImage(pdfImage);
	} else {
		console.log('Arquivo de Imagem Inválido')
		return null
	}

	form.flatten()

	// Salvar o PDF preenchido
	const modifiedPdfBytes = await pdfDoc.save({
		useObjectStreams: false,
		useCompression: true
	});

	return [modifiedPdfBytes, generateFilename()]
}

export default fillPDFTemplate