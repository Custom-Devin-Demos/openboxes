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
import org.pih.warehouse.core.GlAccount
import org.pih.warehouse.core.Location
import org.pih.warehouse.order.OrderAdjustmentType
import org.pih.warehouse.order.OrderAdjustmentTypeCode
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus

class OrderAdjustmentTypeApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: OrderAdjustmentType.list(params).collect { toJson(it) }, totalCount: OrderAdjustmentType.count()] as JSON)
    }

    def read() {
        OrderAdjustmentType orderAdjustmentType = OrderAdjustmentType.get(params.id)
        if (!orderAdjustmentType) {
            throw new ObjectNotFoundException(params.id, OrderAdjustmentType.class.toString())
        }
        render([data: toJson(orderAdjustmentType)] as JSON)
    }

    /**
     * Provides form data for the React create/edit order adjustment type screens
     * (code options, active GL accounts and the accounting-required flag).
     */
    def formData() {
        Location currentLocation = session.warehouse ? Location.get(session.warehouse.id) : null
        render([data: [
            isAccountingRequired: currentLocation?.isAccountingRequired(),
            codeOptions         : OrderAdjustmentTypeCode.values().collect { [id: it.name(), value: it.name(), label: it.name()] },
            glAccountOptions    : GlAccount.findAllByActive(true).collect { GlAccount glAccount ->
                [id: glAccount.id, value: glAccount.id, label: "${glAccount.code} ${glAccount.description}"]
            },
        ]] as JSON)
    }

    @Transactional
    def create() {
        OrderAdjustmentType orderAdjustmentType = new OrderAdjustmentType()
        bindData(orderAdjustmentType, request.JSON)
        if (orderAdjustmentType.hasErrors() || !orderAdjustmentType.save(flush: true)) {
            throw new ValidationException("Invalid order adjustment type", orderAdjustmentType.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(orderAdjustmentType)] as JSON)
    }

    @Transactional
    def update() {
        OrderAdjustmentType orderAdjustmentType = OrderAdjustmentType.get(params.id)
        if (!orderAdjustmentType) {
            throw new ObjectNotFoundException(params.id, OrderAdjustmentType.class.toString())
        }
        bindData(orderAdjustmentType, request.JSON)
        if (orderAdjustmentType.hasErrors() || !orderAdjustmentType.save(flush: true)) {
            throw new ValidationException("Invalid order adjustment type", orderAdjustmentType.errors)
        }
        render([data: toJson(orderAdjustmentType)] as JSON)
    }

    @Transactional
    def delete() {
        OrderAdjustmentType orderAdjustmentType = OrderAdjustmentType.get(params.id)
        if (!orderAdjustmentType) {
            throw new ObjectNotFoundException(params.id, OrderAdjustmentType.class.toString())
        }
        try {
            orderAdjustmentType.delete(flush: true)
        } catch (DataIntegrityViolationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: message(code: 'default.not.deleted.message',
                    args: [message(code: 'orderAdjustmentType.label', default: 'Order Adjustment Type'), params.id])] as JSON)
            return
        }
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(OrderAdjustmentType orderAdjustmentType) {
        return [
            id         : orderAdjustmentType.id,
            name       : orderAdjustmentType.name,
            description: orderAdjustmentType.description,
            code       : orderAdjustmentType.code?.name(),
            glAccount  : orderAdjustmentType.glAccount ? [
                id         : orderAdjustmentType.glAccount.id,
                code       : orderAdjustmentType.glAccount.code,
                description: orderAdjustmentType.glAccount.description,
            ] : null,
            dateCreated: orderAdjustmentType.dateCreated,
            lastUpdated: orderAdjustmentType.lastUpdated,
        ]
    }
}
