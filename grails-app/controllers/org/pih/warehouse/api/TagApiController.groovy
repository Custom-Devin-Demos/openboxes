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
import grails.gorm.PagedResultList
import grails.gorm.transactions.Transactional
import grails.validation.ValidationException
import org.hibernate.ObjectNotFoundException
import org.pih.warehouse.core.Tag
import org.pih.warehouse.product.Product
import org.springframework.http.HttpStatus

class TagApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        PagedResultList tags = Tag.createCriteria().list(params) {
            if (params.tag) {
                ilike("tag", "%${params.tag}%")
            }
        } as PagedResultList
        render([data: tags.collect { toJson(it) }, totalCount: tags.totalCount] as JSON)
    }

    def read() {
        Tag tag = Tag.get(params.id)
        if (!tag) {
            throw new ObjectNotFoundException(params.id, Tag.class.toString())
        }
        render([data: toDetailedJson(tag)] as JSON)
    }

    @Transactional
    def create() {
        Tag tag = new Tag()
        bindTagData(tag, request.JSON)
        if (tag.hasErrors() || !tag.save(flush: true)) {
            throw new ValidationException("Invalid tag", tag.errors)
        }
        response.status = HttpStatus.CREATED.value()
        render([data: toDetailedJson(tag)] as JSON)
    }

    @Transactional
    def update() {
        Tag tag = Tag.get(params.id)
        if (!tag) {
            throw new ObjectNotFoundException(params.id, Tag.class.toString())
        }
        def jsonObject = request.JSON
        if (jsonObject.version != null) {
            Long version = jsonObject.version as Long
            if (tag.version > version) {
                tag.errors.rejectValue("version", "default.optimistic.locking.failure",
                        ["Tag"] as Object[],
                        "Another user has updated this Tag while you were editing")
                throw new ValidationException("Invalid tag", tag.errors)
            }
        }
        bindTagData(tag, jsonObject)
        if (tag.hasErrors() || !tag.save(flush: true)) {
            throw new ValidationException("Invalid tag", tag.errors)
        }
        render([data: toDetailedJson(tag)] as JSON)
    }

    @Transactional
    def delete() {
        Tag tag = Tag.get(params.id)
        if (!tag) {
            throw new ObjectNotFoundException(params.id, Tag.class.toString())
        }
        tag.products?.collect().each { product ->
            tag.removeFromProducts(product)
        }
        tag.delete(flush: true)
        render status: HttpStatus.NO_CONTENT.value()
    }

    @Transactional
    def addProducts() {
        Tag tag = Tag.get(params.id)
        if (!tag) {
            throw new ObjectNotFoundException(params.id, Tag.class.toString())
        }
        def productCodes = request.JSON.productCodes ?: []
        productCodes.each { productCode ->
            Product product = Product.findByProductCodeLike(productCode as String)
            if (product && !tag.products?.contains(product)) {
                tag.addToProducts(product)
                tag.save(flush: true)
            }
        }
        render([data: toDetailedJson(tag)] as JSON)
    }

    @Transactional
    def removeProducts() {
        Tag tag = Tag.get(params.id)
        if (!tag) {
            throw new ObjectNotFoundException(params.id, Tag.class.toString())
        }
        def productIds = request.JSON.productIds ?: []
        productIds.each { productId ->
            Product product = Product.get(productId as String)
            if (product) {
                tag.removeFromProducts(product)
                tag.save(flush: true)
            }
        }
        render([data: toDetailedJson(tag)] as JSON)
    }

    private void bindTagData(Tag tag, def jsonObject) {
        bindData(tag, jsonObject, [include: ['tag', 'isActive']])
    }

    private static Map toJson(Tag tag) {
        return [
            id           : tag.id,
            tag          : tag.tag,
            isActive     : tag.isActive,
            productsCount: tag.products?.size() ?: 0,
            updatedBy    : tag.updatedBy?.name,
            createdBy    : tag.createdBy?.name,
            dateCreated  : tag.dateCreated,
            lastUpdated  : tag.lastUpdated,
            version      : tag.version,
        ]
    }

    private static Map toDetailedJson(Tag tag) {
        return toJson(tag) + [
            updatedById: tag.updatedBy?.id,
            createdById: tag.createdBy?.id,
            products   : tag.products?.sort { it.name }?.collect {
                [id: it.id, productCode: it.productCode, name: it.name]
            } ?: [],
        ]
    }
}
