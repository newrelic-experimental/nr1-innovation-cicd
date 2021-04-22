import React from 'react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  NrqlQuery,
  NerdGraphQuery,
  Spinner,
  HeadingText,
  PlatformStateContext,
  nerdlet,
  UserStorageQuery,
  Checkbox,
  Layout,
  LayoutItem,
} from 'nr1';
import ProjectDropdown from './toolbar/project-dropdown';
import SprintList from './sprint-list';
import Dashboard from './dashboard';
import Mapping from './mapping';
const gqlQuery = require('./query');

export default class InnovationCICD extends React.Component {
  static contextType = PlatformStateContext;

  constructor(props) {
    super(props);
    this.state = {
      accountId: 1382490,
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
    };
    this.handleProjectChange = this.handleProjectChange.bind(this);
    this.handleSprintChange = this.handleSprintChange.bind(this);
    this.handleSettingsChange = this.handleSettingsChange.bind(this);
    this.handleKanbanChange = this.handleKanbanChange.bind(this);
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
    };
  }

  async requiredEventTypesMissing() {
    // check if JIRAEvent and BitbucketEvent exist in the selected account
    let eventTypesList = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(this.state.accountId, 'show eventTypes since 10 weeks ago'),
    });
    eventTypesList =
      (
        ((((eventTypesList || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {};
    if (
      eventTypesList.length &&
      eventTypesList.find(e => e.eventType === 'JIRAEvent') &&
      eventTypesList.find(e => e.eventType === 'BitbucketEvent')
    ) {
      this.setState({ eventMissing: false });
      return false;
    } else {
      this.setState({ eventMissing: true });
      return true;
    }
  }

  setApplication(inProjectName, inSprintName) {
    this.setState({ projectName: inProjectName, sprintName: inSprintName });
  }

  componentDidMount() {
    nerdlet.setConfig({
      timePicker: false,
      accountPicker: true,
      accountPickerValues: [
        nerdlet.ACCOUNT_PICKER_VALUE.CROSS_ACCOUNT,
        ...nerdlet.ACCOUNT_PICKER_DEFAULT_VALUES,
      ],
    });
    this.setState({ accountId: this.context.accountId }, async () => {
      await this.fetchNewRelicData();
    });
  }

  componentDidUpdate() {
    if (this.context.accountId !== this.state.accountId) {
      this.setState(
        {
          accountId: this.context.accountId,
          ...this.initState(),
        },
        async () => {
          await this.fetchNewRelicData();
        }
      );
    }
  }

  async fetchNewRelicData() {
    let eventTypeMissingFlag = await this.requiredEventTypesMissing();
    if (!eventTypeMissingFlag) {
      const projectNRQL = `SELECT uniqueCount(sprintName) FROM JIRAEvent where projectName NOT LIKE '%Kanban%' FACET projectName SINCE 10 weeks ago limit MAX`;
      const kanbanNRQL = `SELECT uniqueCount(sprintName) FROM JIRAEvent since 3 months ago limit MAX where projectName LIKE '%Kanban%' facet projectName`;

      var projectList = [];

      if (this.state.kanbanOnly) {
        let results = await NrqlQuery.query({
          accountId: this.state.accountId,
          query: kanbanNRQL,
        });
        results.data.chart.forEach(function (result) {
          projectList.push({
            name: result.metadata.name,
            sprints: result.data[0].sprintName,
          });
        });
      } else {
        let results = await NrqlQuery.query({
          accountId: this.state.accountId,
          query: projectNRQL,
        });
        results.data.chart.forEach(function (result) {
          projectList.push({
            name: result.metadata.name,
            sprints: result.data[0].sprintName,
          });
        });
      }

      projectList.sort(function (a, b) {
        var nameA = a.name.toLowerCase(),
          nameB = b.name.toLowerCase();
        if (nameA < nameB)
          //sort string ascending
          return -1;
        if (nameA > nameB) return 1;
        return 0; //default return value (no sorting)
      });

      this.setState({ projectList, loading: false });
    }
  }

  async fetchIssueData() {
    const { projectName, issueTypeSelected } = this.state;
    var sprintList = [];

    let sprintListResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(
        this.state.accountId,
        gqlQuery.sprintList(projectName)
      ),
    });
    sprintListResults =
      (
        ((((sprintListResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {};

    sprintListResults.forEach(function (result) {
      sprintList.push({ name: result.sprintName });
    });

    var reA = /[^a-zA-Z]/g;
    var reN = /[^0-9]/g;

    function sortAlphaNum(a, b) {
      var aA = a['name'].replace(reA, '');
      var bA = b['name'].replace(reA, '');
      if (aA === bA) {
        var aN = parseInt(a['name'].replace(reN, ''), 10);
        var bN = parseInt(b['name'].replace(reN, ''), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
      } else {
        return aA > bA ? 1 : -1;
      }
    }
    sprintList.sort(sortAlphaNum);
    sprintList = sprintList.reverse();

    this.setState({ sprintList });
  }

  handleProjectChange(value) {
    const { projectName, sprintName } = this.state;
    this.setState({ loading: true, sprintName: null, projectName: value });

    if (value == 'All') {
      this.setState({
        projectName: null,
        loading: false,
      });
    } else {
      this.setState(
        {
          projectName: value,
          sprintName: 'All',
        },
        async () => {
          await this.fetchMappingStorage(value);
          await this.fetchIssueData();
          this.setState({
            loading: false,
          });
        }
      );
    }
  }

  async fetchMappingStorage(value) {
    let mappingStorage = (
      await UserStorageQuery.query({
        accountId: this.state.accountId,
        collection: 'InnovationCICD',
        documentId: value,
      })
    ).data;
    this.setState({
      codeRepoSelected:
        mappingStorage && mappingStorage.codeRepoSelected
          ? mappingStorage.codeRepoSelected
          : [],
      issueTypeSelected:
        mappingStorage && mappingStorage.issueTypeSelected
          ? mappingStorage.issueTypeSelected
          : ['Story', 'Task'],
    });
  }

  handleSettingsChange(issueTypeSelected, codeRepoSelected) {
    this.setState(
      {
        loading: true,
        sprintName: 'All',
      },
      () => {
        issueTypeSelected = issueTypeSelected ? issueTypeSelected : [];
        codeRepoSelected = codeRepoSelected ? codeRepoSelected : [];
        this.setState(
          {
            issueTypeSelected,
            codeRepoSelected,
          },
          async () => {
            await this.fetchIssueData();
            this.setState({
              loading: false,
            });
          }
        );
      }
    );
  }

  handleKanbanChange(event) {
    this.setState(
      {
        kanbanOnly: !this.state.kanbanOnly,
        sprintName: null,
        projectName: null,
      },
      async () => {
        await this.fetchNewRelicData();
      }
    );
  }

  async handleSprintChange(ent, value) {
    const { projectName, sprintName } = this.state;

    if (value == 'All') {
      this.setState({
        sprintName: 'All',
      });
    } else {
      this.setState({
        sprintName: value,
      });
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
      kanbanOnly,
    } = this.state;

    return (
      <Layout fullHeight>
        <LayoutItem>
          <div className="toolbar__container">
            <div className="toolbar__section">
              {projectList ? (
                <ProjectDropdown
                  selectedProject={projectName}
                  loadedProjects={projectList}
                  filterChange={this.handleProjectChange}
                />
              ) : (
                <Spinner />
              )}
              <div className="toolbar__item">
                <Checkbox
                  className="toolbar__item-element"
                  checked={kanbanOnly}
                  onChange={this.handleKanbanChange}
                  label="Kanban Only"
                />
              </div>
            </div>
            <div className="toolbar__section">
              <div className="toolbar__item">
                {projectName && projectName != 'All' ? (
                  <Mapping
                    projectName={projectName}
                    loading={loading}
                    accountId={accountId}
                    settingsChange={(issueTypeSelected, codeRepoSelected) =>
                      this.handleSettingsChange(issueTypeSelected, codeRepoSelected)
                    }
                  />
                ) : (
                  <></>
                )}
              </div>
            </div>

          </div>
          {/* <Stack
          className="toolbar-container"
          fullWidth
          gapType={Stack.GAP_TYPE.NONE}
          horizontalType={Stack.HORIZONTAL_TYPE.FILL}
          verticalType={Stack.VERTICAL_TYPE.CENTER}
        >
          <StackItem className="toolbar-section1">
            <Stack
              gapType={Stack.GAP_TYPE.LARGE}
              fullWidth
              verticalType={Stack.VERTICAL_TYPE.FILL}
            >
              <StackItem className="toolbar-item has-separator">
                {projectList ? (
                  <ProjectDropdown
                    selectedProject={projectName}
                    loadedProjects={projectList}
                    filterChange={this.handleProjectChange}
                  />
                ) : (
                  <Spinner />
                )}
              </StackItem>
              <StackItem className="toolbar-item has-separator">
                <Radio
                  label="Kanban Only (BETA)"
                  checked={kanbanOnly}
                  onClick={this.handleKanbanChange}
                />
              </StackItem>
            </Stack>
          </StackItem>
          <Stack
            fullWidth
            fullHeight
            verticalType={Stack.VERTICAL_TYPE.CENTER}
            horizontalType={Stack.HORIZONTAL_TYPE.CENTER}
          >
            <StackItem className="toolbar-section2">
              <Stack
                fullWidth
                fullHeight
                verticalType={Stack.VERTICAL_TYPE.CENTER}
                horizontalType={Stack.HORIZONTAL_TYPE.CENTER}
              >
                <StackItem className="toolbar-item has-separator">
                  <HeadingText type={HeadingText.TYPE.HEADING_3}>
                    {projectName ? projectName : 'All'}
                  </HeadingText>
                </StackItem>
                <StackItem>
                  <HeadingText type={HeadingText.TYPE.HEADING_3}>
                    {sprintName ? sprintName : ''}
                  </HeadingText>
                </StackItem>
              </Stack>
            </StackItem>
          </Stack>
          {projectName && projectName != 'All' ? (
            <Mapping
              projectName={projectName}
              loading={loading}
              accountId={accountId}
              settingsChange={(issueTypeSelected, codeRepoSelected) =>
                this.handleSettingsChange(issueTypeSelected, codeRepoSelected)
              }
            />
          ) : (
            <></>
          )}
        </Stack> */}

          <Grid
            className="primary-grid"
            spacingType={[Grid.SPACING_TYPE.NONE, Grid.SPACING_TYPE.NONE]}
          >
            <GridItem className="sidebar-container" columnSpan={2}>
              {projectName && sprintName && !kanbanOnly ? (
                <SprintList
                  projectName={projectName}
                  loadedSprints={sprintList}
                  sprintName={sprintName}
                  filterChange={(ent, value) =>
                    this.handleSprintChange(ent, value)
                  }
                />
              ) : (
                <HeadingText type={HeadingText.TYPE.HEADING_4}>
                  <center></center>
                </HeadingText>
              )}
            </GridItem>

            <GridItem className="primary-content-container" columnSpan={10}>
              <main className="primary-content full-height">
                {eventMissing ? (
                  <center>
                    <h3>No "JIRAEvent" and/or "BitbucketEvent" Types found in this account</h3>
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
              </main>
            </GridItem>
          </Grid>
        </LayoutItem>
      </Layout>
    );
  }
}
