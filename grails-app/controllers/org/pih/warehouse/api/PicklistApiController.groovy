package org.pih.warehouse.api

import grails.converters.JSON
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderItem
import org.pih.warehouse.picklist.Picklist
import org.pih.warehouse.picklist.PicklistService
import org.pih.warehouse.requisition.Requisition
import org.pih.warehouse.requisition.RequisitionItem

import java.text.SimpleDateFormat

class PicklistApiController extends BaseDomainApiController {

    PicklistService picklistService

    def clearPicklist() {
        picklistService.clearPicklist(params.id)

        render status: 204
    }

    private static String formatDate(Date date, String pattern) {
        return date ? new SimpleDateFormat(pattern).format(date) : null
    }

    private static List sortZoneNames(Collection zoneNames) {
        return zoneNames?.unique()?.sort { a, b -> !a ? !b ? 0 : 1 : !b ? -1 : a <=> b }
    }

    private static List sortPicklistItemsByBin(List picklistItems) {
        return picklistItems?.sort { pickA, pickB -> pickA.binLocation?.name <=> pickB.binLocation?.name }
    }

    private static Closure binLocationComparator(Map pickListItemsById) {
        return { a, b ->
            def pickItemsA = sortPicklistItemsByBin(pickListItemsById[a.id])
            def pickItemsB = sortPicklistItemsByBin(pickListItemsById[b.id])
            def itemA = pickItemsA ? pickItemsA[0] : null
            def itemB = pickItemsB ? pickItemsB[0] : null
            def nameA = itemA?.binLocation?.name
            def nameB = itemB?.binLocation?.name
            def orderA = itemA?.sortOrder
            def orderB = itemB?.sortOrder
            /* null is > than string; if both names are null or equal, compare sortOrder */
            return !nameA ? !nameB ? orderA <=> orderB : 1 : !nameB ? -1 : nameA <=> nameB ?: orderA <=> orderB
        }
    }

    private static List linesJson(List picklistItems, String unitOfMeasure) {
        if (!picklistItems) {
            return []
        }
        return picklistItems.collect { picklistItem ->
            [
                    lotNumber     : picklistItem?.inventoryItem?.lotNumber,
                    expirationDate: formatDate(picklistItem?.inventoryItem?.expirationDate, "d MMM yyyy"),
                    binLocation   : picklistItem?.binLocation?.name,
                    quantity      : picklistItem?.quantity ?: 0,
                    unitOfMeasure : unitOfMeasure,
            ]
        }
    }

    private static Map requisitionItemJson(RequisitionItem requisitionItem, Map pickListItemsByRequisition, boolean sorted, boolean hasPicklist) {
        def picklistItems = null
        if (hasPicklist) {
            picklistItems = pickListItemsByRequisition[requisitionItem.id]
            if (sorted) {
                picklistItems = sortPicklistItemsByBin(picklistItems)
            }
            picklistItems = picklistItems?.findAll { it.quantity > 0 }
        }
        RequisitionItem parent = requisitionItem?.parentRequisitionItem
        String unitOfMeasure = requisitionItem?.product?.unitOfMeasure ?: "EA"
        return [
                id                : requisitionItem.id,
                status            : requisitionItem?.status?.toString(),
                productCode       : requisitionItem?.product?.productCode,
                productName       : requisitionItem?.product?.displayNameOrDefaultName,
                substitutedParent : parent?.isSubstituted() ? [
                        productCode: parent?.product?.productCode,
                        productName: parent?.product?.displayNameOrDefaultName,
                ] : null,
                parentChanged     : parent?.isChanged() ?: false,
                parentQuantity    : parent?.quantity ?: 0,
                parentUnitOfMeasure: parent?.product?.unitOfMeasure ?: "EA",
                quantity          : requisitionItem?.quantity ?: 0,
                unitOfMeasure     : unitOfMeasure,
                lines             : linesJson(picklistItems, unitOfMeasure),
        ]
    }

    private static Map orderItemJson(OrderItem orderItem, Map pickListItemsByOrder, boolean sorted, boolean hasPicklist) {
        def picklistItems = null
        if (hasPicklist) {
            picklistItems = pickListItemsByOrder[orderItem.id]
            if (sorted) {
                picklistItems = sortPicklistItemsByBin(picklistItems)
            }
            picklistItems = picklistItems?.findAll { it.quantity > 0 }
        }
        String unitOfMeasure = orderItem?.product?.unitOfMeasure ?: "EA"
        return [
                id           : orderItem.id,
                productCode  : orderItem?.product?.productCode,
                productName  : orderItem?.product?.displayNameOrDefaultName,
                lines        : linesJson(picklistItems, unitOfMeasure),
        ]
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
        boolean sorted = params.sorted ? true : false

        def allRequisitionItems = requisition.requisitionItems.sort { it.product.name }
        def allPickListItems = allRequisitionItems*.retrievePicklistItems()?.flatten()
        def zoneNames = sortZoneNames(allPickListItems?.collect { it?.binLocation?.zone?.name })
        def pickListItemsByZone = allPickListItems?.groupBy { it?.binLocation?.zone?.name } ?: [:]

        def zones = []
        zoneNames?.each { zoneName ->
            def pickListItemsByRequisition = pickListItemsByZone[zoneName]?.groupBy { it?.requisitionItem?.id } ?: [:]

            def requisitionItems
            if (!zoneName) {
                requisitionItems = allRequisitionItems.findAll { !it.picklistItems?.size() || pickListItemsByRequisition[it.id]?.size() }
            } else {
                requisitionItems = allRequisitionItems.findAll { pickListItemsByRequisition[it.id]?.size() }
            }

            def requisitionItemsCanceled = requisitionItems.findAll { it.isCanceled() }
            requisitionItems = requisitionItems.findAll { !it.isCanceled() && !it.isChanged() }
            def requisitionItemsColdChain = requisitionItems.findAll { it?.product?.coldChain }
            def requisitionItemsControlled = requisitionItems.findAll { it?.product?.controlledSubstance }
            def requisitionItemsHazmat = requisitionItems.findAll { it?.product?.hazardousMaterial }
            def requisitionItemsOther = requisitionItems.findAll {
                !it?.product?.hazardousMaterial && !it?.product?.coldChain && !it?.product?.controlledSubstance
            }

            Closure sectionItems = { List<RequisitionItem> items ->
                def sortedItems = sorted ? items?.sort(binLocationComparator(pickListItemsByRequisition)) : items?.sort()
                return sortedItems.collect { requisitionItemJson(it, pickListItemsByRequisition, sorted, hasPicklist) }
            }

            def groups = []
            if (requisitionItemsColdChain) {
                groups << [
                        key         : "coldChain",
                        title       : warehouse.message(code: 'product.coldChain.label', default: 'Cold Chain'),
                        hasFollowing: (requisitionItemsControlled || requisitionItemsHazmat || requisitionItemsOther) as boolean,
                        items       : sectionItems(requisitionItemsColdChain),
                ]
            }
            if (requisitionItemsControlled) {
                groups << [
                        key         : "controlledSubstance",
                        title       : warehouse.message(code: 'product.controlledSubstance.label', default: 'Controlled Substance'),
                        hasFollowing: (requisitionItemsHazmat || requisitionItemsOther) as boolean,
                        items       : sectionItems(requisitionItemsControlled),
                ]
            }
            if (requisitionItemsHazmat) {
                groups << [
                        key         : "hazardousMaterial",
                        title       : warehouse.message(code: 'product.hazardousMaterial.label', default: 'Hazardous Material'),
                        hasFollowing: (requisitionItemsOther) as boolean,
                        items       : sectionItems(requisitionItemsHazmat),
                ]
            }
            if (requisitionItemsOther) {
                groups << [
                        key         : "generalGoods",
                        title       : warehouse.message(code: 'product.generalGoods.label', default: 'General Goods'),
                        hasFollowing: (requisitionItemsCanceled) as boolean,
                        items       : sectionItems(requisitionItemsOther),
                ]
            }
            if (requisitionItemsCanceled) {
                groups << [
                        key         : "canceled",
                        title       : warehouse.message(code: 'canceled.canceled.label', default: 'Canceled'),
                        hasFollowing: false,
                        items       : sectionItems(requisitionItemsCanceled),
                ]
            }

            zones << [
                    name    : zoneName,
                    title   : zoneName ?: warehouse.message(code: 'location.noZone.label', default: 'No zone'),
                    showName: (zoneName || zoneNames.size() > 1) as boolean,
                    groups  : groups,
            ]
        }

        render([data: [
                logoUrl       : grailsApplication.config.openboxes.report.logo.url,
                title         : warehouse.message(code: 'picklist.print.label', default: 'Print picklist'),
                heading       : warehouse.message(code: 'picklist.label', default: 'Picklist'),
                documentNumber: requisition.requestNumber,
                documentName  : requisition?.name,
                barcodeUrl    : requisition.requestNumber ? g.createLink(controller: 'product', action: 'barcode',
                        params: [data: requisition.requestNumber, width: 100, height: 30, format: 'CODE_128']) : null,
                downloadUrl   : g.createLink(controller: 'picklist', action: 'renderPdf', id: requisition.id,
                        params: [sorted: params.sorted]),
                headerRows    : [
                        [label: warehouse.message(code: 'requisition.requisitionNumber.label', default: 'Requisition number'), value: requisition.requestNumber],
                        [label: warehouse.message(code: 'requisition.requisitionType.label', default: 'Requisition type'), value: requisition.type ? warehouse.message(code: 'enum.RequisitionType.' + requisition.type) : null],
                        [label: warehouse.message(code: 'requisition.origin.label', default: 'Origin'), value: requisition.origin?.name],
                        [label: warehouse.message(code: 'requisition.destination.label', default: 'Destination'), value: requisition.destination?.name],
                        [label: warehouse.message(code: 'requisition.date.label', default: 'Date requested'), value: formatDate(requisition?.dateRequested, "MMM d, yyyy  hh:mma")],
                        [label: warehouse.message(code: 'picklist.datePrinted.label', default: 'Date printed'), value: formatDate(new Date(), "MMM d, yyyy hh:mma")],
                ],
                columns       : [
                        [key: 'number', title: warehouse.message(code: 'report.number.label', default: '#')],
                        [key: 'productCode', title: warehouse.message(code: 'product.productCode.label', default: 'Code')],
                        [key: 'product', title: warehouse.message(code: 'product.label', default: 'Product')],
                        [key: 'quantityRequested', title: warehouse.message(code: 'requisitionItem.quantityRequested.label', default: 'Quantity requested')],
                        [key: 'lotNumber', title: warehouse.message(code: 'inventoryItem.lotNumber.label', default: 'Lot number')],
                        [key: 'expirationDate', title: warehouse.message(code: 'inventoryItem.expirationDate.label', default: 'Expiration date')],
                        [key: 'binLocation', title: warehouse.message(code: 'inventoryLevel.binLocation.label', default: 'Bin location')],
                        [key: 'suggestedPick', title: warehouse.message(code: 'requisitionItem.suggestedPick.label', default: 'Suggested pick')],
                        [key: 'confirmedPick', title: warehouse.message(code: 'requisitionItem.confirmedPick.label', default: 'Confirmed pick')],
                        [key: 'comments', title: warehouse.message(code: 'stockMovement.comments.label', default: 'Comments')],
                ],
                signatureColumns: [
                        name     : warehouse.message(code: 'default.name.label', default: 'Name'),
                        signature: warehouse.message(code: 'default.signature.label', default: 'Signature'),
                        date     : warehouse.message(code: 'default.date.label', default: 'Date'),
                        time     : warehouse.message(code: 'default.time.label', default: 'Time'),
                ],
                zones         : zones,
                signatures    : [
                        [label: warehouse.message(code: 'requisition.requestedBy.label', default: 'Requested by'), name: requisition?.requestedBy?.name, date: formatDate(requisition?.dateRequested, "MMM d, yyyy"), time: formatDate(requisition?.dateRequested, "hh:mma")],
                        [label: warehouse.message(code: 'requisition.createdBy.label', default: 'Created by'), name: requisition?.createdBy?.name, date: formatDate(requisition?.dateCreated, "MMM d, yyyy"), time: formatDate(requisition?.dateCreated, "hh:mma")],
                        [label: warehouse.message(code: 'requisition.verifiedBy.label', default: 'Verified by'), name: requisition?.verifiedBy?.name, date: formatDate(requisition?.dateVerified, "MMM d, yyyy"), time: formatDate(requisition?.dateVerified, "hh:mma")],
                        [label: warehouse.message(code: 'requisition.pickedBy.label', default: 'Picked by'), name: picklist?.picker?.name, date: formatDate(picklist?.datePicked, "MMM d, yyyy"), time: formatDate(picklist?.datePicked, "hh:mma")],
                        [label: warehouse.message(code: 'requisition.reviewedBy.label', default: 'Checked by'), name: requisition?.checkedBy?.name, date: formatDate(requisition?.dateChecked, "MMM d, yyyy"), time: formatDate(requisition?.dateChecked, "hh:mma")],
                ],
        ]] as JSON)
    }

    def returnPrintData() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        Picklist picklist = Picklist.findByOrder(order)
        boolean hasPicklist = picklist != null
        boolean sorted = params.sorted ? true : false

        def allOrderItems = order.orderItems.sort { it.product.name }
        def allPickListItems = allOrderItems*.retrievePicklistItems()?.flatten()
        def zoneNames = sortZoneNames(allPickListItems?.collect { it?.binLocation?.zone?.name })
        def pickListItemsByZone = allPickListItems?.groupBy { it?.binLocation?.zone?.name } ?: [:]

        def zones = []
        zoneNames?.each { zoneName ->
            def pickListItemsByOrder = pickListItemsByZone[zoneName]?.groupBy { it?.orderItem?.id } ?: [:]

            def orderItems
            if (!zoneName) {
                orderItems = allOrderItems.findAll { !it.picklistItems?.size() || pickListItemsByOrder[it.id]?.size() }
            } else {
                orderItems = allOrderItems.findAll { pickListItemsByOrder[it.id]?.size() }
            }

            def orderItemsColdChain = orderItems.findAll { it?.product?.coldChain }
            def orderItemsControlled = orderItems.findAll { it?.product?.controlledSubstance }
            def orderItemsHazmat = orderItems.findAll { it?.product?.hazardousMaterial }
            def orderItemsOther = orderItems.findAll {
                !it?.product?.hazardousMaterial && !it?.product?.coldChain && !it?.product?.controlledSubstance
            }

            Closure sectionItems = { List<OrderItem> items ->
                def sortedItems = sorted ? items?.sort(binLocationComparator(pickListItemsByOrder)) : items?.sort()
                return sortedItems.collect { orderItemJson(it, pickListItemsByOrder, sorted, hasPicklist) }
            }

            def groups = []
            if (orderItemsColdChain) {
                groups << [
                        key         : "coldChain",
                        title       : warehouse.message(code: 'product.coldChain.label', default: 'Cold Chain'),
                        hasFollowing: (orderItemsControlled || orderItemsHazmat || orderItemsOther) as boolean,
                        items       : sectionItems(orderItemsColdChain),
                ]
            }
            if (orderItemsControlled) {
                groups << [
                        key         : "controlledSubstance",
                        title       : warehouse.message(code: 'product.controlledSubstance.label', default: 'Controlled Substance'),
                        hasFollowing: (orderItemsHazmat || orderItemsOther) as boolean,
                        items       : sectionItems(orderItemsControlled),
                ]
            }
            if (orderItemsHazmat) {
                groups << [
                        key         : "hazardousMaterial",
                        title       : warehouse.message(code: 'product.hazardousMaterial.label', default: 'Hazardous Material'),
                        hasFollowing: (orderItemsOther) as boolean,
                        items       : sectionItems(orderItemsHazmat),
                ]
            }
            if (orderItemsOther) {
                groups << [
                        key         : "generalGoods",
                        title       : warehouse.message(code: 'product.generalGoods.label', default: 'General Goods'),
                        hasFollowing: true,
                        items       : sectionItems(orderItemsOther),
                ]
            }

            zones << [
                    name    : zoneName,
                    title   : zoneName ?: warehouse.message(code: 'location.noZone.label', default: 'No zone'),
                    showName: (zoneName || zoneNames.size() > 1) as boolean,
                    groups  : groups,
            ]
        }

        render([data: [
                logoUrl       : grailsApplication.config.openboxes.report.logo.url,
                title         : warehouse.message(code: 'picklist.print.label', default: 'Print picklist'),
                heading       : warehouse.message(code: 'picklist.label', default: 'Picklist'),
                documentNumber: order.orderNumber,
                documentName  : order?.name,
                barcodeUrl    : order.orderNumber ? g.createLink(controller: 'product', action: 'barcode',
                        params: [data: order.orderNumber, width: 100, height: 30, format: 'CODE_128']) : null,
                downloadUrl   : g.createLink(controller: 'picklist', action: 'renderReturnPdf', id: order.id,
                        params: [sorted: params.sorted]),
                headerRows    : [
                        [label: warehouse.message(code: 'order.origin.label', default: 'Origin'), value: order.origin?.name],
                        [label: warehouse.message(code: 'order.destination.label', default: 'Destination'), value: order.destination?.name],
                        [label: warehouse.message(code: 'picklist.datePrinted.label', default: 'Date printed'), value: formatDate(new Date(), "MMM d, yyyy hh:mma")],
                ],
                columns       : [
                        [key: 'number', title: warehouse.message(code: 'report.number.label', default: '#')],
                        [key: 'productCode', title: warehouse.message(code: 'product.productCode.label', default: 'Code')],
                        [key: 'product', title: warehouse.message(code: 'product.label', default: 'Product')],
                        [key: 'lotNumber', title: warehouse.message(code: 'inventoryItem.lotNumber.label', default: 'Lot number')],
                        [key: 'expirationDate', title: warehouse.message(code: 'inventoryItem.expirationDate.label', default: 'Expiration date')],
                        [key: 'binLocation', title: warehouse.message(code: 'inventoryLevel.binLocation.label', default: 'Bin location')],
                        [key: 'suggestedPick', title: warehouse.message(code: 'orderItem.suggestedPick.label', default: 'Suggested pick')],
                        [key: 'confirmedPick', title: warehouse.message(code: 'orderItem.confirmedPick.label', default: 'Confirmed pick')],
                        [key: 'comments', title: warehouse.message(code: 'stockMovement.comments.label', default: 'Comments')],
                ],
                signatureColumns: [
                        name     : warehouse.message(code: 'default.name.label', default: 'Name'),
                        signature: warehouse.message(code: 'default.signature.label', default: 'Signature'),
                        date     : warehouse.message(code: 'default.date.label', default: 'Date'),
                        time     : warehouse.message(code: 'default.time.label', default: 'Time'),
                ],
                zones         : zones,
                signatures    : [
                        [label: warehouse.message(code: 'order.orderedBy.label', default: 'Ordered by'), name: order?.orderedBy?.name, date: formatDate(order?.dateOrdered, "MMM d, yyyy"), time: formatDate(order?.dateOrdered, "hh:mma")],
                        [label: warehouse.message(code: 'order.createdBy.label', default: 'Created by'), name: order?.createdBy?.name, date: formatDate(order?.dateCreated, "MMM d, yyyy"), time: formatDate(order?.dateCreated, "hh:mma")],
                ],
        ]] as JSON)
    }
}
