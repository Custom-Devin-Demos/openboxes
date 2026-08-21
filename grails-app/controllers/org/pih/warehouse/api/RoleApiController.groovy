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
import org.pih.warehouse.core.Role
import org.pih.warehouse.core.RoleType

class RoleApiController {

    def roleTypeOptions() {
        render([data: RoleType.values().collect { [id: it.name(), label: it.name()] }] as JSON)
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
}
