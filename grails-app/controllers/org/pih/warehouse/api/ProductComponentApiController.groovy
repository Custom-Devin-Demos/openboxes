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
import org.pih.warehouse.product.ProductComponent

class ProductComponentApiController extends BaseDomainApiController {

    def list() {
        params.max = Math.min(params.max ? params.int('max') : 10, 100)
        List<ProductComponent> productComponents = ProductComponent.list(params)
        Integer productComponentTotal = ProductComponent.count()
        render([data: productComponents.collect { toJson(it) }, totalCount: productComponentTotal] as JSON)
    }

    private Map toJson(ProductComponent productComponent) {
        return [
                id             : productComponent.id,
                assemblyProduct: productComponent.assemblyProduct ? [
                        id  : productComponent.assemblyProduct.id,
                        name: productComponent.assemblyProduct.toString(),
                ] : null,
                componentProduct: productComponent.componentProduct ? [
                        id  : productComponent.componentProduct.id,
                        name: productComponent.componentProduct.toString(),
                ] : null,
                quantity       : productComponent.quantity,
                unitOfMeasure  : productComponent.unitOfMeasure ? productComponent.unitOfMeasure.toString() : null,
        ]
    }
}
