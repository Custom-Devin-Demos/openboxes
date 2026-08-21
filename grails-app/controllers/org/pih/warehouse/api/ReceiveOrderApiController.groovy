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
import org.pih.warehouse.core.User
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderCommand
import org.pih.warehouse.order.OrderException
import org.pih.warehouse.order.OrderItem
import org.pih.warehouse.order.OrderItemCommand
import org.pih.warehouse.product.Product
import org.pih.warehouse.shipping.ReceiptException
import org.pih.warehouse.shipping.ShipmentException
import org.pih.warehouse.shipping.ShipmentType
import org.springframework.context.MessageSource
import org.springframework.http.HttpStatus

import java.text.SimpleDateFormat

class ReceiveOrderApiController {

    def orderService
    MessageSource messageSource

    def read() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: HttpStatus.NOT_FOUND.value(), text: [errorMessages: ["Unable to locate order with ID " + params.id]] as JSON, contentType: "application/json")
            return
        }
        OrderCommand orderCommand = orderService.getOrder(params.id, session.user.id)
        Locale locale = currentLocale()
        render([data: [
            order        : orderToJson(orderCommand),
            orderItems   : orderCommand.orderItems.collect { itemToJson(it) },
            shipmentTypes: ShipmentType.list().collect {
                [id: it.id, name: LocalizationUtil.getLocalizedString(it.name, locale)]
            },
            recipients   : Person.list().sort().collect {
                [id: it.id, name: it.lastName + ", " + it.firstName + " (" + it.email + ")"]
            },
        ]] as JSON)
    }

    private static final List<String> SHIPMENT_DETAILS_FIELDS = ["shipmentType", "recipient", "shippedOn", "deliveredOn"]

    def validateShipmentDetails() {
        OrderCommand orderCommand = bindOrderCommand(request.JSON)
        if (!orderCommand) {
            return
        }
        if (!orderCommand.validate(SHIPMENT_DETAILS_FIELDS)) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: localizeErrors(orderCommand)] as JSON, contentType: "application/json")
            return
        }
        render([data: [valid: true]] as JSON)
    }

    def validateOrderItems() {
        List errorMessages = validateItems(request.JSON.orderItems)
        if (errorMessages) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: errorMessages] as JSON, contentType: "application/json")
            return
        }
        render([data: [valid: true]] as JSON)
    }

    def submit() {
        def jsonObject = request.JSON
        OrderCommand orderCommand = bindOrderCommand(jsonObject)
        if (!orderCommand) {
            return
        }
        if (!orderCommand.validate(SHIPMENT_DETAILS_FIELDS)) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: localizeErrors(orderCommand)] as JSON, contentType: "application/json")
            return
        }
        List itemErrors = validateItems(jsonObject.orderItems)
        if (itemErrors) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: itemErrors] as JSON, contentType: "application/json")
            return
        }
        try {
            Order.withTransaction {
                orderCommand.order = Order.get(params.id)
                // Initialize the order type proxy so downstream shipment validation can use it
                orderCommand.order.orderType?.isReturnOrder()
                orderCommand.orderItems = jsonObject.orderItems.collect { bindOrderItemCommand(it) }
                orderCommand.currentUser = User.get(session.user.id)
                orderCommand.currentLocation = Location.get(session.warehouse.id)
                orderService.saveOrderShipment(orderCommand)
            }
        }
        catch (ShipmentException se) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: localizeErrors(se.shipment)] as JSON, contentType: "application/json")
            return
        }
        catch (ReceiptException re) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: localizeErrors(re.receipt)] as JSON, contentType: "application/json")
            return
        }
        catch (OrderException oe) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: localizeErrors(oe.order)] as JSON, contentType: "application/json")
            return
        }
        catch (ValidationException ve) {
            render(status: HttpStatus.BAD_REQUEST.value(), text: [errorMessages: ve.errors.allErrors.collect { messageSource.getMessage(it, currentLocale()) }] as JSON, contentType: "application/json")
            return
        }
        render([data: [orderId: orderCommand.order.id]] as JSON)
    }

    private OrderCommand bindOrderCommand(def jsonObject) {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: HttpStatus.NOT_FOUND.value(), text: [errorMessages: ["Unable to locate order with ID " + params.id]] as JSON, contentType: "application/json")
            return null
        }
        OrderCommand orderCommand = orderService.getOrder(params.id, null)
        orderCommand.orderItems.clear()
        orderCommand.shipmentType = jsonObject.shipmentTypeId ? ShipmentType.get(jsonObject.shipmentTypeId) : null
        orderCommand.recipient = jsonObject.recipientId ? Person.get(jsonObject.recipientId) : null
        orderCommand.shippedOn = parseDate(jsonObject.shippedOn)
        orderCommand.deliveredOn = parseDate(jsonObject.deliveredOn)
        return orderCommand
    }

    private OrderItemCommand bindOrderItemCommand(def jsonItem) {
        OrderItemCommand orderItemCommand = new OrderItemCommand()
        orderItemCommand.orderItem = jsonItem.orderItemId ? OrderItem.get(jsonItem.orderItemId) : null
        orderItemCommand.primary = jsonItem.primary ? Boolean.valueOf(jsonItem.primary.toString()) : false
        orderItemCommand.type = jsonItem.type ?: null
        orderItemCommand.description = jsonItem.description ?: null
        orderItemCommand.quantityOrdered = jsonItem.quantityOrdered ? jsonItem.quantityOrdered as Integer : null
        orderItemCommand.quantityReceived = jsonItem.quantityReceived ? jsonItem.quantityReceived as Integer : null
        orderItemCommand.productReceived = jsonItem.productId ? Product.get(jsonItem.productId) : null
        orderItemCommand.lotNumber = jsonItem.lotNumber ?: null
        orderItemCommand.expirationDate = parseDate(jsonItem.expirationDate)
        return orderItemCommand
    }

    private List validateItems(def jsonItems) {
        List errorMessages = []
        Locale locale = currentLocale()
        jsonItems?.each { jsonItem ->
            OrderItemCommand orderItemCommand = bindOrderItemCommand(jsonItem)
            if (orderItemCommand.quantityReceived && !orderItemCommand.validate(["productReceived"])) {
                orderItemCommand.errors.allErrors.each { error ->
                    errorMessages << messageSource.getMessage(error, locale)
                }
            }
        }
        return errorMessages
    }

    private List localizeErrors(def bean) {
        Locale locale = currentLocale()
        return bean?.errors?.allErrors?.collect { messageSource.getMessage(it, locale) } ?: []
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

    private static Map orderToJson(OrderCommand orderCommand) {
        Order order = orderCommand.order
        return [
            id         : order.id,
            orderNumber: order.orderNumber,
            name       : order.name,
            status     : order.status?.name(),
            origin     : order.origin?.name,
            destination: order.destination?.name,
            dateOrdered: order.dateOrdered?.format("MMM dd, yyyy"),
        ]
    }

    private static Map itemToJson(OrderItemCommand orderItemCommand) {
        OrderItem orderItem = orderItemCommand.orderItem
        return [
            orderItemId         : orderItem?.id,
            primary             : orderItemCommand.primary,
            type                : orderItemCommand.type,
            description         : orderItemCommand.description,
            productId           : orderItem?.product?.id,
            productCode         : orderItem?.product?.productCode,
            productName         : orderItem?.product?.name ?: orderItemCommand.description,
            unitOfMeasure       : orderItem?.product?.unitOfMeasure ?: "each",
            quantityOrdered     : orderItemCommand.quantityOrdered,
            quantityFulfilled   : orderItem?.quantityShipped ?: 0,
            completelyFulfilled : orderItem?.isCompletelyFulfilled() ?: false,
        ]
    }
}
