import React from 'react'
import PropTypes from 'prop-types'
import {
  Grid,
  GridItem,
  Badge,
  NerdGraphQuery,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
} from 'nr1'
import Card from './card'
import Chart from './chart'
const gqlQuery = require('../query')

export default class ProjectDashboard extends React.Component {
  static propTypes = {
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array,
  }

  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      refinedStoryPointList: [],
      refinedStoryCount: 0,
      sprintVelocity: 0,
      planKeys: [],
    }
  }

  componentDidMount() {
    this.setState(
      { loading: true },
      async () => await this.getTransientProjectData()
    )
  }

  async getTransientProjectData() {
    const {
      projectName,
      accountId,
      issueTypeSelected,
      codeRepoSelected,
    } = this.props
    var refinedStoryCount = 0
    var refinedStoryPointList = []
    var codeProjectKeys = []
    var codeRepoNames = []

    for (let repo of codeRepoSelected) {
      var temp = repo.split('.')
      codeProjectKeys.push(temp[0])
      codeRepoNames.push(temp[1])
    }
    var buildMappingNRQL =
      "select count(commit_status.key) as Plan_key from BitbucketEvent where eventName = 'repo:commit_status_updated' and `commit_status.state` = 'SUCCESSFUL' since 1 months ago limit max facet commit_status.key where repository.project.key in ('" +
      (codeProjectKeys && codeProjectKeys.length > 0
        ? codeProjectKeys.join("','")
        : '') +
      "'" +
      ") and repository.name in ('" +
      (codeRepoNames && codeRepoNames.length > 0
        ? codeRepoNames.join("','")
        : '') +
      "'" +
      ')'

    let buildMappingResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(accountId, buildMappingNRQL),
    })
    buildMappingResults =
      (
        ((((buildMappingResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {}

    var planKeys = []
    for (let key of buildMappingResults) {
      planKeys.push(key.facet)
    }

    let currentSprintResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(accountId, gqlQuery.currentSprint(projectName)),
    })
    let currentSprint = (((
      ((((currentSprintResults || {}).data || {}).actor || {}).account || {})
        .nrql || {}
    ).results || {})[0] || {})['latest.sprintName']

    let refinedStoryResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        accountId,
        gqlQuery.refinedStories(projectName, issueTypeSelected)
      ),
    })
    refinedStoryResults =
      (
        ((((refinedStoryResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {}

    for (let result of refinedStoryResults) {
      if (result['latest.sprintName'] != currentSprint) {
        // refinedStoryPointList.push([
        //   result.issueKey,
        //   result['latest.storyPoints'],
        //   result['latest.issueType'],
        // ]);

        refinedStoryPointList.push({
          issueKey: result.issueKey,
          storyPoints: result['latest.storyPoints'],
          issueType: result['latest.issueType'],
        })
        refinedStoryCount += result['latest.storyPoints']
      }
    }

    let sprintVelocityResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        accountId,
        gqlQuery.sprintVelocity(projectName, currentSprint, issueTypeSelected)
      ),
    })
    var sprintVelocity = (
      ((
        ((((sprintVelocityResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {})[0] || {}
    ).Velocity

    this.setState({
      refinedStoryPointList,
      refinedStoryCount,
      sprintVelocity,
      planKeys,
      loading: false,
    })
  }

  renderDashboard() {
    const {
      projectName,
      accountId,
      issueTypeSelected,
      codeRepoSelected,
    } = this.props
    const {
      refinedStoryPointList,
      refinedStoryCount,
      sprintVelocity,
      planKeys,
    } = this.state

    const timeSpan = 90
    let codeProjectKeys = []
    let codeRepoNames = []

    for (let repo of codeRepoSelected) {
      let temp = repo.split('.')
      codeProjectKeys.push(temp[0])
      codeRepoNames.push(temp[1])
    }

    let backloghealth = refinedStoryCount / sprintVelocity
    backloghealth = Number.isNaN(backloghealth) ? 'N/A' : backloghealth

    return (
      <>
        <div className="issuetypes__container">
          <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
            {projectName}
          </Badge>
          <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
            All Sprints
          </Badge>
          {issueTypeSelected.map(value => {
            return (
              <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
                {value}
              </Badge>
            )
          })}
          <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
            {timeSpan} Days
          </Badge>
        </div>

        <div className="card__group__container">
          <Card
            title="Total Issues"
            subtitle="Unique Issue Keys"
            sections={[
              {
                accountId,
                label: 'Issues',
                query: gqlQuery.totalIssues(
                  projectName,
                  issueTypeSelected,
                  timeSpan
                ),
              },
              {
                accountId,
                label: 'Deleted',
                query: gqlQuery.deletedIssues(projectName, timeSpan + ' DAYS'),
              },
            ]}
          />
          <Card
            title="Bugs"
            subtitle="Bugs"
            sections={[
              {
                accountId,
                label: 'Projects',
                query: projectName
                  ? `select uniqueCount(issueId) as 'Bugs' from JIRAEvent since ${timeSpan.toString()} days ago limit MAX where issueType = 'Bug' and projectName = '${projectName}'`
                  : `select uniqueCount(issueId) as 'Bugs' from JIRAEvent since 1 month ago where issueType = 'Bug' limit MAX`,
              },
            ]}
          />
          <Card
            title="Sprint Velocity"
            subtitle="Storypoints / # of Sprints"
            sections={[
              {
                accountId,
                label: 'Sprint Velocity',
                value: sprintVelocity ? sprintVelocity.toFixed(2) : 0,
              },
            ]}
          />
          <Card
            title="Issue Completion"
            subtitle="Completion Statistics"
            sections={[
              {
                accountId,
                label: 'Issues',
                query: `select uniqueCount(issueKey) as 'Issues' from JIRAEvent since ${timeSpan.toString()} days ago limit MAX where issueStatusName in ('Done','Complete') and timestamp > 1592870400000 and issueType in ('${issueTypeSelected.join(
                  "','"
                )}') and projectName = '${projectName}'`,
              },
            ]}
          />
          <Card
            title="Issue Completion Time"
            subtitle="Completed Time"
            sections={[
              {
                accountId,
                label: 'Days',
                formatter: data => (data ? data.toFixed(2) : 0),
                query:
                  "SELECT average(`timeOpen`) / 24 as 'Days' from JIRAEvent since " +
                  timeSpan.toString() +
                  "  days ago where issueStatusName in ('Done','Complete') and issueType in (" +
                  "'" +
                  issueTypeSelected.join("','") +
                  "'" +
                  ") and projectName = '" +
                  projectName +
                  "' and timestamp > 1592870400000 and sprintEndDate <= timestamp",
              },
            ]}
          />
          <Card
            title="Code Repositories"
            subtitle="Assigned"
            sections={[
              {
                accountId,
                label: 'Repos',
                value: codeRepoSelected ? codeRepoSelected.length : 0,
              },
            ]}
          />
          <Card
            title="Code CheckIns"
            subtitle="Refs Changed"
            sections={[
              {
                accountId,
                label: 'Checkins',
                formatter: data => (data ? data.toFixed(2) : 0),
                query:
                  "SELECT count(*) from BitbucketEvent since 90 days ago limit max where ( pullRequest.toRef.displayId = 'master' or pullrequest.destination.branch.name = 'master') and (pullRequest.state = 'MERGED' or pullrequest.state = 'MERGED') where repository.project.key in ('" +
                  (codeProjectKeys && codeProjectKeys.length > 0
                    ? codeProjectKeys.join("','")
                    : '') +
                  "'" +
                  ") and repository.name in ('" +
                  (codeRepoNames && codeRepoNames.length > 0
                    ? codeRepoNames.join("','")
                    : '') +
                  "'" +
                  ')',
              },
            ]}
          />
        </div>

        <div className="card__group__container">
          <Card
            title="Backlog Health"
            subtitle="Health of Pipeline"
            sections={[
              {
                accountId,
                label: 'Health',
                value:
                  backloghealth !== 'N/A'
                    ? backloghealth.toFixed(2)
                    : backloghealth,
                threshold: function() {
                  if (backloghealth !== 'N/A') {
                    if (backloghealth >= 2) {
                      return 'green'
                    } else if (backloghealth < 2 && backloghealth > 1) {
                      return 'yellow'
                    } else {
                      return 'red'
                    }
                  } else return 'black'
                },
              },
            ]}
          />
          <Card
            title="Refined Story Points"
            subtitle="Ready for delivery"
            sections={[
              {
                accountId,
                label: 'Points',
                value: refinedStoryCount.toFixed(1),
              },
            ]}
          />
        </div>
        <div className="chart__group__container">
          <Grid>
            <GridItem columnSpan={3}>
              <Chart
                title="Average Time Open"
                accountId={accountId}
                query={
                  'SELECT average(`timeOpen`)/24 from JIRAEvent since ' +
                  timeSpan.toString() +
                  ' days ago TIMESERIES AUTO EXTRAPOLATE where issueType in (' +
                  "'" +
                  issueTypeSelected.join("','") +
                  "'" +
                  ") and projectName = '" +
                  projectName +
                  "'"
                }
                type="line"
              />
            </GridItem>
            <GridItem columnSpan={3}>
              <Chart
                title="Issues Closed over Time"
                accountId={accountId}
                query={
                  'SELECT average(`timeOpen`) / 24 from JIRAEvent since ' +
                  timeSpan.toString() +
                  "  days ago TIMESERIES where issueStatus in ('Done','Complete') and issueType in (" +
                  "'" +
                  issueTypeSelected.join("','") +
                  "'" +
                  ") and projectName = '" +
                  projectName +
                  "'"
                }
                type="line"
              />
            </GridItem>
            <GridItem columnSpan={3}>
              <Chart
                title="Story Points Completed over Time"
                accountId={accountId}
                query={
                  "SELECT filter(sum(storyPoints), where issueStatus in ('Done','Complete')) as 'Story Points Completed' FROM JIRAEvent SINCE " +
                  timeSpan.toString() +
                  "  days ago TIMESERIES where projectName = '" +
                  projectName +
                  "'"
                }
                type="line"
              />
            </GridItem>
            <GridItem columnSpan={3}>
              <div className="chart__container">
                <div className="chart-header">
                  <div className="chart-title">Refined Story Points</div>
                </div>
                <Table
                  items={refinedStoryPointList}
                  className="chart-content basic-table"
                  compact
                >
                  <TableHeader>
                    <TableHeaderCell value={({ item }) => item.issueKey}>
                      Key
                    </TableHeaderCell>
                    <TableHeaderCell value={({ item }) => item.storyPoints}>
                      Story Points
                    </TableHeaderCell>
                    <TableHeaderCell value={({ item }) => item.issueType}>
                      Type
                    </TableHeaderCell>
                  </TableHeader>
                  {({ item }) => (
                    <TableRow>
                      <TableRowCell>{item.issueKey}</TableRowCell>
                      <TableRowCell>{item.storyPoints}</TableRowCell>
                      <TableRowCell>{item.issueType}</TableRowCell>
                    </TableRow>
                  )}
                </Table>
              </div>
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Members and Number of Sprints Involved In"
                accountId={accountId}
                query={
                  'SELECT uniqueCount(sprintName) FROM JIRAEvent since ' +
                  timeSpan.toString() +
                  "  days ago facet displayName limit 100 where sprintName not like '%@%' and projectName = '" +
                  projectName +
                  "'"
                }
                type="bar"
              />
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Average Time to Close (Days)"
                accountId={accountId}
                query={
                  'SELECT average(`timeOpen`) / 24 from JIRAEvent since ' +
                  timeSpan.toString() +
                  "  days ago facet priority where issueStatus in ('Done','Complete') and sprintName is not null and issueType in (" +
                  "'" +
                  issueTypeSelected.join("','") +
                  "'" +
                  ") and projectName = '" +
                  projectName +
                  "'"
                }
                type="bar"
              />
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Average Time to Close by Priority (Days)"
                accountId={accountId}
                query={
                  'SELECT average(`timeOpen`) / 24 from JIRAEvent since ' +
                  timeSpan.toString() +
                  "  days ago facet priority where issueStatus in ('Done','Complete') and sprintName is not null and issueType in (" +
                  "'" +
                  issueTypeSelected.join("','") +
                  "'" +
                  ") and projectName = '" +
                  projectName +
                  "'"
                }
                type="bar"
              />
            </GridItem>
          </Grid>
        </div>
      </>
    )
  }

  render() {
    return this.renderDashboard()
  }
}
