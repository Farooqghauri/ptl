// /lib/pdfServerLoader.ts
// import * as pdfjsLib from "pdfjs-dist";

// // Disable worker loading (avoids the 'fake worker' error)
// (pdfjsLib as any).GlobalWorkerOptions = {
//   workerSrc: "",
// };

// export async function getPdfDocument(buffer: Buffer) {
//   const pdf = await (pdfjsLib as any).getDocument({ data: buffer }).promise;
//   return pdf;
// }
