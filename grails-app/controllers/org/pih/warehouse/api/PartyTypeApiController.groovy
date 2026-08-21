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
import org.pih.warehouse.core.PartyType
import org.pih.warehouse.core.PartyTypeCode
import org.springframework.http.HttpStatus

class PartyTypeApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: PartyType.list(params).collect { toJson(it) }, totalCount: PartyType.count()] as JSON)
    }

    def read() {
        PartyType partyType = PartyType.get(params.id)
        if (!partyType) {
            throw new ObjectNotFoundException(params.id, PartyType.class.toString())
        }
        render([data: toJson(partyType)] as JSON)
    }

    def partyTypeCodeOptions() {
        render([data: PartyTypeCode.values().collect { [id: it.name(), label: it.name()] }] as JSON)
    }

    @Transactional
    def create() {
        PartyType partyType = new PartyType()
        bindPartyTypeData(partyType, request.JSON)
        if (partyType.hasErrors() || !partyType.save(flush: true)) {
            throw new ValidationException("Invalid party type", partyType.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(partyType)] as JSON)
    }

    @Transactional
    def update() {
        PartyType partyType = PartyType.get(params.id)
        if (!partyType) {
            throw new ObjectNotFoundException(params.id, PartyType.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (partyType.version > version) {
                partyType.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["PartyType"] as Object[],
                        "Another user has updated this PartyType while you were editing")
                throw new ValidationException("Invalid party type", partyType.errors)
            }
        }
        bindPartyTypeData(partyType, jsonObject)
        if (partyType.hasErrors() || !partyType.save(flush: true)) {
            throw new ValidationException("Invalid party type", partyType.errors)
        }
        render([data: toJson(partyType)] as JSON)
    }

    @Transactional
    def delete() {
        PartyType partyType = PartyType.get(params.id)
        if (!partyType) {
            throw new ObjectNotFoundException(params.id, PartyType.class.toString())
        }
        partyType.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private void bindPartyTypeData(PartyType partyType, def jsonObject) {
        bindData(partyType, jsonObject, [exclude: ['version']])
    }

    private static Map toJson(PartyType partyType) {
        return [
            id           : partyType.id,
            code         : partyType.code,
            name         : partyType.name,
            description  : partyType.description,
            partyTypeCode: partyType.partyTypeCode?.name(),
            dateCreated  : partyType.dateCreated,
            lastUpdated  : partyType.lastUpdated,
            version      : partyType.version,
        ]
    }
}
