# JIRA To Insights

The JIRA to Insights Integration is a Node.JS service hosted on Heroku. The service endpoint expects a POST message from JIRA's Webhook, parses the data and sends it to Insights.

More information on JIRA's Webhook settings can be found [here](https://developer.atlassian.com/jiradev/jira-apis/webhooks)

## Installation
The J2I installation steps depend on the platform to which the integration is being deployed. 

Clone this repository or download and unzip the provided distribution and install into a target platform. Installation should expose and endpoint such as  https://your.server.com:PORT/insights/[RPMID]/key/[INSIGHTSINSERTKEY]


## Usage

1. [Register an Insights Event API insert key](https://docs.newrelic.com/docs/insights/insights-data-sources/custom-data/send-custom-events-event-api#register) <sup>New Relic</sup>
2. [Register a Jira Webhook](https://developer.atlassian.com/server/jira/platform/webhooks/) <sup>Jira</sup>
   The URL for the Webhook should be of the following form.

   https://your.server.com:PORT/insights/[RPMID]/key/[INSIGHTSINSERTKEY]

   [here](http://google.com)
3. Additional information can be found [here](NewRelic-JiraIntegration.pdf)
