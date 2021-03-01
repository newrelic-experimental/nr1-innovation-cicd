import React from 'react';
import PropTypes from 'prop-types';
import { Card,Statistic, Divider } from 'semantic-ui-react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  BlockText,
  Button,
  NrqlQuery,
  LineChart,BarChart,
  Spinner,
} from 'nr1';
import SprintDashboard from './sprint-dashboard';
import TopLevelDashboard from './toplevel-dashboard';
import ProjectDashboard from './project-dashboard';
import TopLevelKanbanDashboard from './toplevel-kanban-dashboard';
import ProjectKanbanDashboard from './project-kanban-dashboard';

export default class Dashboard extends React.Component {

  static propTypes = {
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    kanbanOnly: PropTypes.bool,
    sprintName: PropTypes.string,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array
  }

  constructor(props){
    super(props);
  }

  renderDashboard(){
    const { projectName, accountId, sprintName, issueTypeSelected, codeRepoSelected,kanbanOnly } = this.props;
    if(sprintName && sprintName != "All") {
      return <SprintDashboard projectName={projectName} accountId={accountId} sprintName={sprintName} issueTypeSelected={issueTypeSelected} codeRepoSelected={codeRepoSelected} />
    } else if(projectName && !kanbanOnly){
      return <ProjectDashboard projectName={projectName} accountId={accountId} issueTypeSelected={issueTypeSelected} codeRepoSelected={codeRepoSelected}  />
    } else if(projectName && kanbanOnly){
      return <ProjectKanbanDashboard projectName={projectName} accountId={accountId} issueTypeSelected={issueTypeSelected} codeRepoSelected={codeRepoSelected}  />
    } else if(!projectName && kanbanOnly) {
      return <TopLevelKanbanDashboard accountId={accountId} />
    }
    else {
      return <TopLevelDashboard accountId={accountId} />
    }
}

  render() {
    return (
      this.renderDashboard()
    )
  }

}