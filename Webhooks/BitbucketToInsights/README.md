# Bitbucket To Insights

The Github to Insights Integration is a Node.JS service . The service endpoint expects a POST message from Bitbucket's Webhook, parses the data and sends it to Insights.

More information on Bitbucket's Webhook settings can be found [here](https://confluence.atlassian.com/bitbucket/manage-webhooks-735643732.html)

## Installation
The  installation steps depend on the platform to which the integration is being deployed. 

Clone this repository or download and unzip the provided distribution and install into a target platform.Installation should expose and endpoint such as  
    https://your.server.com:PORT/insights/[RPMID]/key/[INSIGHTSINSERTKEY]


## Usage

1. [Register an Insights Event API insert key](https://docs.newrelic.com/docs/insights/insights-data-sources/custom-data/send-custom-events-event-api#register) <sup>New Relic</sup>
2. [Register a Bitbucket Webhook](https://confluence.atlassian.com/bitbucket/manage-webhooks-735643732.html) <sup>Bitbucket</sup>
   The URL for the Webhook should be of the following form.

   https://your.server.com:PORT/insights/[RPMID]/key/[INSIGHTSINSERTKEY]
