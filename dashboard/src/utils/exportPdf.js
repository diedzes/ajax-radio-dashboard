import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const exportElementToPdf = async (element, filename) => {
  if (!element) {
    return
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff'
  })
  const imageData = canvas.toDataURL('image/png')

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imageProps = pdf.getImageProperties(imageData)
  const imageHeight = (imageProps.height * pdfWidth) / imageProps.width

  let heightLeft = imageHeight
  let position = 0

  pdf.addImage(imageData, 'PNG', 0, position, pdfWidth, imageHeight)
  heightLeft -= pdfHeight

  while (heightLeft > 0) {
    position = heightLeft - imageHeight
    pdf.addPage()
    pdf.addImage(imageData, 'PNG', 0, position, pdfWidth, imageHeight)
    heightLeft -= pdfHeight
  }

  pdf.save(filename)
}
