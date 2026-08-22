/**
 * Copyright (c) 2012 Partners In Health.  All rights reserved.
 * The use and distribution terms for this software are covered by the
 * Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
 * which can be found in the file epl-v10.html at the root of this distribution.
 * By using this software in any fashion, you are agreeing to be bound by
 * the terms of this license.
 * You must not remove this notice, or any other, from this software.
 **/
package org.pih.warehouse.core

import grails.converters.JSON
import grails.core.GrailsApplication
import org.grails.exceptions.ExceptionUtils
import org.grails.web.errors.GrailsWrappedRuntimeException
import org.pih.warehouse.RequestUtil
import org.springframework.http.HttpMethod
import org.springframework.validation.BeanPropertyBindingResult
import util.ConfigHelper

import org.pih.warehouse.core.localization.MessageLocalizer

class ErrorsController {

    private static final Map<String, String> LEGACY_ERROR_VIEWS = [
            error           : "/error",
            notFound        : "/errors/notFound",
            accessDenied    : "/errors/accessDenied",
            dataAccess      : "/errors/dataAccess",
            methodNotAllowed: "/errors/methodNotAllowed",
    ].asImmutable()

    MailService mailService
    def userService
    GrailsApplication grailsApplication
    def groovyPageLocator
    def userAgentIdentService
    MessageLocalizer messageLocalizer

    def handleException() {
        if (RequestUtil.isAjax(request)) {
            Throwable exception = request.getAttribute('exception') ?: request.getAttribute("javax.servlet.error.exception")
            Throwable root = exception ? ExceptionUtils.getRootCause(exception) : null
            String message = root?.message ?: ""
            render([errorCode: 500, cause: root?.class, errorMessage: message] as JSON)
        } else {
            if (userAgentIdentService.isMobile()) {
                Throwable exception = request.getAttribute('exception') ?: request.getAttribute("javax.servlet.error.exception")
                session.mobileError = [
                        statusCode      : request.getAttribute('javax.servlet.error.status_code')?.toString(),
                        message         : request.getAttribute('javax.servlet.error.message')?.toString(),
                        servletName     : request.getAttribute('javax.servlet.error.servlet_name')?.toString(),
                        requestUri      : request.getAttribute('javax.servlet.error.request_uri')?.toString(),
                        exceptionMessage: exception?.message,
                        causeMessage    : exception?.cause?.message,
                        className       : exception instanceof GrailsWrappedRuntimeException ? exception.className : exception?.class?.name,
                        stackTraceLines : exception instanceof GrailsWrappedRuntimeException ? exception.stackTraceLines?.collect { it?.toString() } : null,
                ]
                redirect(controller: "mobile", action: "error")
                return
            }

            renderReactErrorPage(generalErrorPayload())
        }
    }

    def handleNotFound() {
        log.info "Params " + params

        if (RequestUtil.isAjax(request)) {
            response.status = 404
            def errorMessage = "Resource not found"
            if (request?.exception?.message) {
                errorMessage = request.exception.message
            } else if (params.resource) {
                errorMessage = "${params.resource.capitalize()} with identifier ${params.id} not found"
            }
            render([errorCode: 404, errorMessage: errorMessage] as JSON)
        } else {
            renderReactErrorPage([
                    page            : "notFound",
                    id              : params.id,
                    exceptionMessage: request?.exception?.message,
            ])
        }
    }

    def handleUnauthorized() {
        log.info "Unauthorized user"
        if (RequestUtil.isAjax(request)) {
            response.status = 401
            render([errorCode: 401, errorMessage: "Unauthorized user: ${request?.exception?.message}"] as JSON)
        } else {
            redirect(controller: "auth", action: "login")
        }
    }

    def handleForbidden() {
        log.info "Access denied"
        if (RequestUtil.isAjax(request)) {
            response.status = 403
            render([errorCode: 403, errorMessage: "Access denied"] as JSON)
        } else {
            renderReactErrorPage([page: "accessDenied"])
        }
    }


    def handleInvalidDataAccess() {
        if (RequestUtil.isAjax(request)) {
            render([errorCode: 500, errorMessage: "Illegal data access"] as JSON)
        } else {
            Throwable exception = (Throwable) (request.getAttribute("exception") ?: request.getAttribute("javax.servlet.error.exception"))
            renderReactErrorPage([
                    page       : "dataAccess",
                    statusCode : request.getAttribute("javax.servlet.error.status_code"),
                    errorMessage: request.getAttribute("javax.servlet.error.message"),
                    servletName: request.getAttribute("javax.servlet.error.servlet_name"),
                    requestUri : request.getAttribute("javax.servlet.error.request_uri"),
                    exception  : exceptionDetails(exception),
            ])
        }
    }

    def handleMethodNotAllowed() {
        if (RequestUtil.isAjax(request)) {
            render([errorCode: 405, errorMessage: "Method not allowed"] as JSON)
            return
        }
        renderReactErrorPage([page: "methodNotAllowed"])
    }

    def handleValidationErrors() {
        if (RequestUtil.isAjax(request)) {
            response.status = 400
            Throwable exception = request.getAttribute('exception')
            def root = ExceptionUtils.getRootCause(exception)
            BeanPropertyBindingResult errors = root.getErrors()
            List<String> errorMessages = errors.allErrors.collect {
                return messageLocalizer.localize(it)
            }
            render([errorCode: 400,
                    errorMessage: "Validation error. " + root.fullMessage,
                    errorMessages: errorMessages
            ] as JSON)
            return
        }
        renderReactErrorPage(generalErrorPayload())
    }

    def handleConstraintViolation() {
        if (RequestUtil.isAjax(request)) {
            if (request?.method == HttpMethod.DELETE.name()) {
                String message = g.message(
                        code: "errors.existingAssociation.message",
                        default: "Resource could not be deleted because of an existing association"
                )

                render([errorCode: 500, errorMessage: message] as JSON)
                return
            }

            Throwable root = ExceptionUtils.getRootCause(request.getAttribute('exception'))
            render([errorCode: 500, errorMessage: root.getMessage()])
        }

        renderReactErrorPage(generalErrorPayload())
    }

    /**
     * Renders the React SPA host page with an error payload exposed to the
     * frontend through the errorPageBase64 request attribute (see
     * src/assets/grails-template.html). The response status set by the
     * servlet error dispatch is left untouched.
     */
    private void renderReactErrorPage(Map payload) {
        // The React host view is generated by the webpack build; in
        // environments where the frontend bundle has not been built
        // (e.g. backend-only test runs) render the legacy GSP instead.
        if (!groovyPageLocator.findViewByPath("/common/react")) {
            render(view: LEGACY_ERROR_VIEWS[payload.page as String] ?: "/error")
            return
        }
        payload.flashMessage = flash.message
        String json = (payload as JSON).toString()
        request.setAttribute("errorPageBase64", json.getBytes("UTF-8").encodeBase64().toString())
        render(view: "/common/react")
    }

    private Map generalErrorPayload() {
        Throwable exception = (Throwable) (request.getAttribute("exception") ?: request.getAttribute("javax.servlet.error.exception"))
        String targetUri = (request.forwardURI - request.contextPath) + (request.queryString ? "?" : "") + (request.queryString ?: "")
        List recipients = ConfigHelper.listValue(grailsApplication.config.openboxes.mail.errors.recipients)
        return [
                page         : "error",
                statusCode   : request.getAttribute("javax.servlet.error.status_code"),
                errorMessage : request.getAttribute("javax.servlet.error.message"),
                path         : targetUri,
                exception    : exceptionDetails(exception),
                bugReport    : [
                        enabled   : ConfigHelper.booleanValue(grailsApplication.config.openboxes.mail.errors.enabled),
                        recipients: recipients,
                        mailFrom  : grailsApplication.config.grails.mail.from ?: null,
                        user      : session?.user ? [
                                username: session.user.username,
                                name    : session.user.name,
                                email   : session.user.email,
                        ] : null,
                ],
        ]
    }

    private static Map exceptionDetails(Throwable exception) {
        if (!exception) {
            return null
        }
        Map details = [
                message     : exception.message,
                causeMessage: exception.cause?.message,
                className   : exception.class.name,
        ]
        if (exception instanceof GrailsWrappedRuntimeException) {
            details.className = exception.className
            details.lineNumber = exception.lineNumber
            details.codeSnippet = exception.codeSnippet as List
            details.stackTraceLines = exception.stackTraceLines as List
        } else {
            StringWriter stringWriter = new StringWriter()
            exception.printStackTrace(new PrintWriter(stringWriter))
            details.stackTraceLines = stringWriter.toString().readLines()
        }
        return details
    }

    def sendFeedback() {
        def enabled = Boolean.valueOf(grailsApplication.config.openboxes.mail.feedback.enabled ?: true)

        if (enabled) {
            def recipients = grailsApplication.config.openboxes.mail.feedback.recipients
            def jsonObject = JSON.parse(params.data)
            byte[] attachment = jsonObject[1].replace("data:image/png;base64,", "").decodeBase64()
            mailService.sendHtmlMailWithAttachment(
                    session?.user,
                    recipients,
                    null,
                    jsonObject[0]["summary"],
                    jsonObject[0]["description"],
                    attachment,
                    "screenshot.png",
                    "image/png"
            )
        }
        render "OK"
    }


    def processError() {

        def enabled = ConfigHelper.booleanValue(grailsApplication.config.openboxes.mail.errors.enabled)
        if (enabled) {
            def recipients = ConfigHelper.listValue(grailsApplication.config.openboxes.mail.errors.recipients) as List

            def errorNotificationList = userService.findUsersByRoleType(RoleType.ROLE_ERROR_NOTIFICATION)
            errorNotificationList.each { errorNotificationUser ->
                if (errorNotificationUser.email)
                    recipients.add(errorNotificationUser.email)
            }

            def ccList = []
            def reportedBy = User.findByUsername(params.reportedBy)
            if (params.ccMe && reportedBy) {
                ccList.add(reportedBy?.email)
            }

            def dom = params.remove("dom")
            def stacktrace = params.remove("stacktrace")
            def subject = "${params.summary ?: warehouse.message(code: 'email.errorReportSubject.message')}"
            def body = "${g.render(template: '/email/errorReport', model: [stacktrace: stacktrace], params: params)}"

            mailService.sendHtmlMailWithAttachment(reportedBy, recipients, ccList, subject, body.toString(), dom?.bytes, "error.html", "text/html")
            flash.message = "${warehouse.message(code: 'email.errorReportSuccess.message', args: [recipients])}"
        } else {
            flash.message = "${warehouse.message(code: 'email.errorReportDisabled.message')}"
        }
        redirect(controller: "dashboard", action: "index")
    }

}
