import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { extractTextFromFile } from './extract-text'

function createTextFile(content: string, fileName: string): File {
  return new File([content], fileName, {
    type: 'text/plain',
  })
}

describe('extractTextFromFile', () => {
  it('extracts plain text from text file bytes', async () => {
    const file = createTextFile('alpha beta gamma', 'test.txt')
    const bytes = Buffer.from('alpha beta gamma', 'utf8')

    const result = await extractTextFromFile(file, bytes)
    expect(result).toContain('alpha beta gamma')
  })

  it('returns empty text for unsupported mime types', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'image.png', {
      type: 'image/png',
    })
    const bytes = Buffer.from([1, 2, 3])

    const result = await extractTextFromFile(file, bytes)
    expect(result).toBe('')
  })
})
