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
import org.pih.warehouse.LocalizationUtil
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Person
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.User
import org.pih.warehouse.inventory.InventoryItem
import org.pih.warehouse.inventory.TransactionException
import org.pih.warehouse.shipping.Container
import org.pih.warehouse.shipping.ContainerType
import org.pih.warehouse.shipping.ReferenceNumber
import org.pih.warehouse.shipping.ReferenceNumberType
import org.pih.warehouse.shipping.SendShipmentCommand
import org.pih.warehouse.shipping.Shipment
import org.pih.warehouse.shipping.ShipmentException
import org.pih.warehouse.shipping.ShipmentItem
import org.pih.warehouse.shipping.ShipmentMethod
import org.pih.warehouse.shipping.ShipmentType
import org.pih.warehouse.shipping.ShipmentWorkflow
import org.pih.warehouse.shipping.Shipper
import org.springframework.context.MessageSource
import org.springframework.http.HttpStatus

import java.text.SimpleDateFormat

class CreateShipmentApiController {

    def shipmentService
    def inventoryService
    def locationService
    def userService
    def mailService
    MessageSource messageSource

    def read() {
        Shipment shipment = params.id ? Shipment.get(params.id) : null
        if (params.id && !shipment) {
            renderNotFound()
            return
        }
        if (!shipment) {
            shipment = shipmentService.getShipmentInstance(null)
        }
        ShipmentWorkflow shipmentWorkflow = shipmentService.getShipmentWorkflow(shipment)
        render([data: buildReadData(shipment, shipmentWorkflow)] as JSON)
    }

    def saveDetails() {
        def jsonObject = request.JSON
        Shipment shipment
        try {
            shipment = shipmentService.getShipmentInstance(params.id ?: jsonObject.shipmentId ?: null)
        } catch (Exception e) {
            renderNotFound()
            return
        }
        shipment.name = jsonObject.name ?: null
        shipment.shipmentType = jsonObject.shipmentTypeId ? ShipmentType.get(jsonObject.shipmentTypeId) : null
        shipment.origin = jsonObject.originId ? Location.get(jsonObject.originId) : null
        shipment.destination = jsonObject.destinationId ? Location.get(jsonObject.destinationId) : null
        shipment.expectedShippingDate = parseDate(jsonObject.expectedShippingDate)
        shipment.expectedDeliveryDate = parseDate(jsonObject.expectedDeliveryDate)

        if (shipment.hasErrors() || !shipment.validate()) {
            renderErrors(localizeErrors(shipment))
            return
        }
        try {
            shipmentService.saveShipment(shipment)
        } catch (ShipmentException e) {
            renderErrors([e.message])
            return
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        ShipmentWorkflow shipmentWorkflow = shipmentService.getShipmentWorkflow(shipment)
        render([data: buildReadData(shipment, shipmentWorkflow)] as JSON)
    }

    def saveTracking() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            renderNotFound()
            return
        }
        def jsonObject = request.JSON
        ShipmentWorkflow shipmentWorkflow = shipmentService.getShipmentWorkflow(shipment)

        shipment.carrier = jsonObject.carrierId ? Person.get(jsonObject.carrierId) : null
        shipment.recipient = jsonObject.recipientId ? Person.get(jsonObject.recipientId) : null
        shipment.statedValue = jsonObject.statedValue ? new Float(jsonObject.statedValue.toString()) : null
        shipment.totalValue = jsonObject.totalValue ? new Float(jsonObject.totalValue.toString()) : null
        shipment.additionalInformation = jsonObject.additionalInformation ?: null

        bindReferenceNumbers(shipment, shipmentWorkflow, jsonObject.referenceNumbers)
        bindShipper(shipment, jsonObject.shipperId, jsonObject.trackingNumber)

        if (shipment.hasErrors() || !shipment.validate()) {
            renderErrors(localizeErrors(shipment))
            return
        }
        shipmentService.saveShipment(shipment)
        render([data: buildReadData(shipment, shipmentWorkflow)] as JSON)
    }

    def addContainers() {
        try {
            def jsonObject = request.JSON
            shipmentService.createContainers(params.id, jsonObject.containerId ?: null,
                    jsonObject.containerTypeId ?: null, jsonObject.containerText ?: null)
        } catch (ShipmentException e) {
            renderErrors([e.message])
            return
        }
        renderShipment()
    }

    def deleteContainers() {
        try {
            def jsonObject = request.JSON
            List containerIds = jsonObject.containerIds ?: []
            if (!containerIds) {
                throw new ShipmentException(message: "You must select at least one container to delete",
                        shipment: Shipment.load(params.id))
            }
            shipmentService.deleteContainers(params.id, containerIds, Boolean.valueOf(jsonObject.deleteItems?.toString()))
        } catch (ShipmentException e) {
            renderErrors([e.message])
            return
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        renderShipment()
    }

    def deleteAllContainers() {
        try {
            shipmentService.deleteAllContainers(params.id, true)
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        renderShipment()
    }

    def addItem() {
        try {
            def jsonObject = request.JSON
            shipmentService.addToShipmentItems(params.id, jsonObject.containerId ?: null,
                    jsonObject.inventoryItemId ?: null, jsonObject.quantity as Integer)
        } catch (ValidationException e) {
            renderErrors(localizeValidationErrors(e))
            return
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        renderShipment()
    }

    def deleteItem() {
        try {
            ShipmentItem shipmentItem = ShipmentItem.get(request.JSON.itemId)
            if (shipmentItem) {
                shipmentService.deleteShipmentItem(shipmentItem)
            }
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        renderShipment()
    }

    def moveItem() {
        try {
            def jsonObject = request.JSON
            shipmentService.moveShipmentItemToContainer(jsonObject.itemId?.toString(), jsonObject.containerId?.toString())
        } catch (ShipmentException e) {
            renderErrors([e.message])
            return
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        renderShipment()
    }

    def binLocations() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            renderNotFound()
            return
        }
        ShipmentItem shipmentItem = ShipmentItem.get(params.itemId)
        Location location = Location.get(session.warehouse.id)
        List binLocations = shipmentItem?.product ?
                inventoryService.getProductQuantityByBinLocation(location, shipmentItem.product) : []
        render([data: binLocations.collect {
            [
                binLocationId  : it.binLocation?.id,
                binLocationName: it.binLocation?.name ?: warehouse.message(code: 'default.label', default: 'Default'),
                inventoryItemId: it.inventoryItem?.id,
                lotNumber      : it.inventoryItem?.lotNumber,
                expirationDate : it.inventoryItem?.expirationDate?.format("MM/dd/yyyy"),
                quantity       : it.quantity,
            ]
        }] as JSON)
    }

    def pickItem() {
        def jsonObject = request.JSON
        ShipmentItem shipmentItemInstance
        try {
            shipmentItemInstance = ShipmentItem.get(jsonObject.itemId)

            if (!jsonObject.selection) {
                renderErrors([warehouse.message(code: 'shipping.mustPickBinLocation.message',
                        default: 'Please choose a bin location from the list')])
                return
            }

            String[] selection = jsonObject.selection.toString().split(":")
            String binLocationId = selection[0]
            String inventoryItemId = selection.length > 1 ? selection[1] : null

            InventoryItem inventoryItem = (inventoryItemId) ? InventoryItem.load(inventoryItemId) : null
            if (!inventoryItem) {
                shipmentItemInstance.errors.reject("shipmentItem.inventoryItem.required.message", "Inventory item is a required field")
                throw new ValidationException("Unable to update pick list item", shipmentItemInstance.errors)
            } else {
                shipmentItemInstance.inventoryItem = inventoryItem
            }

            Location binLocation = (binLocationId && !binLocationId.equals("null")) ? Location.load(binLocationId) : null
            shipmentItemInstance.binLocation = binLocation

            shipmentItemInstance.quantity = Integer.parseInt(jsonObject.quantity.toString())

            shipmentService.validateShipmentItem(shipmentItemInstance)
            shipmentItemInstance.save(flush: true)
        } catch (ValidationException e) {
            renderErrors(localizeValidationErrors(e))
            return
        }
        renderShipment()
    }

    def splitItem() {
        def jsonObject = request.JSON
        try {
            ShipmentItem shipmentItemInstance = ShipmentItem.load(jsonObject.itemId)

            def currentQuantity = shipmentItemInstance.quantity
            def splitQuantity = jsonObject.splitQuantity as int
            def newQuantity = currentQuantity - splitQuantity

            if (newQuantity <= 0 || newQuantity > currentQuantity) {
                shipmentItemInstance.errors.reject("shipmentItem.invalidQuantity.message", "Quantity is invalid")
                throw new ValidationException("Unable to update pick list item", shipmentItemInstance.errors)
            }

            String[] selection = jsonObject.selection.toString().split(":")
            String binLocationId = selection[0]
            String inventoryItemId = selection.length > 1 ? selection[1] : null

            Location binLocation = (binLocationId && !binLocationId.equals("null")) ? Location.load(binLocationId) : null
            InventoryItem inventoryItem = (inventoryItemId) ? InventoryItem.load(inventoryItemId) : null

            if (!inventoryItem) {
                shipmentItemInstance.errors.reject("shipmentItem.inventoryItem.required.message", "Inventory item is a required field")
                throw new ValidationException("Unable to update pick list item", shipmentItemInstance.errors)
            }

            shipmentItemInstance.quantity = newQuantity

            def splitItemInstance = shipmentItemInstance.cloneShipmentItem()
            splitItemInstance.inventoryItem = inventoryItem
            splitItemInstance.binLocation = binLocation
            splitItemInstance.quantity = splitQuantity
            shipmentItemInstance.shipment.addToShipmentItems(splitItemInstance)

            shipmentItemInstance.shipment.save(flush: true)
        } catch (ValidationException e) {
            renderErrors(localizeValidationErrors(e))
            return
        } catch (Exception e) {
            renderErrors(["Failed to edit pick list due to the following error: " + e.message])
            return
        }
        renderShipment()
    }

    def validatePicklist() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            renderNotFound()
            return
        }
        try {
            shipmentService.validatePicklist(shipment)
        } catch (ValidationException e) {
            renderErrors(localizeValidationErrors(e))
            return
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        render([data: [valid: true, message: warehouse.message(code: 'shipping.picklistValidated.message')]] as JSON)
    }

    def clearPicklist() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            renderNotFound()
            return
        }
        try {
            shipmentService.clearPicklist(shipment)
        } catch (ValidationException e) {
            renderErrors(localizeValidationErrors(e))
            return
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }
        renderShipment()
    }

    def send() {
        Shipment shipmentInstance = Shipment.get(params.id)
        if (!shipmentInstance) {
            renderNotFound()
            return
        }
        def jsonObject = request.JSON
        ShipmentWorkflow shipmentWorkflow = shipmentService.getShipmentWorkflow(params.id)

        SendShipmentCommand command = new SendShipmentCommand()
        command.shipment = shipmentInstance
        command.shipmentWorkflow = shipmentWorkflow
        command.comments = jsonObject.comments ?: null
        command.actualShippingDate = parseDateTime(jsonObject.actualShippingDate)
        command.debitStockOnSend = jsonObject.containsKey("debitStockOnSend") ?
                Boolean.valueOf(jsonObject.debitStockOnSend?.toString()) : true

        if (!command.validate()) {
            renderErrors(localizeErrors(command))
            return
        }

        User userInstance = User.get(session.user.id)
        def emailRecipients = new HashSet()
        jsonObject.emailRecipientIds?.each { recipientId ->
            def recipient = Person.get(recipientId)
            if (recipient && recipient.email) {
                emailRecipients.add(recipient)
            }
        }

        try {
            shipmentService.validatePicklist(shipmentInstance)
            shipmentService.sendShipment(shipmentInstance, command.comments, session.user, session.warehouse,
                    command.actualShippingDate, command.debitStockOnSend)
            triggerSendShipmentEmails(shipmentInstance, userInstance, emailRecipients)
        } catch (ValidationException e) {
            renderErrors(localizeValidationErrors(e))
            return
        } catch (ShipmentException e) {
            renderErrors([e.message] + localizeErrors(e.shipment))
            return
        } catch (TransactionException e) {
            renderErrors(localizeErrors(e.transaction) ?: [e.message])
            return
        } catch (RuntimeException e) {
            renderErrors([e.message])
            return
        } catch (Exception e) {
            renderErrors([e.message])
            return
        }

        if (shipmentInstance.hasErrors()) {
            renderErrors(localizeErrors(shipmentInstance))
            return
        }
        render([data: [shipmentId: shipmentInstance.id]] as JSON)
    }

    private void triggerSendShipmentEmails(Shipment shipmentInstance, User userInstance, Set<Person> recipients) {
        if (!recipients) recipients = new HashSet<Person>()

        // Add all users with the shipment notification role to the email
        def adminList = userService.findUsersByRoleType(RoleType.ROLE_SHIPMENT_NOTIFICATION)
        adminList.each { adminUser ->
            if (adminUser?.email) {
                recipients.add(adminUser)
            }
        }

        // add the current user to the list of email recipients
        if (userInstance) {
            recipients.add(userInstance)
        }

        if (!shipmentInstance.hasErrors()) {
            def shipmentName = "${shipmentInstance.name}"
            def shipmentType = "${LocalizationUtil.getLocalizedString(shipmentInstance.shipmentType?.name, currentLocale())}"
            def shipmentDate = "${shipmentInstance?.actualShippingDate?.format('MMMMM dd yyyy')}"
            def subject = "${warehouse.message(code: 'shipment.hasBeenShipped.message', args: [shipmentType, shipmentName, shipmentDate])}"
            def body = g.render(template: "/email/shipmentShipped",
                    model: [shipmentInstance: shipmentInstance, userInstance: userInstance])
            def toList = recipients?.collect { it?.email }?.unique()
            log.info("Mailing shipment emails to ${toList} ")

            try {
                mailService.sendHtmlMail(subject, body.toString(), toList)
            } catch (Exception e) {
                log.error "Error triggering send shipment emails " + e.message
            }
        }
    }

    private void bindReferenceNumbers(Shipment shipment, ShipmentWorkflow workflow, def referenceNumbers) {
        for (ReferenceNumberType type in workflow?.referenceNumberTypes) {

            ReferenceNumber referenceNumber = shipment.referenceNumbers?.find({
                it.referenceNumberType.id == type.id
            })

            def identifier = referenceNumbers?."${type.id}"
            if (identifier) {
                if (referenceNumber) {
                    referenceNumber.identifier = identifier
                } else {
                    shipment.addToReferenceNumbers(new ReferenceNumber([identifier         : identifier,
                                                                        referenceNumberType: type]))
                }
            } else {
                if (referenceNumber) {
                    shipment.removeFromReferenceNumbers(referenceNumber)
                }
            }
        }
    }

    private void bindShipper(Shipment shipment, def shipperId, def trackingNumber) {
        if (shipperId) {
            if (!shipment.shipmentMethod) {
                shipment.shipmentMethod = new ShipmentMethod()
            }
            shipment.shipmentMethod.shipper = Shipper.get(shipperId)
            shipment.shipmentMethod.trackingNumber = trackingNumber ?: null
        } else {
            // if there is no input for shipper, we remove the *entire* shipment method
            shipment.shipmentMethod = null
        }
    }

    private void renderShipment() {
        Shipment shipment = Shipment.get(params.id)
        if (!shipment) {
            renderNotFound()
            return
        }
        ShipmentWorkflow shipmentWorkflow = shipmentService.getShipmentWorkflow(shipment)
        render([data: buildReadData(shipment, shipmentWorkflow)] as JSON)
    }

    private Map buildReadData(Shipment shipment, ShipmentWorkflow shipmentWorkflow) {
        Locale locale = currentLocale()
        return [
            shipment : shipmentToJson(shipment, locale),
            workflow : workflowToJson(shipmentWorkflow, locale),
            options  : [
                shipmentTypes: ShipmentType.list().collect {
                    [id: it.id, name: LocalizationUtil.getLocalizedString(it.name, locale)]
                },
                origins      : locationService.getShipmentOrigins().sort {
                    it?.name?.toLowerCase()
                }.collect { locationToJson(it, locale) },
                destinations : locationService.getShipmentDestinations().sort {
                    it?.name?.toLowerCase()
                }.collect { locationToJson(it, locale) },
                shippers     : Shipper.list().sort { it?.name?.toLowerCase() }.collect {
                    [id: it.id, name: it.name]
                },
            ],
            containers: shipment.containers ? shipment.containers.sort { it?.sortOrder }.collect {
                containerToJson(it, locale)
            } : [],
            shipmentItems: shipment.shipmentItems ? shipment.shipmentItems.sort {
                it?.container?.sortOrder ?: 0
            }.collect { itemToJson(it) } : [],
            emailRecipients: emailRecipientsToJson(shipment, shipmentWorkflow),
        ]
    }

    private Map shipmentToJson(Shipment shipment, Locale locale) {
        return [
            id                   : shipment.id,
            shipmentNumber       : shipment.shipmentNumber,
            name                 : shipment.name,
            status               : shipment.status?.name ? LocalizationUtil.getLocalizedString(shipment.status.name, locale) : null,
            hasShipped           : shipment.hasShipped(),
            shipmentTypeId       : shipment.shipmentType?.id,
            shipmentTypeName     : shipment.shipmentType?.name ? LocalizationUtil.getLocalizedString(shipment.shipmentType.name, locale) : null,
            originId             : shipment.origin?.id,
            originName           : shipment.origin?.name,
            destinationId        : shipment.destination?.id,
            destinationName      : shipment.destination?.name,
            expectedShippingDate : shipment.expectedShippingDate?.format("MM/dd/yyyy"),
            expectedDeliveryDate : shipment.expectedDeliveryDate?.format("MM/dd/yyyy"),
            actualShippingDate   : shipment.actualShippingDate?.format("MM/dd/yyyy HH:mm"),
            carrierId            : shipment.carrier?.id,
            carrierName          : shipment.carrier?.name,
            recipientId          : shipment.recipient?.id,
            recipientName        : shipment.recipient?.name,
            shipperId            : shipment.shipmentMethod?.shipper?.id,
            trackingNumber       : shipment.shipmentMethod?.trackingNumber,
            statedValue          : shipment.statedValue,
            totalValue           : shipment.totalValue,
            additionalInformation: shipment.additionalInformation,
            referenceNumbers     : shipment.referenceNumbers ? shipment.referenceNumbers.collectEntries {
                [(it.referenceNumberType?.id): it.identifier]
            } : [:],
        ]
    }

    private Map workflowToJson(ShipmentWorkflow shipmentWorkflow, Locale locale) {
        return [
            id                  : shipmentWorkflow?.id,
            name                : shipmentWorkflow?.name,
            excluded            : [
                carrier              : shipmentWorkflow?.isExcluded('carrier') ? true : false,
                shipper              : shipmentWorkflow?.isExcluded('shipmentMethod.shipper') ? true : false,
                recipient            : shipmentWorkflow?.isExcluded('recipient') ? true : false,
                statedValue          : shipmentWorkflow?.isExcluded('statedValue') ? true : false,
                totalValue           : shipmentWorkflow?.isExcluded('totalValue') ? true : false,
                additionalInformation: shipmentWorkflow?.isExcluded('additionalInformation') ? true : false,
            ],
            referenceNumberTypes: shipmentWorkflow?.referenceNumberTypes ? shipmentWorkflow.referenceNumberTypes.collect {
                [id: it.id, name: LocalizationUtil.getLocalizedString(it.name, locale)]
            } : [],
            containerTypes      : (shipmentWorkflow?.containerTypes ?: ContainerType.list()).collect {
                [id: it.id, name: LocalizationUtil.getLocalizedString(it.name, locale)]
            },
        ]
    }

    private Map locationToJson(Location location, Locale locale) {
        String locationType = location.locationType?.name ?
                LocalizationUtil.getLocalizedString(location.locationType.name, locale) : ""
        return [id: location.id, name: location.name + (locationType ? " [" + locationType + "]" : "")]
    }

    private Map containerToJson(Container container, Locale locale) {
        return [
            id               : container.id,
            name             : container.name,
            containerTypeId  : container.containerType?.id,
            containerTypeName: container.containerType?.name ?
                    LocalizationUtil.getLocalizedString(container.containerType.name, locale) : null,
            parentContainerId: container.parentContainer?.id,
            sortOrder        : container.sortOrder,
        ]
    }

    private Map itemToJson(ShipmentItem item) {
        return [
            id             : item.id,
            containerId    : item.container?.id,
            containerName  : item.container?.name,
            productId      : item.product?.id,
            productCode    : item.product?.productCode,
            productName    : item.product?.name,
            inventoryItemId: item.inventoryItem?.id,
            lotNumber      : item.inventoryItem?.lotNumber ?: item.lotNumber,
            expirationDate : item.inventoryItem?.expirationDate?.format("MM/dd/yyyy"),
            binLocationId  : item.binLocation?.id,
            binLocationName: item.binLocation?.name,
            quantity       : item.quantity,
            unitOfMeasure  : item.product?.unitOfMeasure ?: "EA",
            recipientId    : item.recipient?.id,
            recipientName  : item.recipient?.name,
        ]
    }

    private List emailRecipientsToJson(Shipment shipment, ShipmentWorkflow shipmentWorkflow) {
        def candidates = new LinkedHashSet<Person>()
        if (!shipmentWorkflow?.isExcluded('carrier') && shipment.carrier) {
            candidates.add(shipment.carrier)
        }
        if (!shipmentWorkflow?.isExcluded('recipient') && shipment.recipient) {
            candidates.add(shipment.recipient)
        }
        shipment.shipmentItems?.each {
            if (it.recipient) {
                candidates.add(it.recipient)
            }
        }
        return candidates.collect {
            [id: it.id, name: it.name, email: it.email]
        }
    }

    private void renderNotFound() {
        render(status: HttpStatus.NOT_FOUND.value(),
                text: [errorMessages: ["Unable to locate shipment with ID " + params.id]] as JSON,
                contentType: "application/json")
    }

    private void renderErrors(List errorMessages) {
        render(status: HttpStatus.BAD_REQUEST.value(),
                text: [errorMessages: errorMessages?.findAll { it } ?: []] as JSON,
                contentType: "application/json")
    }

    private List localizeErrors(def bean) {
        Locale locale = currentLocale()
        return bean?.errors?.allErrors?.collect { messageSource.getMessage(it, locale) } ?: []
    }

    private List localizeValidationErrors(ValidationException e) {
        Locale locale = currentLocale()
        return e.errors?.allErrors?.collect { messageSource.getMessage(it, locale) } ?: [e.message]
    }

    private Locale currentLocale() {
        return session?.locale ?: session?.user?.locale ?: new Locale(grailsApplication.config.openboxes.locale.defaultLocale)
    }

    private static Date parseDate(def value) {
        if (!value) {
            return null
        }
        SimpleDateFormat dateFormat = new SimpleDateFormat("MM/dd/yyyy")
        dateFormat.lenient = false
        return dateFormat.parse(value.toString())
    }

    private static Date parseDateTime(def value) {
        if (!value) {
            return null
        }
        SimpleDateFormat dateFormat = new SimpleDateFormat("MM/dd/yyyy HH:mm")
        dateFormat.lenient = false
        try {
            return dateFormat.parse(value.toString())
        } catch (Exception e) {
            return parseDate(value)
        }
    }
}
