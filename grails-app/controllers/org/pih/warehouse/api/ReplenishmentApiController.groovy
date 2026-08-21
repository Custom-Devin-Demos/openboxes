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

import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.core.identification.IdentifierGeneratorContext
import org.pih.warehouse.inventory.InventoryLevelStatus
import org.pih.warehouse.inventory.Requirement
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderIdentifierService
import org.pih.warehouse.order.OrderItem
import org.pih.warehouse.order.OrderType
import org.pih.warehouse.order.OrderTypeCode
import org.pih.warehouse.picklist.Picklist

class ReplenishmentApiController {

    OrderIdentifierService orderIdentifierService
    def replenishmentService
    def picklistService

    def list() {
        List<Order> replenishments = Order.findAllByOrderType(OrderType.get(OrderTypeCode.TRANSFER_ORDER.name()))
        render([data: replenishments.collect { it.toJson() }] as JSON)
    }

    private static String formatPrintDate(Date date, String pattern) {
        return date ? new java.text.SimpleDateFormat(pattern).format(date) : null
    }

    def printData() {
        Order transferOrder = Order.get(params.id)
        if (!transferOrder) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }

        Picklist picklist = Picklist.findByOrder(transferOrder)
        def zoneNames = picklist.picklistItems?.collect { it?.binLocation?.zone?.name }?.unique()?.sort { a, b -> !a ? !b ? 0 : 1 : !b ? -1 : a <=> b }
        def pickListByZone = picklist.picklistItems?.groupBy { it.binLocation?.zone?.name }

        def zones = []
        zoneNames.each { zoneName ->
            def coldChain = pickListByZone[zoneName].findAll {
                it.orderItem.product['coldChain']
            }.collect { it.orderItem }?.unique()
            def controlledSubstance = pickListByZone[zoneName].findAll {
                it.orderItem.product['controlledSubstance']
            }.collect { it.orderItem }?.unique()
            def hazardousMaterial = pickListByZone[zoneName].findAll {
                it.orderItem.product['hazardousMaterial']
            }.collect { it.orderItem }?.unique()
            def generalGoods = pickListByZone[zoneName].findAll {
                !it?.orderItem.product['coldChain'] && !it?.orderItem.product['controlledSubstance'] && !it?.orderItem.product['hazardousMaterial']
            }.collect { it.orderItem }?.unique()

            def groupedLineItemsMap = [
                    'coldChain'          : coldChain,
                    'controlledSubstance': controlledSubstance,
                    'hazardousMaterial'  : hazardousMaterial,
                    'generalGoods'       : generalGoods,
            ]
            def groupedPickListItems = pickListByZone[zoneName].groupBy { it.orderItem }

            def groups = []
            groupedLineItemsMap.each { lineItemKey, lineItems ->
                if (lineItems.size() > 0) {
                    groups << [
                            key  : lineItemKey,
                            title: warehouse.message(code: 'product.' + lineItemKey + '.label'),
                            items: lineItems.collect { lineItem ->
                                def groupedPicklistItems = groupedPickListItems[lineItem]
                                [
                                        id                : lineItem.id,
                                        productCode       : lineItem?.product?.productCode,
                                        productName       : lineItem?.product?.name,
                                        destinationBin    : lineItem?.destinationBinLocation?.name,
                                        quantity          : lineItem?.quantity,
                                        unitOfMeasure     : lineItem?.product?.unitOfMeasure ?: "EA",
                                        lines             : groupedPicklistItems ? groupedPicklistItems.collect { picklistItem ->
                                            [
                                                    binLocation   : picklistItem?.binLocation?.name,
                                                    lotNumber     : picklistItem?.inventoryItem?.lotNumber,
                                                    expirationDate: formatPrintDate(picklistItem?.inventoryItem?.expirationDate, "MM/dd/yyyy"),
                                                    quantity      : picklistItem?.quantity ?: 0,
                                            ]
                                        } : [],
                                ]
                            },
                    ]
                }
            }

            zones << [
                    name    : zoneName,
                    title   : zoneName ?: warehouse.message(code: 'location.noZone.label', default: 'No zone'),
                    showName: (zoneName || zoneNames.size() > 1) as boolean,
                    groups  : groups,
            ]
        }

        render([data: [
                logoUrl   : grailsApplication.config.openboxes.report.logo.url,
                title     : warehouse.message(code: 'inventory.printStockTransfer.label', default: 'Print Stock Transfer'),
                heading   : warehouse.message(code: 'order.transferOrder.label', default: 'Transfer Order'),
                headerRows: [
                        [label: warehouse.message(code: 'order.orderNumber.label', default: 'Order Number'), value: transferOrder.orderNumber],
                        [label: warehouse.message(code: 'order.createdBy.label', default: 'Created by'), value: transferOrder.createdBy?.toString()],
                        [label: warehouse.message(code: 'order.dateCreated.label', default: 'Date Created'), value: transferOrder.dateCreated.format('MM/dd/yyyy')],
                ],
                columns   : [
                        [key: 'number', title: warehouse.message(code: 'report.number.label', default: '#')],
                        [key: 'currentBin', title: warehouse.message(code: 'orderItem.currentBin.label', default: 'Current bin')],
                        [key: 'productCode', title: warehouse.message(code: 'product.productCode.label', default: 'Code')],
                        [key: 'productName', title: warehouse.message(code: 'product.name.label', default: 'Name')],
                        [key: 'lotNumber', title: warehouse.message(code: 'default.lotSerialNo.label', default: 'Lot/Serial No.')],
                        [key: 'expiry', title: warehouse.message(code: 'orderItem.expiry.label', default: 'Expiry')],
                        [key: 'transferToBin', title: warehouse.message(code: 'orderItem.transferToBin.label', default: 'Transfer to bin')],
                        [key: 'qtyToTransfer', title: warehouse.message(code: 'orderItem.qtyToTransfer.label', default: 'Qty to transfer')],
                        [key: 'suggestedPick', title: warehouse.message(code: 'requisitionItem.suggestedPick.label', default: 'Suggested pick')],
                        [key: 'notes', title: warehouse.message(code: 'default.notes.label', default: 'Notes')],
                ],
                signatureColumns: [
                        name     : warehouse.message(code: 'default.name.label', default: 'Name'),
                        signature: warehouse.message(code: 'default.signature.label', default: 'Signature'),
                        date     : warehouse.message(code: 'default.date.label', default: 'Date'),
                ],
                zones     : zones,
                signatures: [
                        [label: warehouse.message(code: 'order.completedBy.label', default: 'Completed By'), name: null, date: null],
                ],
        ]] as JSON)
    }

    def read() {
        Order order = Order.get(params.id)
        if (!order) {
            throw new IllegalArgumentException("No replenishment found for order ID ${params.id}")
        }

        Replenishment replenishment = Replenishment.createFromOrder(order)
        replenishmentService.fillCalculatedData(replenishment)
        render([data: replenishment?.toJson()] as JSON)
    }

    def create() {
        Location currentLocation = Location.get(session.warehouse.id)
        JSONObject jsonObject = request.JSON
        User currentUser = User.get(session.user.id)
        if (!currentLocation || !currentUser) {
            throw new IllegalArgumentException("User must be logged into a location to update replenishment")
        }

        Replenishment replenishment = new Replenishment()

        // We don't have the order yet so can't use it when generating the stockTransferNumber
        bindReplenishmentData(replenishment, null, currentUser, currentLocation, jsonObject)

        Order order = replenishmentService.createOrUpdateOrderFromReplenishment(replenishment)

        picklistService.createPicklist(order)

        replenishment = Replenishment.createFromOrder(order)

        response.status = 201
        render([data: replenishment?.toJson()] as JSON)
    }

    def update() {
        JSONObject jsonObject = request.JSON

        User currentUser = User.get(session.user.id)
        Location currentLocation = Location.get(session.warehouse.id)
        if (!currentLocation || !currentUser) {
            throw new IllegalArgumentException("User must be logged into a location to update replenishment")
        }

        Order order = Order.get(params.id)
        if (!order) {
            throw new IllegalArgumentException("No replenishment found for order ID ${params.id}")
        }

        Replenishment replenishment = new Replenishment()
        replenishment.id = params.id
        bindReplenishmentData(replenishment, order, currentUser, currentLocation, jsonObject)
        if (replenishment?.status == ReplenishmentStatus.COMPLETED) {
            replenishmentService.completeReplenishment(replenishment)
        } else {
            order = replenishmentService.createOrUpdateOrderFromReplenishment(replenishment)
        }

        render status: 200
    }

    Replenishment bindReplenishmentData(Replenishment replenishment, Order order, User currentUser, Location currentLocation, JSONObject jsonObject) {
        bindData(replenishment, jsonObject, [exclude: ['replenishmentItems']])

        if (!replenishment.origin) {
            replenishment.origin = currentLocation
        }

        if (!replenishment.destination) {
            replenishment.destination = currentLocation
        }

        if (!replenishment.orderedBy) {
            replenishment.orderedBy = currentUser
        }

        if (!replenishment.replenishmentNumber) {
            String prefix = grailsApplication.config.openboxes.stockTransfer.binReplenishment.prefix
            replenishment.replenishmentNumber = orderIdentifierService.generate(order,
                    IdentifierGeneratorContext.builder()
                            .prefix(prefix)
                            .build())
        }

        jsonObject.replenishmentItems.each { replenishmentItemMap ->
            ReplenishmentItem replenishmentItem = new ReplenishmentItem()
            bindData(replenishmentItem, replenishmentItemMap, [exclude: ['picklistItems']])
            if (!replenishmentItem.location) {
                replenishmentItem.location = replenishment.destination
            }

            replenishmentItemMap.picklistItems.each { pickItemMap ->
                ReplenishmentItem pickItem = new ReplenishmentItem()
                bindData(pickItem, pickItemMap)
                if (!pickItem.location) {
                    pickItem.location = replenishment.origin
                }
                replenishmentItem.picklistItems.add(pickItem)
            }

            replenishment.replenishmentItems.add(replenishmentItem)

        }

        return replenishment
    }

    def statusOptions() {
        def options = InventoryLevelStatus.listReplenishmentOptions()?.collect {
            [ id: it.name(), value: it.name(), label: "${g.message(code: 'enum.InventoryLevelStatus.' + it.name())}" ]
        }
        render([data: options] as JSON)
    }

    def requirements() {
        Location location = Location.get(params.location.id)
        if (!location) {
            throw new IllegalArgumentException("Can't find location with given id: ${params.location.id}")
        }

        InventoryLevelStatus inventoryLevelStatus = params.inventoryLevelStatus ?
            InventoryLevelStatus.valueOf(params.inventoryLevelStatus) : InventoryLevelStatus.BELOW_MINIMUM
        List<Requirement> requirements = replenishmentService.getRequirements(location, inventoryLevelStatus)
        render([data: requirements?.collect { it.toJson() }] as JSON)
    }

    def removeItem() {
        replenishmentService.deleteReplenishmentItem(params.id)
        render status: 204
    }

   /** Returns picklist for specific order item (with picked items, available items and suggested items **/
    def getPicklist() {
        OrderItem orderItem = OrderItem.get(params.id)
        if (!orderItem) {
            throw new IllegalArgumentException("Can't find order item with given id: ${params.id}")
        }

        ReplenishmentPickPageItem pickPageItem = replenishmentService.getPicklist(orderItem)
        render([data: pickPageItem.toJson()] as JSON)
    }

    def createPicklist() {
        Order order = Order.get(params.id)
        if (!order) {
            throw new IllegalArgumentException("Can't find order with given id: ${params.id}")
        }

        picklistService.clearPicklist(order)

        picklistService.createPicklist(order)

        render status: 201
    }

    def createPicklistItem() {
        OrderItem orderItem = OrderItem.get(params.id)
        if (!orderItem) {
            throw new IllegalArgumentException("Can't find order item with given id: ${params.id}")
        }

        picklistService.createPicklist(orderItem)

        render status: 200

    }

    def updatePicklist() {
        OrderItem orderItem = OrderItem.get(params.id)
        if (!orderItem) {
            throw new IllegalArgumentException("Can't find order item with given id: ${params.id}")
        }

        JSONObject jsonObject = request.JSON
        List picklistItems = jsonObject.remove("picklistItems")

        if (!picklistItems) {
            throw new IllegalArgumentException("Must specifiy picklistItems")
        }

        picklistService.updatePicklist(orderItem, picklistItems)

        render status: 200
    }

    def deletePicklist() {
        OrderItem orderItem = OrderItem.get(params.id)
        if (!orderItem) {
            throw new IllegalArgumentException("Can't find order item with given id: ${params.id}")
        }

        picklistService.clearPicklist(orderItem)

        render status: 200
    }
}
