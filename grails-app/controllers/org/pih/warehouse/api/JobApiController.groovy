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
import grails.plugins.quartz.QuartzMonitorJobFactory
import org.quartz.CronTrigger
import org.quartz.JobDetail
import org.quartz.JobKey
import org.quartz.Scheduler
import org.quartz.SchedulerException
import org.quartz.Trigger
import org.quartz.TriggerKey
import org.quartz.impl.matchers.GroupMatcher
import org.quartz.impl.triggers.CronTriggerImpl

import java.text.ParseException

class JobApiController extends BaseApiController {

    static final Map<String, Trigger> stoppedTriggers = [:]

    JobManagerService jobManagerService

    Scheduler getQuartzScheduler() {
        return jobManagerService.quartzScheduler
    }

    def list() {
        def jobsList = []
        quartzScheduler.jobGroupNames?.each { String jobGroup ->
            quartzScheduler.getJobKeys(GroupMatcher.jobGroupEquals(jobGroup))?.each { JobKey jobKey ->
                List<Trigger> jobTriggers = quartzScheduler.getTriggersOfJob(jobKey)
                if (jobTriggers) {
                    jobTriggers.each { Trigger trigger ->
                        def state = quartzScheduler.getTriggerState(trigger.key)
                        def triggerStatus = Trigger.TriggerState.find { it == state } ?: "UNKNOWN"
                        jobsList << buildJob(jobGroup, jobKey.name, trigger, triggerStatus)
                    }
                } else {
                    jobsList << buildJob(jobGroup, jobKey.name, null, null)
                }
            }
        }
        render([data: [
                jobs                  : jobsList,
                now                   : new Date().toString(),
                nowTime               : new Date().time,
                schedulerInStandbyMode: quartzScheduler.isInStandbyMode(),
        ]] as JSON)
    }

    private Map buildJob(String jobGroup, String jobName, Trigger trigger, def triggerStatus) {
        Map jobRun = QuartzMonitorJobFactory.jobRuns[trigger?.key?.name ?: ""] ?: [:]
        return [
                group        : jobGroup,
                name         : jobName,
                status       : jobRun.status,
                error        : jobRun.error?.toString(),
                duration     : jobRun.duration,
                lastRun      : jobRun.lastRun?.toString(),
                triggerStatus: triggerStatus?.toString(),
                trigger      : trigger ? [
                        name        : trigger.key.name,
                        group       : trigger.key.group,
                        nextFireTime: trigger.nextFireTime?.toString(),
                        nextFireTimestamp: trigger.nextFireTime?.time,
                        mayFireAgain: trigger.mayFireAgain(),
                        isCronTrigger: trigger instanceof CronTrigger,
                ] : null,
        ]
    }

    def stopJob() {
        String message = null
        def triggerKeys = quartzScheduler.getTriggerKeys(GroupMatcher.triggerGroupEquals(params.triggerGroup))
        def key = triggerKeys?.find { it.name == params.triggerName }
        if (key) {
            Trigger trigger = quartzScheduler.getTrigger(key)
            if (trigger) {
                stoppedTriggers[params.jobName] = trigger
                quartzScheduler.unscheduleJob(key)
            } else {
                message = "No trigger could be found for ${key}"
            }
        } else {
            message = "No trigger key could be found for ${params.triggerGroup} : ${params.triggerName}"
        }
        render([data: [message: message?.toString()]] as JSON)
    }

    def startJob() {
        String message = null
        Trigger trigger = stoppedTriggers[params.jobName]
        if (trigger) {
            quartzScheduler.scheduleJob(trigger)
        } else {
            message = "No trigger could be found for ${params.jobName}"
        }
        render([data: [message: message?.toString()]] as JSON)
    }

    def pauseJob() {
        String message = null
        JobKey key = findJobKey()
        if (key) {
            quartzScheduler.pauseJob(key)
        } else {
            message = "No job key could be found for ${params.jobGroup} : ${params.jobName}"
        }
        render([data: [message: message?.toString()]] as JSON)
    }

    def resumeJob() {
        String message = null
        JobKey key = findJobKey()
        if (key) {
            quartzScheduler.resumeJob(key)
        } else {
            message = "No job key could be found for ${params.jobGroup} : ${params.jobName}"
        }
        render([data: [message: message?.toString()]] as JSON)
    }

    def runNowJob() {
        String message = null
        JobKey key = findJobKey()
        if (key) {
            quartzScheduler.triggerJob(key)
        } else {
            message = "No job key could be found for ${params.jobGroup} : ${params.jobName}"
        }
        render([data: [message: message?.toString()]] as JSON)
    }

    def startScheduler() {
        quartzScheduler.start()
        render([data: [message: null]] as JSON)
    }

    def stopScheduler() {
        quartzScheduler.standby()
        render([data: [message: null]] as JSON)
    }

    private JobKey findJobKey() {
        def jobKeys = quartzScheduler.getJobKeys(GroupMatcher.jobGroupEquals(params.jobGroup))
        return jobKeys?.find { it.name == params.jobName }
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
