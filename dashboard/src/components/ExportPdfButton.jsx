import React from 'react'
import { exportElementToPdf } from '../utils/exportPdf'

function ExportPdfButton({ targetId, filename, label = 'Export PDF' }) {
  const handleClick = async () => {
    const element = document.getElementById(targetId)
    if (!element) {
      return
    }
    await exportElementToPdf(element, filename)
  }

  return (
    <button type="button" className="export-button" onClick={handleClick}>
      {label}
    </button>
  )
}

export default ExportPdfButton
