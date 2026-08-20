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
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.BudgetCode
import org.pih.warehouse.core.BudgetCodeFilterCommand
import org.pih.warehouse.core.BudgetCodeService
import org.springframework.http.HttpStatus

class BudgetCodeApiController {

    BudgetCodeService budgetCodeService

    def list(BudgetCodeFilterCommand command) {
        PagedResultList<BudgetCode> budgetCodes = budgetCodeService.getBudgetCodes(command)
        render([data: budgetCodes.collect { toJson(it) }, totalCount: budgetCodes.totalCount] as JSON)
    }

    def read() {
        BudgetCode budgetCode = BudgetCode.get(params.id)
        if (!budgetCode) {
            throw new ObjectNotFoundException(params.id, BudgetCode.class.toString())
        }
        render([data: toJson(budgetCode)] as JSON)
    }

    @Transactional
    def create() {
        BudgetCode budgetCode = new BudgetCode()
        bindData(budgetCode, request.JSON)
        if (budgetCode.hasErrors() || !budgetCode.save(flush: true)) {
            throw new ValidationException("Invalid budget code", budgetCode.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(budgetCode)] as JSON)
    }

    @Transactional
    def update() {
        BudgetCode budgetCode = BudgetCode.get(params.id)
        if (!budgetCode) {
            throw new ObjectNotFoundException(params.id, BudgetCode.class.toString())
        }
        bindData(budgetCode, request.JSON)
        if (budgetCode.hasErrors() || !budgetCode.save(flush: true)) {
            throw new ValidationException("Invalid budget code", budgetCode.errors)
        }
        render([data: toJson(budgetCode)] as JSON)
    }

    @Transactional
    def delete() {
        BudgetCode budgetCode = BudgetCode.get(params.id)
        if (!budgetCode) {
            throw new ObjectNotFoundException(params.id, BudgetCode.class.toString())
        }
        budgetCode.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(BudgetCode budgetCode) {
        return [
            id          : budgetCode.id,
            code        : budgetCode.code,
            name        : budgetCode.name,
            description : budgetCode.description,
            active      : budgetCode.active,
            organization: budgetCode.organization ? [
                id  : budgetCode.organization.id,
                name: budgetCode.organization.name,
            ] : null,
            dateCreated : budgetCode.dateCreated,
            lastUpdated : budgetCode.lastUpdated,
        ]
    }
}
