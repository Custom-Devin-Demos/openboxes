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
import org.pih.warehouse.core.Document
import org.pih.warehouse.core.DocumentType
import util.FileUtil

import java.text.SimpleDateFormat

@Transactional
class DocumentApiController {

    private List errorMessages(Document documentInstance) {
        return documentInstance.errors.allErrors.collect { g.message(error: it) }
    }

    private Map documentJson(Document documentInstance) {
        return [
                id            : documentInstance.id,
                version       : documentInstance.version,
                name          : documentInstance.name,
                documentType  : documentInstance.documentType ? [
                        id  : documentInstance.documentType.id,
                        name: documentInstance.documentType.toString(),
                ] : null,
                extension     : documentInstance.extension,
                contentType   : documentInstance.contentType,
                fileUri       : documentInstance.fileUri,
                documentNumber: documentInstance.documentNumber,
                filename      : documentInstance.filename,
                isImage       : documentInstance.isImage(),
                size          : documentInstance.size,
                lastUpdated   : documentInstance.lastUpdated ?
                        new SimpleDateFormat("dd/MMM/yyyy hh:mm:ss a z").format(documentInstance.lastUpdated) : null,
        ]
    }

    def documentTypeOptions() {
        render([data: DocumentType.list().collect { [id: it.id, name: it.toString()] }] as JSON)
    }

    def details() {
        Document documentInstance = Document.get(params.id)
        if (!documentInstance) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'document.label', default: 'Document'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        render([data: documentJson(documentInstance)] as JSON)
    }

    def create() {
        Document documentInstance = new Document()
        documentInstance.documentType = params["documentType.id"] && params["documentType.id"] != "null" ?
                DocumentType.get(params["documentType.id"]) : null

        String flashMessage = null
        def file = request.getFile("fileContents")
        // file must not be empty and must be less than 10MB
        if (!file || file?.isEmpty()) {
            flashMessage = "${warehouse.message(code: 'document.documentCannotBeEmpty.message')}"
        }
        // FIXME The size limit should be configurable
        else if (file.size < 10 * 1024 * 1000) {
            documentInstance.name = file.originalFilename
            documentInstance.filename = file.originalFilename
            documentInstance.fileContents = file.bytes
            documentInstance.extension = FileUtil.getExtension(file.originalFilename)
            documentInstance.contentType = file.contentType
        }

        if (documentInstance.save(flush: true)) {
            def message = "${warehouse.message(code: 'default.created.message', args: [warehouse.message(code: 'document.label', default: 'Document'), documentInstance.id])}"
            render([data: [id: documentInstance.id], message: message, flashMessage: flashMessage] as JSON)
        } else {
            response.status = 400
            render([errorMessages: errorMessages(documentInstance), flashMessage: flashMessage] as JSON)
        }
    }

    def update() {
        Document documentInstance = Document.get(params.id)
        if (!documentInstance) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'document.label', default: 'Document'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        if (params.version) {
            def version = params.version.toLong()
            if (documentInstance.version > version) {
                documentInstance.errors.rejectValue("version", "default.optimistic.locking.failure", [warehouse.message(code: 'document.label', default: 'Document')] as Object[], "Another user has updated this Document while you were editing")
                response.status = 400
                render([errorMessages: errorMessages(documentInstance)] as JSON)
                return
            }
        }

        documentInstance.properties = params

        if (!documentInstance.hasErrors() && documentInstance.save(flush: true)) {
            def message = "${warehouse.message(code: 'default.updated.message', args: [warehouse.message(code: 'document.label', default: 'Document'), documentInstance.id])}"
            render([data: [id: documentInstance.id], message: message] as JSON)
        } else {
            response.status = 400
            render([errorMessages: errorMessages(documentInstance)] as JSON)
        }
    }

    def upload() {
        Document documentInstance = Document.get(params.id)
        if (!documentInstance) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'document.label', default: 'Document'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        if (params.version) {
            def version = params.version.toLong()
            if (documentInstance.version > version) {
                documentInstance.errors.rejectValue("version", "default.optimistic.locking.failure", [warehouse.message(code: 'document.label', default: 'Document')] as Object[], "Another user has updated this Document while you were editing")
                response.status = 400
                render([errorMessages: errorMessages(documentInstance)] as JSON)
                return
            }
        }

        String flashMessage = null
        def file = request.getFile("fileContents")
        if (file?.empty) {
            flashMessage = "${g.message(code: 'file')}"
        } else {
            if (documentInstance.filename == documentInstance.name) {
                documentInstance.name = file.originalFilename
            }

            documentInstance.filename = file.originalFilename
            documentInstance.fileContents = file.bytes
            documentInstance.extension = FileUtil.getExtension(file.originalFilename)
            documentInstance.contentType = file.contentType
        }

        if (!documentInstance.hasErrors() && documentInstance.save(flush: true)) {
            def message = "${warehouse.message(code: 'default.updated.message', args: [warehouse.message(code: 'document.label', default: 'Document'), documentInstance.id])}"
            render([data: [id: documentInstance.id], message: message, flashMessage: flashMessage] as JSON)
        } else {
            response.status = 400
            render([errorMessages: errorMessages(documentInstance), flashMessage: flashMessage] as JSON)
        }
    }

    def delete() {
        Document documentInstance = Document.get(params.id)
        if (!documentInstance) {
            def message = "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'document.label', default: 'Document'), params.id])}"
            response.status = 404
            render([errorMessage: message] as JSON)
            return
        }
        try {
            documentInstance.delete(flush: true)
            def message = "${warehouse.message(code: 'default.deleted.message', args: [warehouse.message(code: 'document.label', default: 'Document'), params.id])}"
            render([message: message] as JSON)
        }
        catch (org.springframework.dao.DataIntegrityViolationException e) {
            def message = "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'document.label', default: 'Document'), params.id])}"
            response.status = 400
            render([errorMessage: message] as JSON)
        }
    }
}
