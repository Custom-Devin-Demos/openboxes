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
import org.pih.warehouse.core.Address
import org.pih.warehouse.core.Location
import org.pih.warehouse.picklist.Picklist
import org.pih.warehouse.requisition.Requisition
import org.pih.warehouse.requisition.RequisitionItem
import org.pih.warehouse.shipping.Shipment
import org.pih.warehouse.shipping.ShipmentItem

import java.text.SimpleDateFormat
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class DeliveryNoteApiController {

    private static final String HEADER_DATE_FORMAT = "d MMMMM yyyy  hh:mma"

    private static String formatDate(Date date, String pattern) {
        return date ? new SimpleDateFormat(pattern).format(date) : null
    }

    // Matches <g:formatDate format="d MMMMM yyyy  hh:mma"/> which renders the narrow month form
    private static String formatHeaderDate(Date date) {
        if (!date) {
            return null
        }
        return DateTimeFormatter.ofPattern(HEADER_DATE_FORMAT)
                .format(date.toInstant().atZone(ZoneId.systemDefault()))
    }

    private static Map addressJson(Address address) {
        if (!address) {
            return null
        }
        return [
                address        : address.address,
                address2       : address.address2,
                city           : address.city,
                stateOrProvince: address.stateOrProvince,
                postalCode     : address.postalCode,
                country        : address.country,
        ]
    }

    private static Map locationJson(Location location) {
        if (!location) {
            return null
        }
        return [name: location.name, address: addressJson(location.address)]
    }

    private Map notesJson(Shipment shipment) {
        return [
                trackingNumber: shipment?.referenceNumbers ? shipment.referenceNumbers.first()?.toString() : '',
                driverName    : shipment?.driverName ?: '',
                comments      : shipment?.additionalInformation ?: '',
        ]
    }

    private String reasonCodeMessage(String reasonCode) {
        String code = reasonCode?.contains("(") ? reasonCode?.split("\\(", 2)[1].replace(")", "") : reasonCode
        return warehouse.message(code: 'enum.ReasonCode.' + code)
    }

    private Map requisitionItemJson(RequisitionItem requisitionItem, boolean hasPicklist) {
        def shipmentItems = null
        def picklistItemsGroup = null
        int lineCount = 1
        if (hasPicklist) {
            def inventoryItemMap = requisitionItem?.retrievePicklistItems()?.findAll { it.quantity > 0 }?.groupBy { it?.inventoryItem }
            shipmentItems = requisitionItem?.requisition?.shipment?.shipmentItems?.findAll { it.requisitionItem == requisitionItem }
            picklistItemsGroup = inventoryItemMap?.values()?.toList()
            lineCount = shipmentItems?.size() ?: (picklistItemsGroup?.size() ?: 1)
        }

        def lines = []
        for (int j = 0; j < lineCount; j++) {
            def shipmentItem = shipmentItems ? shipmentItems[j] : null
            def inventoryItem
            if (shipmentItems) {
                inventoryItem = shipmentItems[j].inventoryItem
            } else if (picklistItemsGroup) {
                inventoryItem = picklistItemsGroup[j]?.first()?.inventoryItem
            } else {
                inventoryItem = requisitionItem?.shipmentItems?.size() > 0 ?
                        requisitionItem?.shipmentItems?.toList()?.first()?.inventoryItem : null
            }
            def quantity = null
            if (shipmentItem) {
                quantity = shipmentItem?.quantity ?: 0
            } else if (picklistItemsGroup) {
                quantity = picklistItemsGroup[j]?.sum { it?.quantity } ?: 0
            }
            lines << [
                    packLevel1      : shipmentItem?.container?.parentContainer?.name ?: shipmentItem?.container?.name,
                    packLevel2      : shipmentItem?.container?.parentContainer ? shipmentItem?.container?.name : '',
                    lotNumber       : inventoryItem?.lotNumber,
                    expirationDate  : formatDate(inventoryItem?.expirationDate, "d MMM yyyy"),
                    quantity        : quantity,
                    quantityReceived: shipmentItem?.quantityReceived,
                    comments        : shipmentItem?.comments ? shipmentItem?.getComments()?.join(', ') : null,
            ]
        }

        RequisitionItem parent = requisitionItem?.parentRequisitionItem
        Map parentCancelReason = null
        if (parent?.cancelReasonCode) {
            String typeLabel = null
            if (parent?.isSubstituted()) {
                typeLabel = warehouse.message(code: 'requisitionItem.substituted.label')
            } else if (parent?.isChanged()) {
                typeLabel = warehouse.message(code: 'requisitionItem.modified.label')
            }
            parentCancelReason = [
                    typeLabel: typeLabel,
                    reason   : reasonCodeMessage(parent?.cancelReasonCode),
                    comments : parent?.cancelComments,
            ]
        }
        Map ownCancelReason = null
        if (requisitionItem?.cancelReasonCode) {
            ownCancelReason = [
                    canceledLabel: requisitionItem?.isCanceled() ? warehouse.message(code: 'requisitionItem.canceled.label') : null,
                    reason       : warehouse.message(code: 'enum.ReasonCode.' + requisitionItem?.cancelReasonCode),
                    comments     : requisitionItem?.cancelComments,
            ]
        }

        return [
                id               : requisitionItem.id,
                productCode      : requisitionItem?.product?.productCode,
                productName      : requisitionItem?.product?.displayNameOrDefaultName,
                substitutedParent: parent?.isSubstituted() ? [
                        productCode: parent?.product?.productCode,
                        productName: parent?.product?.displayNameOrDefaultName,
                ] : null,
                parentChanged    : parent?.isChanged() ?: false,
                parentQuantity   : parent?.quantity ?: 0,
                parentUnitOfMeasure: parent?.product?.unitOfMeasure ?: "EA",
                quantity         : requisitionItem?.quantity ?: 0,
                unitOfMeasure    : requisitionItem?.product?.unitOfMeasure ?: "EA",
                status           : requisitionItem?.status?.toString(),
                totalQuantityPicked: requisitionItem?.totalQuantityPicked() ?: 0,
                cancelReasonParent: parentCancelReason,
                cancelReasonOwn  : ownCancelReason,
                pickReason       : requisitionItem?.pickReasonCode ? warehouse.message(code: 'enum.ReasonCode.' + requisitionItem?.pickReasonCode) : null,
                lines            : lines,
        ]
    }

    private List sectionItemsJson(List<RequisitionItem> requisitionItems, String sortOrder, boolean hasPicklist) {
        List<RequisitionItem> items = requisitionItems
        if (!"PRODUCT".equalsIgnoreCase(sortOrder as String)) {
            items = items?.sort()
        }
        return items.collect { requisitionItemJson(it, hasPicklist) }
    }

    def printData() {
        Requisition requisition = Requisition.get(params.id)
        if (!requisition) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'requisition.label', default: 'Requisition'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        Picklist picklist = Picklist.findByRequisition(requisition)
        boolean hasPicklist = picklist != null
        String sortOrder = params.sortOrder

        def requisitionItemsSorted = requisition.requisitionItems.sort { it.product.name }
        def requisitionItemsCanceled = requisitionItemsSorted.findAll { it.isCanceled() }
        def requisitionItems = requisitionItemsSorted.findAll { !it.isCanceled() && !it.isChanged() }
        def requisitionItemsColdChain = requisitionItems.findAll { it?.product?.coldChain }
        def requisitionItemsControlled = requisitionItems.findAll { it?.product?.controlledSubstance && !it?.product?.coldChain }
        def requisitionItemsHazmat = requisitionItems.findAll {
            it?.product?.hazardousMaterial && !it?.product?.controlledSubstance && !it?.product?.coldChain
        }
        def requisitionItemsOther = requisitionItems.findAll {
            !it?.product?.hazardousMaterial && !it?.product?.coldChain && !it?.product?.controlledSubstance
        }

        def sections = []
        if (requisitionItemsColdChain) {
            sections << [
                    key           : "coldChain",
                    title         : warehouse.message(code: 'product.coldChain.label', default: 'Cold chain'),
                    headerMt      : false,
                    pageBreakAfter: (requisitionItemsControlled || requisitionItemsHazmat || requisitionItemsOther) ? 'always' : 'avoid',
                    items         : sectionItemsJson(requisitionItemsColdChain, sortOrder, hasPicklist),
            ]
        }
        if (requisitionItemsControlled) {
            sections << [
                    key           : "controlledSubstance",
                    title         : warehouse.message(code: 'product.controlledSubstance.label', default: 'Controlled Substance'),
                    headerMt      : requisitionItemsColdChain as boolean,
                    pageBreakAfter: (requisitionItemsHazmat || requisitionItemsOther) ? 'always' : 'avoid',
                    items         : sectionItemsJson(requisitionItemsControlled, sortOrder, hasPicklist),
            ]
        }
        if (requisitionItemsHazmat) {
            sections << [
                    key           : "hazardousMaterial",
                    title         : warehouse.message(code: 'product.hazardousMaterial.label', default: 'Hazardous Material'),
                    headerMt      : (requisitionItemsControlled || requisitionItemsColdChain) as boolean,
                    pageBreakAfter: (requisitionItemsOther) ? 'always' : 'avoid',
                    items         : sectionItemsJson(requisitionItemsHazmat, sortOrder, hasPicklist),
            ]
        }
        if (requisitionItemsOther) {
            sections << [
                    key           : "generalGoods",
                    title         : warehouse.message(code: 'product.generalGoods.label', default: 'General Goods'),
                    headerMt      : (requisitionItemsHazmat || requisitionItemsControlled || requisitionItemsColdChain) as boolean,
                    pageBreakAfter: (requisitionItemsCanceled) ? 'always' : 'avoid',
                    items         : sectionItemsJson(requisitionItemsOther, sortOrder, hasPicklist),
            ]
        }
        if (requisitionItemsCanceled) {
            sections << [
                    key           : "canceled",
                    title         : warehouse.message(code: 'default.canceled.label', default: 'Canceled Items'),
                    headerMt      : requisitionItemsOther as boolean,
                    pageBreakAfter: 'avoid',
                    items         : sectionItemsJson(requisitionItemsCanceled, sortOrder, hasPicklist),
            ]
        }

        Shipment shipment = requisition?.shipment

        render([data: [
                logoUrl            : grailsApplication.config.openboxes.report.logo.url,
                title              : warehouse.message(code: 'requisition.deliveryNote.label', default: 'Delivery Note'),
                documentNumber     : requisition.requestNumber,
                documentName       : requisition.name,
                origin             : locationJson(requisition.origin),
                destination        : locationJson(requisition.destination),
                requestedBy        : requisition?.requestedBy?.name,
                dateRequested      : formatHeaderDate(requisition?.dateRequested),
                shipDate           : formatHeaderDate(shipment?.expectedShippingDate),
                receivedDate       : formatHeaderDate(shipment?.receipt?.actualDeliveryDate),
                barcodeUrl         : requisition.requestNumber ? g.createLink(controller: 'product', action: 'barcode',
                        params: [data: requisition.requestNumber, height: 30, format: 'CODE_128']) : null,
                showPackLevel1Header: shipment?.shipmentItems?.any { it.container } as boolean,
                showPackLevel2Header: shipment?.shipmentItems?.any { it.container && it.container?.parentContainer } as boolean,
                showPackLevel1Cell : shipment?.hasChildContainer() as boolean,
                showPackLevel2Cell : shipment?.hasParentContainer() as boolean,
                sections           : sections,
                notes              : notesJson(shipment),
        ]] as JSON)
    }

    def printOutboundReturnData() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'shipment.label', default: 'Shipment'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }

        def sortedItems = shipment.shipmentItems?.sort { it.product?.name }
        def rows = []
        sortedItems?.each { ShipmentItem item ->
            def receiptItems = shipment.receipts?.collectMany { r ->
                r.receiptItems?.findAll { ri -> ri.shipmentItem?.id == item.id && ri.quantityReceived > 0 } ?: []
            } ?: []
            boolean productChanged = receiptItems.any { ri -> ri.product?.id != item.product?.id }
            boolean lotChanged = receiptItems.any { ri -> (ri.lotNumber ?: '') != (item.lotNumber ?: '') }
            boolean expiryChanged = receiptItems.any { ri -> ri.expirationDate != item.expirationDate }
            boolean anyChanged = productChanged || lotChanged || expiryChanged
            if (anyChanged) {
                rows << [
                        changed     : true,
                        original    : [
                                productCode   : item.product?.productCode,
                                productName   : item.product?.name,
                                lotNumber     : item.lotNumber ?: '',
                                expirationDate: formatDate(item.expirationDate, "MM/yyyy"),
                                quantity      : item.quantity,
                        ],
                        receiptItems: receiptItems.collect { ri ->
                            [
                                    productCode     : ri.product?.productCode,
                                    productName     : ri.product?.name,
                                    lotNumber       : ri.lotNumber ?: '',
                                    expirationDate  : formatDate(ri.expirationDate, "MM/yyyy"),
                                    quantityReceived: ri.quantityReceived ?: '',
                                    comment         : ri.comment ?: '',
                            ]
                        },
                ]
            } else {
                def quantityReceived = receiptItems.sum { it.quantityReceived } ?: 0
                def comments = receiptItems.collect { it.comment }.findAll { it }?.join(', ')
                rows << [
                        changed         : false,
                        productCode     : item.product?.productCode,
                        productName     : item.product?.name,
                        lotNumber       : item.lotNumber ?: '',
                        expirationDate  : formatDate(item.expirationDate, "MM/yyyy"),
                        quantity        : item.quantity,
                        quantityReceived: quantityReceived ?: "",
                        comments        : comments ?: "",
                ]
            }
        }

        render([data: [
                logoUrl       : grailsApplication.config.openboxes.report.logo.url,
                title         : warehouse.message(code: 'requisition.deliveryNote.label', default: 'Delivery Note'),
                documentNumber: shipment.shipmentNumber,
                documentName  : shipment.name,
                origin        : locationJson(shipment.origin),
                destination   : locationJson(shipment.destination),
                shipDate      : formatHeaderDate(shipment.expectedShippingDate),
                receivedDate  : formatHeaderDate(shipment?.receipts ? shipment.receipts.last()?.actualDeliveryDate : null),
                barcodeUrl    : shipment.shipmentNumber ? g.createLink(controller: 'product', action: 'barcode',
                        params: [data: shipment.shipmentNumber, height: 30, format: 'CODE_128']) : null,
                rows          : rows,
                notes         : notesJson(shipment),
        ]] as JSON)
    }
}
