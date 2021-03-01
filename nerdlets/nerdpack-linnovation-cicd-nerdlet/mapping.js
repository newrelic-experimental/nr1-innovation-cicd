import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Dropdown,Modal,Grid,Divider } from 'semantic-ui-react';
import { Stack, StackItem, Spinner, Button, navigation, NerdGraphQuery, UserStorageQuery, UserStorageMutation,NrqlQuery } from 'nr1';
const gqlQuery = require('./query');

export default class Mapping extends React.Component {

  static propTypes = {
    projectName: PropTypes.string,
    loading: PropTypes.bool,
    accountId: PropTypes.number,
    settingsChange: PropTypes.func,
  }

  constructor(props){
    super(props);
    this.state = {
      mappingOpen: false,
      workloadOptions: null,
      projectSelected: null,
      tempProjectSelected: null,
      issueTypeSelected: null,
      tempIssueTypeSelected: null,
      codeRepoSelected: null,
      tempCodeRepoSelected: null,
      codeRepoOptions: null,
      issueTypeOptions: [{key: "Story", text: "Story", value: "Story"}, {key: "Task", text: "Task", value: "Task"}]
    };
    this._closeSettings = this._closeSettings.bind(this);
    this._openSettings = this._openSettings.bind(this);
    this._saveSettings = this._saveSettings.bind(this);
  }
    _openSettings () {

      const {projectSelected, codeRepoSelected, issueTypeSelected} = this.state;
      this.setState({tempProjectSelected: projectSelected, tempCodeRepoSelected: codeRepoSelected, tempIssueTypeSelected: issueTypeSelected});
      this.setState({ mappingOpen: true });

    }

     _closeSettings () {

      this.setState({ mappingOpen: false });

    }

    _saveSettings () {

      this.setState({ mappingOpen: false });
      var {tempCodeRepoSelected, tempProjectSelected, tempIssueTypeSelected} = this.state;

      this.setState({
        issueTypeSelected: tempIssueTypeSelected,
        tempIssueTypeSelected: null,
        codeRepoSelected: tempCodeRepoSelected,
        tempCodeRepoSelected: null,
        projectSelected: tempProjectSelected,
        tempProjectSelected: null
      });
      this.props.settingsChange(tempIssueTypeSelected, tempCodeRepoSelected);
      UserStorageMutation.mutate({
        accountId: this.props.accountId,
        actionType: UserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
        collection: 'InnovationCICD',
        documentId: tempProjectSelected.name,
        document: {
          name: tempProjectSelected.workloadName,
          guid: tempProjectSelected.guid,
          issueTypeSelected: tempIssueTypeSelected,
          codeRepoSelected: tempCodeRepoSelected
        },
      }); 

    }

    _saveTempSettings(e, value) {

      const {workloadOptions, projectSelected} = this.state;

      if(e == "IssueType") {
        if(value.indexOf("Story") < 0) {
          value.push("Story");
        }
        if(value.indexOf("Task") < 0) {
          value.push("Task");
        }
        this.setState({tempIssueTypeSelected: value});
      }
      if(e == "CodeRepo") {
        this.setState({tempCodeRepoSelected: value});
      }
      if(e == "Workload") {
        var tempProjectSelected = {};
        var tempworkloadSelected = (_.filter(workloadOptions, x => x.value === value))[0];
        tempProjectSelected.guid = value;
        tempProjectSelected.workloadName = (tempworkloadSelected && tempworkloadSelected.name ? tempworkloadSelected.name : null);
        tempProjectSelected.name = projectSelected.name;
        this.setState({tempProjectSelected});
      }

    }

    async componentDidMount(){
      await this.fetchMappingStorage();
      this.fetchWorkloads();
      this.fetchCodeRepo();
      this.fetchIssueTypes();
      const { projectName, loading } = this.props;
    }

    async fetchCodeRepo() {
      const {projectName, accountId} = this.props;
      let codeRepoResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.codeRepos())});
      codeRepoResults = (((((codeRepoResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};

      const codeRepoOptions = _.map(codeRepoResults, (d, index) => ({
        key: codeRepoResults[index].facet[1] + "." + codeRepoResults[index].facet[0],
        text: codeRepoResults[index].facet[1] + "." + codeRepoResults[index].facet[0],
        value: codeRepoResults[index].facet[1] + "." + codeRepoResults[index].facet[0]
      }));

      this.setState({codeRepoOptions});

    }

    async fetchIssueTypes(){
      const {projectName, accountId} = this.props;
      const issueTypeNRQL = "SELECT count(issueKey) FROM JIRAEvent since 3 months ago facet issueType limit MAX";
      let results = await NrqlQuery.query({accountId: accountId,query: issueTypeNRQL});
      const issueTypeResults = ((results || {}).data || {}).chart || {};
      const issueTypeOptions = _.map(issueTypeResults, (d, index) => ({
        key: issueTypeResults[index].metadata.name,
        text: issueTypeResults[index].metadata.name,
        value: issueTypeResults[index].metadata.name
      }));
      this.setState({issueTypeOptions});
    }

    async fetchMappingStorage(){
        const {projectName, accountId} = this.props;
        let mappingStorage = (await UserStorageQuery.query({
          accountId: accountId,
          collection: 'InnovationCICD',
          documentId: projectName,
        })).data;
        if(mappingStorage) {
          this.setState({
            projectSelected: {name: projectName, workloadName: mappingStorage.name, guid: mappingStorage.guid },
            codeRepoSelected: mappingStorage.codeRepoSelected ? mappingStorage.codeRepoSelected : null,
            issueTypeSelected: mappingStorage.issueTypeSelected ? mappingStorage.issueTypeSelected : ["Story","Task"]
          });
        } else{
          this.setState({projectSelected: {name: projectName, workloadName: null, guid: null}});
        }
    }

    async fetchWorkloads(){
      let results = await NerdGraphQuery.query({query: gqlQuery.getWorkloads()});    
      const workloadResults = (((((results || {}).data || {}).actor || {}).entitySearch || {}).results || {}).entities || {};
      const workloadOptions = _.map(workloadResults, (workload, index) => ({
        key: workloadResults[index].name,
        text: workloadResults[index].name,
        value: workloadResults[index].guid,
      }));
      this.setState({workloadOptions});

    }

  renderMapping(){
    const { projectName, loading } = this.props;
    const {workloadOptions, projectSelected, codeRepoSelected,issueTypeSelected, codeRepoOptions, issueTypeOptions} = this.state;

    return (
      <>
      <Stack horizontalType={Stack.HORIZONTAL_TYPE.RIGHT} verticalType={Stack.VERTICAL_TYPE.CENTER} gapType={Stack.GAP_TYPE.SMALL} fullWidth>
              <StackItem >
                <Button
                    onClick={() => navigation.openStackedEntity(projectSelected.guid)}
                    type={Button.TYPE.PRIMARY}
                    iconType={Button.ICON_TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__LIVE_VIEW}
                    disabled={ !(projectSelected && projectSelected.guid) }
                >
                    View Workload
                </Button>
             </StackItem >
            <StackItem >
              <Button
                  onClick={() => this._openSettings()}
                  type={Button.TYPE.PRIMARY}
                  iconType={Button.ICON_TYPE.DATAVIZ__DATAVIZ__CHART__A_EDIT}
                  disabled = {loading}
              >
                  
              </Button>
            </StackItem >
        </Stack>
        <Modal size='small' open={this.state.mappingOpen} onClose={this._closeSettings} closeIcon = {false}>
            <Modal.Header>Map {projectName}</Modal.Header>
            <Modal.Content>
              <Grid divided='vertically'>
                  <Grid.Row columns={2}>
                    <Grid.Column>
                     Configure Workload Associated with this project:
                    </Grid.Column>
                    <Grid.Column>
                      <Dropdown clearable search selection defaultValue={projectSelected ? projectSelected.guid : ""} options={workloadOptions} loading={loading} disabled={loading} onChange={(ent, value) => this._saveTempSettings("Workload", value.value)}/>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row columns={2}>
                    <Grid.Column>
                     Configure Code Respository Associated with this project:
                    </Grid.Column>
                    <Grid.Column>
                      <Dropdown clearable search fluid multiple selection defaultValue={codeRepoSelected ? codeRepoSelected : ""} options={codeRepoOptions} loading={loading} disabled={loading} onChange={(ent, value) => this._saveTempSettings("CodeRepo", value.value)}/>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row columns={2}>
                    <Grid.Column>
                     Issue Types to Include:
                    </Grid.Column>
                    <Grid.Column>
                      <Dropdown clearable search fluid multiple selection defaultValue={issueTypeSelected} options={issueTypeOptions} loading={loading} disabled={loading} onChange={(ent, value) => this._saveTempSettings("IssueType", value.value)} />
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
            </Modal.Content>
            <Modal.Content>

            <p align='left'><Button type={Button.TYPE.PRIMARY} onClick={() => this._closeSettings()}>Cancel</Button></p><p> <Button type={Button.TYPE.PRIMARY} onClick={() => this._saveSettings()}>Save</Button> </p>
            </Modal.Content>
      </Modal>
      </>
      )
}

  render() {
    return (
      this.renderMapping()
    )
  }

}
