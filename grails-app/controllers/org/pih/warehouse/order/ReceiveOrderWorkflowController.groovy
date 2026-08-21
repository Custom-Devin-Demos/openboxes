/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.order

import grails.gorm.transactions.Transactional

@Transactional
class ReceiveOrderWorkflowController {

    def index() {
        redirect(action: "receiveOrder", params: params)
    }

    def receiveOrder() {
        if (!params.id) {
            flash.message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'order.label', default: 'Order'), params.id])}"
            redirect(controller: "order", action: "list")
            return
        }
        render(view: "/common/react")
    }
}
