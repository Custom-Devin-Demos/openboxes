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
import grails.util.Holders
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductActivityCode
import org.pih.warehouse.product.ProductField
import org.pih.warehouse.product.ProductType
import org.pih.warehouse.product.ProductTypeCode
import org.pih.warehouse.product.ProductTypeService
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus

class ProductTypeApiController {

    ProductTypeService productTypeService

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        render([data: ProductType.list(params).collect { toJson(it) }, totalCount: ProductType.count()] as JSON)
    }

    def read() {
        ProductType productType = ProductType.get(params.id)
        if (!productType) {
            throw new ObjectNotFoundException(params.id, ProductType.class.toString())
        }
        render([data: toJson(productType)] as JSON)
    }

    def productActivityCodeOptions() {
        render([data: ProductActivityCode.values().collect {
            [id: it.name(), label: warehouse.message(code: "enum.ProductActivityCode.${it.name()}", default: it.name())]
        }] as JSON)
    }

    def productFieldOptions() {
        render([data: ProductField.values().collect {
            [id: it.name(), label: warehouse.message(code: "enum.ProductField.${it.name()}", default: it.name())]
        }] as JSON)
    }

    @Transactional
    def create() {
        def jsonObject = request.JSON
        ProductType productType = new ProductType()
        productType.name = jsonObject.name
        productType.code = jsonObject.code ?: null
        productType.productIdentifierFormat = jsonObject.productIdentifierFormat ?: null
        productType.sequenceNumber = jsonObject.sequenceNumber != null && jsonObject.sequenceNumber != "" ? jsonObject.sequenceNumber as Integer : 0
        productType.productTypeCode = ProductTypeCode.GOOD
        productType.requiredFields = [ProductField.PRODUCT_CODE, ProductField.NAME, ProductField.CATEGORY, ProductField.GL_ACCOUNT]
        bindEnumCollections(productType, jsonObject)

        if (!productType.code && !productType.productIdentifierFormat) {
            productType.errors.rejectValue("productIdentifierFormat", "productType.codeOrIdentifierRequired.message")
            productType.errors.rejectValue("code", "productType.codeOrIdentifierRequired.message")
            throw new ValidationException("Invalid product type", productType.errors)
        }
        if (!productTypeService.saveProductType(productType) || productType.hasErrors()) {
            throw new ValidationException("Invalid product type", productType.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toJson(productType)] as JSON)
    }

    @Transactional
    def update() {
        ProductType productType = ProductType.get(params.id)
        if (!productType) {
            throw new ObjectNotFoundException(params.id, ProductType.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (productType.version > version) {
                productType.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [warehouse.message(code: 'productType.label', default: 'ProductType')] as Object[],
                        "Another user has updated this ProductType while you were editing")
                throw new ValidationException("Invalid product type", productType.errors)
            }
        }
        if (jsonObject.containsKey("name")) {
            productType.name = jsonObject.name
        }
        if (jsonObject.containsKey("sequenceNumber")) {
            productType.sequenceNumber = jsonObject.sequenceNumber != null && jsonObject.sequenceNumber != "" ? jsonObject.sequenceNumber as Integer : 0
        }
        bindEnumCollections(productType, jsonObject)
        if (!productTypeService.saveProductType(productType) || productType.hasErrors()) {
            throw new ValidationException("Invalid product type", productType.errors)
        }
        render([data: toJson(productType)] as JSON)
    }

    @Transactional
    def delete() {
        if (params.id == Holders.config.openboxes.productType.default.id) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([
                    errorCode   : HttpStatus.BAD_REQUEST.value(),
                    errorMessage: "${warehouse.message(code: 'productType.cannotDeleteDefaultProductType.message')}",
            ] as JSON)
            return
        }
        ProductType productType = ProductType.get(params.id)
        if (!productType) {
            throw new ObjectNotFoundException(params.id, ProductType.class.toString())
        }
        def existingProducts = Product.countByProductType(productType)
        if (existingProducts) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([
                    errorCode   : HttpStatus.BAD_REQUEST.value(),
                    errorMessage: "${warehouse.message(code: 'productType.deleteWithExistingProducts.message')}",
            ] as JSON)
            return
        }
        try {
            productTypeService.delete(productType)
        } catch (DataIntegrityViolationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([
                    errorCode   : HttpStatus.BAD_REQUEST.value(),
                    errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'productType.label', default: 'ProductType'), params.id])}",
            ] as JSON)
            return
        }
        render status: HttpStatus.NO_CONTENT.value()
    }

    private void bindEnumCollections(ProductType productType, def jsonObject) {
        if (jsonObject.containsKey("supportedActivities")) {
            productType.supportedActivities?.clear()
            jsonObject.supportedActivities?.each {
                productType.addToSupportedActivities(it as ProductActivityCode)
            }
        }
        if (jsonObject.containsKey("displayedFields")) {
            productType.displayedFields?.clear()
            jsonObject.displayedFields?.each {
                productType.addToDisplayedFields(it as ProductField)
            }
        }
    }

    private static Map toJson(ProductType productType) {
        return [
                id                     : productType.id,
                name                   : productType.name,
                code                   : productType.code,
                productTypeCode        : productType.productTypeCode?.name(),
                productIdentifierFormat: productType.productIdentifierFormat,
                sequenceNumber         : productType.sequenceNumber,
                supportedActivities    : productType.supportedActivities?.collect { it.name() } ?: [],
                requiredFields         : productType.requiredFields?.collect { it.name() } ?: [],
                displayedFields        : productType.displayedFields?.collect { it.name() } ?: [],
                productCount           : Product.countByProductType(productType),
                dateCreated            : productType.dateCreated,
                lastUpdated            : productType.lastUpdated,
                version                : productType.version,
        ]
    }
}
