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
import grails.plugins.quartz.GrailsJobClassConstants
import grails.plugins.quartz.JobManagerService
import org.quartz.JobDetail
import org.quartz.JobKey
import org.quartz.Scheduler
import org.quartz.SchedulerException
import org.quartz.Trigger
import org.quartz.TriggerKey
import org.quartz.impl.triggers.CronTriggerImpl

import java.text.ParseException

class JobApiController extends BaseApiController {

    JobManagerService jobManagerService

    Scheduler getQuartzScheduler() {
        return jobManagerService.quartzScheduler
    }

    def read() {
        String jobGroup = params.group ?: GrailsJobClassConstants.DEFAULT_GROUP
        JobKey jobKey = new JobKey(params.id, jobGroup)
        JobDetail jobDetail = quartzScheduler.getJobDetail(jobKey)
        if (!jobDetail) {
            throw new SchedulerException("No Job Detail for key ${params.id}")
        }
        def triggers = quartzScheduler.getTriggersOfJob(jobKey)
        render([data: [
                key       : jobDetail.key.toString(),
                name      : jobDetail.key.name,
                group     : jobDetail.key.group,
                properties: jobDetail.properties.collect {
                    [key: it.key?.toString(), value: it.value?.toString()]
                },
                triggers  : triggers.collect { Trigger trigger ->
                    [
                            id              : trigger.key.toString(),
                            name            : trigger.key.name,
                            summary         : trigger instanceof CronTriggerImpl ?
                                    "${trigger.cronExpression} (${trigger.expressionSummary})".toString() :
                                    trigger.properties.toString(),
                            previousFireTime: trigger.previousFireTime?.toString(),
                            nextFireTime    : trigger.nextFireTime?.toString(),
                    ]
                },
        ]] as JSON)
    }

    def unscheduleTrigger() {
        String message = null
        TriggerKey triggerKey = TriggerKey.triggerKey(params.id)
        Trigger trigger = quartzScheduler.getTrigger(triggerKey)
        if (trigger) {
            quartzScheduler.unscheduleJob(triggerKey)
        } else {
            message = "Unable to unschedule trigger with trigger key ${params.id}"
        }
        render([data: [message: message?.toString()]] as JSON)
    }

    def scheduleJob() {
        String message
        JobKey jobKey = JobKey.jobKey(params.id)
        if (jobKey) {
            try {
                Trigger trigger
                def date = quartzScheduler.scheduleJob(trigger)
                message = "Job ${jobKey} scheduled " + date
            } catch (ParseException e) {
                message = "Unable to schedule job with cron expression ${params.cronExpression} due to the following error: " + e.message
            }
        } else {
            message = "Unable to find job with jobKey = ${params.id}"
        }
        render([data: [message: message?.toString()]] as JSON)
    }
}
