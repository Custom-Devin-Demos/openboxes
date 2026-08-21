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
import org.pih.warehouse.shipping.Shipment

import java.text.SimpleDateFormat

class GoodsReceiptNoteApiController {

    private static final String HEADER_DATE_FORMAT = "d MMMMM yyyy hh:mma"
    private static final String EXPIRATION_DATE_FORMAT = "dd/MMM/yyyy"

    private static String formatDate(Date date, String pattern) {
        return date ? new SimpleDateFormat(pattern).format(date) : null
    }

    def printData() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'shipment.label', default: 'Shipment'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }

        def receipts = shipment.receipts?.toList() ?: []
        String eachLabel = warehouse.message(code: "default.each.label")

        def items = []
        shipment.sortShipmentItemsBySortOrder()?.findAll { it.receiptItems }?.each { shipmentItem ->
            def receiptItems = shipmentItem.receiptItems.sort { !it.isSplitItem }
            boolean hasSplit = receiptItems.any { it.isSplitItem }
            Map splitRow = null
            if (hasSplit) {
                splitRow = [
                        productCode    : shipmentItem?.product?.productCode,
                        productName    : shipmentItem?.product?.displayNameOrDefaultName,
                        lotNumber      : shipmentItem?.inventoryItem?.lotNumber,
                        expirationDate : formatDate(shipmentItem?.inventoryItem?.expirationDate, EXPIRATION_DATE_FORMAT),
                        unitOfMeasure  : shipmentItem?.inventoryItem?.product?.unitOfMeasure ?: eachLabel,
                        quantityShipped: shipmentItem?.quantity,
                ]
            }
            def rows = receiptItems.collect { receiptItem ->
                [
                        productCode      : shipmentItem?.product?.productCode,
                        productName      : shipmentItem?.product?.displayNameOrDefaultName,
                        lotNumber        : receiptItem?.inventoryItem?.lotNumber,
                        expirationDate   : formatDate(receiptItem?.inventoryItem?.expirationDate, EXPIRATION_DATE_FORMAT),
                        unitOfMeasure    : shipmentItem?.inventoryItem?.product?.unitOfMeasure ?: eachLabel,
                        quantityShipped  : receiptItem?.quantityShipped,
                        receiptQuantities: receipts.collect { receipt ->
                            receiptItem.receipt == receipt ? receiptItem.quantityReceived : 0
                        },
                        discrepancy      : receiptItem.quantityShipped - receiptItem.quantityReceived,
                        comment          : receiptItem?.comment,
                ]
            }
            items << [
                    id         : shipmentItem.id,
                    hasSplit   : hasSplit,
                    splitRow   : splitRow,
                    receiptRows: rows,
            ]
        }

        render([data: [
                logoUrl        : grailsApplication.config.openboxes.report.logo.url,
                title          : warehouse.message(code: 'goodsReceiptNote.label'),
                status         : shipment?.status?.code?.name ?
                        warehouse.message(code: "enum.ShipmentStatusCode.${shipment.status.code.name}", default: shipment.status.code.name) : null,
                shipmentNumber : shipment?.shipmentNumber,
                name           : shipment?.name,
                barcodeUrl     : shipment?.shipmentNumber ? g.createLink(controller: 'product', action: 'barcode',
                        params: [data: shipment.shipmentNumber, width: 100, height: 30, format: 'CODE_128']) : null,
                origin         : shipment?.origin?.name,
                destination    : shipment?.destination?.name,
                dateShipped    : formatDate(shipment?.actualShippingDate, HEADER_DATE_FORMAT),
                datePrinted    : formatDate(new Date(), HEADER_DATE_FORMAT),
                lastReceiptDate: formatDate(receipts ? receipts.last()?.actualDeliveryDate : null, HEADER_DATE_FORMAT),
                receipts       : receipts.collect { [id: it.id, receiptNumber: it.receiptNumber] },
                items          : items,
        ]] as JSON)
    }
}
