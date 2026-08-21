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
import org.pih.warehouse.core.GlAccountType
import org.pih.warehouse.product.Product
import org.springframework.http.HttpStatus

class GlAccountApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: GlAccount.list(params).collect { toJson(it) }, totalCount: GlAccount.count()] as JSON)
    }

    def read() {
        GlAccount glAccount = GlAccount.get(params.id)
        if (!glAccount) {
            throw new ObjectNotFoundException(params.id, GlAccount.class.toString())
        }
        render([data: toJson(glAccount)] as JSON)
    }

    def glAccountTypeOptions() {
        render([data: GlAccountType.list().collect { [id: it.id, label: it.code] }] as JSON)
    }

    @Transactional
    def create() {
        GlAccount glAccount = new GlAccount()
        bindData(glAccount, request.JSON)
        if (glAccount.hasErrors() || !glAccount.save(flush: true)) {
            throw new ValidationException("Invalid GL account", glAccount.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(glAccount)] as JSON)
    }

    @Transactional
    def update() {
        GlAccount glAccount = GlAccount.get(params.id)
        if (!glAccount) {
            throw new ObjectNotFoundException(params.id, GlAccount.class.toString())
        }
        def jsonObject = request.JSON
        // If the glAccount is associated with ANY product, do not allow to deactivate it
        Product productAssociated = Product.findByGlAccount(glAccount)
        if (productAssociated && !jsonObject.active) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: message(code: 'glAccount.associatedProducts.error.label',
                    default: 'This GL account is linked to an active product and cannot be deactivated.')] as JSON)
            return
        }
        bindData(glAccount, jsonObject)
        if (glAccount.hasErrors() || !glAccount.save(flush: true)) {
            throw new ValidationException("Invalid GL account", glAccount.errors)
        }
        render([data: toJson(glAccount)] as JSON)
    }

    @Transactional
    def delete() {
        GlAccount glAccount = GlAccount.get(params.id)
        if (!glAccount) {
            throw new ObjectNotFoundException(params.id, GlAccount.class.toString())
        }
        glAccount.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(GlAccount glAccount) {
        return [
            id           : glAccount.id,
            code         : glAccount.code,
            name         : glAccount.name,
            description  : glAccount.description,
            active       : glAccount.active,
            glAccountType: glAccount.glAccountType ? [
                id  : glAccount.glAccountType.id,
                code: glAccount.glAccountType.code,
                name: glAccount.glAccountType.name,
            ] : null,
            dateCreated  : glAccount.dateCreated,
            lastUpdated  : glAccount.lastUpdated,
        ]
    }
}
