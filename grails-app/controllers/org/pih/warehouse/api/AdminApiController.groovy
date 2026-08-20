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
import grails.core.GrailsApplication
import grails.util.Environment
import grails.util.Holders
import org.pih.warehouse.LocalizationUtil
import org.pih.warehouse.core.MailService
import org.pih.warehouse.core.Role
import org.pih.warehouse.core.RoleType
import org.pih.warehouse.core.User
import org.pih.warehouse.jobs.SendStockAlertsJob
import org.springframework.boot.info.GitProperties
import org.springframework.web.multipart.MultipartFile
import util.ConfigHelper
import util.StringUtil

import javax.print.PrintService
import java.awt.print.PrinterJob
import java.nio.charset.Charset

class AdminApiController extends BaseApiController {

    def sessionFactory
    MailService mailService
    GrailsApplication grailsApplication
    def config = Holders.getConfig()
    def quartzScheduler
    def userService
    GitProperties gitProperties

    def controllers() {
        def controllers = grailsApplication.controllerClasses.sort { it.fullName }.collect {
            [
                    name               : it.name,
                    fullName           : it.fullName,
                    logicalPropertyName: it.logicalPropertyName,
            ]
        }
        render([data: controllers] as JSON)
    }

    def controllerActions() {
        List actionNames = []
        grailsApplication.controllerClasses.sort { it.logicalPropertyName }.each { controller ->
            controller.reference.propertyDescriptors.each { pd ->
                def closure = controller.getPropertyOrStaticPropertyOrFieldValue(pd.name, Closure)
                if (closure) {
                    if (pd.name != 'beforeInterceptor' && pd.name != 'afterInterceptor') {
                        actionNames << controller.logicalPropertyName + "." + pd.name + ".label = " + pd.name
                    }
                }
            }
        }
        render([data: actionNames] as JSON)
    }

    def plugins() {
        def pluginManager = grailsApplication.mainContext.getBean('pluginManager')
        def plugins = pluginManager.allPlugins.collect {
            [name: it.name, version: it.version?.toString()]
        }
        render([data: plugins] as JSON)
    }

    def cache() {
        def cacheStatistics = sessionFactory.getStatistics()
        def secondLevelCacheStatistics = cacheStatistics.secondLevelCacheRegionNames.collect { regionName ->
            def statistics = cacheStatistics.getSecondLevelCacheStatistics(regionName)
            [
                    regionName          : regionName,
                    hitCount            : statistics.hitCount,
                    missCount           : statistics.missCount,
                    putCount            : statistics.putCount,
                    elementCountInMemory: statistics.elementCountInMemory,
                    elementCountOnDisk  : statistics.elementCountOnDisk,
                    sizeInMemory        : statistics.sizeInMemory,
            ]
        }
        def queryCacheStatistics = cacheStatistics.queries.collect { queryName ->
            def statistics = cacheStatistics.getQueryStatistics(queryName)
            [
                    queryName        : queryName,
                    cacheHitCount    : statistics.cacheHitCount,
                    cacheMissCount   : statistics.cacheMissCount,
                    cachePutCount    : statistics.cachePutCount,
                    executionCount   : statistics.executionCount,
                    executionMinTime : statistics.executionMinTime,
                    executionMaxTime : statistics.executionMaxTime,
                    executionAvgTime : statistics.executionAvgTime,
                    executionRowCount: statistics.executionRowCount,
            ]
        }
        def entityCacheStatistics = grailsApplication.domainClasses.collect { domainClass ->
            def statistics = cacheStatistics.getEntityStatistics(domainClass.fullName)
            [
                    entityName            : domainClass.toString(),
                    loadCount             : statistics.loadCount,
                    deleteCount           : statistics.deleteCount,
                    fetchCount            : statistics.fetchCount,
                    insertCount           : statistics.insertCount,
                    updateCount           : statistics.updateCount,
                    optimisticFailureCount: statistics.optimisticFailureCount,
            ]
        }
        render([data: [
                hibernateConfig           : grailsApplication.config.hibernate.toString(),
                cacheStatistics           : cacheStatistics.toString(),
                secondLevelCacheStatistics: secondLevelCacheStatistics,
                queryCacheStatistics      : queryCacheStatistics,
                entityCacheStatistics     : entityCacheStatistics,
        ]] as JSON)
    }

    def evictDomainCache() {
        def domainClass = grailsApplication.getDomainClass(params.name)
        String message
        if (domainClass) {
            sessionFactory.evict(domainClass.clazz)
            message = "Domain cache '${params.name}' was invalidated"
        } else {
            message = "Domain cache '${params.name}' does not exist"
        }
        render([data: [message: message.toString()]] as JSON)
    }

    def evictQueryCache() {
        String message
        if (params.name) {
            sessionFactory.evictQueries(params.name)
            message = "Query cache '${params.name}' was invalidated"
        } else {
            sessionFactory.evictQueries()
            message = "All query caches were invalidated"
        }
        render([data: [message: message.toString()]] as JSON)
    }

    def triggerStockAlerts() {
        SendStockAlertsJob.triggerNow([:])
        render([data: [message: "Triggered send stock alerts job in background"]] as JSON)
    }

    def settings() {
        PrintService[] printServices = PrinterJob.lookupPrintServices()
        User user = User.get(session?.user?.id)
        Locale userLocale = session?.user?.locale
        Locale defaultLocale = new Locale(grailsApplication.config.openboxes.locale.defaultLocale)
        def supportedLocales = grailsApplication.config.openboxes.locale.supportedLocales.collect { code ->
            Locale locale = LocalizationUtil.getLocale(code)
            [
                    code                        : code,
                    displayName                 : locale?.getDisplayName(locale ?: defaultLocale),
                    displayLanguageInUserLocale : locale?.getDisplayLanguage(userLocale ?: defaultLocale),
                    current                     : userLocale == locale,
            ]
        }
        def mailSettings = grailsApplication.config.grails.mail.collect { property ->
            [key: property.key?.toString(), value: maskedValue(property.key?.toString(), property.value?.toString())]
        }
        def configProperties = grailsApplication.config.toProperties().sort().collect { property ->
            [key: property.key?.toString(), value: maskedValue(property.key?.toString(), property.value?.toString())]
        }
        def systemProperties = System.properties.collect { property ->
            [key: property.key?.toString(), value: property.value?.toString()]
        }
        def printers = printServices.collect { printService ->
            [
                    name               : printService.name,
                    attributes         : printService.attributes.toArray().collect {
                        [name: it.name, value: it.toString()]
                    },
                    supportedDocFlavors: printService.supportedDocFlavors.collect { it.mimeType },
                    attributeCategories: printService.supportedAttributeCategories.collect {
                        [name: it.name, defaultValue: printService.getDefaultAttributeValue(it)?.toString()]
                    },
            ]
        }
        render([data: [
                environment        : Environment.current.toString(),
                appVersion         : grailsApplication.metadata.getProperty('info.app.version'),
                showUpgradeLink    : user?.roles?.contains(Role.findByRoleType('ROLE_ADMIN')) ?: false,
                buildNumber        : gitProperties.shortCommitId,
                buildDate          : grailsApplication.metadata.getProperty('build.time'),
                branchName         : ConfigHelper.getBranchName(gitProperties),
                grailsVersion      : grailsApplication.metadata.getProperty('info.app.grailsVersion'),
                currentDate        : new Date().toString(),
                supportedLocales   : supportedLocales,
                showCustomizeButton: userService.isUserInRole(session?.user?.id, [RoleType.ROLE_ADMIN, RoleType.ROLE_BROWSER]),
                defaultCharset     : Charset.defaultCharset().toString(),
                mailSettings       : mailSettings,
                externalConfigFile : grailsApplication.config.grails.config.locations?.toString(),
                configProperties   : configProperties,
                systemProperties   : systemProperties,
                printers           : printers,
                schedulerName      : quartzScheduler.schedulerName,
                schedulerInstanceId: quartzScheduler.schedulerInstanceId,
                schedulerMetaData  : quartzScheduler.metaData.toString(),
                caches             : [],
        ]] as JSON)
    }

    def sendMail() {
        String message
        try {
            MultipartFile multipartFile = request.respondsTo('getFile') ? request.getFile('file') : null
            if (multipartFile && !multipartFile.empty) {
                def success = mailService.sendHtmlMailWithAttachment(
                        session?.user,
                        params.list("to"),
                        null,
                        params["subject"],
                        params["message"],
                        multipartFile?.bytes,
                        multipartFile?.originalFilename,
                        multipartFile?.contentType
                )
                if (success) {
                    message = "Multipart email with subject ${params.subject} and attachment ${multipartFile.originalFilename} has been sent to ${params.to}"
                } else {
                    message = "Could not send email with subject ${params.subject} and attachment ${multipartFile.originalFilename} to ${params.to}"
                }
            } else {
                if (params.includesHtml) {
                    mailService.sendHtmlMail(params.subject, params.message, params.to)
                    message = "HTML email with subject ${params.subject} has been sent to ${params.to}"
                } else {
                    mailService.sendMail(params.subject, params.message, params.to)
                    message = "Text email with subject ${params.subject} has been sent to ${params.to}"
                }
            }
        } catch (Exception e) {
            message = "Unable to send email due to error: " + e.message
        }
        render([data: [message: message.toString()]] as JSON)
    }

    def mailForm() {
        render([data: [
                to     : session?.user?.email,
                from   : grailsApplication.config.grails.mail.from?.toString(),
                subject: "Test email",
        ]] as JSON)
    }

    private static String maskedValue(String key, String value) {
        if (key?.contains('password') && value) {
            return StringUtil.mask(value, "*")
        }
        return value
    }
}
