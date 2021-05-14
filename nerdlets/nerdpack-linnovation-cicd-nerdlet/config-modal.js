import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  Stack,
  StackItem,
  Button,
  navigation,
  NerdGraphQuery,
  NrqlQuery,
  Modal,
  Spinner,
  HeadingText,
  Select,
  SelectItem,
} from 'nr1'
import MultiSelect from './multi-select/multi-select'
import {
  NerdstoreDefaults,
  readUserCollection,
  writeUserDocument,
} from './data/nerdstore'
const gqlQuery = require('./query')

export default class ConfigModal extends React.Component {
  static propTypes = {
    projectName: PropTypes.string,
    loading: PropTypes.bool,
    accountId: PropTypes.number,
    settingsChange: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {
      modalLoading: true,
      modalHidden: true,
      workloadOptions: null,
      projectSelected: null,
      tempProjectSelected: null,
      issueTypeSelected: [],
      tempIssueTypeSelected: [],
      codeRepoSelected: [],
      tempCodeRepoSelected: [],
      codeRepoOptions: null,
      issueTypeOptions: [
        { key: 'Story', text: 'Story', value: 'Story' },
        { key: 'Task', text: 'Task', value: 'Task' },
      ],
    }
    this._closeSettings = this._closeSettings.bind(this)
    this._openSettings = this._openSettings.bind(this)
    this._saveSettings = this._saveSettings.bind(this)
  }

  async _openSettings() {
    this.setState({ modalLoading: true, modalHidden: false })

    await Promise.all([
      this.fetchSavedConfig(),
      this.fetchWorkloads(),
      this.fetchCodeRepo(),
      this.fetchIssueTypes(),
    ])

    const { projectSelected, codeRepoSelected, issueTypeSelected } = this.state

    this.setState({
      tempProjectSelected: projectSelected,
      tempCodeRepoSelected: codeRepoSelected,
      tempIssueTypeSelected: issueTypeSelected,
      modalLoading: false,
    })
  }

  _closeSettings() {
    this.setState({
      modalHidden: true,
      tempProjectSelected: null,
      tempCodeRepoSelected: [],
      tempIssueTypeSelected: [],
      codeRepoSelected: [],
      issueTypeSelected: [],
      projectSelected: {},
    })
  }

  async _saveSettings() {
    const {
      tempCodeRepoSelected,
      tempProjectSelected,
      tempIssueTypeSelected,
    } = this.state

    try {
      await writeUserDocument(
        NerdstoreDefaults.CONFIG_COLLECTION_NAME,
        tempProjectSelected.name,
        {
          name: tempProjectSelected.workloadName,
          guid: tempProjectSelected.guid,
          issueTypeSelected: tempIssueTypeSelected,
          codeRepoSelected: tempCodeRepoSelected,
        }
      )
      this.setState({ modalHidden: true }, () =>
        this.props.settingsChange(
          tempIssueTypeSelected,
          tempCodeRepoSelected,
          tempProjectSelected.guid
        )
      )
    } catch (error) {
      console.error('error saving project configuration', error)
      this.setState({ modalHidden: true })
    }
  }

  _saveTempSettings(e, value) {
    const { workloadOptions, projectSelected } = this.state

    if (e == 'IssueType') {
      let clonedIssues = [...this.state.tempIssueTypeSelected]
      if (!clonedIssues) clonedIssues = [value]
      else {
        let found = false
        clonedIssues = clonedIssues.filter(r => {
          if (r === value) {
            found = true
            return false // we want to remove matching values
          } else return true
        })
        if (!found) clonedIssues.push(value)
      }
      if (clonedIssues.indexOf('Story') < 0) {
        clonedIssues.unshift('Story')
      }
      if (clonedIssues.indexOf('Task') < 0) {
        clonedIssues.unshift('Task')
      }

      this.setState({ tempIssueTypeSelected: clonedIssues })
    }
    if (e == 'CodeRepo') {
      let clonedRepos = [...this.state.tempCodeRepoSelected]
      if (!clonedRepos) clonedRepos = [value]
      else {
        let found = false
        clonedRepos = clonedRepos.filter(r => {
          if (r === value) {
            found = true
            return false // we want to remove matching values
          } else return true
        })
        if (!found) clonedRepos.push(value)
      }
      this.setState({ tempCodeRepoSelected: clonedRepos })
    }
    if (e == 'Workload') {
      var tempProjectSelected = {}
      var tempworkloadSelected = _.filter(
        workloadOptions,
        x => x.value === value
      )[0]
      tempProjectSelected.guid = value
      tempProjectSelected.workloadName =
        tempworkloadSelected && tempworkloadSelected.name
          ? tempworkloadSelected.name
          : null
      tempProjectSelected.name = projectSelected.name
      this.setState({ tempProjectSelected })
    }
  }

  async fetchCodeRepo() {
    const { projectName, accountId } = this.props
    let codeRepoResults = await NerdGraphQuery.query({
      query: gqlQuery.runQuery(accountId, gqlQuery.codeRepos()),
    })
    codeRepoResults =
      (
        ((((codeRepoResults || {}).data || {}).actor || {}).account || {})
          .nrql || {}
      ).results || {}

    const codeRepoOptions = _.map(codeRepoResults, (d, index) => ({
      key:
        codeRepoResults[index].facet[1] + '.' + codeRepoResults[index].facet[0],
      text:
        codeRepoResults[index].facet[1] + '.' + codeRepoResults[index].facet[0],
      value:
        codeRepoResults[index].facet[1] + '.' + codeRepoResults[index].facet[0],
    }))

    this.setState({ codeRepoOptions })
  }

  updateCodeRepos = repo => this._saveTempSettings('CodeRepo', repo)

  async fetchIssueTypes() {
    const { accountId } = this.props
    const issueTypeNRQL =
      'SELECT count(issueKey) FROM JIRAEvent since 3 months ago facet issueType limit MAX'
    let { data } = await NrqlQuery.query({
      accountId: accountId,
      query: issueTypeNRQL,
    })

    if (data) {
      const issueTypeOptions = data.reduce((acc, d) => {
        if (d.metadata.name !== 'Daylight Saving Time') {
          acc.push({
            key: d.metadata.name,
            text: d.metadata.name,
            value: d.metadata.name,
          })
        }
        return acc
      }, [])
      this.setState({ issueTypeOptions })
    }
  }

  updateIssueTypes = issue => this._saveTempSettings('IssueType', issue)

  async fetchSavedConfig() {
    const { projectName, accountId } = this.props
    const mappingStorage = await readUserCollection(
      NerdstoreDefaults.CONFIG_COLLECTION_NAME,
      projectName
    )

    if (mappingStorage) {
      this.setState({
        projectSelected: {
          name: projectName,
          workloadName: mappingStorage.name,
          guid: mappingStorage.guid,
        },
        codeRepoSelected: mappingStorage.codeRepoSelected
          ? mappingStorage.codeRepoSelected
          : null,
        issueTypeSelected: mappingStorage.issueTypeSelected
          ? mappingStorage.issueTypeSelected
          : ['Story', 'Task'],
      })
    } else {
      this.setState({
        projectSelected: { name: projectName, workloadName: null, guid: null },
        issueTypeSelected: ['Story', 'Task'],
      })
    }
  }

  async fetchWorkloads() {
    let results = await NerdGraphQuery.query({
      query: gqlQuery.getWorkloads(),
    })
    const workloadResults =
      (
        ((((results || {}).data || {}).actor || {}).entitySearch || {})
          .results || {}
      ).entities || {}
    const workloadOptions = _.map(workloadResults, (workload, index) => ({
      key: workloadResults[index].name,
      text: workloadResults[index].name,
      value: workloadResults[index].guid,
    }))
    this.setState({ workloadOptions })
  }

  updateWorkload = workload => this._saveTempSettings('Workload', workload)

  render() {
    const { projectName, loading } = this.props
    const {
      workloadOptions,
      projectSelected,
      tempProjectSelected,
      codeRepoSelected,
      tempCodeRepoSelected,
      tempIssueTypeSelected,
      issueTypeSelected,
      codeRepoOptions,
      issueTypeOptions,
      modalLoading,
      modalHidden,
    } = this.state

    return (
      <>
        <Button
          onClick={() => this._openSettings()}
          type={Button.TYPE.PRIMARY}
          iconType={Button.ICON_TYPE.DATAVIZ__DATAVIZ__CHART__A_EDIT}
          disabled={loading}
        ></Button>

        {!modalHidden && (
          <Modal hidden={modalHidden} onClose={this._closeSettings}>
            <HeadingText type={HeadingText.TYPE.HEADING_2}>
              Configure Project: {projectName}
            </HeadingText>
            <div className="side__modal-content">
              {modalLoading ? (
                <Spinner />
              ) : (
                <>
                  <div className="side__modal-item">
                    <HeadingText
                      className="name"
                      type={HeadingText.TYPE.HEADING_4}
                    >
                      Associate a workload with this project:
                    </HeadingText>
                    <div className="value">
                      {workloadOptions && workloadOptions.length > 0 ? (
                        <Select
                          onChange={(evt, value) => this.updateWorkload(value)}
                          value={
                            tempProjectSelected.guid
                              ? tempProjectSelected.guid
                              : undefined
                          }
                        >
                          <SelectItem value="default">
                            Select Workload
                          </SelectItem>
                          {workloadOptions.map(workload => (
                            <SelectItem value={workload.value}>
                              {workload.text}
                            </SelectItem>
                          ))}
                        </Select>
                      ) : (
                        <div>You have no Workloads set up</div>
                      )}
                    </div>
                  </div>
                  <div className="side__modal-item">
                    <HeadingText
                      className="name"
                      type={HeadingText.TYPE.HEADING_4}
                    >
                      Associate code repositories to this project:
                    </HeadingText>
                    <MultiSelect
                      source={codeRepoOptions}
                      selected={tempCodeRepoSelected}
                      onChange={this.updateCodeRepos}
                      emptyMessage="No code repos found."
                    />
                  </div>
                  <div className="side__modal-item">
                    <HeadingText
                      className="name"
                      type={HeadingText.TYPE.HEADING_4}
                    >
                      Select issue types to include in dashboards:
                    </HeadingText>
                    <MultiSelect
                      source={issueTypeOptions}
                      selected={tempIssueTypeSelected}
                      onChange={this.updateIssueTypes}
                      emptyMessage="No issue types found."
                    />
                  </div>
                  <div className="side__modal-item">
                    <div className="button__row">
                      <Button
                        type={Button.TYPE.NORMAL}
                        onClick={this._closeSettings}
                      >
                        Cancel
                      </Button>
                      <Button
                        type={Button.TYPE.PRIMARY}
                        onClick={this._saveSettings}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}
      </>
    )
  }
}
