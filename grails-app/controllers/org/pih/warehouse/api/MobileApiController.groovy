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
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderTypeCode
import org.pih.warehouse.product.ProductSummary
import org.pih.warehouse.requisition.Requisition

class MobileApiController {

    def locationService

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
}
