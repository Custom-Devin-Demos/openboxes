/*
 * Replicates the dynamic renderPdf() method that the rendering plugin's
 * doWithDynamicMethods used to inject into controllers.
 */
package grails.plugins.rendering

import grails.plugins.rendering.pdf.PdfRenderingService

trait RenderingSupport {

    PdfRenderingService pdfRenderingService

    def renderPdfDocument(Map args) {
        pdfRenderingService.render(args, response)
    }
}
