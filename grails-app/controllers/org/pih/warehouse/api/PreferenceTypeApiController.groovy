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
import org.pih.warehouse.core.PreferenceType
import org.pih.warehouse.core.ValidationCode
import org.springframework.http.HttpStatus

class PreferenceTypeApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: PreferenceType.list(params).collect { toJson(it) }, totalCount: PreferenceType.count()] as JSON)
    }

    def read() {
        PreferenceType preferenceType = PreferenceType.get(params.id)
        if (!preferenceType) {
            throw new ObjectNotFoundException(params.id, PreferenceType.class.toString())
        }
        render([data: toJson(preferenceType)] as JSON)
    }

    def validationCodeOptions() {
        render([data: ValidationCode.values().collect { [id: it.name(), label: it.name()] }] as JSON)
    }

    @Transactional
    def create() {
        PreferenceType preferenceType = new PreferenceType()
        bindData(preferenceType, request.JSON)
        if (preferenceType.hasErrors() || !preferenceType.save(flush: true)) {
            throw new ValidationException("Invalid preference type", preferenceType.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(preferenceType)] as JSON)
    }

    @Transactional
    def update() {
        PreferenceType preferenceType = PreferenceType.get(params.id)
        if (!preferenceType) {
            throw new ObjectNotFoundException(params.id, PreferenceType.class.toString())
        }
        bindData(preferenceType, request.JSON)
        if (preferenceType.hasErrors() || !preferenceType.save(flush: true)) {
            throw new ValidationException("Invalid preference type", preferenceType.errors)
        }
        render([data: toJson(preferenceType)] as JSON)
    }

    @Transactional
    def delete() {
        PreferenceType preferenceType = PreferenceType.get(params.id)
        if (!preferenceType) {
            throw new ObjectNotFoundException(params.id, PreferenceType.class.toString())
        }
        preferenceType.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(PreferenceType preferenceType) {
        return [
            id            : preferenceType.id,
            name          : preferenceType.name,
            validationCode: preferenceType.validationCode?.name(),
            dateCreated   : preferenceType.dateCreated,
            lastUpdated   : preferenceType.lastUpdated,
        ]
    }
}
