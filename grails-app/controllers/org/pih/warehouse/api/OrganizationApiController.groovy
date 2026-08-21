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
import org.pih.warehouse.core.IdentifierTypeCode
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.Organization
import org.pih.warehouse.core.OrganizationIdentifierService
import org.pih.warehouse.core.OrganizationService
import org.pih.warehouse.core.PartyType
import org.pih.warehouse.core.UserService
import org.springframework.http.HttpStatus

class OrganizationApiController extends BaseDomainApiController {

    OrganizationService organizationService
    OrganizationIdentifierService organizationIdentifierService
    UserService userService

    def list() {
        List<Organization> organizations = organizationService.getOrganizations(params)
        if (params.max) {
            render([data: organizations, totalCount: organizations.totalCount] as JSON)
            return
        }
        render ([data:organizations] as JSON)
     }

    def read() {
        Organization organization = Organization.get(params.id)
        if (!organization) {
            throw new IllegalArgumentException("No Organization found for organization ID ${params.id}")
        }

        render([data: organization] as JSON)
    }

    def details() {
        Organization organization = Organization.get(params.id)
        if (!organization) {
            throw new ObjectNotFoundException(params.id, Organization.class.toString())
        }
        render([data: toDetailsJson(organization)] as JSON)
    }

    def create(Organization organization) {
        organizationService.createOrganization(organization)
        render([data: [id: organization.id]] as JSON)
    }

    @Transactional
    def update() {
        Organization organization = Organization.get(params.id)
        if (!organization) {
            throw new ObjectNotFoundException(params.id, Organization.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (organization.version > version) {
                organization.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [warehouse.message(code: 'organization.label', default: 'Organization')] as Object[],
                        "Another user has updated this Organization while you were editing")
                throw new ValidationException("Invalid organization", organization.errors)
            }
        }
        boolean isSuperuser = userService.isSuperuser(session?.user)
        boolean codeLocked = organization.hasPurchaseOrders() && !isSuperuser
        if (jsonObject.containsKey("name")) {
            organization.name = jsonObject.name
        }
        if (jsonObject.containsKey("description")) {
            organization.description = jsonObject.description
        }
        if (jsonObject.containsKey("active")) {
            organization.active = jsonObject.active as boolean
        }
        if (jsonObject.containsKey("code") && !codeLocked) {
            organization.code = jsonObject.code
        }
        if (jsonObject.containsKey("partyType")) {
            organization.partyType = jsonObject.partyType ? PartyType.get(jsonObject.partyType) : null
        }
        if (jsonObject.containsKey("defaultLocation")) {
            organization.defaultLocation = jsonObject.defaultLocation ?
                    Location.get(jsonObject.defaultLocation) : null
        }
        if (jsonObject.containsKey("sequences") && isSuperuser) {
            Map sequences = [:]
            jsonObject.sequences?.each { key, value ->
                if (value != null && value.toString() != "") {
                    sequences.put(key.toString(), value.toString())
                }
            }
            organization.sequences = sequences
        }
        if (!organization.code) {
            organization.code = organizationIdentifierService.generate(organization)
        }
        if (organization.hasErrors() || !organization.save(flush: true)) {
            throw new ValidationException("Invalid organization", organization.errors)
        }
        render([data: toDetailsJson(organization)] as JSON)
    }

    @Transactional
    def delete() {
        Organization organization = Organization.get(params.id)
        if (!organization) {
            throw new ObjectNotFoundException(params.id, Organization.class.toString())
        }
        try {
            organization.delete(flush: true)
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([
                    errorCode   : HttpStatus.BAD_REQUEST.value(),
                    errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'organization.label', default: 'Organization'), params.id])}",
            ] as JSON)
            return
        }
        render status: HttpStatus.NO_CONTENT.value()
    }

    private Map toDetailsJson(Organization organization) {
        boolean isSuperuser = userService.isSuperuser(session?.user)
        return [
                id                    : organization.id,
                code                  : organization.code,
                name                  : organization.name,
                description           : organization.description,
                active                : organization.active,
                version               : organization.version,
                dateCreated           : organization.dateCreated,
                lastUpdated           : organization.lastUpdated,
                partyType             : organization.partyType ? [
                        id  : organization.partyType.id,
                        name: organization.partyType.toString(),
                ] : null,
                defaultLocation       : organization.defaultLocation ? [
                        id  : organization.defaultLocation.id,
                        name: organization.defaultLocation.name,
                ] : null,
                locations             : organization.locations ? organization.locations.collect {
                    [id: it.id, name: it.name]
                } : [],
                roles                 : organization.roles ? organization.roles.collect {
                    [id: it.id, name: it.toString()]
                } : [],
                sequences             : organization.sequences ?: [:],
                sequenceTypes         : IdentifierTypeCode.values().collect { it.name() },
                hasPurchaseOrders     : organization.hasPurchaseOrders() ? true : false,
                maxPurchaseOrderNumber: organization.maxPurchaseOrderNumber(),
                isSuperuser           : isSuperuser,
        ]
    }
}
