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
import org.pih.warehouse.core.Person
import org.springframework.dao.DataIntegrityViolationException
import util.StringUtil

class PersonApiController extends BaseDomainApiController {

    def userService

    def list() {
        String[] terms = params?.name?.split(",| ")?.findAll { it }
        def people = userService.findPersons(terms, params)
        render([data: people] as JSON)
    }

    def search() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        params.offset = params.int('offset', 0)

        def personInstanceList
        def personInstanceTotal
        if (params.q) {
            String[] terms = ["%" + params.q + "%"]
            personInstanceList = userService.findPersons(terms, params)
            personInstanceTotal = personInstanceList.totalCount
        } else {
            personInstanceList = Person.list(params)
            personInstanceTotal = Person.count()
        }

        boolean anonymize = grailsApplication.config.getProperty("openboxes.anonymize.enabled", Boolean.class, Boolean.FALSE)
        render([data: personInstanceList.collect { toListJson(it, anonymize) }, totalCount: personInstanceTotal] as JSON)
    }

    def read() {
        Person personInstance = Person.get(params.id)
        if (!personInstance) {
            throw new ObjectNotFoundException(params.id, Person.class.toString())
        }
        render(toDetailedJson(personInstance) as JSON)
    }

    @Transactional
    def create() {
        Person personInstance = new Person()
        bindPersonData(personInstance, request.JSON)
        if (personInstance.hasErrors() || !personInstance.save(flush: true)) {
            throw new ValidationException("Invalid person", personInstance.errors)
        }
        render(toDetailedJson(personInstance) as JSON)
    }

    @Transactional
    def update() {
        Person personInstance = Person.get(params.id)
        if (!personInstance) {
            throw new ObjectNotFoundException(params.id, Person.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (personInstance.version > version) {
                personInstance.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [warehouse.message(code: 'person.label', default: 'Person')] as Object[],
                        "Another user has updated this Person while you were editing")
                throw new ValidationException("Invalid person", personInstance.errors)
            }
        }
        bindPersonData(personInstance, jsonObject)
        if (personInstance.hasErrors() || !personInstance.save(flush: true)) {
            throw new ValidationException("Invalid person", personInstance.errors)
        }
        render(toDetailedJson(personInstance) as JSON)
    }

    @Transactional
    def delete() {
        Person personInstance = Person.get(params.id)
        if (!personInstance) {
            throw new ObjectNotFoundException(params.id, Person.class.toString())
        }
        try {
            personInstance.delete(flush: true)
            render(status: 204)
        } catch (DataIntegrityViolationException e) {
            response.status = 400
            render([errorCode: 400, errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'person.label', default: 'Person'), params.id])}"] as JSON)
        }
    }

    private void bindPersonData(Person personInstance, data) {
        personInstance.firstName = data.firstName
        personInstance.lastName = data.lastName
        personInstance.email = data.email ?: null
        personInstance.phoneNumber = data.phoneNumber ?: null
        personInstance.active = data.active as boolean
    }

    private Map toListJson(Person person, boolean anonymize) {
        return [
                id         : person.id,
                name       : person.name,
                type       : person.class.simpleName,
                email      : anonymize ? StringUtil.mask(person.email) : person.email,
                phoneNumber: person.phoneNumber,
                active     : person.active,
        ]
    }

    private Map toDetailedJson(Person person) {
        return [
                id         : person.id,
                type       : person.class.simpleName,
                name       : person.name,
                firstName  : person.firstName,
                lastName   : person.lastName,
                email      : person.email,
                phoneNumber: person.phoneNumber,
                active     : person.active,
                dateCreated: person.dateCreated?.format("dd/MMM/yyyy HH:mm:ss"),
                lastUpdated: person.lastUpdated?.format("dd/MMM/yyyy HH:mm:ss"),
                version    : person.version,
        ]
    }
}
