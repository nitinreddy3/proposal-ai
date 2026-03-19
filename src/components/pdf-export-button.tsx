'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PdfExportButtonProps {
  proposalId: string
  title: string
}

/** Generates a PDF from the proposal editor content using jsPDF + html2canvas. */
export function PdfExportButton({ proposalId, title }: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setIsExporting(true)

    try {
      const res = await fetch(`/api/proposals/${proposalId}`)
      if (!res.ok) throw new Error('Failed to fetch proposal')

      const proposal = await res.json()
      const htmlContent = proposal.generated_content
        ? typeof proposal.generated_content === 'string'
          ? JSON.parse(proposal.generated_content)
          : proposal.generated_content
        : ''

      if (!htmlContent) {
        toast.error('No content to export. Generate content first.')
        return
      }

      const { default: jsPDF } = await import('jspdf')

      const container = document.createElement('div')
      container.innerHTML = htmlContent
      container.style.cssText =
        'width:650px;padding:40px;font-family:Georgia,serif;font-size:12px;line-height:1.6;color:#1a1a1a;position:absolute;left:-9999px;top:0;'

      const style = document.createElement('style')
      style.textContent = `
        h2 { font-size: 18px; font-weight: bold; margin: 24px 0 8px; color: #111; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        h3 { font-size: 15px; font-weight: bold; margin: 18px 0 6px; color: #222; }
        p { margin: 0 0 10px; }
        ul, ol { margin: 0 0 10px; padding-left: 20px; }
        li { margin-bottom: 4px; }
        strong { font-weight: bold; }
      `
      container.prepend(style)

      const header = document.createElement('div')
      header.innerHTML = `
        <div style="border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:24px;">
          <h1 style="font-size:24px;font-weight:bold;margin:0 0 4px;color:#111;">${title}</h1>
          ${proposal.client_name ? `<p style="font-size:14px;color:#555;margin:0;">Prepared for: ${proposal.client_name}</p>` : ''}
          <p style="font-size:12px;color:#777;margin:4px 0 0;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      `
      container.prepend(header)

      document.body.appendChild(container)

      const { default: html2canvas } = await import('html2canvas-pro')
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      document.body.removeChild(container)

      const imgWidth = 190
      const pageHeight = 277
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')

      let heightLeft = imgHeight
      let position = 10

      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        10,
        position,
        imgWidth,
        imgHeight,
      )
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          10,
          position,
          imgWidth,
          imgHeight,
        )
        heightLeft -= pageHeight
      }

      const safeTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim()
      pdf.save(`${safeTitle || 'Proposal'}.pdf`)
      toast.success('PDF exported successfully!')
    } catch {
      toast.error('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [proposalId, title])

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export PDF
    </Button>
  )
}
