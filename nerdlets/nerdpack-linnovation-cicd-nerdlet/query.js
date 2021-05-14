module.exports = {
    getWorkloads: (accountId) =>{
      return `{
  actor {
    entitySearch(queryBuilder: {type: WORKLOAD}) {
      results {
        entities {
          name
          entityType
          accountId
          guid
        }
      }
    }
  }
}`
    },
    runQuery: (accountId,nrql) =>{
      return `{
        actor {
          account(id: ` + accountId + `) {
            nrql(query: "` + nrql + `") {
              results
            }
          }
        }
      }`
    },
    sprintStartStoryCount: (sprintName,issueTypeSelected) =>{
      return `select sum(pointsAtSprintStart) from (SELECT latest(issueKey) as issueKey,latest(issueType) as issueType,latest(sprintName) as sprintName, filter(uniqueCount(issueKey), where (timestamp <= sprintStartDate or sprintStartDate is null)) as issuesAtSprintStart,filter(uniqueCount(issueKey), where timestamp >= sprintStartDate and timestamp <= sprintEndDate) as issuesInSprint,filter(latest(storyPoints), where (timestamp <= sprintStartDate or sprintStartDate is null)) as pointsAtSprintStart,filter(latest(storyPoints), where timestamp >= sprintStartDate and timestamp <= sprintEndDate) as pointsInSprint from JIRAEvent where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `) and sprintName = '` + sprintName + `' and ( (timestamp >= sprintStartDate and timestamp <= sprintEndDate)  or (timestamp <= sprintStartDate or sprintStartDate is null) ) facet issueKey, sprintName limit max)  where issuesAtSprintStart = 1 and issuesInSprint = 1 since 3 months ago`
    },
    sprintStartIssueCount: (sprintName, issueTypeSelected) =>{
      return `select sum(issuesAtSprintStart) from (SELECT latest(issueKey) as issueKey, latest(issueType) as issueType,latest(sprintName) as sprintName, filter(uniqueCount(issueKey), where (timestamp <= sprintStartDate or sprintStartDate is null)) as issuesAtSprintStart, filter(uniqueCount(issueKey), where timestamp >= sprintStartDate and timestamp <= sprintEndDate) as issuesinSprint from JIRAEvent where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `) and sprintName = '` + sprintName + `' and ( (timestamp >= sprintStartDate and timestamp <= sprintEndDate) or (timestamp <= sprintStartDate or sprintStartDate is null)) facet issueKey, sprintName limit max) where issuesAtSprintStart = 1 and issuesinSprint = 1 since 3 months ago`
    },
    sprintStartCount: (sprintName,issueTypeSelected) =>{
      return `select latest(storyPoints) from (SELECT latest(issueKey) as issueKey,latest(issueType) as issueType,latest(sprintName) as sprintName,latest(storyPoints) as storyPoints, filter(uniqueCount(issueKey), where (timestamp <= sprintStartDate or sprintStartDate is null)) as issuesAtSprintStart,filter(uniqueCount(issueKey), where timestamp >= sprintStartDate and timestamp <= sprintEndDate) as issuesInSprint,filter(latest(storyPoints), where (timestamp <= sprintStartDate or sprintStartDate is null)) as pointsAtSprintStart,filter(latest(storyPoints), where timestamp >= sprintStartDate and timestamp <= sprintEndDate) as pointsInSprint from JIRAEvent where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `) and sprintName = '` + sprintName + `' and ( (timestamp >= sprintStartDate and timestamp <= sprintEndDate)  or (timestamp <= sprintStartDate or sprintStartDate is null) ) facet issueKey, sprintName limit max)  where issuesAtSprintStart = 1 and issuesInSprint = 1 facet issueKey limit max since 3 months ago`
    },
    sprintStartCountAPI: (sprintName) =>{
      return `select latest(issueKey), latest(storyPoints) from JIRAEvent facet issueKey where eventObject = 'Sprint' and eventName = 'Started' and sprintName = '` + sprintName + `' limit max since 3 months ago`
    },
    inSprintCount: (sprintName, issueTypeSelected) => {
      return `select latest(storyPoints) from (SELECT latest(issueKey) as issueKey,latest(issueType) as issueType,latest(sprintName) as sprintName, latest(storyPoints) as storyPoints,filter(uniqueCount(issueKey), where (timestamp > sprintStartDate or (eventObject = 'Sprint' and eventName = 'Started'))) as issuesinSprint from JIRAEvent where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `) and sprintName = '` + sprintName + `' facet issueKey, sprintName limit max) where issuesinSprint = 1 facet issueKey since 3 months ago limit max`
    },
    postSprintCount: (sprintName, issueTypeSelected, inSprintIssueList) => {
      return `select latest(storyPoints), latest(issueType) from (SELECT latest(issueKey) as issueKey,latest(issueType) as issueType,latest(storyPoints) as storyPoints, latest(sprintName) as sprintName from JIRAEvent where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `) and issueKey in (` + inSprintIssueList.map(function(issue){ return "'" + issue.issueKey + "'"}).join(",") + ` ) and issueStatus in ('Done', 'Complete') and sprintName is not null facet issueKey limit max) facet issueKey where sprintName = '` + sprintName + `' since 3 months ago limit max`
    },
    refinedStories: (projectName, issueTypeSelected) => {
      return `select latest(storyPoints), latest(issueType), latest(sprintName) from (SELECT latest(issueKey) as issueKey,latest(issueType) as issueType,latest(storyPoints) as storyPoints, latest(issueStatusName) as issueStatusName, latest(sprintName) as sprintName from JIRAEvent where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `) and projectName = '` + projectName + `' facet issueKey limit max) where issueStatusName = 'Ready for delivery' facet issueKey since 3 months ago limit max`
    },
    sprintVelocity: (projectName, currentSprint, issueTypeSelected) => {
      return `select sum(storyPoints)/uniqueCount(sprintName) as Velocity from (SELECT latest(issueKey) as issueKey, latest(issueType) as issueType, latest(storyPoints) as storyPoints, latest(sprintName) as sprintName from JIRAEvent where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `) and projectName = '` + projectName + `' and issueStatus in ('Done', 'Complete') and sprintStartDate > 1592870400000 and sprintStartDate IS NOT NULL and sprintName != '` + currentSprint + `' facet issueKey limit max) since 3 months ago limit max`
    },
    sprintList: (projectName) => {
      return `SELECT latest(timestamp) FROM (SELECT latest(sprintStartDate) as sprintStartDate, latest(sprintEndDate) as sprintEndDate FROM JIRAEvent facet sprintName where projectName = '` + projectName + `' and timestamp > 1592870400000) SINCE 90 days ago facet sprintName limit 10 where sprintStartDate is not null and sprintEndDate is not null and sprintStartDate > 1592870400000`
    },
    currentSprint: (projectName) => {
      return `select latest(sprintName) from JIRAEvent since 3 months ago limit 1 where sprintStartDate < ` + new Date().getTime() + ` and sprintEndDate > ` + new Date().getTime() + ` and projectName = '` + projectName + `'`
    },
    codeRepos: () => {
      return `SELECT uniqueCount(repository.name) FROM BitbucketEvent facet repository.name,repository.project.key SINCE 10 weeks AGO limit MAX`
    },
    totalIssues: (projectName,issueTypeSelected,timeSpan) => {
      return `select sum(Issues), sum(Deleted) from (SELECT filter(uniqueCount(issueKey), where issueType in (` + `'` + issueTypeSelected.join("','") + `'` + `)) as Issues, filter(uniqueCount(issueKey), where webhookEvent = 'jira:issue_deleted') as Deleted FROM JIRAEvent where projectName = '` + projectName + `' facet issueKey where timestamp > 1592870400000 limit MAX) where Issues = 1  SINCE ` + timeSpan.toString() + ` days AGO`
    },
    deletedIssues: (projectName, timeSpan) => {
      return `SELECT filter(uniqueCount(issueKey), where webhookEvent = 'jira:issue_deleted') as Deleted FROM JIRAEvent where projectName = '${projectName}' facet issueKey limit MAX SINCE ${timeSpan} AGO`
    },
    changeRate: () => {
      return `"SELECT  filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') as 'InProgress', filter(earliest(timeOpen)/24,  where issueStatus in ('Complete','Done')) - filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') as 'Done', filter(earliest(timeOpen)/24, where issueStatus in ('Complete','Done')) as 'Total'  from JIRAEvent since 1 month ago limit max facet issueKey where issueKey in (` + inSprintIssueList.map(function(issue){ return "'" + issue.issueKey + "'"}).join(",") + ` )"`
    }
 
  };
