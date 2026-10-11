const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');

/**
 * Extracts readable text from uploaded file buffer based on extension/mimetype.
 * Supports: .pdf, .docx, .pptx, .txt
 */
async function extractTextFromFile(file) {
  const originalName = (file.originalname || '').toLowerCase();
  const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);

  if (!buffer) {
    throw new Error('No file buffer or file path provided.');
  }

  // 1. PDF
  if (originalName.endsWith('.pdf') || (file.mimetype && file.mimetype.includes('pdf'))) {
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(buffer);
      return data.text || '';
    } else if (pdfParse && typeof pdfParse.default === 'function') {
      const data = await pdfParse.default(buffer);
      return data.text || '';
    } else {
      console.warn('pdfParse is not a function, returning raw buffer string');
      return buffer.toString('utf8');
    }
  }

  // 2. Word (.docx)
  if (originalName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // 3. PowerPoint (.pptx)
  if (originalName.endsWith('.pptx')) {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    let textChunks = [];

    zipEntries.forEach((entry) => {
      // Slides XML content contains the text
      if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
        const slideXml = entry.getData().toString('utf8');
        // Extract text inside <a:t> tags
        const matches = slideXml.match(/<a:t>([\s\S]*?)<\/a:t>/g);
        if (matches) {
          matches.forEach((tag) => {
            const cleanText = tag.replace(/<\/?a:t>/g, '').trim();
            if (cleanText) textChunks.push(cleanText);
          });
        }
      }
    });

    return textChunks.join('\n');
  }

  // 4. Plain text / Markdown / JSON
  if (originalName.endsWith('.txt') || originalName.endsWith('.md') || originalName.endsWith('.json')) {
    return buffer.toString('utf8');
  }

  // Fallback try reading as utf8
  return buffer.toString('utf8');
}

module.exports = {
  extractTextFromFile,
};
