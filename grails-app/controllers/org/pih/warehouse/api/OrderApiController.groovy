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
import org.pih.warehouse.core.DocumentService
import org.pih.warehouse.core.DocumentType
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderAdjustment
import org.pih.warehouse.order.OrderAdjustmentType
import org.pih.warehouse.order.OrderItem
import org.pih.warehouse.order.OrderItemStatusCode
import org.pih.warehouse.order.OrderService
import org.pih.warehouse.order.OrderStatus
import org.pih.warehouse.order.OrderType
import org.pih.warehouse.order.OrderTypeCode

import java.math.RoundingMode

class OrderApiController {

    OrderService orderService
    DocumentService documentService
    BudgetCodeService budgetCodeService

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
}
