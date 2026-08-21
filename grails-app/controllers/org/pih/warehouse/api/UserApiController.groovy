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
import org.pih.warehouse.LocalizationUtil
import org.pih.warehouse.core.User
import org.pih.warehouse.core.UserService
import org.springframework.http.HttpStatus

class UserApiController {

    UserService userService
    def mailService

    def read() {
        User user = User.get(params.id)
        if (!user) {
            throw new ObjectNotFoundException(params.id, User.class.toString())
        }
        render([data: toJson(user)] as JSON)
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
                id       : user.id,
                username : user.username,
                firstName: user.firstName,
                lastName : user.lastName,
                name     : user.name,
                email    : user.email,
                locale   : user.locale?.toString(),
                active   : user.active,
                hasPhoto : user.photo != null,
        ]
    }
}
