/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.api

import grails.converters.JSON
import grails.validation.ValidationException
import org.apache.commons.csv.CSVPrinter
import org.grails.web.json.JSONObject
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Organization
import org.pih.warehouse.invoice.Invoice
import org.pih.warehouse.invoice.InvoiceIdentifierService
import org.pih.warehouse.invoice.InvoiceItemCandidate
import org.pih.warehouse.invoice.InvoiceItem
import org.pih.warehouse.invoice.InvoiceList
import org.pih.warehouse.invoice.InvoiceType
import org.pih.warehouse.invoice.InvoiceTypeCode
import org.pih.warehouse.invoice.InvoiceStatus

class InvoiceApiController {

    InvoiceIdentifierService invoiceIdentifierService
    def invoiceDataService
    def invoiceService
    def documentService

    def list() {
        Location location = Location.get(session.warehouse.id)
        params.partyFromId = location?.organization?.id
        Boolean includeInvoiceItems = params.boolean("invoiceItems", false)

        List<InvoiceList> invoices = invoiceService.getInvoices(params, includeInvoiceItems)

        if (params.format == "csv") {
            CSVPrinter csv = includeInvoiceItems
                    ? invoiceService.getInvoiceItemsCsv(invoices.invoice.invoiceItems.flatten())
                    : invoiceService.getInvoicesCsv(invoices)

            String name = includeInvoiceItems ? "Invoice Items" : "Invoices"
            response.setHeader("Content-disposition", "attachment; filename=\"${name}-${new Date().format("MM/dd/yyyy")}.csv\"")
            render(contentType: "text/csv", text: csv.out.toString())
            return
        }
        render([data: invoices, totalCount: invoices?.totalCount] as JSON)
    }

    def read() {
        Invoice invoice = Invoice.get(params.id)
        if (!invoice) {
            throw new IllegalArgumentException("No Invoice found for invoice ID ${params.id}")
        }

        render([data: invoice?.toJson()] as JSON)
    }

    def create() {
        JSONObject jsonObject = request.JSON

        Location currentLocation = Location.get(session.warehouse.id)
        if (!currentLocation) {
            throw new IllegalArgumentException("User must be logged into a location to create invoice")
        }

        Invoice invoice = new Invoice()
        bindInvoiceData(invoice, currentLocation, jsonObject)

        if (invoice.hasErrors() || !invoiceDataService.save(invoice)) {
            throw new ValidationException("Invalid invoice", invoice.errors)
        }

        render([data: invoice?.toJson()] as JSON)
    }

    def update() {
        JSONObject jsonObject = request.JSON

        Invoice existingInvoice = Invoice.get(params.id)
        if (!existingInvoice) {
            throw new IllegalArgumentException("No Invoice found for invoice ID ${params.id}")
        }

        Location currentLocation = Location.get(session.warehouse.id)
        if (!currentLocation) {
            throw new IllegalArgumentException("User must be logged into a location to create invoice")
        }

        bindInvoiceData(existingInvoice, currentLocation, jsonObject)

        if (existingInvoice.hasErrors() || !invoiceDataService.save(existingInvoice)) {
            throw new ValidationException("Invalid invoice", existingInvoice.errors)
        }

        render([data: existingInvoice?.toJson()] as JSON)
    }

    def showDetails() {
        Invoice invoice = Invoice.get(params.id)
        if (!invoice) {
            throw new IllegalArgumentException("No Invoice found for invoice ID ${params.id}")
        }

        String defaultCurrencyCode = grailsApplication.config.openboxes.locale.defaultCurrencyCode
        render([data: [
                id                  : invoice.id,
                invoiceNumber       : invoice.invoiceNumber,
                vendorInvoiceNumber : invoice.vendorInvoiceNumber?.identifier,
                vendorName          : invoice.party?.displayName,
                partyFromName       : invoice.partyFrom?.displayName,
                createdByName       : invoice.createdBy?.name,
                updatedByName       : invoice.updatedBy?.name,
                dateCreated         : invoice.dateCreated?.format("dd/MMM/yyyy"),
                lastUpdated         : invoice.lastUpdated?.format("dd/MMM/yyyy"),
                dateInvoiced        : invoice.dateInvoiced?.format("dd/MMM/yyyy"),
                datePosted          : invoice.datePosted?.format("dd/MMM/yyyy"),
                isPosted            : invoice.datePosted != null,
                currencyName        : invoice.currencyUom?.name,
                currencyCode        : invoice.currencyUom?.code,
                invoiceTypeName     : invoice.invoiceType?.name,
                totalValue          : invoice.totalValue,
                totalValueNormalized: invoice.totalValueNormalized,
                defaultCurrencyCode : defaultCurrencyCode,
                status              : invoice.status?.name(),
                statusLabel         : "${g.message(code: 'enum.InvoiceStatus.' + invoice.status?.name(), default: invoice.status?.name())}",
                orders              : invoice.orders?.collect { [id: it.id, orderNumber: it.orderNumber] } ?: [],
                shipments           : invoice.shipments?.collect { [id: it.id, shipmentNumber: it.shipmentNumber] } ?: [],
                items               : invoice.getSortedInvoiceItems()?.collect { InvoiceItem invoiceItem ->
                    [
                            id             : invoiceItem.id,
                            productCode    : invoiceItem.product?.productCode,
                            description    : invoiceItem.orderAdjustment ? invoiceItem.description : invoiceItem.product?.name,
                            isAdjustment   : invoiceItem.orderAdjustment != null,
                            orderNumber    : invoiceItem.order?.orderNumber,
                            glAccountCode  : invoiceItem.glAccount?.code,
                            budgetCodeCode : invoiceItem.budgetCode?.code,
                            quantity       : invoiceItem.quantity,
                            quantityPerUom : invoiceItem.quantityPerUom,
                            unitPrice      : invoiceItem.unitPrice,
                            amount         : invoiceItem.amount,
                    ]
                } ?: [],
                documents           : invoice.documents?.collect { documentToJson(it) } ?: [],
                orderDocuments      : invoice.orderDocuments?.collect { [
                        id              : it.id,
                        name            : it.name,
                        filename        : it.filename,
                        fileUri         : it.fileUri,
                        documentTypeName: it.documentType?.name,
                        size            : it.size,
                        lastUpdated     : it.lastUpdated?.toString(),
                ] } ?: [],
        ]] as JSON)
    }

    def documentFormData() {
        Invoice invoice = Invoice.get(params.id)
        if (!invoice) {
            throw new IllegalArgumentException("No Invoice found for invoice ID ${params.id}")
        }

        List<DocumentType> documentTypes = documentService.getNonTemplateDocumentTypes()
        Document document = params.documentId ? Document.get(params.documentId) : null

        render([data: [
                id                 : invoice.id,
                invoiceNumber      : invoice.invoiceNumber,
                isPosted           : invoice.datePosted != null,
                vendorName         : invoice.party?.displayName,
                vendorInvoiceNumber: invoice.vendorInvoiceNumber?.identifier,
                status             : invoice.status?.name(),
                statusLabel        : "${g.message(code: 'enum.InvoiceStatus.' + invoice.status?.name(), default: invoice.status?.name())}",
                documentTypes      : documentTypes.collect { DocumentType documentType ->
                    [id: documentType.id, name: documentType.name]
                },
                document           : document ? [
                        id            : document.id,
                        name          : document.name,
                        documentNumber: document.documentNumber,
                        documentTypeId: document.documentType?.id,
                        filename      : document.filename,
                        fileUri       : document.fileUri,
                ] : null,
        ]] as JSON)
    }

    Map documentToJson(Document document) {
        return [
                id              : document.id,
                name            : document.name,
                filename        : document.filename,
                fileUri         : document.fileUri,
                documentTypeName: document.documentType?.name,
                size            : document.size,
                lastUpdated     : document.lastUpdated?.toString(),
        ]
    }

    def statusOptions() {
        def options = InvoiceStatus.list().collect{
            [ id: it.name(), value: it.name(), label: "${g.message(code: 'enum.InvoiceStatus.' + it.name())}", variant: it.variant?.name() ]
        }
        render([data: options] as JSON)
    }

    def invoiceTypeCodes() {
        def codes = InvoiceTypeCode.list().collect{
            [ id: it.name(), value: it.name(), label: "${g.message(code: 'enum.InvoiceTypeCode.' + it.name())}"]
        }
        render([data: codes] as JSON)
    }

    Invoice bindInvoiceData(Invoice invoice, Location currentLocation, JSONObject jsonObject) {
        bindData(invoice, jsonObject)

        if (!invoice.partyFrom) {
            invoice.partyFrom = currentLocation?.organization
        }

        if (!invoice.invoiceNumber) {
            invoice.invoiceNumber = invoiceIdentifierService.generate(invoice)
        }

        if (!invoice.invoiceType) {
            invoice.invoiceType = InvoiceType.findByCode(InvoiceTypeCode.INVOICE)
        }

        invoice.party = Organization.get(jsonObject?.vendor)

        // TODO: find or create vendor invoice number in reference numbers
        invoiceService.createOrUpdateVendorInvoiceNumber(invoice, jsonObject?.vendorInvoiceNumber)

        return invoice
    }

    def getInvoiceItems() {
        List<InvoiceItem> invoiceItems = invoiceService.getInvoiceItems(params.id, params.max, params.offset)
        render([data: invoiceItems, totalCount: invoiceItems.totalCount?:invoiceItems.size()] as JSON)
    }

    def getInvoiceItemCandidates() {
        JSONObject jsonObject = request.JSON
        List<InvoiceItemCandidate> invoiceItemCandidates = invoiceService.getInvoiceItemCandidates(
            params.id, jsonObject.orderNumbers, jsonObject.shipmentNumbers
        )
        render([data: invoiceItemCandidates] as JSON)
    }

    def getOrderNumbers() {
        List orderNumbers = invoiceService.getDistinctFieldFromInvoiceItemCandidates(params.id, "orderNumber")

        render([data: orderNumbers] as JSON)
    }

    def getShipmentNumbers() {
        List shipmentNumbers = invoiceService.getDistinctFieldFromInvoiceItemCandidates(params.id, "shipmentNumber")

        render([data: shipmentNumbers] as JSON)
    }

    def removeItem() {
        invoiceService.removeInvoiceItem(params.id)
        render status: 204
    }

    def updateItems() {
        JSONObject jsonObject = request.JSON

        Invoice invoice = Invoice.get(params.id)
        List invoiceItems = jsonObject.remove("invoiceItems")
        invoiceService.updateItems(invoice, invoiceItems)
        render status: 204
    }

    def submitInvoice() {
        Invoice invoice = Invoice.get(params.id)
        if (!invoice) {
            throw new IllegalArgumentException("No Invoice found for invoice ID ${params.id}")
        }
        invoiceService.submitInvoice(invoice)
        render([data: invoice?.toJson()] as JSON)
    }

    def postInvoice() {
        Invoice invoice = Invoice.get(params.id)
        if (!invoice) {
            throw new IllegalArgumentException("No Invoice found for invoice ID ${params.id}")
        }
        invoiceService.postInvoice(invoice)
        render([data: invoice?.toJson()] as JSON)
    }

    /**
     * @deprecated Inverse items are now stored in the final invoice, no longer need to pull these
     */
    def getPrepaymentItems() {
        Invoice invoice = Invoice.get(params.id)
        List<InvoiceItem> prepaymentItems = invoice.prepaymentItems
        render([data: prepaymentItems, totalCount: prepaymentItems.size()] as JSON)
    }

    def validateInvoiceItem(InvoiceItem invoiceItem) {
        if (!invoiceItem.validate()) {
            throw new ValidationException("Invalid invoice item", invoiceItem.errors)
        }

        render(status: 200)
    }
}
