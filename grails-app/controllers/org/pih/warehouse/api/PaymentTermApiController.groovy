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
import org.pih.warehouse.core.PaymentTerm
import org.springframework.http.HttpStatus

class PaymentTermApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: PaymentTerm.list(params).collect { toJson(it) }, totalCount: PaymentTerm.count()] as JSON)
    }

    def read() {
        PaymentTerm paymentTerm = PaymentTerm.get(params.id)
        if (!paymentTerm) {
            throw new ObjectNotFoundException(params.id, PaymentTerm.class.toString())
        }
        render([data: toJson(paymentTerm)] as JSON)
    }

    @Transactional
    def create() {
        PaymentTerm paymentTerm = new PaymentTerm()
        bindData(paymentTerm, request.JSON)
        if (paymentTerm.hasErrors() || !paymentTerm.save(flush: true)) {
            throw new ValidationException("Invalid payment term", paymentTerm.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(paymentTerm)] as JSON)
    }

    @Transactional
    def update() {
        PaymentTerm paymentTerm = PaymentTerm.get(params.id)
        if (!paymentTerm) {
            throw new ObjectNotFoundException(params.id, PaymentTerm.class.toString())
        }
        bindData(paymentTerm, request.JSON)
        if (paymentTerm.hasErrors() || !paymentTerm.save(flush: true)) {
            throw new ValidationException("Invalid payment term", paymentTerm.errors)
        }
        render([data: toJson(paymentTerm)] as JSON)
    }

    @Transactional
    def delete() {
        PaymentTerm paymentTerm = PaymentTerm.get(params.id)
        if (!paymentTerm) {
            throw new ObjectNotFoundException(params.id, PaymentTerm.class.toString())
        }
        paymentTerm.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(PaymentTerm paymentTerm) {
        return [
            id               : paymentTerm.id,
            code             : paymentTerm.code,
            name             : paymentTerm.name,
            description      : paymentTerm.description,
            prepaymentPercent: paymentTerm.prepaymentPercent,
            daysToPayment    : paymentTerm.daysToPayment,
            dateCreated      : paymentTerm.dateCreated,
            lastUpdated      : paymentTerm.lastUpdated,
        ]
    }
}
