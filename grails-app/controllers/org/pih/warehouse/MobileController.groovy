/**
* Copyright (c) 2012 Partners In Health.  All rights reserved.
* The use and distribution terms for this software are covered by the
* Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
* which can be found in the file epl-v10.html at the root of this distribution.
* By using this software in any fashion, you are agreeing to be bound by
* the terms of this license.
* You must not remove this notice, or any other, from this software.
**/
package org.pih.warehouse

import org.pih.warehouse.core.Location
import org.pih.warehouse.core.User
import org.pih.warehouse.order.Order
import org.pih.warehouse.order.OrderTypeCode
import org.pih.warehouse.product.ProductSummary
import org.pih.warehouse.requisition.Requisition

class MobileController {

    def userService
    def productService
    def inventoryService
    def locationService
    def megamenuService
    def stockMovementService

    def index() {

        Location location = Location.get(session.warehouse.id)
        def productCount = ProductSummary.countByLocation(location)
        def productListUrl = g.createLink(controller: "mobile", action: "productList")

        def orderCount = Order.createCriteria().count {
            eq("destination", location)
            orderType {
                eq("orderTypeCode", OrderTypeCode.PURCHASE_ORDER)
            }
        }

        def requisitionCount = Requisition.createCriteria().count {
            eq("origin", location)
        }

        [
                data: [
                        [name: "Inventory Items", class: "fa fa-box", count: productCount, url: g.createLink(controller: "mobile", action: "productList")],
                        [name: "Purchase Orders", class: "fa fa-shopping-cart", count: orderCount, url: g.createLink(controller: "order", action: "list", params: ['origin.id', location.id])],
                        [name: "Replenishment Orders", class: "fa fa-truck", count: requisitionCount, url: g.createLink(controller: "mobile", action: "outboundList", params: ['origin.id', location.id])],
                ]
        ]
    }

    def login() {

    }

    def menu() {
        render(view: "/common/react", params: params)
    }

    def menuBar() {
        render(view: "/mobile/menu")
    }

    def chooseLocation() {
        User user = User.get(session.user.id)
        Location warehouse = Location.get(session.warehouse.id)
        render (view: "/mobile/chooseLocation",
            model: [savedLocations: user.warehouse ? [user.warehouse] : null, loginLocationsMap: locationService.getLoginLocationsMap(user, warehouse, true)])
    }

    def productList() {
        render(view: "/common/react", params: params)
    }

    def productDetails() {
        render(view: "/common/react", params: params)
    }

    def outboundList() {
        render(view: "/common/react", params: params)
    }

}
