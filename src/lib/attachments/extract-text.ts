import { Buffer } from 'node:buffer'

/**
 * Extracts prompt-ready text from uploaded file bytes.
 */
export async function extractTextFromFile(file: File, bytes: Buffer): Promise<string> {
  const mimeType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  if (
    mimeType.includes('text') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.json')
  ) {
    return bytes.toString('utf8').slice(0, 15000)
  }

  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    try {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: bytes })
      const parsed = await parser.getText()
      await parser.destroy()
      return (parsed.text ?? '').slice(0, 15000)
    } catch {
      return ''
    }
  }

  return ''
}
