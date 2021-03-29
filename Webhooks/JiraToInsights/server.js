var newrelic = require("newrelic");
var getMetricEmitter = require('@newrelic/native-metrics');
var http = require('http');
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var unirest = require('unirest');
var port = process.env.PORT || 8080;

var emitter = getMetricEmitter({timeout: 15000});
emitter.unbind();
emitter.bind(10000);

// create application/json parser
var jsonParser = bodyParser.json();

app.post("/insights/:accountNumber/key/:xinsertkey", jsonParser, function(request, response){

  //getting account Number from Path
  //var accountNumber = request.params['accountNumber'];
  var accountNumber = request.params['accountNumber'].replace(/[^\w\s]/gi, '');

  //getting Key from Secret
  var xInsertKey = request.params['xinsertkey'];

  //parse event, create an Insights-Formatted event based on JSON
  var insightEvent = parseEvent(request);

  console.log(JSON.stringify(insightEvent));

  if(insightEvent != null){

    //posting message to Insights
    unirest.post('https://insights-collector.newrelic.com/v1/accounts/'+accountNumber+'/events')
      .headers({'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Insert-Key': xInsertKey})
      .send(JSON.stringify(insightEvent))
      .end(function (response) {
        console.log(response.body);
    });
      //this is misleading, need to do error handling and/or status check to reflect real responses
      response.end('{"success":"added"}');
  } else {
    response.end('{"success":"not added"}');

  }


});

app.use(express.static(__dirname + '/public'));

//function to parse JSON from GIT and build Insights event
//Code is far from ideal, the idea is just to create a PoC-like service to validate the idea. Parsing can be greatly improved
function parseEvent(request){

  var insightEvent;

  var headers = request.headers;

  //GIT event type as declared by GIT
  //var eventName = headers['x-github-event'];
  //var eventName = gitJson.webhookEvent


  var gitJson = request.body;
  console.log(request.body);
  //console.log(gitJson.issue.fields.priority);

  var currdate = new Date();
  //if(gitJson.issue == null) {
    //console.log(request.body);
    //return null;
  //}

  //Issues
  if(gitJson.webhookEvent === 'jira:issue_created'){
    var dateUpdated = new Date(gitJson.issue.fields.updated);
    var dateCreated = new Date(gitJson.issue.fields.created);
    //var labelArr = gitJson.issue.fields.labels;
    //var componentsArr = gitJson.issue.fields.components;
    var timeFromOpen = Math.abs(currdate - dateCreated);
    var timeFromUpdate = Math.abs(currdate - dateUpdated);
    var timeFromOpenHours = Math.ceil(timeFromOpen/ ( 1000*60*60 ));
    var timeFromUpdateHours = Math.ceil(timeFromUpdate/ ( 1000*60*60 ));


    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Issue',
      eventName: 'Created',
      webhookEvent: gitJson.webhookEvent,

      issueKey: gitJson.issue.key,
      issueUrl: gitJson.issue.self,
      issueId: gitJson.issue.id,
      issueType: gitJson.issue.fields.issuetype.name,
      issueStatus: gitJson.issue.fields.status.statusCategory.name,
      issueDescription: gitJson.issue.fields.description,
      issueSummary: gitJson.issue.fields.summary,
      projectName: gitJson.issue.fields.project.name,
      priority: gitJson.issue.fields.priority.name,
      updated: gitJson.issue.fields.updated,
      created: gitJson.issue.fields.created,
      ... ((!Array.isArray(gitJson.issue.fields.components) || !gitJson.issue.fields.components.length || gitJson.issue.fields.components[0].name == undefined) ? {} : {component: gitJson.issue.fields.components[0].name}),
      ... ((gitJson.issue.fields.labels == undefined) ? {} : {label1: gitJson.issue.fields.labels[0]}),
      ... ((gitJson.issue.fields.labels == undefined) ? {} : {label2: gitJson.issue.fields.labels[0]}),
      ... ((gitJson.customfield_10623 == undefined) ? {} : {assignedGroup: gitJson.customfield_10623}),
      timeOpen: timeFromOpenHours,
      timesinceUpdate: timeFromUpdateHours
    }

    return insightEvent;
  }

  if(gitJson.webhookEvent === 'jira:issue_updated'){

    var dateUpdated = new Date(gitJson.issue.fields.updated);
    var dateCreated = new Date(gitJson.issue.fields.created);
    //var labelArr = gitJson.issue.fields.labels;
    //var componentsArr = gitJson.issue.fields.components;
    var timeFromOpen = Math.abs(currdate - dateCreated);
    var timeFromUpdate = Math.abs(currdate - dateUpdated);
    var timeFromOpenHours = Math.ceil(timeFromOpen/ ( 1000*60*60 ));
    var timeFromUpdateHours = Math.ceil(timeFromUpdate/ ( 1000*60*60 ));
    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Issue',
      eventName: 'Updated',
      webhookEvent: gitJson.webhookEvent,

      issueKey: gitJson.issue.key,
      issueUrl: gitJson.issue.self,
      issueId: gitJson.issue.id,
      issueType: gitJson.issue.fields.issuetype.name,
      issueStatus: gitJson.issue.fields.status.name,
      issueDescription: gitJson.issue.fields.description,
      issueSummary: gitJson.issue.fields.summary,
      projectName: gitJson.issue.fields.project.name,
      priority: gitJson.issue.fields.priority.name,
      updated: gitJson.issue.fields.updated,
      created: gitJson.issue.fields.created,
      ... ((!Array.isArray(gitJson.issue.fields.components) || !gitJson.issue.fields.components.length || gitJson.issue.fields.components[0].name == undefined) ? {} : {component: gitJson.issue.fields.components[0].name}),
      ... ((gitJson.issue.fields.labels == undefined) ? {} : {label1: gitJson.issue.fields.labels[0]}),
      ... ((gitJson.issue.fields.labels == undefined) ? {} : {label2: gitJson.issue.fields.labels[0]}),
      ... ((gitJson.customfield_10623 == undefined) ? {} : {assignedGroup: gitJson.customfield_10623}),
      timeOpen: timeFromOpenHours,
      timesinceUpdate: timeFromUpdateHours

    }

    return insightEvent;
  }
  /*
  if(eventName === 'jira:issue_deleted'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Issue',
      eventName: 'Deleted',
      webhookEvent: gitJson.webhookEvent,

      issueKey: gitJson.issue.key,
      issueId: gitJson.issue.id,
      issueDescription: gitJson.issue.fields.description,
      projectName: gitJson.issue.fields.project.name

    }

    return insightEvent;
  }
*/
  if(gitJson.webhookEvent === 'jira:worklog_updated'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Issue',
      eventName: 'Worklog Updated',
      webhookEvent: gitJson.webhookEvent,

      issueKey: gitJson.issue.key,
      issueId: gitJson.issue.id,
      issueDescription: gitJson.issue.fields.description,
      projectName: gitJson.issue.fields.project.name

    }

    return insightEvent;
  }
/*
  //Comments
  //need to test
  if(eventName === 'comment_created'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventName: 'Comment Created',
      webhookEvent: gitJson.webhookEvent,

      issueKey: gitJson.issue.key,
      issueId: gitJson.issue.id,
      issueDescription: gitJson.issue.fields.description,
      issueProject: gitJson.issue.fields.project.name

    }

    return insightEvent;
  }

  if(eventName === 'comment_updated'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventName: 'Comment Updated',
      webhookEvent: gitJson.webhookEvent,

      issueKey: gitJson.issue.key,
      issueId: gitJson.issue.id,
      issueDescription: gitJson.issue.fields.description,
      issueProject: gitJson.issue.fields.project.name

    }

    return insightEvent;
  }


  //Sprints
  //webhook mentioned but details no references in API docs
  if(gitJson.webhookEvent === 'sprint_created'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Sprint',
      eventName: 'Created',
      webhookEvent: gitJson.webhookEvent,

      projectKey: gitJson.sprint.key,
      projectId: gitJson.sprint.id,
      projectDescription: gitJson.sprint.description,
      projectUrl: gitJson.sprint.name

    }

    return insightEvent;
  }

  //Boards
  //webhook mentioned but details no references in API docs
  if(gitJson.webhookEvent === 'board_created'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Board',
      eventName: 'Created',
      webhookEvent: gitJson.webhookEvent,

      projectKey: gitJson.board.key,
      projectId: gitJson.board.id,
      projectDescription: gitJson.board.description,
      projectUrl: gitJson.board.name

    }

    return insightEvent;
  }
  */

  //Projects

  if(gitJson.webhookEvent === 'project_created'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Project',
      eventName: 'Created',
      webhookEvent: gitJson.webhookEvent,

      projectKey: gitJson.project.key,
      projectId: gitJson.project.id,
      projectDescription: gitJson.project.description,
      projectUrl: gitJson.project.name

    }

    return insightEvent;
  }

  /*
  if(gitJson.webhookEvent === 'project_updated'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Project',
      eventName: 'Updated',
      webhookEvent: gitJson.webhookEvent,

      projectKey: gitJson.project.key,
      projectId: gitJson.project.id,
      projectUrl: gitJson.project.name

    }

    return insightEvent;
  }

  if(eventName === 'project_deleted'){

    insightEvent = {

      eventType: 'JIRAEvent',
      eventObject: 'Project',
      eventName: 'Deleted',
      webhookEvent: gitJson.webhookEvent,

      projectKey: gitJson.project.key,
      projectId: gitJson.project.id,
      projectDescription: gitJson.project.description,
      projectUrl: gitJson.project.name

    }

    return insightEvent;
  }
  */


  console.log( '---------------- EventName: ');

  insightEvent = {
    eventType:'JIRAEvent'
  }

  return insightEvent;
}

app.listen(port);

console.log("Listening on port ", port);

require("cf-deployment-tracker-client").track();
