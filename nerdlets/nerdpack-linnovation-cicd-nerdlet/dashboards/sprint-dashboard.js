import React from 'react'
import PropTypes from 'prop-types'
import dayjs from 'dayjs'
import {
  Grid,
  GridItem,
  Badge,
  NrqlQuery,
  NerdGraphQuery,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableRowCell,
  TableChart,
  HeadingText,
  BlockText,
  Spinner,
} from 'nr1'
import Card from './card'
import Modal from 'react-modal'
const gqlQuery = require('../query')
const roundToTwo = data => Math.round((data + Number.EPSILON) * 100) / 100

export default class SprintDashboard extends React.Component {
  static propTypes = {
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    sprintName: PropTypes.string,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array,
  }
  state = {
    issueKey: null,
    issueModalOpen: false,
    issueModalContent: null,
    issueDetailsData: null,
    sprintStartDate: null,
    sprintEndDate: null,
    sprintStartEstimated: null,
    sprintStartIssueList: [],
    sprintStartStoryCount: null,
    inSprintIssueList: [],
    inSprintStoryCount: null,
    postSprintStoryCount: null,
    postSprintIssueList: [],
    releaseCount: null,
    cycleTimes: {},
    releaseList: [],
    loading: false,
  }

  openModel = issueKey =>
    this.setState({
      issueModalOpen: true,
      issueKey,
    })

  closeModal = () =>
    this.setState({
      issueModalOpen: false,
      issueKey: null,
    })

  getModalContent = () => {
    const { accountId } = this.props
    const { issueKey } = this.state
    const issueDetailsNrql = `SELECT displayName as 'Name', issueStatus, issueStatusName as 'Status Name', priority, sprintName as 'Sprint', storyPoints, timeOpen/24 as 'daysOpen', timestamp From JIRAEvent since 3 months ago where issueKey ='${issueKey}' LIMIT 100`
    const issueOverviewNrql = `SELECT latest(issueSummary), latest(issueStatus), latest(timeOpen)/24 as 'daysOpen' from JIRAEvent since 3 months ago where issueKey ='${issueKey}'`

    return (
      <>
        <div className="modal__title">Issue: {issueKey}</div>

        <NrqlQuery accountId={accountId} query={issueOverviewNrql}>
          {({ data, loading, error }) => {
            console.info('running query', loading, data)
            if (loading) return <Spinner />
            if (error) console.error('error loading issue data', error)
            if (data && data.length > 0) {
              return (
                <>
                  <div className="modal__content">
                    <HeadingText type={HeadingText.TYPE.HEADING_3}>
                      {data[0].data[0].issueSummary}
                    </HeadingText>
                    <div className="modal__details">
                      <HeadingText type={HeadingText.TYPE.HEADING_4}>
                        <strong>Current Status:</strong> {data[1].data[0].issueStatus}
                      </HeadingText>
                      <HeadingText type={HeadingText.TYPE.HEADING_4}>
                        <strong>Days Open:</strong> {roundToTwo(data[2].data[0].daysOpen)}
                      </HeadingText>
                    </div>

                    <TableChart
                      accountId={accountId}
                      query={issueDetailsNrql}
                      fullWidth
                      style={{ height: '90%' }}
                    />
                  </div>
                  <div></div>
                </>
              )
            } else return <div>No issue details found</div>
          }}
        </NrqlQuery>
      </>
    )
  }

  async componentDidMount() {
    this.setState({ loading: true }, async () => {
      await this.getTransientSprintData()
      this.setState({
        loading: false,
      })
    })
  }

  componentDidUpdate(prevProps) {
    if (this.props.sprintName !== prevProps.sprintName) {
      this.setState(
        {
          issueKey: null,
          issueModalOpen: false,
          issueDetailsData: null,
          sprintStartDate: null,
          sprintEndDate: null,
          sprintStartEstimated: null,

          postSprintStoryCount: null,
          postSprintIssueList: [],

          sprintStartStoryPoints: null,
          sprintStartIssueList: [],

          inSprintStoryCount: null,
          inSprintIssueList: [],

          releaseList: [],
          cycleTimes: {},
          loading: true,
        },
        async () => {
          await this.getTransientSprintData()
          this.setState({
            loading: false,
          })
        }
      )
    }
  }

  async getTransientSprintData() {
    const {
      projectName,
      accountId,
      sprintName,
      issueTypeSelected,
      codeRepoSelected,
    } = this.props
    const sprintDatesNRQL =
      "From JIRAEvent select latest(sprintStartDate), latest(sprintEndDate) limit 1 where sprintStartDate is not null since 1 month ago where sprintName = '" +
      sprintName +
      "'"
    let results = await NrqlQuery.query({
      accountId: accountId,
      query: sprintDatesNRQL,
    })
    var inSprintIssueList = []
    var sprintStartIssueList = []
    var postSprintIssueList = []
    var deletedIssueList = []
    var releaseList = []
    var inSprintStoryCount = 0
    var sprintStartStoryCount = 0
    var postSprintStoryCount = 0
    var releaseCount = 0
    var cycleTimes = {}
    var sprintStartEstimated = true

    var sprintStartDate = results.data.chart[0].data[0].sprintStartDate
    var sprintEndDate = results.data.chart[1].data[0].sprintEndDate

    let sprintStartCountResultsAPI = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        accountId,
        gqlQuery.sprintStartCountAPI(sprintName)
      ),
    })
    sprintStartCountResultsAPI =
      (
        (
          (((sprintStartCountResultsAPI || {}).data || {}).actor || {})
            .account || {}
        ).nrql || {}
      ).results || {}

    let sprintStartCountResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        accountId,
        gqlQuery.sprintStartCount(sprintName, issueTypeSelected)
      ),
    })
    sprintStartCountResults =
      (
        (
          (((sprintStartCountResults || {}).data || {}).actor || {}).account ||
          {}
        ).nrql || {}
      ).results || {}
    let inSprintCountResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        accountId,
        gqlQuery.inSprintCount(sprintName, issueTypeSelected)
      ),
    })
    inSprintCountResults =
      (
        ((((inSprintCountResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {}
    let deletedIssuesResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        accountId,
        gqlQuery.deletedIssues(projectName, '1 HOUR')
      ),
    })
    deletedIssuesResults =
      (
        ((((deletedIssuesResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {}
    for (let result of deletedIssuesResults) {
      deletedIssueList.push(result.issueKey)
    }

    if (
      sprintStartCountResultsAPI === undefined ||
      sprintStartCountResultsAPI.length == 0 ||
      !Object.keys(sprintStartCountResultsAPI).length
    ) {
      for (let result of sprintStartCountResults) {
        sprintStartIssueList.push({
          issueKey: result.issueKey,
          ...(result['latest.storyPoints'] == undefined ||
            !result['latest.storyPoints']
            ? { storyPoints: 0 }
            : { storyPoints: result['latest.storyPoints'] }),
        })
        sprintStartStoryCount += result['latest.storyPoints']
      }
      sprintStartEstimated = true
    } else {
      for (let result of sprintStartCountResultsAPI) {
        sprintStartIssueList.push({
          issueKey: result.issueKey,
          storyPoints: result['latest.storyPoints'],
        })
        sprintStartStoryCount += result['latest.storyPoints']
      }
      sprintStartEstimated = false
    }
    for (let result of inSprintCountResults) {
      inSprintIssueList.push({
        issueKey: result.issueKey,
        storyPoints: result['latest.storyPoints'],
      })
      inSprintStoryCount += result['latest.storyPoints']
    }

    let postSprintCountResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        accountId,
        gqlQuery.postSprintCount(
          sprintName,
          issueTypeSelected,
          inSprintIssueList
        )
      ),
    })
    postSprintCountResults =
      (
        (
          (((postSprintCountResults || {}).data || {}).actor || {}).account ||
          {}
        ).nrql || {}
      ).results || {}

    for (let result of postSprintCountResults) {
      if (deletedIssueList.indexOf(result.issueKey) < 0) {
        postSprintIssueList.push({
          issueKey: result.issueKey,
          storyPoints: result['latest.storyPoints'],
          issueType: result['latest.issueType'],
        })
        postSprintStoryCount += result['latest.storyPoints']
      }
    }

    if (sprintStartDate && sprintEndDate) {
      const releaseNRQL =
        "select latest(duedate) from JIRAEvent since 3 months ago limit max facet issueKey where issueKey is not null and issueType = 'Release' and projectName = '" +
        projectName +
        "'"
      let releaseQueryResults = await NrqlQuery.query({
        accountId: accountId,
        query: releaseNRQL,
      })
      const releaseResults =
        ((releaseQueryResults || {}).data || {}).chart || {}
      var dateSprintStartDate = new Date(sprintStartDate)
      var dateSprintEndDate = new Date(sprintEndDate)
      var roundsprintStartDate = new Date(
        dateSprintStartDate.getFullYear() +
        '-' +
        (dateSprintStartDate.getMonth() + 1) +
        '-' +
        dateSprintStartDate.getDate() +
        ' GMT+00:00'
      ).getTime()
      var roundsprintEndDate =
        new Date(
          dateSprintEndDate.getFullYear() +
          '-' +
          (dateSprintEndDate.getMonth() + 1) +
          '-' +
          dateSprintEndDate.getDate()
        ).getTime() + 86399000

      if (releaseResults && releaseResults.length > 0) {
        for (let result of releaseResults) {
          var releaseDate = new Date(result.data[0].duedate).getTime()

          if (
            releaseDate >= roundsprintStartDate &&
            releaseDate <= sprintEndDate
          ) {
            releaseCount++
            releaseList.push({
              issueKey: result.metadata.name,
            })
          }
        }
      }
    }

    const changeRateNRQL =
      "SELECT  filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') as 'InProgress', filter(earliest(timeOpen)/24,  where issueStatus in ('Complete','Done')) - filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') as 'Done', filter(earliest(timeOpen)/24, where issueStatus in ('Complete','Done')) as 'Total'  from JIRAEvent since 1 month ago limit max facet issueKey where issueKey in (" +
      inSprintIssueList
        .map(function (issue) {
          return "'" + issue.issueKey + "'"
        })
        .join(',') +
      ' )'
    let results4 = await NrqlQuery.query({
      accountId: accountId,
      query: changeRateNRQL,
    })

    var inProgressAverage = 0,
      inProgressCount = 0,
      doneAverage = 0,
      doneCount = 0,
      totalAverage = 0,
      totalCount = 0

    for (let result of results4.data.chart) {
      if (result.data[0].InProgress) {
        inProgressAverage += result.data[0].InProgress
        inProgressCount++
      }
      if (result.data[0].Done) {
        doneAverage += result.data[0].Done
        doneCount++
      }
      if (result.data[0].Total) {
        totalAverage += result.data[0].Total
        totalCount++
      }
    }

    cycleTimes = {
      inProgress: inProgressAverage / inProgressCount,
      done: doneAverage / doneCount,
      total: totalAverage / totalCount,
    }
    this.setState({
      sprintStartEstimated,
      releaseList,
      sprintStartDate,
      sprintEndDate,
      postSprintStoryCount,
      postSprintIssueList,
      inSprintStoryCount,
      inSprintIssueList,
      sprintStartStoryCount,
      sprintStartIssueList,
      releaseCount,
      cycleTimes,
    })
  }

  renderSprintDashboard() {
    const { projectName, accountId, sprintName, issueTypeSelected } = this.props
    const {
      issueModalOpen,
      releaseList,
      postSprintStoryCount,
      postSprintIssueList,
      inSprintStoryCount,
      sprintStartStoryCount,
      sprintStartIssueList,
      inSprintIssueList,
      cycleTimes,
      sprintStartEstimated,
    } = this.state

    const timestampFormatter = data => {
      if (!data) return 0
      else {
        const now = dayjs()
        const then = dayjs(data)

        if (then.isAfter(now)) return 0
        else return now.diff(then, 'day')
      }
    }

    // const roundToTwo = data => Math.round((data + Number.EPSILON) * 100) / 100
    return (
      <>
        <div className="issuetypes__container">
          <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
            {projectName}
          </Badge>
          <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
            {sprintName}
          </Badge>
          {issueTypeSelected.map(value => {
            return (
              <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
                {value}
              </Badge>
            )
          })}
        </div>

        <div className="card__group__container">
          <Card
            title="Sprint"
            subtitle="Days Ago"
            sections={[
              {
                accountId,
                label: 'Start',
                formatter: timestampFormatter,
                query: `From JIRAEvent select latest(sprintStartDate) limit 1 where sprintStartDate is not null since 1 month ago where sprintName = '${sprintName}'`,
              },
              {
                accountId,
                label: 'End',
                formatter: timestampFormatter,
                query: `From JIRAEvent select latest(sprintEndDate) limit 1 where sprintStartDate is not null since 1 month ago where sprintName = '${sprintName}'`,
              },
            ]}
          />
          <Card
            title="Story Points"
            subtitle="Before and During Sprint"
            sections={[
              {
                label: sprintStartEstimated ? 'Estimated' : 'At Start',
                value: sprintStartStoryCount ? sprintStartStoryCount : 0,
              },
              {
                label: 'Commited',
                value: inSprintStoryCount,
              },
              {
                label: 'Completed',
                value: postSprintStoryCount,
              },
            ]}
          />
          <Card
            title="Issues"
            subtitle="Before and During Sprint"
            sections={[
              {
                label: sprintStartEstimated ? 'Estimated' : 'At Start',
                value: sprintStartIssueList ? sprintStartIssueList.length : 0,
              },
              {
                label: 'Commited',
                value: inSprintIssueList ? inSprintIssueList.length : 0,
              },
              {
                label: 'Completed',
                value: postSprintIssueList ? postSprintIssueList.length : 0,
              },
            ]}
          />
          <Card
            title="Change Rates"
            subtitle="Average In Days"
            wide={true}
            sections={[
              {
                label: 'Created > In Progress',
                value: cycleTimes.inProgress
                  ? roundToTwo(cycleTimes.inProgress)
                  : 0,
                wide: true,
              },
              {
                label: 'In Progress > Done',
                value: cycleTimes.done ? roundToTwo(cycleTimes.done) : 0,
                wide: true,
              },
              {
                label: 'Created > Done',
                value: cycleTimes.total ? roundToTwo(cycleTimes.total) : 0,
                wide: true,
              },
            ]}
          />
        </div>
        <div className="chart__group__container">
          <Grid>
            <GridItem columnSpan={3}>
              <div className="chart__container">
                <div className="chart-header">
                  <div className="chart-title">
                    Issues committed before Sprint Start
                  </div>
                </div>

                <Table
                  items={sprintStartIssueList}
                  className="chart-content basic-table"
                  compact
                >
                  <TableHeader>
                    <TableHeaderCell value={({ item }) => item.issueKey}>
                      Issue Key
                    </TableHeaderCell>
                    <TableHeaderCell value={({ item }) => item.storyPoints}>
                      Story Points
                    </TableHeaderCell>
                  </TableHeader>
                  {({ item }) => (
                    <TableRow onClick={() => this.openModel(item.issueKey)}>
                      <TableRowCell>{item.issueKey}</TableRowCell>
                      <TableRowCell>{item.storyPoints}</TableRowCell>
                    </TableRow>
                  )}
                </Table>
              </div>
            </GridItem>
            <GridItem columnSpan={3}>
              <div className="chart__container">
                <div className="chart-header">
                  <div className="chart-title">
                    Issues that were in this Sprint
                  </div>
                </div>

                <Table
                  items={inSprintIssueList}
                  className="chart-content basic-table"
                  compact
                >
                  <TableHeader>
                    <TableHeaderCell value={({ item }) => item.issueKey}>
                      Issue Key
                    </TableHeaderCell>
                    <TableHeaderCell value={({ item }) => item.storyPoints}>
                      Story Points
                    </TableHeaderCell>
                  </TableHeader>
                  {({ item }) => (
                    <TableRow onClick={() => this.openModel(item.issueKey)}>
                      <TableRowCell>{item.issueKey}</TableRowCell>
                      <TableRowCell>{item.storyPoints}</TableRowCell>
                    </TableRow>
                  )}
                </Table>
              </div>
            </GridItem>
            <GridItem columnSpan={3}>
              <div className="chart__container">
                <div className="chart-header">
                  <div className="chart-title">Issues Completed</div>
                </div>

                <Table
                  items={postSprintIssueList}
                  className="chart-content basic-table"
                  compact
                >
                  <TableHeader>
                    <TableHeaderCell value={({ item }) => item.issueKey}>
                      Issue Key
                    </TableHeaderCell>
                    <TableHeaderCell value={({ item }) => item.storyPoints}>
                      Story Points
                    </TableHeaderCell>
                    <TableHeaderCell value={({ item }) => item.issueType}>
                      Issue Type
                    </TableHeaderCell>
                  </TableHeader>
                  {({ item }) => (
                    <TableRow onClick={() => this.openModel(item.issueKey)}>
                      <TableRowCell>{item.issueKey}</TableRowCell>
                      <TableRowCell>{item.storyPoints}</TableRowCell>
                      <TableRowCell>{item.issueType}</TableRowCell>
                    </TableRow>
                  )}
                </Table>
              </div>
            </GridItem>
            <GridItem columnSpan={3}>
              <div className="chart__container">
                <div className="chart-header">
                  <div className="chart-title">Release List</div>
                </div>

                <Table
                  items={releaseList}
                  className="chart-content basic-table"
                  compact
                >
                  <TableHeader>
                    <TableHeaderCell value={({ item }) => item.issueKey}>
                      Issue Key
                    </TableHeaderCell>
                  </TableHeader>
                  {({ item }) => (
                    <TableRow onClick={() => this.openModel(item.issueKey)}>
                      <TableRowCell>{item.issueKey}</TableRowCell>
                    </TableRow>
                  )}
                </Table>
              </div>
            </GridItem>
          </Grid>
        </div>

        {issueModalOpen && (
          <Modal
            isOpen={issueModalOpen}
            onRequestClose={this.closeModal}
            shouldCloseOnOverlayClick={true}
            contentLabel="Issue Details"
            overlayClassName="modal__overlay"
            style={{
              content: {
                position: 'absolute',
                overflow: 'initial',
                inset: '5rem 10rem',
                padding: '1rem',
                minHeight: '30rem',
              },
            }}
          >
            <button
              type="button"
              className="modal__close-button"
              onClick={this.closeModal}
            >
              <span className="modal__icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  focusable="false"
                  style={{ fill: 'white' }}
                >
                  <path d="M13.4 2.4l-.8-.8-5.1 5.2-5.1-5.2-.8.8 5.2 5.1-5.2 5.1.8.8 5.1-5.2 5.1 5.2.8-.8-5.2-5.1z" />
                </svg>
              </span>
            </button>
            {this.getModalContent()}
          </Modal>
        )}
      </>
    )
  }

  render() {
    return this.renderSprintDashboard()
  }
}
