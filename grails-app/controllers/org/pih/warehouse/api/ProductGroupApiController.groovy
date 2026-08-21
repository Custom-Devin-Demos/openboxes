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
import org.pih.warehouse.product.Category
import org.pih.warehouse.product.Product
import org.pih.warehouse.product.ProductGroup
import org.pih.warehouse.product.ProductGroupService
import org.springframework.http.HttpStatus

class ProductGroupApiController extends BaseDomainApiController {

    ProductGroupService productGroupService

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)

        def productGroups
        def productGroupTotal

        if (params.q) {
            productGroups = ProductGroup.findAllByNameLike("%" + params.q + "%", params)
            productGroupTotal = ProductGroup.countByNameLike("%" + params.q + "%")
        } else {
            productGroups = ProductGroup.list(params)
            productGroupTotal = ProductGroup.count()
        }

        render([data: productGroups.collect { toListJson(it) }, totalCount: productGroupTotal] as JSON)
    }

    def details() {
        ProductGroup productGroup = ProductGroup.get(params.id)
        if (!productGroup) {
            throw new ObjectNotFoundException(params.id, ProductGroup.class.toString())
        }
        render([data: toDetailsJson(productGroup)] as JSON)
    }

    @Transactional
    def create() {
        def jsonObject = request.JSON
        ProductGroup productGroup = new ProductGroup()
        productGroup.name = jsonObject.name
        productGroup.description = jsonObject.description
        productGroup.category = jsonObject.category ? Category.get(jsonObject.category) : null
        if (productGroup.hasErrors() || !productGroup.save(flush: true)) {
            throw new ValidationException("Invalid product group", productGroup.errors)
        }
        render([data: toDetailsJson(productGroup)] as JSON)
    }

    @Transactional
    def update() {
        ProductGroup productGroup = ProductGroup.get(params.id)
        if (!productGroup) {
            throw new ObjectNotFoundException(params.id, ProductGroup.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (productGroup.version > version) {
                productGroup.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [warehouse.message(code: 'productGroup.label', default: 'ProductGroup')] as Object[],
                        "Another user has updated this ProductGroup while you were editing")
                throw new ValidationException("Invalid product group", productGroup.errors)
            }
        }
        if (jsonObject.containsKey("name")) {
            productGroup.name = jsonObject.name
        }
        if (jsonObject.containsKey("description")) {
            productGroup.description = jsonObject.description
        }
        if (jsonObject.containsKey("category")) {
            productGroup.category = jsonObject.category ? Category.get(jsonObject.category) : null
        }
        if (productGroup.hasErrors() || !productGroup.save(flush: true)) {
            throw new ValidationException("Invalid product group", productGroup.errors)
        }
        render([data: toDetailsJson(productGroup)] as JSON)
    }

    @Transactional
    def delete() {
        ProductGroup productGroup = ProductGroup.get(params.id)
        if (!productGroup) {
            throw new ObjectNotFoundException(params.id, ProductGroup.class.toString())
        }
        try {
            // Remove all products from the product group before deleting the product group
            def productIds = productGroup?.products?.collect { it.id }
            productIds.each { productId ->
                Product product = Product.get(productId)
                productGroup.removeFromProducts(product)
            }
            productGroup.delete(flush: true)
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([
                    errorCode   : HttpStatus.BAD_REQUEST.value(),
                    errorMessage: "${warehouse.message(code: 'default.not.deleted.message', args: [warehouse.message(code: 'productGroup.label', default: 'ProductGroup'), params.id])}",
            ] as JSON)
            return
        }
        render status: HttpStatus.NO_CONTENT.value()
    }

    def addProduct() {
        def jsonObject = request.JSON
        Boolean isProductFamily = jsonObject.isProductFamily ? jsonObject.isProductFamily as boolean : false
        ProductGroup productGroup
        try {
            productGroup = productGroupService.addProductToProductGroup(params.id, jsonObject.product?.id as String, isProductFamily)
        } catch (IllegalArgumentException e) {
            response.status = HttpStatus.BAD_REQUEST.value()
            render([
                    errorCode   : HttpStatus.BAD_REQUEST.value(),
                    errorMessage: e.message,
            ] as JSON)
            return
        }
        render([data: toDetailsJson(productGroup)] as JSON)
    }

    @Transactional
    def removeProduct() {
        Boolean isProductFamily = params.boolean("isProductFamily") ?: false
        ProductGroup productGroup = ProductGroup.get(params.id)
        Product product = Product.get(params.productId)
        if (!product || !productGroup) {
            response.status = HttpStatus.NOT_FOUND.value()
            render([
                    errorCode   : HttpStatus.NOT_FOUND.value(),
                    errorMessage: "${warehouse.message(code: 'default.not.found.message', args: [warehouse.message(code: 'productGroup.label', default: 'ProductGroup'), params.id])}",
            ] as JSON)
            return
        }
        if (isProductFamily) {
            product.productFamily = null
        } else {
            product.removeFromProductGroups(productGroup)
            productGroup.removeFromProducts(product)
        }
        product.save(flush: true)
        render([data: toDetailsJson(productGroup)] as JSON)
    }

    private Map toListJson(ProductGroup productGroup) {
        return [
                id          : productGroup.id,
                name        : productGroup.name,
                category    : productGroup.category ? [
                        id  : productGroup.category.id,
                        name: productGroup.category.toString(),
                ] : null,
                productCount: productGroup.products ? productGroup.products.size() : 0,
                dateCreated : productGroup.dateCreated,
                lastUpdated : productGroup.lastUpdated,
        ]
    }

    private Map toDetailsJson(ProductGroup productGroup) {
        return [
                id         : productGroup.id,
                name       : productGroup.name,
                description: productGroup.description,
                version    : productGroup.version,
                category   : productGroup.category ? [
                        id  : productGroup.category.id,
                        name: productGroup.category.toString(),
                ] : null,
                dateCreated: productGroup.dateCreated,
                lastUpdated: productGroup.lastUpdated,
                products   : (productGroup.products ?: []).collect { toProductJson(it) },
                siblings   : (productGroup.siblings ?: []).collect { toProductJson(it) },
        ]
    }

    private Map toProductJson(Product product) {
        return [
                id              : product.id,
                productCode     : product.productCode,
                name            : product.name,
                category        : product.category ? product.category.toString() : null,
                unitOfMeasure   : product.unitOfMeasure,
                manufacturer    : product.manufacturer,
                manufacturerCode: product.manufacturerCode,
                vendor          : product.vendor,
                vendorCode      : product.vendorCode,
        ]
    }
}
