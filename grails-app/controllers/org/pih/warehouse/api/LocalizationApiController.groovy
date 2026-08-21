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
import org.hibernate.ObjectNotFoundException
import org.springframework.http.HttpStatus

import java.nio.charset.Charset

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

    def search() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)

        def defaultLocale = new Locale(grailsApplication.config.openboxes.locale.defaultLocale)
        def currentLocale = session?.user?.locale ?: session?.locale ?: defaultLocale
        params.locale = params.locale ?: currentLocale?.language

        def localizations = Localization.createCriteria().list(params) {
            if (params.locale) {
                eq("locale", params.locale)
            }
            if (params.q) {
                or {
                    ilike("code", params.q + "%")
                    ilike("text", "%" + params.q + "%")
                }
            }
        }
        render([data: localizations.collect { toJson(it) }, totalCount: localizations.totalCount] as JSON)
    }

    def details() {
        Localization localization = Localization.get(params.id)
        if (!localization) {
            throw new ObjectNotFoundException(params.id, Localization.class.toString())
        }
        render([data: toJson(localization)] as JSON)
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

    @Transactional
    def update() {
        Localization localizationInstance = Localization.get(params.id)
        if (!localizationInstance) {
            throw new ObjectNotFoundException(params.id, Localization.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (localizationInstance.version > version) {
                localizationInstance.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [g.message(code: 'localization.label', default: 'Localization')] as Object[],
                        "Another user has updated this Localization while you were editing")
                throw new ValidationException("Invalid localization", localizationInstance.errors)
            }
        }
        bindData(localizationInstance, jsonObject, [include: ['code', 'locale', 'text']])
        if (localizationInstance.hasErrors() || !localizationInstance.save(flush: true)) {
            throw new ValidationException("Invalid localization", localizationInstance.errors)
        }
        render([data: toJson(localizationInstance) + [
                message: g.message(code: 'default.updated.message',
                        args: [g.message(code: 'localization.label', default: 'Localization'), localizationInstance.id])?.toString(),
        ]] as JSON)
    }

    @Transactional
    def delete() {
        Localization localizationInstance = Localization.get(params.id)
        if (!localizationInstance) {
            throw new ObjectNotFoundException(params.id, Localization.class.toString())
        }
        localizationInstance.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    @Transactional
    def upload() {
        def messageProperties = request instanceof org.springframework.web.multipart.MultipartHttpServletRequest
                ? request.getFile("messageProperties")
                : null
        String locale = params.locale
        if (!messageProperties || messageProperties.empty || !locale) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([errorMessage: g.message(code: 'default.invalid.file.message', default: 'Invalid file')] as JSON)
            return
        }
        Properties properties = new Properties()
        properties.load(new InputStreamReader(messageProperties.inputStream, Charset.forName("UTF-8")))
        properties.stringPropertyNames().each { String property ->
            String text = properties.getProperty(property)
            Localization localization = Localization.findByCodeAndLocale(property, locale)
            if (!localization) {
                localization = new Localization(code: property, locale: locale, text: text)
            }
            localization.text = text
            localization.save()
        }
        render([data: [
                message: g.message(code: 'default.uploaded.message',
                        args: [g.message(code: 'localizations.label', default: 'Localizations')])?.toString(),
        ]] as JSON)
    }

    private static Map toJson(Localization localization) {
        return [
                id         : localization.id,
                code       : localization.code,
                locale     : localization.locale,
                text       : localization.text,
                dateCreated: localization.dateCreated,
                lastUpdated: localization.lastUpdated,
                version    : localization.version,
        ]
    }
}
