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
import org.apache.poi.poifs.filesystem.OfficeXmlFileException
import org.pih.warehouse.core.Location
import org.pih.warehouse.core.UploadService
import org.pih.warehouse.importer.CategoryExcelImporter
import org.pih.warehouse.importer.DataImporter
import org.pih.warehouse.importer.ImportDataCommand
import org.pih.warehouse.importer.InventoryExcelImporter
import org.pih.warehouse.importer.InventoryLevelExcelImporter
import org.pih.warehouse.importer.LocationExcelImporter
import org.pih.warehouse.importer.OutboundStockMovementExcelImporter
import org.pih.warehouse.importer.PersonExcelImporter
import org.pih.warehouse.importer.ProductAttributeExcelImporter
import org.pih.warehouse.importer.ProductCatalogExcelImporter
import org.pih.warehouse.importer.ProductCatalogItemExcelImporter
import org.pih.warehouse.importer.ProductExcelImporter
import org.pih.warehouse.importer.ProductPackageExcelImporter
import org.pih.warehouse.importer.ProductSupplierAttributeExcelImporter
import org.pih.warehouse.importer.ProductSupplierExcelImporter
import org.pih.warehouse.importer.ProductSupplierPreferenceExcelImporter
import org.pih.warehouse.importer.ProductAssociationExcelImporter
import org.pih.warehouse.importer.ProductSynonymExcelImporter
import org.pih.warehouse.importer.PurchaseOrderActualReadyDateExcelImporter
import org.pih.warehouse.importer.TagExcelImporter
import org.pih.warehouse.importer.UserExcelImporter
import org.pih.warehouse.importer.UserLocationExcelImporter
import org.springframework.web.multipart.support.StandardMultipartHttpServletRequest

class BatchApiController extends BaseApiController {

    UploadService uploadService

    def importData(ImportDataCommand command) {
        String flashMessage = null
        Boolean imported = Boolean.FALSE

        if (params.importDate) {
            try {
                command.date = Date.parse("yyyy-MM-dd HH:mm", params.importDate)
            } catch (Exception ignored) {
                command.date = null
            }
        }

        def localFile = session.localFile
        if (request instanceof StandardMultipartHttpServletRequest) {
            def uploadFile = command.importFile
            if (!uploadFile?.empty) {
                try {
                    localFile = uploadService.createLocalFile(uploadFile.originalFilename)
                    uploadFile.transferTo(localFile)
                    session.localFile = localFile
                } catch (Exception e) {
                    log.error("Error uploading file" + e.message, e)
                    render([data: [message: "Unable to upload file due to exception: " + e.message]] as JSON)
                    return
                }
            } else {
                flashMessage = "${g.message(code: 'inventoryItem.emptyFile.message')}"
            }
        }

        def dataImporter
        if (localFile) {
            log.info "Local xls file " + localFile.getAbsolutePath()
            command.filename = localFile.getAbsolutePath()
            command.location = Location.get(session.warehouse.id)
            try {
                dataImporter = createExcelImporter(command)
            }
            catch (OfficeXmlFileException e) {
                log.error("Error with import file " + e.message, e)
                command.errors.reject("importFile", e.message)
            }

            if (dataImporter) {
                command.data = dataImporter.data
                dataImporter.validateData(command)
                command.columnMap = dataImporter.columnMap
            }

            if (command?.data?.isEmpty()) {
                command.errors.reject("importFile", "${g.message(code: 'inventoryItem.pleaseEnsureDate.message', args: [dataImporter.columnMap?.sheet ?: 'Sheet1', localFile.getAbsolutePath()])}")
            }

            if (command.importType == 'inventory' && !command.date) {
                command.errors.reject("date", "${g.message(code: 'import.inventoryImportMustHaveDate.message', default: "Inventory import must specify the date of the stock count")}")
            }

            if (command.importNow) {
                try {
                    dataImporter.importData(command)
                } catch (Exception e) {
                    log.error("Unable to import data: " + e.message, e)
                    command.errors.reject(e.message)
                }
                if (!command.hasErrors()) {
                    flashMessage = "${g.message(code: 'inventoryItem.importSuccess.message', args: [localFile.getAbsolutePath()])}"
                    imported = Boolean.TRUE
                    session.removeAttribute("localFile")
                }
            } else if (!command.hasErrors()) {
                flashMessage = "${g.message(code: 'inventoryItem.dataReadyToBeImported.message')}"
            }
        } else {
            flashMessage = "${g.message(code: 'inventoryItem.notValidXLSFile.message')}"
        }

        render([data: [
                message   : flashMessage?.toString(),
                errors    : command.hasErrors() ? command.errors.allErrors.collect { g.message(error: it)?.toString() } : [],
                imported  : imported,
                location  : command.location?.toString(),
                importType: command.importType,
                filename  : command.filename,
                date      : command.date?.format("yyyy-MM-dd HH:mm"),
                columnMap : command.columnMap?.columnMap,
                data      : imported ? null : command.data,
        ]] as JSON)
    }

    DataImporter createExcelImporter(ImportDataCommand command) {

        switch (command.importType) {
            case "category":
                return new CategoryExcelImporter(command?.filename)
            case "inventory":
                return new InventoryExcelImporter(command?.filename)
            case "inventoryLevel":
                return new InventoryLevelExcelImporter(command?.filename)
            case "location":
                return new LocationExcelImporter(command?.filename)
            case "person":
                return new PersonExcelImporter(command?.filename)
            case "product":
                return new ProductExcelImporter(command?.filename)
            case "productAttribute":
                return new ProductAttributeExcelImporter(command?.filename)
            case "productCatalog":
                return new ProductCatalogExcelImporter(command?.filename)
            case "productCatalogItem":
                return new ProductCatalogItemExcelImporter(command?.filename)
            case "productSupplier":
                return new ProductSupplierExcelImporter(command?.filename)
            case "productSupplierPreference":
                return new ProductSupplierPreferenceExcelImporter(command?.filename)
            case "productSupplierAttribute":
                return new ProductSupplierAttributeExcelImporter(command?.filename)
            case "productPackage":
                return new ProductPackageExcelImporter(command?.filename)
            case "outboundStockMovement":
                return new OutboundStockMovementExcelImporter(command?.filename)
            case "tag":
                return new TagExcelImporter(command?.filename)
            case "user":
                return new UserExcelImporter(command?.filename)
            case "userLocation":
                return new UserLocationExcelImporter(command?.filename)
            case "productAssociation":
                return new ProductAssociationExcelImporter(command?.filename)
            case "productSynonym":
                return new ProductSynonymExcelImporter(command?.filename)
            case "purchaseOrderActualReadyDate":
                return new PurchaseOrderActualReadyDateExcelImporter(command?.filename)
            default:
                command.errors.reject("importType", "${g.message(code: 'import.invalidType.message', default: 'Please choose a valid import type')}")
        }
    }
}
