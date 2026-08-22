package spring

import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.core.Ordered

import grails.plugins.quartz.QuartzMonitorJobFactory
import org.pih.warehouse.monitoring.SentryGrailsTracingFilter

// This is where we can register spring-specific beans using the Spring Bean DSL.
// Regular beans that conform to Grails conventions don't need to be registered here.
// https://docs.grails.org/latest/guide/spring.html
beans = {

    // Job factory (inlined from quartz-monitor 1.3) that records job run
    // details for JobApiController and the /jobs screen.
    quartzJobFactory(QuartzMonitorJobFactory) {
        sessionFactory = ref('sessionFactory')
        pluginManager = ref('pluginManager')
    }

    // Override Sentry's default tracing filters since Grails behaves slightly differently than SpringBoot.
    sentryTracingFilter(SentryGrailsTracingFilter)
    sentryTracingFilterRegistration(FilterRegistrationBean) {
        filter = sentryTracingFilter
        urlPatterns = ['/*']
        order = Ordered.HIGHEST_PRECEDENCE + 1
    }
}
