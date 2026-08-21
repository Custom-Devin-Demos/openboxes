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
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.donation.Donor
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.product.Product
import org.pih.warehouse.shipping.Container
import org.pih.warehouse.shipping.Shipment
import org.pih.warehouse.shipping.ShipmentItem
import org.springframework.http.HttpStatus

class ShipmentItemApiController {

    def inventoryService
    def shipmentService

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: ShipmentItem.list(params).collect { toJson(it) }, totalCount: ShipmentItem.count()] as JSON)
    }

    def read() {
        ShipmentItem shipmentItem = ShipmentItem.get(params.id)
        if (!shipmentItem) {
            throw new ObjectNotFoundException(params.id, ShipmentItem.class.toString())
        }
        render([data: toJson(shipmentItem)] as JSON)
    }

    def options() {
        render([data: [
            containers    : Container.list().collect { [id: it.id, label: it.toString()] },
            products      : Product.list().collect { [id: it.id, label: it.toString()] },
            persons       : Person.list().collect { [id: it.id, label: it.toString()] },
            inventoryItems: InventoryItem.list().collect { [id: it.id, label: it.toString()] },
            donors        : Donor.list().collect { [id: it.id, label: it.toString()] },
            shipments     : Shipment.list().collect { [id: it.id, label: it.toString()] },
        ]] as JSON)
    }

    @Transactional
    def create() {
        ShipmentItem shipmentItem = new ShipmentItem()
        bindShipmentItemData(shipmentItem, request.JSON)
        if (shipmentItem.hasErrors() || !shipmentItem.save(flush: true)) {
            throw new ValidationException("Invalid shipment item", shipmentItem.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(shipmentItem)] as JSON)
    }

    @Transactional
    def update() {
        ShipmentItem shipmentItem = ShipmentItem.get(params.id)
        if (!shipmentItem) {
            throw new ObjectNotFoundException(params.id, ShipmentItem.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (shipmentItem.version > version) {
                shipmentItem.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["ShipmentItem"] as Object[],
                        "Another user has updated this ShipmentItem while you were editing")
                throw new ValidationException("Invalid shipment item", shipmentItem.errors)
            }
        }
        bindShipmentItemData(shipmentItem, jsonObject)
        if (shipmentItem.hasErrors() || !shipmentItem.save(flush: true)) {
            throw new ValidationException("Invalid shipment item", shipmentItem.errors)
        }
        render([data: toJson(shipmentItem)] as JSON)
    }

    @Transactional
    def delete() {
        ShipmentItem shipmentItem = ShipmentItem.get(params.id)
        if (!shipmentItem) {
            throw new ObjectNotFoundException(params.id, ShipmentItem.class.toString())
        }
        try {
            shipmentItem.delete(flush: true)
            render status: HttpStatus.NO_CONTENT.value()
        }
        catch (org.springframework.dao.DataIntegrityViolationException e) {
            response.status = HttpStatus.CONFLICT.value()
            render([errorCode: HttpStatus.CONFLICT.value(),
                    errorMessage: warehouse.message(code: 'default.not.deleted.message',
                            args: [warehouse.message(code: 'shipmentItem.label', default: 'ShipmentItem'), params.id])] as JSON)
        }
    }

    def pick() {
        ShipmentItem shipmentItem = ShipmentItem.get(params.id)
        if (!shipmentItem) {
            throw new ObjectNotFoundException(params.id, ShipmentItem.class.toString())
        }
        Location location = Location.load(session.warehouse.id)
        List binLocations = inventoryService.getProductQuantityByBinLocation(location, shipmentItem.product)
        List binLocationSelected = binLocations.findAll {
            it?.binLocation == shipmentItem?.binLocation && it.inventoryItem == shipmentItem?.inventoryItem
        }
        render([data: [
            shipmentItem       : toJson(shipmentItem),
            binLocations       : binLocations.collect { toBinLocationJson(it) },
            binLocationSelected: binLocationSelected.collect { toBinLocationJson(it) },
        ]] as JSON)
    }

    @Transactional
    def updatePick() {
        ShipmentItem shipmentItem = ShipmentItem.get(params.id)
        if (!shipmentItem) {
            throw new ObjectNotFoundException(params.id, ShipmentItem.class.toString())
        }
        def jsonObject = request.JSON
        if (!jsonObject.selection) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorCode: HttpStatus.BAD_REQUEST.value(),
                    errorMessage: warehouse.message(code: 'shipping.mustPickBinLocation.message',
                            default: 'Please choose a bin location from the list')] as JSON)
            return
        }
        String[] selection = jsonObject.selection.toString().split(":")
        String binLocationId = selection.length > 0 ? selection[0] : null
        String inventoryItemId = selection.length > 1 ? selection[1] : null

        InventoryItem inventoryItem = (inventoryItemId && !inventoryItemId.equals("null")) ? InventoryItem.load(inventoryItemId) : null
        if (!inventoryItem) {
            shipmentItem.errors.reject("shipmentItem.inventoryItem.required.message", "Inventory item is a required field")
            throw new ValidationException("Unable to update pick list item", shipmentItem.errors)
        }
        shipmentItem.inventoryItem = inventoryItem

        Location binLocation = (binLocationId && !binLocationId.equals("null")) ? Location.load(binLocationId) : null
        shipmentItem.binLocation = binLocation

        shipmentItem.quantity = Integer.parseInt(jsonObject.quantity.toString())

        shipmentService.validateShipmentItem(shipmentItem)

        if (shipmentItem.hasErrors() || !shipmentItem.save(flush: true)) {
            throw new ValidationException("Unable to update pick list item", shipmentItem.errors)
        }
        render([data: toJson(shipmentItem)] as JSON)
    }

    def split() {
        ShipmentItem shipmentItem = ShipmentItem.get(params.id)
        if (!shipmentItem) {
            throw new ObjectNotFoundException(params.id, ShipmentItem.class.toString())
        }
        Location location = Location.load(session.warehouse.id)
        List binLocations = inventoryService.getProductQuantityByBinLocation(location, shipmentItem.product)
        List binLocationSelected = binLocations.findAll {
            it?.binLocation == shipmentItem?.binLocation && it.inventoryItem == shipmentItem?.inventoryItem
        }
        render([data: [
            shipmentItem       : toJson(shipmentItem),
            binLocations       : binLocations.collect { toBinLocationJson(it) },
            binLocationSelected: binLocationSelected.collect { toBinLocationJson(it) },
        ]] as JSON)
    }

    @Transactional
    def updateSplit() {
        ShipmentItem shipmentItem = ShipmentItem.get(params.id)
        if (!shipmentItem) {
            throw new ObjectNotFoundException(params.id, ShipmentItem.class.toString())
        }
        def jsonObject = request.JSON
        if (!jsonObject.selection) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorCode: HttpStatus.BAD_REQUEST.value(),
                    errorMessage: warehouse.message(code: 'shipping.mustPickBinLocation.message',
                            default: 'Please choose a bin location from the list')] as JSON)
            return
        }

        Integer currentQuantity = shipmentItem.quantity
        Integer splitQuantity
        try {
            splitQuantity = Integer.parseInt(jsonObject.splitQuantity.toString())
        } catch (NumberFormatException e) {
            shipmentItem.errors.reject("shipmentItem.invalidQuantity.message", "Quantity is invalid")
            throw new ValidationException("Unable to update pick list item", shipmentItem.errors)
        }
        Integer newQuantity = currentQuantity - splitQuantity

        // Make sure there's no funny business (i.e. entering a split quantity greater than the original quantity)
        if (newQuantity <= 0 || newQuantity > currentQuantity) {
            shipmentItem.errors.reject("shipmentItem.invalidQuantity.message", "Quantity is invalid")
            throw new ValidationException("Unable to update pick list item", shipmentItem.errors)
        }

        String[] selection = jsonObject.selection.toString().split(":")
        String binLocationId = selection.length > 0 ? selection[0] : null
        String inventoryItemId = selection.length > 1 ? selection[1] : null

        Location binLocation = (binLocationId && !binLocationId.equals("null")) ? Location.load(binLocationId) : null
        InventoryItem inventoryItem = (inventoryItemId && !inventoryItemId.equals("null")) ? InventoryItem.load(inventoryItemId) : null

        if (!inventoryItem) {
            shipmentItem.errors.reject("shipmentItem.inventoryItem.required.message", "Inventory item is a required field")
            throw new ValidationException("Unable to update pick list item", shipmentItem.errors)
        }

        // Update the old shipment item with the new quantity
        shipmentItem.quantity = newQuantity

        // Create a new shipment item and update with selected bin location and split quantity
        ShipmentItem splitItem = shipmentItem.cloneShipmentItem()
        splitItem.inventoryItem = inventoryItem
        splitItem.binLocation = binLocation
        splitItem.quantity = splitQuantity
        shipmentItem.shipment.addToShipmentItems(splitItem)

        if (!shipmentItem.shipment.save(flush: true)) {
            throw new ValidationException("Unable to split shipment item", shipmentItem.errors)
        }
        render([data: [
            shipmentItem: toJson(shipmentItem),
            splitItem   : toJson(splitItem),
        ]] as JSON)
    }

    private void bindShipmentItemData(ShipmentItem shipmentItem, def jsonObject) {
        shipmentItem.container = jsonObject.container ? Container.get(jsonObject.container) : null
        shipmentItem.product = jsonObject.product ? Product.get(jsonObject.product) : null
        shipmentItem.lotNumber = jsonObject.lotNumber ?: null
        shipmentItem.expirationDate = parseDate(jsonObject.expirationDate)
        if (jsonObject.quantity != null && jsonObject.quantity.toString() != "") {
            try {
                shipmentItem.quantity = Integer.parseInt(jsonObject.quantity.toString())
            } catch (NumberFormatException e) {
                shipmentItem.errors.rejectValue("quantity", "typeMismatch.java.lang.Integer",
                        ["quantity"] as Object[], "Property quantity must be a valid number")
            }
        } else {
            shipmentItem.quantity = null
        }
        shipmentItem.recipient = jsonObject.recipient ? Person.get(jsonObject.recipient) : null
        shipmentItem.inventoryItem = jsonObject.inventoryItem ? InventoryItem.get(jsonObject.inventoryItem) : null
        shipmentItem.donor = jsonObject.donor ? Donor.get(jsonObject.donor) : null
        shipmentItem.shipment = jsonObject.shipment ? Shipment.get(jsonObject.shipment) : null
    }

    private static Date parseDate(def value) {
        if (!value) {
            return null
        }
        String text = value.toString()
        return new java.text.SimpleDateFormat("yyyy-MM-dd").parse(text.take(10))
    }

    private static Map toBinLocationJson(def entry) {
        return [
            binLocation  : entry?.binLocation ? [id: entry.binLocation.id, name: entry.binLocation.name] : null,
            inventoryItem: entry?.inventoryItem ? [
                id            : entry.inventoryItem.id,
                lotNumber     : entry.inventoryItem.lotNumber,
                expirationDate: entry.inventoryItem.expirationDate,
            ] : null,
            quantity     : entry?.quantity,
        ]
    }

    private static Map toJson(ShipmentItem shipmentItem) {
        return [
            id            : shipmentItem.id,
            container     : shipmentItem.container ? [id: shipmentItem.container.id, name: shipmentItem.container.toString()] : null,
            product       : shipmentItem.product ? [id: shipmentItem.product.id, name: shipmentItem.product.toString(),
                                                    productCode: shipmentItem.product.productCode,
                                                    unitOfMeasure: shipmentItem.product.unitOfMeasure] : null,
            lotNumber     : shipmentItem.lotNumber,
            expirationDate: shipmentItem.expirationDate,
            quantity      : shipmentItem.quantity,
            recipient     : shipmentItem.recipient ? [id: shipmentItem.recipient.id, name: shipmentItem.recipient.toString()] : null,
            inventoryItem : shipmentItem.inventoryItem ? [id: shipmentItem.inventoryItem.id, name: shipmentItem.inventoryItem.toString(),
                                                          lotNumber: shipmentItem.inventoryItem.lotNumber] : null,
            donor         : shipmentItem.donor ? [id: shipmentItem.donor.id, name: shipmentItem.donor.toString()] : null,
            binLocation   : shipmentItem.binLocation ? [id: shipmentItem.binLocation.id, name: shipmentItem.binLocation.name] : null,
            dateCreated   : shipmentItem.dateCreated,
            lastUpdated   : shipmentItem.lastUpdated,
            orderItems    : shipmentItem.orderItems?.collect { [id: it.id, name: it.toString()] } ?: [],
            shipment      : shipmentItem.shipment ? [id: shipmentItem.shipment.id, name: shipmentItem.shipment.toString()] : null,
            version       : shipmentItem.version,
        ]
    }
}
