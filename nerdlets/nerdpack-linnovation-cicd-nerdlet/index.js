import React from 'react'
import {
  NrqlQuery,
  NerdGraphQuery,
  Spinner,
  PlatformStateContext,
  nerdlet,
  Layout,
  LayoutItem,
  SegmentedControl,
  SegmentedControlItem,
  navigation,
  Button,
} from 'nr1'
import ProjectDropdown from './toolbar/project-dropdown'
import Navigation from './nav/navigation'
import Dashboard from './dashboards/dashboard-container'
import ConfigModal from './config-modal'
import { NerdstoreDefaults, readUserCollection } from './data/nerdstore'
const gqlQuery = require('./query')

export default class InnovationCICD extends React.Component {
  static contextType = PlatformStateContext

  constructor(props) {
    super(props)
    this.state = {
      globalTime: '90 days',
      loading: true,
      eventMissing: false,
      projectName: null,
      sprintName: null,
      projectList: null,
      sprintList: null,
      issueList: null,
      projectStoryPoints: null,
      currentIssue: 0,
      totalNumberOfIssues: 0,
      settingsOpen: false,
      sprintVelocityPoints: null,
      refinedStoryPointList: null,
      issueTypeSelected: [],
      codeRepoSelected: [],
      kanbanOnly: false,
    }
    this.handleProjectChange = this.handleProjectChange.bind(this)
    this.handleSprintChange = this.handleSprintChange.bind(this)
    this.handleSettingsChange = this.handleSettingsChange.bind(this)
    this.handleKanbanChange = this.handleKanbanChange.bind(this)
  }

  initState() {
    return {
      globalTime: '90 days',
      loading: true,
      eventMissing: false,
      projectName: null,
      sprintName: null,
      projectList: null,
      sprintList: null,
      issueList: null,
      projectStoryPoints: null,
      currentIssue: 0,
      totalNumberOfIssues: 0,
      settingsOpen: false,
      sprintVelocityPoints: null,
      refinedStoryPointList: null,
      issueTypeSelected: [],
      codeRepoSelected: [],
      kanbanOnly: false,
    }
  }

  async requiredEventTypesMissing() {
    // check if JIRAEvent and BitbucketEvent exist in the selected account
    let eventTypesList = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        this.state.accountId,
        'show eventTypes since 10 weeks ago'
      ),
    })
    eventTypesList =
      (
        ((((eventTypesList || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {}
    if (
      eventTypesList.length &&
      eventTypesList.find(e => e.eventType === 'JIRAEvent') &&
      eventTypesList.find(e => e.eventType === 'BitbucketEvent')
    ) {
      this.setState({ eventMissing: false })
      return false
    } else {
      this.setState({ eventMissing: true })
      return true
    }
  }

  setApplication(inProjectName, inSprintName) {
    this.setState({ projectName: inProjectName, sprintName: inSprintName })
  }

  componentDidMount() {
    nerdlet.setConfig({
      timePicker: false,
      accountPicker: true,
      accountPickerValues: [
        nerdlet.ACCOUNT_PICKER_VALUE.CROSS_ACCOUNT,
        ...nerdlet.ACCOUNT_PICKER_DEFAULT_VALUES,
      ],
    })
    this.setState({ accountId: this.context.accountId }, async () => {
      await this.fetchNewRelicData()
    })
  }

  componentDidUpdate() {
    if (this.context.accountId !== this.state.accountId) {
      this.setState(
        {
          accountId: this.context.accountId,
          ...this.initState(),
        },
        async () => {
          await this.fetchNewRelicData()
        }
      )
    }
  }

  getProjectList = async query => {
    const projectList = []

    const { data } = await NrqlQuery.query({
      accountId: this.state.accountId,
      query,
    })

    data.forEach(result => {
      const name = result.metadata.name
      if (name !== 'Daylight Saving Time') {
        projectList.push({
          name,
          sprints: result.data[0].sprintName,
        })
      }
    })

    return projectList
  }

  async fetchNewRelicData() {
    let eventTypeMissingFlag = await this.requiredEventTypesMissing()
    if (!eventTypeMissingFlag) {
      const projectNRQL = `SELECT uniqueCount(sprintName) FROM JIRAEvent where projectName NOT LIKE '%Kanban%' FACET projectName SINCE 10 weeks ago limit MAX`
      const kanbanNRQL = `SELECT uniqueCount(sprintName) FROM JIRAEvent since 3 months ago limit MAX where projectName LIKE '%Kanban%' facet projectName`

      let projectList = []

      if (this.state.kanbanOnly) {
        projectList = await this.getProjectList(kanbanNRQL)
      } else {
        projectList = await this.getProjectList(projectNRQL)
      }

      projectList.sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB)
          //sort string ascending
          return -1
        if (nameA > nameB) return 1
        return 0 //default return value (no sorting)
      })

      this.setState({ projectList, loading: false })
    }
  }

  async fetchIssueData() {
    const { projectName, issueTypeSelected } = this.state
    var sprintList = []

    let sprintListResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        this.state.accountId,
        gqlQuery.sprintList(projectName)
      ),
    })
    sprintListResults =
      (
        ((((sprintListResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {}

    sprintListResults.forEach(function(result) {
      sprintList.push({ name: result.sprintName })
    })

    var reA = /[^a-zA-Z]/g
    var reN = /[^0-9]/g

    function sortAlphaNum(a, b) {
      var aA = a['name'].replace(reA, '')
      var bA = b['name'].replace(reA, '')
      if (aA === bA) {
        var aN = parseInt(a['name'].replace(reN, ''), 10)
        var bN = parseInt(b['name'].replace(reN, ''), 10)
        return aN === bN ? 0 : aN > bN ? 1 : -1
      } else {
        return aA > bA ? 1 : -1
      }
    }
    sprintList.sort(sortAlphaNum)
    sprintList = sprintList.reverse()

    this.setState({ sprintList })
  }

  handleProjectChange(value) {
    this.setState({ loading: true, sprintName: null, projectName: value })

    if (value == 'All') {
      this.setState({
        projectName: null,
        loading: false,
      })
    } else {
      this.setState(
        {
          projectName: value,
          sprintName: 'All',
        },
        async () => {
          await this.fetchMappingStorage(value)
          await this.fetchIssueData()
          this.setState({
            loading: false,
          })
        }
      )
    }
  }

  async fetchMappingStorage(value) {
    const mappingStorage = await readUserCollection(
      NerdstoreDefaults.CONFIG_COLLECTION_NAME,
      value
    )

    this.setState({
      codeRepoSelected:
        mappingStorage && mappingStorage.codeRepoSelected
          ? mappingStorage.codeRepoSelected
          : [],
      issueTypeSelected:
        mappingStorage && mappingStorage.issueTypeSelected
          ? mappingStorage.issueTypeSelected
          : ['Story', 'Task'],
      workloadSelected:
        mappingStorage && mappingStorage.guid ? mappingStorage.guid : null,
    })
  }

  handleSettingsChange(issueTypeSelected, codeRepoSelected, workloadSelected) {
    this.setState(
      {
        loading: true,
        sprintName: 'All',
      },
      () => {
        issueTypeSelected = issueTypeSelected ? issueTypeSelected : []
        codeRepoSelected = codeRepoSelected ? codeRepoSelected : []
        workloadSelected = workloadSelected && workloadSelected
        this.setState(
          {
            issueTypeSelected,
            codeRepoSelected,
            workloadSelected,
          },
          async () => {
            await this.fetchIssueData()
            this.setState({
              loading: false,
            })
          }
        )
      }
    )
  }

  handleKanbanChange(event) {
    this.setState(
      {
        kanbanOnly: !this.state.kanbanOnly,
        loading: true,
        sprintName: null,
        projectName: null,
      },
      async () => {
        await this.fetchNewRelicData()
      }
    )
  }

  handleSprintChange(value) {
    const { projectName, sprintName } = this.state

    if (value == 'All') {
      this.setState({
        sprintName: 'All',
      })
    } else {
      this.setState({
        sprintName: value,
      })
    }
  }

  render() {
    const {
      accountId,
      projectName,
      sprintName,
      projectList,
      sprintList,
      eventMissing,
      loading,
      issueTypeSelected,
      codeRepoSelected,
      workloadSelected,
      kanbanOnly,
    } = this.state

    return (
      <>
        <Layout style={{ marginBottom: '0px' }}>
          <LayoutItem className="toolbar__container">
            <div className="toolbar__section">
              <div className="toolbar__item">
                <SegmentedControl
                  className="toolbar__item-element"
                  onChange={this.handleKanbanChange}
                  value={kanbanOnly ? 'kanban' : 'scrum'}
                >
                  <SegmentedControlItem value="scrum" label="Scrum" />
                  <SegmentedControlItem value="kanban" label="Kanban" />
                </SegmentedControl>
              </div>
              {projectList ? (
                <ProjectDropdown
                  selectedProject={projectName}
                  loadedProjects={projectList}
                  filterChange={this.handleProjectChange}
                />
              ) : (
                <Spinner />
              )}
            </div>
            <div className="toolbar__section">
              <div className="toolbar__item">
                {projectName && projectName != 'All' && (
                  <div className="button__row">
                    <Button
                      onClick={() =>
                        navigation.openStackedEntity(workloadSelected)
                      }
                      type={Button.TYPE.PRIMARY}
                      iconType={
                        Button.ICON_TYPE
                          .HARDWARE_AND_SOFTWARE__SOFTWARE__LIVE_VIEW
                      }
                      disabled={!workloadSelected}
                    >
                      View Workload
                    </Button>
                    <ConfigModal
                      projectName={projectName}
                      loading={loading}
                      accountId={accountId}
                      settingsChange={this.handleSettingsChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </LayoutItem>
        </Layout>
        <Layout fullHeight>
          {projectName && (
            <LayoutItem
              type={LayoutItem.TYPE.SPLIT_LEFT}
              sizeType={LayoutItem.SIZE_TYPE.SMALL}
              className="navigation__container"
            >
              <Navigation
                projectName={projectName}
                loadedSprints={sprintList}
                sprintName={sprintName}
                onChange={this.handleSprintChange}
              />
            </LayoutItem>
          )}
          <LayoutItem className="dashboard__container">
            {eventMissing ? (
              <center>
                <h3>
                  No "JIRAEvent" and/or "BitbucketEvent" Types found in this
                  account
                </h3>
                <h4>Please select an account with required event types</h4>
              </center>
            ) : loading ? (
              <>
                <Spinner /> <br />
                <center>
                  {'Loading Types: ' + issueTypeSelected.toString()}
                </center>
              </>
            ) : (
              <Dashboard
                projectName={projectName}
                accountId={accountId}
                kanbanOnly={kanbanOnly}
                sprintName={sprintName}
                issueTypeSelected={issueTypeSelected}
                codeRepoSelected={codeRepoSelected}
              />
            )}
          </LayoutItem>
        </Layout>
      </>
    )
  }
}
