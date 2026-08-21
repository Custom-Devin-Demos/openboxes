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
import org.apache.http.auth.AuthenticationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.LocalizationUtil
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.LocationRole
import org.pih.warehouse.core.Role
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.User
import org.pih.warehouse.core.UserDataService
import org.pih.warehouse.core.UserService
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import util.StringUtil

class UserApiController {

    UserService userService
    UserDataService userGormService
    def locationService
    def mailService

    private static final List<String> SORTABLE_PROPERTIES = [
            "active", "username", "firstName", "lastName", "email", "locale", "lastLoginDate",
    ]

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        if (params.sort && !SORTABLE_PROPERTIES.contains(params.sort)) {
            params.remove("sort")
            params.remove("order")
        }
        def query = params.q ? "%" + params.q + "%" : ""
        def users = userService.findUsers(query, params)
        boolean anonymize = grailsApplication.config.getProperty("openboxes.anonymize.enabled", Boolean, Boolean.FALSE)
        render([data: users.collect { User user ->
            [
                    id           : user.id,
                    active       : user.active,
                    username     : anonymize ? StringUtil.mask(user.username) : user.username,
                    name         : user.name,
                    email        : anonymize ? StringUtil.mask(user.email) : user.email,
                    locale       : user.locale?.displayName,
                    roles        : user.roles ? user.roles.collect { it.toString() }.sort().join(", ") : "",
                    lastLoginDate: user.lastLoginDate?.time,
            ]
        }, totalCount: users.totalCount] as JSON)
    }

    def read() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        render([data: toJson(user)] as JSON)
    }

    def loginLocationOptions() {
        def locations = locationService.getLoginLocations(session.warehouse).sort()
        render([data: locations.collect { [id: it.id, label: it.name] }] as JSON)
    }

    def timezoneOptions() {
        render([data: TimeZone.availableIDs.collect { [id: it, label: it] }] as JSON)
    }

    def roleOptions() {
        render([data: Role.list().sort { it.description }.collect {
            [id: it.id, label: it.toString()]
        }] as JSON)
    }

    def localeOptions() {
        def supportedLocales = grailsApplication.config.openboxes.locale.supportedLocales
        render([data: supportedLocales.collect { String code ->
            Locale locale = LocalizationUtil.getLocale(code)
            [id: code, label: locale.displayName]
        }] as JSON)
    }

    @Transactional
    def create() {
        def data = request.JSON
        User user = new User()
        user.username = data.username ?: null
        user.firstName = data.firstName ?: null
        user.lastName = data.lastName ?: null
        user.email = data.email ?: null
        user.locale = data.locale ? LocalizationUtil.getLocale(data.locale as String) : null
        // Default value for active field on Person is set to true which is
        // inherited by User, but a newly created user should start inactive
        user.active = false
        user.password = data.password ? (data.password as String).encodeAsPassword() : null
        userService.saveUser(user, session.user.id, null)
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(user)] as JSON)
    }

    @Transactional
    def update() {
        User userInstance = User.get(params.id)
        if (!userInstance) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        def data = request.JSON
        if (data.version != null) {
            Long version = data.version as Long
            if (userInstance.version > version) {
                userInstance.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [g.message(code: 'user.label')] as Object[],
                        "Another user has updated this User while you were editing")
                throw new ValidationException("Invalid user", userInstance.errors)
            }
        }
        List<String> requestedRoles = data.roles != null ? data.roles.collect { it as String } : null
        Map updateParams = [:]
        ["username", "firstName", "lastName", "email", "timezone", "locale"].each { String property ->
            if (data.containsKey(property)) {
                updateParams[property] = data[property] ?: null
            }
        }
        if (data.containsKey("active")) {
            updateParams.active = data.active as Boolean
        }
        if (data.containsKey("rememberLastLocation")) {
            updateParams.rememberLastLocation = data.rememberLastLocation as Boolean
        }
        if (data.containsKey("warehouse")) {
            updateParams.warehouse = data.warehouse ? Location.get(data.warehouse as String) : null
        }
        userInstance = userService.updateUser(params.id as String, session.user.id as String, requestedRoles, updateParams)
        // Update session data if the user is editing their own profile
        if (session.user.id == userInstance?.id) {
            session.user = User.get(userInstance?.id)
            if (data.timezone) {
                session.timezone = TimeZone.getTimeZone(data.timezone as String)
            }
        }
        render([data: toJson(userInstance)] as JSON)
    }

    @Transactional
    def changePassword() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        def data = request.JSON
        try {
            userService.changePassword(user, data.password as String, data.passwordConfirm as String)
        } catch (AuthenticationException e) {
            response.status = HttpStatus.FORBIDDEN.value()
            render([errorMessage: e.message] as JSON)
            return
        }
        render([data: toJson(user)] as JSON)
    }

    @Transactional
    def toggleActivation() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        user.active = !user.active
        if (user.hasErrors() || !user.save(flush: true)) {
            throw new ValidationException("Invalid user", user.errors)
        }
        sendUserStatusChanged(user)
        render([data: toJson(user)] as JSON)
    }

    @Transactional
    def delete() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        if (user.id == session?.user?.id) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: g.message(code: 'default.cannot.delete.self.message',
                    args: [g.message(code: 'user.label'), params.id])] as JSON)
            return
        }
        try {
            userGormService.delete(user.id)
        } catch (DataIntegrityViolationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: g.message(code: 'default.not.deleted.message',
                    args: [g.message(code: 'user.label'), params.id])] as JSON)
            return
        }
        render(status: HttpStatus.NO_CONTENT.value())
    }

    @Transactional
    def saveLocationRole() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        def data = request.JSON
        Location location = data.location ? Location.get(data.location as String) : null
        List<Role> roles = (data.roles ?: []).collect { Role.get(it as String) }
        try {
            userService.saveLocationRole(location, null, roles, user, session.user.id as String)
        } catch (ValidationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: e.message] as JSON)
            return
        }
        render([data: toJson(user)] as JSON)
    }

    @Transactional
    def deleteLocationRole() {
        LocationRole locationRole = LocationRole.get(params.locationRoleId)
        if (!locationRole) {
            throw new ObjectNotFoundException(params.locationRoleId, LocationRole.class.toString())
        }
        try {
            userService.deleteLocationRole(locationRole, session.user.id as String)
        } catch (ValidationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: e.message] as JSON)
            return
        }
        render(status: HttpStatus.NO_CONTENT.value())
    }

    def sendTestEmail() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        try {
            String subject = "${g.message(code: 'system.testEmailSubject.label')}"
            String body = g.render(template: "/email/userCanReceiveEmail", model: [userInstance: user])
            mailService.sendHtmlMail(subject, body, user?.email)
            render([data: "Email successfully sent to " + user?.email] as JSON)
        } catch (Exception e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: "Error sending email " + e.message] as JSON)
        }
    }

    @Transactional
    def uploadPhoto() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        def photo = request.getFile("photo")
        def okcontents = ['image/png', 'image/jpeg', 'image/gif']
        if (!photo || !okcontents.contains(photo.getContentType())) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: "Photo must be one of: ${okcontents}".toString()] as JSON)
            return
        }
        if (photo.empty || photo.size >= 1024 * 1000) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: g.message(code: 'user.photoTooLarge.message',
                    args: [g.message(code: 'user.label'), user.id])] as JSON)
            return
        }
        user.photo = photo.bytes
        if (user.hasErrors() || !user.save(flush: true)) {
            throw new ValidationException("Invalid user", user.errors)
        }
        sendUserPhotoChanged(user)
        render([data: toJson(user)] as JSON)
    }

    private void sendUserStatusChanged(User userInstance) {
        try {
            // Send notification emails to all administrators
            def users = userService.findUsersByRoleType(RoleType.ROLE_USER_NOTIFICATION)

            // Include the user whose status has changed
            users << userInstance

            def recipients = users.collect { it.email }
            def activatedOrDeactivated = "${userInstance.active ? g.message(code: 'user.activated.label') : g.message(code: 'user.disabled.label')}"
            def subject = "${g.message(code: 'email.userAccountActivated.message', args: [userInstance.username, activatedOrDeactivated])}"
            def body = "${g.render(template: '/email/userAccountActivated', model: [userInstance: userInstance])}"
            mailService.sendHtmlMail(subject, body.toString(), recipients)
        }
        catch (Exception e) {
            log.warn("Unable to send user status changed email: ${e.message}")
        }
    }

    private void sendUserPhotoChanged(User userInstance) {
        try {
            def subject = "${g.message(code: 'email.userPhotoChanged.message', args: [userInstance?.email])}"
            def body = "${g.render(template: '/email/userPhotoChanged', model: [userInstance: userInstance])}"
            mailService.sendHtmlMailWithAttachment(userInstance, subject, body.toString(), userInstance.photo, "photo.png", "image/png")
        }
        catch (Exception e) {
            log.warn("Unable to send photo changed email: ${e.message}")
        }
    }

    private static Map toJson(User user) {
        return [
                id                      : user.id,
                version                 : user.version,
                username                : user.username,
                firstName               : user.firstName,
                lastName                : user.lastName,
                name                    : user.name,
                email                   : user.email,
                locale                  : user.locale?.toString(),
                localeDisplayName       : user.locale?.displayName,
                timezone                : user.timezone,
                active                  : user.active,
                hasPhoto                : user.photo != null,
                rememberLastLocation    : user.rememberLastLocation,
                defaultLocation         : user.warehouse ? [id: user.warehouse.id, name: user.warehouse.name] : null,
                roles                   : user.roles ? user.roles.collect { [id: it.id, name: it.toString()] }.sort { it.name } : [],
                locationRoles           : user.locationRoles ? user.locationRoles.collect { LocationRole locationRole ->
                    [
                            id      : locationRole.id,
                            location: locationRole.location?.name,
                            role    : locationRole.role?.toString(),
                            inactive: locationRole.role != user.getHighestRole(locationRole.location),
                    ]
                } : [],
                locationRolesDescription: user.locationRolesDescription(),
                lastLoginDate           : user.lastLoginDate?.time,
                dateCreated             : user.dateCreated?.time,
                lastUpdated             : user.lastUpdated?.time,
        ]
    }
}
