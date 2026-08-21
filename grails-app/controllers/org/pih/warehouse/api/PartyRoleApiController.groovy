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
import java.time.Instant
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.Party
import org.pih.warehouse.core.PartyRole
import org.pih.warehouse.core.RoleType
import org.springframework.http.HttpStatus

class PartyRoleApiController {

    def read() {
        PartyRole partyRole = PartyRole.get(params.id)
        if (!partyRole) {
            throw new ObjectNotFoundException(params.id, PartyRole.class.toString())
        }
        render([data: toJson(partyRole)] as JSON)
    }

    def roleTypeOptions() {
        render([data: RoleType.values().collect { [id: it.name(), label: it.name()] }] as JSON)
    }

    @Transactional
    def create() {
        PartyRole partyRole = new PartyRole()
        bindPartyRole(partyRole, request.JSON)
        if (partyRole.hasErrors() || !partyRole.save(flush: true)) {
            throw new ValidationException("Invalid party role", partyRole.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(partyRole)] as JSON)
    }

    @Transactional
    def update() {
        PartyRole partyRole = PartyRole.get(params.id)
        if (!partyRole) {
            throw new ObjectNotFoundException(params.id, PartyRole.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (partyRole.version > version) {
                partyRole.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["PartyRole"] as Object[],
                        "Another user has updated this PartyRole while you were editing")
                throw new ValidationException("Invalid party role", partyRole.errors)
            }
        }
        bindPartyRole(partyRole, jsonObject)
        if (partyRole.hasErrors() || !partyRole.save(flush: true)) {
            throw new ValidationException("Invalid party role", partyRole.errors)
        }
        render([data: toJson(partyRole)] as JSON)
    }

    @Transactional
    def delete() {
        PartyRole partyRole = PartyRole.get(params.id)
        if (!partyRole) {
            throw new ObjectNotFoundException(params.id, PartyRole.class.toString())
        }
        partyRole.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static void bindPartyRole(PartyRole partyRole, def jsonObject) {
        String partyId = jsonObject.party instanceof Map ? jsonObject.party?.id : jsonObject.party
        partyRole.party = partyId ? Party.get(partyId) : null
        partyRole.roleType = jsonObject.roleType ? RoleType.valueOf(jsonObject.roleType as String) : null
        if (jsonObject.containsKey("startDate")) {
            partyRole.startDate = jsonObject.startDate ? Instant.parse(jsonObject.startDate as String) : null
        }
        if (jsonObject.containsKey("endDate")) {
            partyRole.endDate = jsonObject.endDate ? Instant.parse(jsonObject.endDate as String) : null
        }
    }

    private static Map toJson(PartyRole partyRole) {
        return [
                id       : partyRole.id,
                version  : partyRole.version,
                party    : partyRole.party ? [
                        id  : partyRole.party.id,
                        name: partyRole.party.toString(),
                ] : null,
                roleType : partyRole.roleType?.name(),
                startDate: partyRole.startDate?.toString(),
                endDate  : partyRole.endDate?.toString(),
        ]
    }
}
