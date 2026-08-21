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
import grails.gorm.PagedResultList
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.inventory.StockMovementStatusCode
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderTypeCode
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductSummary
import org.pih.warehouse.requisition.Requisition
import org.springframework.http.HttpStatus

class MobileApiController {

    def locationService
    def stockMovementService

    def dashboard() {
        Location location = Location.get(session.warehouse.id)
        def productCount = ProductSummary.countByLocation(location)

        def orderCount = Order.createCriteria().count {
            eq("destination", location)
            orderType {
                eq("orderTypeCode", OrderTypeCode.PURCHASE_ORDER)
            }
        }

        def requisitionCount = Requisition.createCriteria().count {
            eq("origin", location)
        }

        render([data: [
                [name: "Inventory Items", class: "fa fa-box", count: productCount, url: g.createLink(controller: "mobile", action: "productList")],
                [name: "Purchase Orders", class: "fa fa-shopping-cart", count: orderCount, url: g.createLink(controller: "order", action: "list", params: ['origin.id': location.id])],
                [name: "Replenishment Orders", class: "fa fa-truck", count: requisitionCount, url: g.createLink(controller: "mobile", action: "outboundList", params: ['origin.id': location.id])],
        ]] as JSON)
    }

    def chooseLocationOptions() {
        User user = User.get(session.user.id)
        Location warehouse = session.warehouse ? Location.get(session.warehouse.id) : null
        Map loginLocationsMap = locationService.getLoginLocationsMap(user, warehouse, true)
        List savedLocations = user.warehouse && loginLocationsMap.containsValue(user.warehouse) ?
                [[id: user.warehouse.id, name: user.warehouse.name]] : []
        render([data: [
                savedLocations   : savedLocations,
                loginLocationsMap: loginLocationsMap.collect { entry ->
                    [
                            organization: entry.key,
                            locations   : entry.value.collect { [id: it.id, name: it.name] }.sort { it.name },
                    ]
                },
        ]] as JSON)
    }

    def errorDetails() {
        render([data: session.mobileError ?: [:]] as JSON)
    }

    def productSummaryList() {
        Location location = Location.get(session.warehouse.id)
        PagedResultList productSummaries = ProductSummary.createCriteria().list(
                max: params.max ? params.int("max") : 10, offset: params.offset ? params.int("offset") : 0) {
            eq("location", location)
            order("product", "asc")
        } as PagedResultList
        render([data: productSummaries.collect { toProductSummaryJson(it) },
                totalCount: productSummaries.totalCount] as JSON)
    }

    def productSummaryDetails() {
        Product product = Product.findByIdOrProductCode(params.id, params.id)
        Location location = Location.get(session.warehouse.id)
        ProductSummary productSummary = product ?
                ProductSummary.findByProductAndLocation(product, location) : null
        if (!productSummary) {
            response.status = HttpStatus.NOT_FOUND.value()
            render([errorMessage: "Product ${product?.productCode ?: params.id} is not available in ${location.locationNumber}".toString()] as JSON)
            return
        }
        render([data: toProductSummaryJson(productSummary) + [
                attributes: productSummary.product.attributes?.collect { productAttribute ->
                    [
                        name         : productAttribute.attribute?.name,
                        value        : productAttribute.value,
                        unitOfMeasure: productAttribute.unitOfMeasure?.name ?:
                                productAttribute.attribute?.unitOfMeasureClass?.baseUom?.name,
                    ]
                } ?: [],
        ]] as JSON)
    }

    def outboundList() {
        Location origin = Location.get(params.origin ? params.origin.id : session.warehouse.id)
        StockMovement stockMovement = new StockMovement(origin: origin,
                stockMovementDirection: StockMovementDirection.OUTBOUND,
                stockMovementStatusCode: StockMovementStatusCode.PENDING)
        params.max = params.max ?: 10
        params.offset = params.offset ?: 0
        def stockMovements = stockMovementService.getStockMovements(stockMovement, params)
        render([data: stockMovements.collect {
            [
                id                   : it.id,
                identifier           : it.identifier,
                status               : it.status?.toString(),
                destination          : [
                    name          : it.destination?.name,
                    locationNumber: it.destination?.locationNumber,
                ],
                requestedDeliveryDate: it.requisition?.requestedDeliveryDate?.format("dd MMM yyyy"),
            ]
        }, totalCount: stockMovements.totalCount] as JSON)
    }

    private static Map toProductSummaryJson(ProductSummary productSummary) {
        Product product = productSummary.product
        return [
            product: [
                id           : product.id,
                productCode  : product.productCode,
                name         : product.name,
                description  : product.description,
                unitOfMeasure: product.unitOfMeasure,
                thumbnailId  : product.images ? product.thumbnail?.id : null,
                handlingIcons: product.handlingIcons?.collect {
                    [icon: it.icon, color: it.color, label: it.label]
                } ?: [],
            ],
            quantityOnHand: productSummary.quantityOnHand ?: 0,
        ]
    }
}
