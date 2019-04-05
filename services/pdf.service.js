const hummus = require('hummus');
const memoryStreams = require('memory-streams');
const fs = require('fs');
const { promisify } = require('util');
const uuid = require('uuid');

const writeFilePromisified = promisify(fs.writeFile);
const unlinkPromisified = promisify(fs.unlink);

const {
  horizontalScaling, rotatingLeft, rotatingRight, widthA4, heightA4, verticalScaling,
} = require('../config');

const combinePDFBuffersToOneBufferWithFourPages = (pdfs) => {
  const outStream = new memoryStreams.WritableStream();
  try {
    const firstPDFStream = new hummus.PDFRStreamForBuffer(pdfs[0]);
    const pdfWriter = hummus.createWriterToModify(firstPDFStream, new hummus.PDFStreamForResponse(outStream));
    for (let i = 1; i < pdfs.length; i += 1) {
      const PDFstream = new hummus.PDFRStreamForBuffer(pdfs[i]);
      pdfWriter.appendPDFPagesFromPDF(PDFstream);
    }
    pdfWriter.end();
    const combineBuffer = outStream.toBuffer();
    outStream.end();
    return combineBuffer;
  } catch (e) {
    outStream.end();
    throw new Error(`Error during PDF combination: ${e.message}`);
  }
};

const calculateOffset = (contentContext) => {
  const offset = { x: 0, y: 0 };
  switch (contentContext.pageIndex) {
    case 0: {
      offset.y = heightA4 * 0.5;
      break;
    }
    case 1: {
      offset.y = heightA4 * 0.5;
      offset.x = widthA4 * 0.5;
      break;
    }
    case 2: {
      offset.x = widthA4 * 0.5;
      break;
    }
    default:
      break;
  }
  contentContext
    .Q()
    .q()
    .cm(horizontalScaling, 0, 0, verticalScaling, offset.x, offset.y);
  contentContext.pageIndex += 1;
};

const mergePDF = async (base64Array) => {
  try {
    const bufferArray = base64Array.map(b64string => Buffer.from(b64string, 'base64'));
    const combineBuffer = combinePDFBuffersToOneBufferWithFourPages(bufferArray);
    const fileId = uuid();


    await writeFilePromisified(`./public/pdf/bufferFile${fileId}.pdf`, combineBuffer, 'binary');
    const pdfWriter = hummus.createWriter(`./public/pdf/merge${fileId}.pdf`);

    const page = pdfWriter.createPage(0, 0, widthA4, heightA4);

    const contentContext = pdfWriter.startPageContentContext(page)
      .q()
      .cm(horizontalScaling, rotatingLeft, rotatingRight, verticalScaling, 0, 0);

    contentContext.pageIndex = 0;
    pdfWriter.mergePDFPagesToPage(page, `./public/pdf/bufferFile${fileId}.pdf`,
      { type: hummus.eRangeTypeSpecific, specificRanges: [[0, 3]] },
      calculateOffset.bind(this, contentContext));

    await unlinkPromisified(`./public/pdf/bufferFile${fileId}.pdf`);
    contentContext.Q();
    pdfWriter.writePage(page).end();
    return `./public/pdf/merge${fileId}.pdf`;
  } catch (e) {
    throw new Error(`Error merge PDF: ${e.message}`);
  }
};

module.exports = {
  mergePDF,
};
