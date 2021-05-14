import React from 'react';
import PropTypes from 'prop-types';
import SprintDashboard from './sprint-dashboard';
import AllProjectsDashboard from './allprojects-dashboard';
import ProjectDashboard from './project-dashboard';
import AllKanbanDashboard from './allkanban-dashboard';
import KanbanDashboard from './kanban-dashboard';

export default class Dashboard extends React.Component {
  static propTypes = {
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    kanbanOnly: PropTypes.bool,
    sprintName: PropTypes.string,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array,
  };

  constructor(props) {
    super(props);
  }

  renderDashboard() {
    const {
      projectName,
      accountId,
      sprintName,
      issueTypeSelected,
      codeRepoSelected,
      kanbanOnly,
    } = this.props;
    if (sprintName && sprintName != 'All') {
      return (
        <SprintDashboard
          projectName={projectName}
          accountId={accountId}
          sprintName={sprintName}
          issueTypeSelected={issueTypeSelected}
          codeRepoSelected={codeRepoSelected}
        />
      );
    } else if (projectName && !kanbanOnly) {
      return (
        <ProjectDashboard
          projectName={projectName}
          accountId={accountId}
          issueTypeSelected={issueTypeSelected}
          codeRepoSelected={codeRepoSelected}
        />
      );
    } else if (projectName && kanbanOnly) {
      return (
        <KanbanDashboard
          projectName={projectName}
          accountId={accountId}
          issueTypeSelected={issueTypeSelected}
          codeRepoSelected={codeRepoSelected}
        />
      );
    } else if (!projectName && kanbanOnly) {
      return <AllKanbanDashboard accountId={accountId} />;
    } else {
      return <AllProjectsDashboard accountId={accountId} />;
    }
  }

  render() {
    return this.renderDashboard();
  }
}
