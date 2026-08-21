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

import org.pih.warehouse.LocalizationUtil
import org.pih.warehouse.core.Localization
import org.pih.warehouse.core.LocalizationService
import org.pih.warehouse.core.localization.LocalizedMessageDto
import org.pih.warehouse.core.localization.LocalizedMessagesDto
import org.springframework.http.HttpStatus

class LocalizationApiController {

    LocalizationService localizationService

    def list() {
        String languageCode = params.languageCode
        String prefix = params.prefix

        LocalizedMessagesDto response = localizationService.list(languageCode, prefix)

        render(response.toJson() as JSON)
    }

    def read() {
        String messageCode = params.id
        Object[] messageArgs = params.list("args").toArray()
        String languageCode = params.lang

        LocalizedMessageDto response = localizationService.localize(messageCode, messageArgs, languageCode)

        render(response.toJson() as JSON)
    }

    def localeOptions() {
        def supportedLocales = grailsApplication.config.openboxes.locale.supportedLocales?.sort(false)
        def options = supportedLocales.collect { code ->
            Locale locale = LocalizationUtil.getLocale(code)
            [id: code, value: code, label: locale.getDisplayName(LocalizationUtil.currentLocale)]
        }
        render([data: options] as JSON)
    }

    @Transactional
    def create() {
        Localization localizationInstance = new Localization()
        bindData(localizationInstance, request.JSON, [include: ['code', 'locale', 'text']])
        if (localizationInstance.hasErrors() || !localizationInstance.save(flush: true)) {
            throw new ValidationException("Invalid localization", localizationInstance.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: [
                id     : localizationInstance.id,
                code   : localizationInstance.code,
                locale : localizationInstance.locale,
                text   : localizationInstance.text,
                message: g.message(code: 'default.saved.message',
                        args: [g.message(code: 'localization.label', default: 'Localization'), localizationInstance.id])?.toString(),
        ]] as JSON)
    }
}
