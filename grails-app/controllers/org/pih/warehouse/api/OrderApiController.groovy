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
import org.pih.warehouse.core.ActivityCode
import org.pih.warehouse.core.BudgetCode
import org.pih.warehouse.core.BudgetCodeFilterCommand
import org.pih.warehouse.core.BudgetCodeService
import org.pih.warehouse.core.Comment
import org.pih.warehouse.core.Constants
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentCode
import org.pih.warehouse.core.DocumentService
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.User
import org.pih.warehouse.core.UserService
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderAdjustment
import org.pih.warehouse.order.OrderAdjustmentType
import org.pih.warehouse.order.OrderItem
import org.pih.warehouse.order.OrderItemStatusCode
import org.pih.warehouse.order.OrderService
import org.pih.warehouse.order.OrderStatus
import org.pih.warehouse.order.OrderSummaryStatus
import org.pih.warehouse.order.OrderType
import org.pih.warehouse.order.OrderTypeCode

import java.math.RoundingMode
import java.text.SimpleDateFormat

class OrderApiController {

    OrderService orderService
    DocumentService documentService
    BudgetCodeService budgetCodeService
    UserService userService

    /**
     * Replicates the model behavior of the legacy OrderController.list action
     * as a JSON endpoint for the React order list screen.
     */
    def list() {
        Location currentLocation = Location.get(session.warehouse.id)
        Boolean isCentralPurchasingEnabled = currentLocation.supports(ActivityCode.ENABLE_CENTRAL_PURCHASING)

        // Parse pagination and date parameters
        Date statusStartDate = params.statusStartDate ? Date.parse("MM/dd/yyyy", params.statusStartDate) : null
        Date statusEndDate = params.statusEndDate ? Date.parse("MM/dd/yyyy", params.statusEndDate) : null

        params.destination = params.destination == null && !isCentralPurchasingEnabled ? session?.warehouse?.id : params.destination
        OrderType orderType = params.orderType ? OrderType.findByIdOrCode(params.orderType, params.orderType) : OrderType.findByCode(OrderTypeCode.PURCHASE_ORDER.name())
        params.status = params.status ? Enum.valueOf(OrderStatus.class, params.status) : null
        params.destinationParty = isCentralPurchasingEnabled ? currentLocation?.organization?.id : params.destinationParty

        params.max = params.max ?: 10
        params.offset = params.offset ?: 0

        def orderTemplate = new Order(params)
        orderTemplate.orderType = orderType

        def orders = orderService.getOrders(orderTemplate, statusStartDate, statusEndDate, params)
        def ordersDerivedStatus = orderService.getOrdersDerivedStatus(orders?.collect { it?.id })

        String defaultCurrencyCode = grailsApplication.config.openboxes.locale.defaultCurrencyCode
        def data = orders.collect { Order order ->
            def originOrgCode = order.origin?.organization?.code
            def destinationOrgCode = order.destination?.organization?.code
            [
                id                    : order.id,
                orderNumber           : order.orderNumber,
                name                  : order.name,
                orderTypeCode         : order.orderType?.code,
                orderTypeName         : order.orderType?.name,
                status                : order.status?.name(),
                derivedStatus         : ordersDerivedStatus ? ordersDerivedStatus[order.id] : null,
                origin                : "${order.origin?.name}" + (originOrgCode ? " (${originOrgCode})" : ""),
                destination           : "${order.destination?.name}" + (destinationOrgCode ? " (${destinationOrgCode})" : ""),
                orderedBy             : order.orderedBy?.name,
                dateOrdered           : order.dateOrdered,
                orderItemsCount       : order.orderItems?.findAll { OrderItem orderItem -> orderItem.orderItemStatusCode != OrderItemStatusCode.CANCELED }?.size() ?: 0,
                orderedOrderItemsCount: order.orderedOrderItems?.size() ?: 0,
                shippedItemsCount     : order.shippedOrderItems?.size() ?: 0,
                receivedItemsCount    : order.receivedOrderItems?.size() ?: 0,
                total                 : "${order.total?.setScale(2, RoundingMode.HALF_UP)} ${order.currencyCode ?: defaultCurrencyCode}",
                totalNormalized       : "${order.totalNormalized?.setScale(2, RoundingMode.HALF_UP)} ${defaultCurrencyCode}",
                shipmentsCount        : order.shipments?.size() ?: 0,
                isPending             : order.isPending(),
                isPlaced              : order.isPlaced(),
                isBeforePlaced        : order.status < OrderStatus.PLACED,
            ]
        }

        render([
            data      : data,
            totalCount: orders?.totalCount ?: 0,
            totalPrice: orders?.sum { it.totalNormalized ?: 0.0 } ?: 0.0,
        ] as JSON)
    }

    /**
     * Provides order status options for the React order list filters
     * (equivalent of the legacy OrderStatus.list() select).
     */
    def statusOptions() {
        def options = OrderStatus.list().collect {
            [
                id   : it.name(),
                value: it.name(),
                label: "${g.message(code: 'enum.OrderStatus.' + it.name())}",
            ]
        }
        render([data: options] as JSON)
    }

    /**
     * Provides order type options for the React order list filters
     * (equivalent of the legacy OrderType.list() select).
     */
    def orderTypeOptions() {
        def options = OrderType.list().collect { OrderType orderType ->
            [
                id   : orderType.code,
                value: orderType.code,
                label: orderType.name,
            ]
        }
        render([data: options] as JSON)
    }

    /**
     * Provides data for the React equivalent of the legacy listOrderItems screen
     * (incomplete order items grouped by order).
     */
    def pendingOrderItems() {
        def orderItems = OrderItem.getAll().findAll { !it.isCompletelyFulfilled() }
        def data = orderItems.groupBy { it.order }.collectMany { order, items ->
            items.collect { OrderItem orderItem ->
                [
                    id                   : orderItem.id,
                    orderId              : order?.id,
                    orderName            : order?.name,
                    description          : orderItem.description,
                    quantity             : orderItem.quantity,
                    isCompletelyFulfilled: orderItem.isCompletelyFulfilled(),
                ]
            }
        }
        render([data: data] as JSON)
    }

    /**
     * Provides data for the React equivalent of the legacy orderItemSummaryList screen,
     * supporting both the orderItemSummary and orderItemDetails modes.
     */
    def orderItemSummaries() {
        params.max = params.max ?: 10
        params.offset = params.offset ?: 0
        if (params.derivedStatus) {
            params.derivedStatus = params.list("derivedStatus")
        }
        Boolean isDetailsMode = params.mode == "details"
        def orderItemSummaryList = isDetailsMode ?
            orderService.getOrderItemDetailsList(params) :
            orderService.getOrderItemSummaryList(params)

        def data = orderItemSummaryList.collect { orderItemSummary ->
            [
                id                 : orderItemSummary.id,
                orderId            : orderItemSummary.order?.id,
                orderNumber        : orderItemSummary.orderNumber,
                productCode        : orderItemSummary.product?.productCode,
                orderItemStatus    : orderItemSummary.orderItemStatus,
                quantityOrdered    : orderItemSummary.quantityOrdered,
                quantityShipped    : orderItemSummary.quantityShipped,
                quantityReceived   : orderItemSummary.quantityReceived,
                quantityCanceled   : isDetailsMode ? null : orderItemSummary.quantityCanceled,
                quantityInvoiced   : orderItemSummary.quantityInvoiced,
                isItemFullyShipped : isDetailsMode ? null : orderItemSummary.isItemFullyShipped,
                isItemFullyReceived: isDetailsMode ? null : orderItemSummary.isItemFullyReceived,
                isItemFullyInvoiced: isDetailsMode ? null : orderItemSummary.isItemFullyInvoiced,
                derivedStatus      : orderItemSummary.derivedStatus?.toString(),
            ]
        }

        render([data: data, totalCount: orderItemSummaryList?.totalCount ?: 0] as JSON)
    }

    /**
     * Provides the order header data used by the React order summary component
     * (replacement for the legacy _summary.gsp template).
     */
    def summary() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        def derivedStatusMap = orderService.getOrdersDerivedStatus([order.id])
        render([data: [
            id            : order.id,
            orderNumber   : order.orderNumber,
            name          : order.name,
            status        : order.status?.name(),
            derivedStatus : derivedStatusMap ? derivedStatusMap[order.id] : null,
            orderTypeCode : order.orderType?.code,
            isPutaway     : order.orderType?.code == Constants.PUTAWAY_ORDER,
            isPending     : order.isPending(),
            isPlaced      : order.isPlaced(),
            shipmentsCount: order.shipments?.size() ?: 0,
        ]] as JSON)
    }

    /**
     * Provides form data for the React add/edit comment screen.
     */
    def commentFormData() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        Comment comment = params.commentId ? Comment.get(params.commentId) : null
        render([data: [
            recipients: User.list().collect { User user -> [id: user.id, name: user.name] },
            comment   : comment ? [
                id         : comment.id,
                comment    : comment.comment,
                recipientId: comment.recipient?.id,
            ] : null,
        ]] as JSON)
    }

    /**
     * Provides form data for the React add/edit document screen.
     */
    def documentFormData() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        List<DocumentType> documentTypes = documentService.getNonTemplateDocumentTypes()
        Document document = params.documentId ? Document.get(params.documentId) : null
        render([data: [
            documentTypes: documentTypes.collect { DocumentType documentType ->
                [id: documentType.id, name: documentType.name]
            },
            document     : document ? [
                id            : document.id,
                name          : document.name,
                documentNumber: document.documentNumber,
                documentTypeId: document.documentType?.id,
                filename      : document.filename,
                fileUri       : document.fileUri,
            ] : null,
        ]] as JSON)
    }

    /**
     * Provides form data for the React edit adjustment screen.
     */
    def adjustmentFormData() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        Location currentLocation = Location.get(session.warehouse.id)
        Boolean isAccountingRequired = currentLocation?.isAccountingRequired()
        OrderAdjustment orderAdjustment = params.adjustmentId ? OrderAdjustment.get(params.adjustmentId) : null
        BudgetCodeFilterCommand command = new BudgetCodeFilterCommand(
            active: true,
            budgetCodeIds: orderAdjustment?.budgetCode?.id ? [orderAdjustment.budgetCode.id] : [],
            paginationEnabled: false,
        )
        List<BudgetCode> budgetCodes = budgetCodeService.getBudgetCodes(command)
        render([data: [
            isAccountingRequired: isAccountingRequired,
            orderItems          : order.listOrderItems().collect { OrderItem orderItem ->
                [id: orderItem.id, name: orderItem.product?.displayNameOrDefaultName]
            },
            adjustmentTypes     : OrderAdjustmentType.list().collect { OrderAdjustmentType adjustmentType ->
                [id: adjustmentType.id, name: adjustmentType.name]
            },
            budgetCodes         : budgetCodes.collect { BudgetCode budgetCode ->
                [id: budgetCode.id, code: budgetCode.code]
            },
            adjustment          : orderAdjustment ? [
                id                   : orderAdjustment.id,
                orderItemId          : orderAdjustment.orderItem?.id,
                orderAdjustmentTypeId: orderAdjustment.orderAdjustmentType?.id,
                description          : orderAdjustment.description,
                amount               : orderAdjustment.amount,
                percentage           : orderAdjustment.percentage,
                comments             : orderAdjustment.comments,
                budgetCodeId         : orderAdjustment.budgetCode?.id,
            ] : null,
        ]] as JSON)
    }

    /**
     * Provides data for the React order summary list screen
     * (replaces the model of the legacy orderSummaryList.gsp).
     */
    def orderSummaries() {
        params.max = params.max ?: 10
        params.offset = params.offset ?: 0
        ["orderStatus", "shipmentStatus", "receiptStatus", "paymentStatus", "derivedStatus"].each { String statusParam ->
            if (params[statusParam]) {
                params[statusParam] = params.list(statusParam)
            }
        }
        def orderSummaryList = orderService.getOrderSummaryList(params)
        def data = orderSummaryList.collect {
            [
                id            : it.id,
                orderNumber   : it.order?.orderNumber,
                itemsOrdered  : it.itemsOrdered,
                itemsShipped  : it.itemsShipped,
                itemsReceived : it.itemsReceived,
                itemsInvoiced : it.itemsInvoiced,
                orderStatus   : it.orderStatus,
                shipmentStatus: it.shipmentStatus,
                receiptStatus : it.receiptStatus,
                paymentStatus : it.paymentStatus,
                derivedStatus : it.derivedStatus,
            ]
        }
        render([data: data, totalCount: orderSummaryList?.totalCount ?: 0] as JSON)
    }

    /**
     * Provides status filter options for the React order summary list screen
     * (replaces the selects of the legacy _orderStatusFilters.gsp).
     */
    def orderSummaryStatusOptions() {
        def toOptions = { List statuses ->
            statuses.collect { [id: it.name(), value: it.name(), label: "${g.message(code: 'enum.OrderSummaryStatus.' + it.name())}"] }
        }
        render([data: [
            orderStatuses   : toOptions(OrderSummaryStatus.orderStatuses()),
            shipmentStatuses: toOptions(OrderSummaryStatus.shipmentStatuses()),
            receiptStatuses : toOptions(OrderSummaryStatus.receiptStatuses()),
            paymentStatuses : toOptions(OrderSummaryStatus.paymentStatuses()),
            derivedStatuses : toOptions(OrderSummaryStatus.derivedStatuses()),
        ]] as JSON)
    }

    /**
     * Provides the order header, auditing and action-permission data for
     * the React order show screen (replaces the model of the legacy show.gsp).
     */
    def details() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        Location currentLocation = Location.get(session.warehouse.id)
        User user = User.get(session.user.id)
        String defaultCurrencyCode = grailsApplication.config.openboxes.locale.defaultCurrencyCode
        Boolean isPurchaseOrder = order.orderType?.code == OrderTypeCode.PURCHASE_ORDER.name()
        def documentTemplates = Document.findAllByDocumentCode(DocumentCode.PURCHASE_ORDER_TEMPLATE)
        render([data: [
            id                        : order.id,
            orderNumber               : order.orderNumber,
            name                      : order.name,
            status                    : order.status?.name(),
            orderTypeName             : order.orderType?.name,
            orderTypeCode             : order.orderType?.code,
            isPurchaseOrder           : isPurchaseOrder,
            isPutawayOrder            : order.orderType?.code == Constants.PUTAWAY_ORDER,
            originCode                : order.origin?.organization?.code,
            origin                    : order.origin?.name,
            destination               : order.destination?.name,
            paymentTerm               : order.paymentTerm?.name,
            paymentMethodType         : order.paymentMethodType?.name,
            subtotal                  : g.formatNumber(number: order.subtotal ?: 0),
            totalAdjustments          : g.formatNumber(number: order.totalAdjustments ?: 0),
            total                     : g.formatNumber(number: order.total ?: 0),
            currencyCode              : order.currencyCode ?: defaultCurrencyCode,
            orderedBy                 : order.orderedBy?.name,
            dateOrdered               : formatLegacyDate(order.dateOrdered),
            approvedBy                : order.approvedBy?.name,
            dateApproved              : formatLegacyDate(order.dateApproved),
            completedBy               : order.completedBy?.name,
            dateCompleted             : formatLegacyDate(order.dateCompleted),
            createdBy                 : order.createdBy?.name,
            dateCreated               : formatLegacyDate(order.dateCreated),
            updatedBy                 : order.updatedBy?.name,
            lastUpdated               : formatLegacyDate(order.lastUpdated),
            commentsCount             : order.comments?.size() ?: 0,
            hasShipments              : (order.shipments?.size() ?: 0) > 0,
            isPending                 : order.isPending(),
            isPlaced                  : order.isPlaced(),
            isBeforePlaced            : order.status < OrderStatus.PLACED,
            supportsPlaceOrder        : currentLocation.supports(ActivityCode.PLACE_ORDER),
            isApprover                : userService.hasRolePurchaseApprover(user),
            hasRoleInvoice            : userService.hasRoleInvoice(user),
            isSuperuser               : userService.isSuperuser(user),
            hasRoleAssistant          : userService.isUserInRole(user.id, [RoleType.ROLE_ASSISTANT]),
            isPrepaymentInvoiceAllowed: order.isPrepaymentInvoiceAllowed,
            canGenerateInvoice        : order.canGenerateInvoice,
            documentTemplates         : documentTemplates.collect { [id: it.id, name: it.name] },
        ]] as JSON)
    }

    /**
     * Provides the summary tab data for the React order show screen
     * (replaces the model of the legacy _orderSummary.gsp template).
     */
    def orderItemsSummaryData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        Map orderSummary = orderService.getOrderSummary(order.id)
        def orderItems = orderSummary.orderItems?.sort { a, b -> a.dateCreated <=> b.dateCreated ?: a.orderIndex <=> b.orderIndex }
        render([data: [
            isPurchaseOrder    : orderSummary.isPurchaseOrder,
            isPutawayOrder     : orderSummary.isPutawayOrder,
            hasSupplierCode    : orderSummary.hasSupplierCode,
            hasManufacturerName: orderSummary.hasManufacturerName,
            hasManufacturerCode: orderSummary.hasManufacturerCode,
            currencyCode       : orderSummary.currencyCode,
            subtotal           : g.formatNumber(number: orderSummary.subtotal),
            totalAdjustments   : g.formatNumber(number: orderSummary.totalAdjustments),
            total              : g.formatNumber(number: orderSummary.total),
            orderItems         : orderItems?.collect { OrderItem orderItem ->
                [
                    id              : orderItem.id,
                    canceled        : orderItem.canceled,
                    productId       : orderItem.product?.id,
                    productCode     : orderItem.product?.productCode,
                    productName     : orderItem.product?.displayNameOrDefaultName,
                    supplierCode    : orderItem.productSupplier?.supplierCode,
                    manufacturerName: orderItem.productSupplier?.manufacturerName,
                    manufacturerCode: orderItem.productSupplier?.manufacturerCode,
                    quantity        : orderItem.quantity,
                    unitOfMeasure   : orderItem.unitOfMeasure,
                    unitPrice       : g.formatNumber(number: orderItem.unitPrice),
                    totalPrice      : g.formatNumber(number: orderItem.totalPrice()),
                ]
            } ?: [],
        ]] as JSON)
    }

    /**
     * Provides the item status tab data for the React order show screen
     * (replaces the model of the legacy _itemStatus.gsp template).
     */
    def itemStatusData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        Map itemStatus = orderService.getOrderItemStatus(order.id)
        render([data: [
            isPurchaseOrder: itemStatus.isPurchaseOrder,
            isPutawayOrder : itemStatus.isPutawayOrder,
            currencyCode   : itemStatus.currencyCode,
            total          : g.formatNumber(number: itemStatus.total),
            orderItems     : itemStatus.orderItems?.collect { orderItem ->
                [
                    id                    : orderItem.id,
                    canceled              : orderItem.canceled,
                    orderItemStatusCode   : orderItem.orderItemStatusCode?.name(),
                    productId             : orderItem.product?.id,
                    productCode           : orderItem.product?.productCode,
                    productName           : orderItem.product?.displayNameOrDefaultName,
                    description           : orderItem.description,
                    supplierCode          : orderItem.productSupplier?.supplierCode,
                    unitOfMeasure         : orderItem.unitOfMeasure,
                    quantity              : orderItem.quantity,
                    quantityShipped       : orderItem.quantityShipped,
                    quantityReceived      : orderItem.quantityReceived,
                    postedQuantityInvoiced: orderItem.postedQuantityInvoiced,
                    unitPrice             : g.formatNumber(number: orderItem.unitPrice ?: 0),
                    totalPrice            : g.formatNumber(number: orderItem.totalPrice() ?: 0),
                    lotNumber             : orderItem.inventoryItem?.lotNumber,
                    expirationDate        : formatLegacyDate(orderItem.inventoryItem?.expirationDate),
                    originBinLocation     : orderItem.originBinLocation?.toString(),
                    destinationBinLocation: orderItem.destinationBinLocation?.toString(),
                ]
            } ?: [],
        ]] as JSON)
    }

    /**
     * Provides the item details tab data for the React order show screen
     * (replaces the model of the legacy _itemDetails.gsp template).
     */
    def itemDetailsData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        Boolean isPurchaseOrder = order.orderType?.code == OrderTypeCode.PURCHASE_ORDER.name()
        def orderItems = order.orderItems?.sort { a, b -> a.dateCreated <=> b.dateCreated ?: a.orderIndex <=> b.orderIndex }
        SimpleDateFormat shipDateFormat = new SimpleDateFormat("dd/MMM/yyyy")
        render([data: [
            isPurchaseOrder: isPurchaseOrder,
            isPutawayOrder : order.orderType?.code == Constants.PUTAWAY_ORDER,
            orderItems     : orderItems?.collect { OrderItem orderItem ->
                [
                    id                     : orderItem.id,
                    canceled               : orderItem.orderItemStatusCode == OrderItemStatusCode.CANCELED,
                    productId              : orderItem.product?.id,
                    productCode            : orderItem.product?.productCode,
                    productName            : orderItem.product?.displayNameOrDefaultName,
                    supplierCode           : orderItem.productSupplier?.supplierCode,
                    manufacturerName       : orderItem.productSupplier?.manufacturer?.name,
                    manufacturerCode       : orderItem.productSupplier?.manufacturerCode,
                    quantity               : orderItem.quantity,
                    unitOfMeasure          : orderItem.unitOfMeasure,
                    recipient              : orderItem.recipient?.toString(),
                    estimatedReadyDate     : orderItem.estimatedReadyDate ? shipDateFormat.format(orderItem.estimatedReadyDate) : null,
                    actualReadyDate        : orderItem.actualReadyDate ? shipDateFormat.format(orderItem.actualReadyDate) : null,
                    budgetCode             : orderItem.budgetCode?.code,
                ]
            } ?: [],
        ]] as JSON)
    }

    /**
     * Provides the adjustments tab data for the React order show screen
     * (replaces the model of the legacy _orderAdjustments.gsp template).
     */
    def adjustmentsData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        render([data: [
            totalAdjustments: g.formatNumber(number: order.totalAdjustments),
            adjustments     : order.orderAdjustments?.sort()?.collect { OrderAdjustment orderAdjustment ->
                def amount
                if (orderAdjustment.amount) {
                    amount = formatNumber(number: orderAdjustment.amount)
                } else if (orderAdjustment.percentage) {
                    amount = orderAdjustment.orderItem ?
                        formatNumber(number: orderAdjustment.orderItem.totalAdjustments) :
                        formatNumber(number: orderAdjustment.totalAdjustments)
                }
                [
                    id                  : orderAdjustment.id,
                    canceled            : orderAdjustment.canceled,
                    orderItemProductName: orderAdjustment.orderItem?.product?.displayNameOrDefaultName,
                    typeName            : orderAdjustment.orderAdjustmentType?.name,
                    description         : orderAdjustment.description,
                    percentage          : orderAdjustment.percentage,
                    amount              : amount,
                    budgetCode          : orderAdjustment.budgetCode?.code,
                    derivedPaymentStatus: localizedMetadata(orderAdjustment.derivedPaymentStatus),
                ]
            } ?: [],
        ]] as JSON)
    }

    /**
     * Provides the shipments tab data for the React order show screen
     * (replaces the model of the legacy _orderShipments.gsp template).
     */
    def shipmentsData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        SimpleDateFormat expirationFormat = new SimpleDateFormat("MMM yyyy")
        def orderItems = order.orderItems?.sort { a, b -> a.dateCreated <=> b.dateCreated ?: a.orderIndex <=> b.orderIndex }
        def rows = []
        orderItems?.eachWithIndex { OrderItem orderItem, int i ->
            def shipmentItems = orderItem.shipmentItems?.sort { it.dateCreated }
            shipmentItems?.eachWithIndex { shipmentItem, int j ->
                rows << [
                    id             : shipmentItem.id,
                    orderItemNumber: j == 0 ? i + 1 : null,
                    productCode    : j == 0 ? shipmentItem.product?.productCode : null,
                    productName    : j == 0 ? shipmentItem.product?.displayNameOrDefaultName : null,
                    shipmentId     : shipmentItem.shipment?.id,
                    shipmentNumber : shipmentItem.shipment?.shipmentNumber,
                    shipmentName   : shipmentItem.shipment?.name,
                    shipmentType   : localizedMetadata(shipmentItem.shipment?.shipmentType),
                    shipmentStatus : localizedMetadata(shipmentItem.shipment?.currentStatus),
                    packLevel1     : shipmentItem.container?.parentContainer?.name,
                    packLevel2     : shipmentItem.container?.name,
                    lotNumber      : shipmentItem.inventoryItem?.lotNumber,
                    expirationDate : shipmentItem.inventoryItem?.expirationDate ? expirationFormat.format(shipmentItem.inventoryItem.expirationDate) : null,
                    quantity       : shipmentItem.quantity,
                    unitOfMeasure  : shipmentItem.product?.unitOfMeasure,
                ]
            }
        }
        render([data: [shipmentItems: rows]] as JSON)
    }

    /**
     * Provides the invoices tab data for the React order show screen
     * (replaces the model of the legacy _orderInvoices.gsp template).
     */
    def invoicesData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        render([data: [
            invoiceItems: order.getSortedInvoiceItems()?.collect { invoiceItem ->
                def orderItem = invoiceItem.orderItem ?: invoiceItem.shipmentItem?.orderItem
                [
                    id           : invoiceItem.id,
                    inverse      : invoiceItem.inverse,
                    orderItemId  : invoiceItem.orderItem?.id,
                    productCode  : invoiceItem.product?.productCode,
                    description  : invoiceItem.orderAdjustment ?
                        invoiceItem.description :
                        (invoiceItem.product?.displayNameOrDefaultName ?: invoiceItem.description),
                    invoiceId    : invoiceItem.invoice?.id,
                    invoiceNumber: invoiceItem.invoice?.invoiceNumber,
                    invoiceType  : invoiceItem.invoice?.invoiceType?.name,
                    invoiceStatus: invoiceItem.invoice?.status?.toString(),
                    quantity     : invoiceItem.quantity,
                    unitOfMeasure: invoiceItem.unitOfMeasure,
                    unitPrice    : g.formatNumber(number: invoiceItem.unitPrice),
                    amount       : g.formatNumber(number: invoiceItem.amount),
                ]
            } ?: [],
        ]] as JSON)
    }

    /**
     * Provides the documents tab data for the React order show screen
     * (replaces the model of the legacy _orderDocuments.gsp template).
     */
    def documentsData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        def documentTemplates = Document.findAllByDocumentCode(DocumentCode.PURCHASE_ORDER_TEMPLATE)
        def toDocumentJson = { Document document ->
            [
                id          : document.id,
                filename    : document.filename,
                name        : document.name,
                documentType: localizedMetadata(document.documentType),
                size        : document.size,
                lastUpdated : document.lastUpdated?.toString(),
                fileUri     : document.fileUri,
            ]
        }
        render([data: [
            documents        : order.documents?.findAll { !it.fileUri }?.collect(toDocumentJson) ?: [],
            documentTemplates: documentTemplates.collect(toDocumentJson),
            links            : order.documents?.findAll { it.fileUri }?.collect(toDocumentJson) ?: [],
        ]] as JSON)
    }

    /**
     * Provides the comments tab data for the React order show screen
     * (replaces the model of the legacy _orderComments.gsp template).
     */
    def commentsData() {
        Order order = Order.get(params.id)
        if (!order) {
            render(status: 404, text: [errorMessage: "Order not found"] as JSON)
            return
        }
        render([data: [
            comments: order.comments?.collect { Comment comment ->
                [
                    id         : comment.id,
                    recipient  : comment.recipient?.name,
                    sender     : comment.sender?.name,
                    comment    : comment.comment,
                    lastUpdated: comment.lastUpdated?.toString(),
                ]
            } ?: [],
        ]] as JSON)
    }

    /**
     * Provides data for the React order print screen
     * (replaces the model of the legacy print.gsp).
     */
    def printData() {
        Order order = Order.get(params.id)
        if (!order) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        String defaultCurrencyCode = grailsApplication.config.openboxes.locale.defaultCurrencyCode
        def toAddressJson = { address ->
            address ? [
                address        : address.address,
                address2       : address.address2,
                city           : address.city,
                stateOrProvince: address.stateOrProvince,
                postalCode     : address.postalCode,
                country        : address.country,
                description    : address.description,
            ] : null
        }
        def orderItems = order.listOrderItems()
        Boolean hasSupplierCode = order.orderItems.any { it.productSupplier?.supplierCode }
        Boolean hasManufacturerName = order.orderItems.any { it.productSupplier?.manufacturerName }
        Boolean hasManufacturerCode = order.orderItems.any { it.productSupplier?.manufacturerCode }
        def adjustments = order.orderAdjustments
            .findAll { !(it.orderItem || it.canceled) }
            .sort { it.totalAdjustments }
            .reverse()
        render([data: [
            orderNumber            : order.orderNumber,
            orderTypeName          : order.orderType?.name,
            currentDate            : new SimpleDateFormat("dd MMM yyyy").format(new Date()),
            destinationPartyName   : order.destinationParty?.displayName,
            destinationPartyAddress: toAddressJson(order.destinationParty?.defaultLocation?.address),
            paymentTerm            : order.paymentTerm?.name,
            paymentMethodType      : order.paymentMethodType?.name,
            originName             : order.origin?.name,
            originAddress          : toAddressJson(order.origin?.address),
            destinationName        : order.destination?.name,
            destinationAddress     : toAddressJson(order.destination?.address),
            orderedByName          : order.orderedBy?.name,
            currencyCode           : order.currencyCode ?: defaultCurrencyCode,
            hasSupplierCode        : hasSupplierCode,
            hasManufacturerName    : hasManufacturerName,
            hasManufacturerCode    : hasManufacturerCode,
            subtotal               : g.formatNumber(number: order.subtotal),
            total                  : g.formatNumber(number: order.total),
            orderItems             : orderItems?.collect { OrderItem orderItem ->
                [
                    id              : orderItem.id,
                    productCode     : orderItem.product?.productCode,
                    productName     : orderItem.product?.displayNameOrDefaultName,
                    supplierCode    : orderItem.productSupplier?.supplierCode,
                    manufacturerName: orderItem.productSupplier?.manufacturerName,
                    manufacturerCode: orderItem.productSupplier?.manufacturerCode,
                    quantity        : orderItem.quantity,
                    unitOfMeasure   : orderItem.unitOfMeasure,
                    unitPrice       : g.formatNumber(number: orderItem.unitPrice),
                    subtotal        : g.formatNumber(number: orderItem.subtotal),
                    total           : g.formatNumber(number: orderItem.total),
                ]
            } ?: [],
            adjustments            : adjustments.collect { OrderAdjustment orderAdjustment ->
                [
                    id              : orderAdjustment.id,
                    description     : orderAdjustment.description,
                    typeName        : localizedMetadata(orderAdjustment.orderAdjustmentType),
                    percentage      : orderAdjustment.percentage,
                    totalAdjustments: g.formatNumber(number: orderAdjustment.totalAdjustments),
                ]
            },
        ]] as JSON)
    }

    private String formatLegacyDate(Date date) {
        return date ? new SimpleDateFormat(Constants.DEFAULT_DATE_FORMAT).format(date) : null
    }

    private String localizedMetadata(Object obj) {
        if (obj == null) {
            return null
        }
        if (obj instanceof Enum) {
            return "${g.message(code: 'enum.' + obj.getClass().getSimpleName() + '.' + obj)}"
        }
        if (obj.hasProperty("name") && obj.name) {
            return obj.name?.toString()
        }
        return obj.toString()
    }
}
