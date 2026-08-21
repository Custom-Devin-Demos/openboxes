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
import org.grails.web.json.JSONObject
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.User
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderIdentifierService
import org.pih.warehouse.order.OrderStatus
import org.pih.warehouse.order.OrderType
import org.pih.warehouse.order.OrderTypeCode
import org.pih.warehouse.product.Product
import org.pih.warehouse.shipping.ShipmentType

import java.text.SimpleDateFormat

class StockTransferApiController {

    OrderIdentifierService orderIdentifierService
    def inventoryService
    def orderService
    def shipmentService
    def stockTransferService
    def userService

    private static String formatDate(Date date, String pattern) {
        return date ? new SimpleDateFormat(pattern).format(date) : null
    }

    def list() {
        if (!params.location) {
            def message = "Location parameter is required"
            response.status = 400
            render([errorMessage: message] as JSON)
            return
        }

        def stockTransfers = stockTransferService.getStockTransfers(params)
        render([
            data: stockTransfers?.collect { it.toJson(it.orderType.orderTypeCode) },
            totalCount: stockTransfers.totalCount
        ] as JSON)
    }

    def read() {
        Order order = Order.get(params.id)
        if (!order) {
            throw new IllegalArgumentException("No stock transfer found for order ID ${params.id}")
        }

        StockTransfer stockTransfer = StockTransfer.createFromOrder(order)
        stockTransferService.setQuantityOnHand(stockTransfer)
        if (order?.picklist) {
            stockTransferService.getDocuments(stockTransfer)
        }
        render([data: stockTransfer?.toJson()] as JSON)
    }

    def create() {
        JSONObject jsonObject = request.JSON

        User currentUser = User.get(session.user.id)
        Location currentLocation = Location.get(session.warehouse.id)
        if (!currentLocation || !currentUser) {
            throw new IllegalArgumentException("User must be logged into a location to update stock transfer")
        }

        StockTransfer stockTransfer = new StockTransfer()

        // We don't have the order yet so can't use it when generating the stockTransferNumber
        bindStockTransferData(stockTransfer, null, currentUser, currentLocation, jsonObject)

        Order order = stockTransferService.createOrUpdateOrderFromStockTransfer(stockTransfer)

        // TODO: Refactor - Return only status
        stockTransfer = StockTransfer.createFromOrder(order)
        stockTransferService.setQuantityOnHand(stockTransfer)
        render([data: stockTransfer?.toJson()] as JSON)
    }

    def update() {
        JSONObject jsonObject = request.JSON

        User currentUser = User.get(session.user.id)
        Location currentLocation = Location.get(session.warehouse.id)
        if (!currentLocation || !currentUser) {
            throw new IllegalArgumentException("User must be logged into a location to update stock transfer")
        }

        Order order = Order.get(params.id)
        if (!order) {
            throw new IllegalArgumentException("No stock transfer found for order ID ${params.id}")
        }

        StockTransfer stockTransfer = new StockTransfer()

        bindStockTransferData(stockTransfer, order, currentUser, currentLocation, jsonObject)

        Boolean isReturnType = stockTransfer.type == OrderType.findByCode(Constants.RETURN_ORDER)
        if (isReturnType && (stockTransfer?.status == StockTransferStatus.PLACED)) {
            order = stockTransferService.createOrUpdateOrderFromStockTransfer(stockTransfer)
            shipmentService.createOrUpdateShipment(stockTransfer)
        } else if (!isReturnType && stockTransfer?.status == StockTransferStatus.COMPLETED) {
            order = stockTransferService.completeStockTransfer(stockTransfer)
        } else {
            order = stockTransferService.createOrUpdateOrderFromStockTransfer(stockTransfer)
        }

        // TODO: Refactor - Return only status
        stockTransfer = StockTransfer.createFromOrder(order)
        stockTransferService.setQuantityOnHand(stockTransfer)
        render([data: stockTransfer?.toJson()] as JSON)
    }

    StockTransfer bindStockTransferData(StockTransfer stockTransfer, Order order, User currentUser, Location currentLocation, JSONObject jsonObject) {
        bindData(stockTransfer, jsonObject, [exclude: ['stockTransferItems']])

        if (!stockTransfer.origin) {
            stockTransfer.origin = currentLocation
        }

        if (!stockTransfer.destination) {
            stockTransfer.destination = currentLocation
        }

        if (!stockTransfer.orderedBy) {
            stockTransfer.orderedBy = currentUser
        }

        if (!stockTransfer.stockTransferNumber) {
            stockTransfer.stockTransferNumber = orderIdentifierService.generate(order)
        }

        if (jsonObject.type) {
            stockTransfer.type = OrderType.get(jsonObject.type)
        }

        if (jsonObject.shipmentType) {
            stockTransfer.shipmentType = ShipmentType.get(jsonObject.shipmentType?.id)
        }

        def dateFormat = new SimpleDateFormat("MM/dd/yyyy")
        if (jsonObject.dateShipped) {
            stockTransfer.dateShipped = dateFormat.parse(jsonObject.dateShipped)
        }

        if (jsonObject.expectedDeliveryDate) {
            stockTransfer.expectedDeliveryDate = dateFormat.parse(jsonObject.expectedDeliveryDate)
        }

        jsonObject.stockTransferItems.each { stockTransferItemMap ->
            StockTransferItem stockTransferItem = new StockTransferItem()
            stockTransferItem.id = stockTransferItemMap["id"] ? stockTransferItemMap["id"] : null
            stockTransferItem.productAvailabilityId = stockTransferItemMap["productAvailabilityId"] ? stockTransferItemMap["productAvailabilityId"] : null
            stockTransferItem.product = stockTransferItemMap?.product?.id ? Product.load(stockTransferItemMap?.product?.id) : null
            stockTransferItem.originBinLocation = stockTransferItemMap?.originBinLocation?.id ? Location.load(stockTransferItemMap?.originBinLocation?.id) : null
            stockTransferItem.destinationBinLocation = stockTransferItemMap?.destinationBinLocation?.id ? Location.load(stockTransferItemMap?.destinationBinLocation?.id) : null
            stockTransferItem.inventoryItem = stockTransferItemMap?.inventoryItem?.id ? InventoryItem.load(stockTransferItemMap?.inventoryItem?.id) : null
            stockTransferItem.quantityOnHand = stockTransferItemMap["quantityOnHand"] ? stockTransferItemMap["quantityOnHand"] : 0
            stockTransferItem.quantityNotPicked = stockTransferItemMap["quantityNotPicked"] ? stockTransferItemMap["quantityNotPicked"] : 0
            stockTransferItem.quantity = stockTransferItemMap["quantity"] ? new BigDecimal(stockTransferItemMap["quantity"]) : 0
            stockTransferItem.status = stockTransferItemMap["status"] ? stockTransferItemMap["status"] : null
            stockTransferItem.recipient = stockTransferItemMap?.recipient?.id ? Person.load(stockTransferItemMap?.recipient?.id) : null

            if (!stockTransferItem.location) {
                stockTransferItem.location = stockTransfer.origin
            }

            stockTransferItemMap.splitItems.each { splitItemMap ->
                StockTransferItem splitItem = new StockTransferItem()
                bindData(splitItem, splitItemMap)
                if (!splitItem.location) {
                    splitItem.location = stockTransfer.origin
                }
                stockTransferItem.splitItems.add(splitItem)
            }

            // For inbound returns
            Date expirationDate = stockTransferItemMap.expirationDate ? Constants.EXPIRATION_DATE_FORMATTER.parse(stockTransferItemMap.expirationDate) : null
            String lotNumber = stockTransferItemMap.lotNumber ? stockTransferItemMap.lotNumber : null
            stockTransferItem.inventoryItem = inventoryService.findAndUpdateOrCreateInventoryItem(
                    stockTransferItem.product,
                    lotNumber,
                    expirationDate
            )

            if (stockTransferItemMap.sortOrder) {
                stockTransferItem.orderIndex = stockTransferItemMap.sortOrder
            }

            stockTransfer.stockTransferItems.add(stockTransferItem)
        }

        return stockTransfer
    }

    def stockTransferCandidates() {
        String locationId = params?.location?.id ?: session.warehouse.id
        Boolean showExpiredItemsOnly = params.boolean('showExpiredItemsOnly', false)
        Location location = Location.get(locationId)

        if (!location) {
            throw new IllegalArgumentException("Can't find location with given id: ${locationId}")
        }

        List<StockTransferItem> stockTransferCandidates = stockTransferService.getStockTransferCandidates(location, null, showExpiredItemsOnly)
        render([data: stockTransferCandidates?.collect { it.toJson() }] as JSON)
    }

    def returnCandidates() {
        Location location = Location.get(request?.JSON?.locationId)
        if (!location) {
            throw new IllegalArgumentException("Can't find location with given id: ${request?.JSON?.locationId}")
        }

        List<StockTransferItem> stockTransferCandidates = stockTransferService.getStockTransferCandidates(location, request?.JSON)
        render([data: stockTransferCandidates?.collect { it.toJson() }] as JSON)
    }

    def removeItem() {
        Order order = stockTransferService.deleteStockTransferItem(params.id)
        StockTransfer stockTransfer = StockTransfer.createFromOrder(order)
        stockTransferService.setQuantityOnHand(stockTransfer)
        render([data: stockTransfer?.toJson()] as JSON)
    }

    def removeAllItems() {
        Order order = stockTransferService.deleteAllStockTransferItems(params.id)
        render([data: StockTransfer.createFromOrder(order)?.toJson()] as JSON)
    }

    def sendShipment() {
        Order order = Order.get(params.id)
        if (!order) {
            throw new IllegalArgumentException("Can't find order with given id: ${params.id}")
        }

        shipmentService.sendShipment(order)
        render status: 200
    }

    def rollback() {
        Location currentLocation = Location.get(session.warehouse.id)

        stockTransferService.rollbackReturnOrder(params.id as String, currentLocation)
        render status: 200
    }

    def delete() {
        def order = Order.get(params.id)
        if (!order) {
            def message = "Order does not exist"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }

        if (order.status > OrderStatus.APPROVED || order.orderType.orderTypeCode != OrderTypeCode.TRANSFER_ORDER) {
            def message = "Cannot delete this order"
            response.status = 400
            render([errorMessage: message] as JSON)
            return
        }

        orderService.deleteOrder(order)
        render status: 204
    }

    def showDetails() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'inventory.stockTransfer.label', default: 'Stock Transfer'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }

        Location currentLocation = Location.get(session.warehouse.id)

        String editAction
        if (order.isOutbound(currentLocation)) {
            editAction = "createOutboundReturn"
        } else if (order.isInbound(currentLocation)) {
            editAction = "createInboundReturn"
        } else if (order.orderNumber?.startsWith(grailsApplication.config.openboxes.stockTransfer.binReplenishment.prefix as String)) {
            editAction = "replenishment"
        } else {
            editAction = "create"
        }

        boolean isUserManager = userService.isUserInRole(session.user.id as String,
                [RoleType.ROLE_SUPERUSER, RoleType.ROLE_ADMIN, RoleType.ROLE_MANAGER])

        def orderItems = order.orderItems?.findAll { !it.orderItems }?.sort { a, b ->
            a.dateCreated <=> b.dateCreated ?: a.orderIndex <=> b.orderIndex
        }

        render([data: [
                id                 : order.id,
                orderNumber        : order.orderNumber,
                statusLabel        : order.status ? warehouse.message(code: 'enum.OrderStatus.' + order.status.name()) : null,
                originName         : order.origin?.name,
                dateCreated        : formatDate(order.dateCreated, Constants.DEFAULT_DATE_FORMAT),
                createdByName      : order.createdBy?.name,
                updatedByName      : order.updatedBy?.name,
                lastUpdated        : formatDate(order.lastUpdated, Constants.DEFAULT_DATE_FORMAT),
                completedByName    : order.completedBy?.name,
                dateCompleted      : formatDate(order.dateCompleted, Constants.DEFAULT_DATE_FORMAT),
                editAction         : editAction,
                editDisabled       : order.status >= OrderStatus.COMPLETED,
                editDisabledMessage: warehouse.message(code: 'inventory.stockTransfers.editCompleted', default: 'Cannot edit completed order'),
                canDelete          : isUserManager && (order.status == OrderStatus.PENDING || order.status == OrderStatus.APPROVED),
                labels             : [
                        listStockTransfers : warehouse.message(code: 'default.list.label', args: [warehouse.message(code: 'inventory.stockTransfers.label', default: 'Stock Transfers')]),
                        editStockTransfer  : warehouse.message(code: 'inventory.editStockTransfer.label', default: 'Edit Stock Transfer'),
                        printStockTransfer : warehouse.message(code: 'inventory.printStockTransfer.label', default: 'Print Stock Transfer'),
                        deleteButton       : warehouse.message(code: 'default.button.delete.label', default: 'Delete'),
                        deleteConfirm      : warehouse.message(code: 'default.button.delete.confirm.message', default: 'Are you sure?'),
                        orderHeader        : warehouse.message(code: 'order.orderHeader.label', default: 'Order Header'),
                        orderNumber        : warehouse.message(code: 'inventory.stockTransfers.orderNumber.label', default: 'Order Number'),
                        status             : warehouse.message(code: 'default.status.label', default: 'Status'),
                        location           : warehouse.message(code: 'location.label', default: 'Location'),
                        auditing           : warehouse.message(code: 'default.auditing.label', default: 'Auditing'),
                        createdBy          : warehouse.message(code: 'order.createdBy.label', default: 'Created by'),
                        updatedBy          : warehouse.message(code: 'default.updatedBy.label', default: 'Updated by'),
                        completedBy        : warehouse.message(code: 'order.completedBy.label', default: 'Completed by'),
                        none               : warehouse.message(code: 'default.none.label', default: 'None'),
                        summary            : warehouse.message(code: 'default.summary.label', default: 'Summary'),
                        productCode        : warehouse.message(code: 'product.productCode.label', default: 'Code'),
                        productName        : warehouse.message(code: 'product.name.label', default: 'Name'),
                        lot                : warehouse.message(code: 'inventoryItem.lot.label', default: 'Lot'),
                        expirationDate     : warehouse.message(code: 'inventoryItem.expirationDate.label', default: 'Expiration date'),
                        qtyTransferred     : warehouse.message(code: 'inventory.stockTransfers.qtyTransferred', default: 'Qty transferred'),
                        transferredFrom    : warehouse.message(code: 'inventory.stockTransfers.transferredFrom', default: 'Transferred From'),
                        transferredTo      : warehouse.message(code: 'inventory.stockTransfers.transferredTo', default: 'Transferred To'),
                        noItems            : warehouse.message(code: 'default.noItems.label', default: 'No items'),
                ],
                items              : orderItems?.collect { orderItem ->
                    [
                            id             : orderItem.id,
                            productId      : orderItem.product?.id,
                            productCode    : orderItem.product?.productCode,
                            productName    : orderItem.product?.displayNameOrDefaultName,
                            productColor   : orderItem.product?.color,
                            lotNumber      : orderItem.inventoryItem?.lotNumber,
                            expirationDate : formatDate(orderItem.inventoryItem?.expirationDate, Constants.DEFAULT_DATE_FORMAT),
                            quantity       : orderItem.quantity,
                            originBin      : orderItem.originBinLocation?.name,
                            destinationBin : orderItem.destinationBinLocation?.name,
                    ]
                } ?: [],
        ]] as JSON)
    }

    def printData() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'inventory.stockTransfer.label', default: 'Stock Transfer'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }

        def allStockTransferItems = order.orderItems.findAll { !it.parentOrderItem }.sort { it.product.name }
        def zoneNames = allStockTransferItems?.collect { it?.originBinLocation?.zone?.name }?.unique()?.sort { a, b ->
            !a ? !b ? 0 : 1 : !b ? -1 : a <=> b
        }
        def stockTransferItemsByZone = allStockTransferItems?.groupBy { it?.originBinLocation?.zone?.name } ?: [:]

        Closure itemJson = { orderItem ->
            def splitItems = orderItem?.orderItems?.sort { a, b ->
                a.destinationBinLocation?.name <=> b.destinationBinLocation?.name ?: b.quantity <=> a.quantity
            }
            return [
                    id            : orderItem.id,
                    originBin     : orderItem?.originBinLocation?.name,
                    productCode   : orderItem?.product?.productCode,
                    productName   : orderItem?.product?.name,
                    lotNumber     : orderItem?.inventoryItem?.lotNumber,
                    expirationDate: formatDate(orderItem?.inventoryItem?.expirationDate, "MM/dd/yyyy"),
                    destinationBin: orderItem?.destinationBinLocation?.name,
                    quantity      : orderItem?.quantity,
                    splitItems    : splitItems?.collect {
                        [
                                id            : it.id,
                                destinationBin: it?.destinationBinLocation?.name,
                                quantity      : it?.quantity,
                        ]
                    } ?: [],
            ]
        }

        def zones = []
        zoneNames?.each { zoneName ->
            def stockTransferItems = stockTransferItemsByZone[zoneName] ?: []

            def stockTransferItemsColdChain = stockTransferItems.findAll { it?.product?.coldChain }
            def stockTransferItemsControlled = stockTransferItems.findAll { it?.product?.controlledSubstance }
            def stockTransferItemsHazmat = stockTransferItems.findAll { it?.product?.hazardousMaterial }
            def stockTransferItemsOther = stockTransferItems.findAll {
                !it?.product?.hazardousMaterial && !it?.product?.coldChain && !it?.product?.controlledSubstance
            }

            def groups = []
            if (stockTransferItemsColdChain) {
                groups << [
                        key         : "coldChain",
                        title       : warehouse.message(code: 'product.coldChain.label', default: 'Cold Chain'),
                        hasFollowing: (stockTransferItemsControlled || stockTransferItemsHazmat || stockTransferItemsOther) as boolean,
                        items       : stockTransferItemsColdChain.collect(itemJson),
                ]
            }
            if (stockTransferItemsControlled) {
                groups << [
                        key         : "controlledSubstance",
                        title       : warehouse.message(code: 'product.controlledSubstance.label', default: 'Controlled Substance'),
                        hasFollowing: (stockTransferItemsHazmat || stockTransferItemsOther) as boolean,
                        items       : stockTransferItemsControlled.collect(itemJson),
                ]
            }
            if (stockTransferItemsHazmat) {
                groups << [
                        key         : "hazardousMaterial",
                        title       : warehouse.message(code: 'product.hazardousMaterial.label', default: 'Hazardous Material'),
                        hasFollowing: (stockTransferItemsOther) as boolean,
                        items       : stockTransferItemsHazmat.collect(itemJson),
                ]
            }
            if (stockTransferItemsOther) {
                groups << [
                        key         : "generalGoods",
                        title       : warehouse.message(code: 'product.generalGoods.label', default: 'General Goods'),
                        hasFollowing: true,
                        items       : stockTransferItemsOther.collect(itemJson),
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
                title          : warehouse.message(code: 'inventory.printStockTransfer.label', default: 'Print Stock Transfer'),
                heading        : warehouse.message(code: 'order.transferOrder.label', default: 'Transfer Order'),
                logoUrl        : grailsApplication.config.openboxes.report.logo.url,
                orderNumber    : order.orderNumber,
                createdByName  : order.createdBy?.name,
                dateCreated    : formatDate(order.dateCreated, "MM/dd/yyyy"),
                headerRows     : [
                        [label: warehouse.message(code: 'order.orderNumber.label', default: 'Order Number'), value: order.orderNumber],
                        [label: warehouse.message(code: 'default.createdBy.label', default: 'Created By'), value: order.createdBy?.name],
                        [label: warehouse.message(code: 'default.dateCreated.label', default: 'Date Created'), value: formatDate(order.dateCreated, "MM/dd/yyyy")],
                ],
                columns        : [
                        [key: 'number', title: warehouse.message(code: 'report.number.label', default: '#')],
                        [key: 'currentBin', title: warehouse.message(code: 'orderItem.currentBin.label', default: 'Current Bin')],
                        [key: 'productCode', title: warehouse.message(code: 'product.productCode.label', default: 'Code')],
                        [key: 'productName', title: warehouse.message(code: 'product.name.label', default: 'Name')],
                        [key: 'lotSerialNo', title: warehouse.message(code: 'default.lotSerialNo.label', default: 'Lot/Serial No.')],
                        [key: 'expiry', title: warehouse.message(code: 'orderItem.expiry.label', default: 'Expiry')],
                        [key: 'transferToBin', title: warehouse.message(code: 'orderItem.transferToBin.label', default: 'Transfer To Bin')],
                        [key: 'qtyToTransfer', title: warehouse.message(code: 'orderItem.qtyToTransfer.label', default: 'Quantity To Transfer')],
                        [key: 'notes', title: warehouse.message(code: 'default.notes.label', default: 'Notes')],
                ],
                signatureColumns: [
                        name     : warehouse.message(code: 'default.name.label', default: 'Name'),
                        signature: warehouse.message(code: 'default.signature.label', default: 'Signature'),
                        date     : warehouse.message(code: 'default.date.label', default: 'Date'),
                ],
                signatures     : [
                        [label: warehouse.message(code: 'order.completedBy.label', default: 'Completed By'), name: null, date: null],
                ],
                zones          : zones,
        ]] as JSON)
    }

    def statusOptions() {
        def statusOptions = OrderStatus.listStockTransfer().collect{
            [ id: it.name(), value: it.name(), label: "${g.message(code: 'enum.OrderStatus.' + it.name())}", variant: it.variant?.name()]
        }
        render([data: statusOptions] as JSON)
    }
}
