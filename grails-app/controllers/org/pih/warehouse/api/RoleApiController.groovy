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
import org.pih.warehouse.core.Role
import org.pih.warehouse.core.RoleType
import org.springframework.http.HttpStatus

class RoleApiController {

    def roleTypeOptions() {
        render([data: RoleType.values().collect { [id: it.name(), label: it.name()] }] as JSON)
    }

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: Role.list(params).collect { toJson(it) }, totalCount: Role.count()] as JSON)
    }

    def read() {
        Role role = Role.get(params.id)
        if (!role) {
            throw new ObjectNotFoundException(params.id, Role.class.toString())
        }
        render([data: toJson(role)] as JSON)
    }

    @Transactional
    def create() {
        Role role = new Role()
        def data = request.JSON
        role.name = data.name
        role.roleType = data.roleType ? data.roleType as RoleType : null
        role.description = data.description ?: null
        if (role.hasErrors() || !role.save(flush: true)) {
            throw new ValidationException("Invalid role", role.errors)
        }
        render([
                id         : role.id,
                name       : role.name,
                roleType   : role.roleType?.name(),
                description: role.description,
        ] as JSON)
    }

    @Transactional
    def update() {
        Role role = Role.get(params.id)
        if (!role) {
            throw new ObjectNotFoundException(params.id, Role.class.toString())
        }
        def data = request.JSON
        if (data.version != null) {
            Long version = data.version as Long
            if (role.version > version) {
                role.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["Role"] as Object[],
                        "Another user has updated this Role while you were editing")
                throw new ValidationException("Invalid role", role.errors)
            }
        }
        role.name = data.name
        role.roleType = data.roleType ? data.roleType as RoleType : null
        role.description = data.description ?: null
        if (role.hasErrors() || !role.save(flush: true)) {
            throw new ValidationException("Invalid role", role.errors)
        }
        render([data: toJson(role)] as JSON)
    }

    @Transactional
    def delete() {
        Role role = Role.get(params.id)
        if (!role) {
            throw new ObjectNotFoundException(params.id, Role.class.toString())
        }
        role.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    private static Map toJson(Role role) {
        return [
                id         : role.id,
                name       : role.name,
                roleType   : role.roleType?.name(),
                description: role.description,
                version    : role.version,
        ]
    }
}
