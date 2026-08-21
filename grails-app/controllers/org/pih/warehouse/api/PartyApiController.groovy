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
import org.pih.warehouse.core.Party
import org.pih.warehouse.core.PartyType
import org.springframework.http.HttpStatus

class PartyApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        params.offset = params.offset ? params.int('offset') : 0
        List<Party> parties = Party.list(params)
        render([data: parties.collect { toJson(it) }, totalCount: Party.count()] as JSON)
    }

    def read() {
        Party party = Party.get(params.id)
        if (!party) {
            throw new ObjectNotFoundException(params.id, Party.class.toString())
        }
        render([data: toJson(party)] as JSON)
    }

    def partyTypeOptions() {
        render([data: PartyType.list().collect { [id: it.id, label: it.toString()] }] as JSON)
    }

    def partyOptions() {
        render([data: Party.list().collect { [id: it.id, label: it.toString()] }] as JSON)
    }

    @Transactional
    def create() {
        Party party = new Party()
        bindPartyType(party, request.JSON)
        if (party.hasErrors() || !party.save(flush: true)) {
            throw new ValidationException("Invalid party", party.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(party)] as JSON)
    }

    @Transactional
    def update() {
        Party party = Party.get(params.id)
        if (!party) {
            throw new ObjectNotFoundException(params.id, Party.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (party.version > version) {
                party.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["Party"] as Object[],
                        "Another user has updated this Party while you were editing")
                throw new ValidationException("Invalid party", party.errors)
            }
        }
        bindPartyType(party, jsonObject)
        if (party.hasErrors() || !party.save(flush: true)) {
            throw new ValidationException("Invalid party", party.errors)
        }
        render([data: toJson(party)] as JSON)
    }

    @Transactional
    def delete() {
        Party party = Party.get(params.id)
        if (!party) {
            throw new ObjectNotFoundException(params.id, Party.class.toString())
        }
        try {
            party.delete(flush: true)
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([
                    errorCode   : HttpStatus.BAD_REQUEST.value(),
                    errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'party.label', default: 'Party'), params.id])}",
            ] as JSON)
            return
        }
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static void bindPartyType(Party party, def jsonObject) {
        String partyTypeId = jsonObject.partyType instanceof Map ?
                jsonObject.partyType?.id : jsonObject.partyType
        party.partyType = partyTypeId ? PartyType.get(partyTypeId) : null
    }

    private static Map toJson(Party party) {
        return [
                id       : party.id,
                version  : party.version,
                partyType: party.partyType ? [
                        id  : party.partyType.id,
                        name: party.partyType.toString(),
                ] : null,
                roles    : party.roles ? party.roles.collect {
                    [id: it.id, name: it.toString()]
                } : [],
        ]
    }
}
