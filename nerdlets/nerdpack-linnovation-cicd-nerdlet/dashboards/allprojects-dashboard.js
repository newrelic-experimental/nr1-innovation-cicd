import React from 'react';
import PropTypes from 'prop-types';
import Card from './card';
import Chart from './chart';
import { Grid, GridItem } from 'nr1';

export default class AllProjects extends React.PureComponent {
  static propTypes = {
    accountId: PropTypes.number,
  };

  renderDashboard() {
    const { accountId } = this.props;
    return (
      <>
        <div className="card__group__container">
          <Card
            title="Projects"
            subtitle="Unique Project Keys"
            sections={[
              {
                accountId,
                label: 'Projects',
                query:
                  'SELECT uniqueCount(projectName) as Issues FROM `JIRAEvent` SINCE 1 month AGO',
              },
            ]}
          />
          <Card
            title="Contributors"
            subtitle="Names Captured"
            sections={[
              {
                accountId,
                label: 'Users',
                query:
                  'SELECT uniqueCount(displayName) FROM JIRAEvent since 1 month ago',
              },
            ]}
          />
          <Card
            title="Bugs"
            subtitle="Bugs"
            sections={[
              {
                accountId,
                label: 'Bugs',
                query:
                  "select uniqueCount(issueId) as 'Bugs' from JIRAEvent since 1 month ago where issueType = 'Bug' limit MAX",
              },
            ]}
          />
          <Card
            title="Sprints Captured"
            subtitle="Sprints"
            sections={[
              {
                accountId,
                label: 'Sprints',
                query:
                  'SELECT uniqueCount(sprintName) FROM JIRAEvent  since 1 month ago',
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
                query:
                  "SELECT uniqueCount(issueKey) as 'Issues' from JIRAEvent since 1 month ago where issueStatus in ('Done','Complete') and issueType in ('Story','Task')",
              },
            ]}
          />
          <Card
            title="Issue Completion"
            subtitle="Completion Time"
            sections={[
              {
                accountId,
                label: 'Days',
                formatter: data => (data ? data.toFixed(2) : 0),
                query:
                  "SELECT average(`timeOpen`) / 24 as 'Days' from JIRAEvent since 1 month ago where issueStatus in ('Done','Complete') and issueType in ('Story', 'Task')",
              },
            ]}
          />
          <Card
            title="Code Repositories"
            subtitle="Repos"
            sections={[
              {
                accountId,
                label: 'Repos',
                query:
                  'SELECT uniqueCount(repository.name) FROM BitbucketEvent since 90 days ago',
              },
            ]}
          />
          <Card
            title="Code CheckIns"
            subtitle="Refs Changed"
            sections={[
              {
                accountId,
                label: 'CheckIns',
                query:
                  "SELECT COUNT(*) from BitbucketEvent since 90 days ago limit max where ( pullRequest.toRef.displayId = 'master' or pullrequest.destination.branch.name = 'master' and (pullRequest.state = 'MERGED' or pullrequest.state = 'MERGED'))",
              },
            ]}
          />
          <Card
            title="Bug to Story %"
            subtitle="Bugs/Stories"
            sections={[
              {
                accountId,
                label: 'Percent',
                formatter: data => (data ? data.toFixed(2) : 0),
                query:
                  "SELECT COUNT(*) from BitbucketEvent since 90 days ago limit max where ( pullRequest.toRef.displayId = 'master' or pullrequest.destination.branch.name = 'master' and (pullRequest.state = 'MERGED' or pullrequest.state = 'MERGED'))",
              },
            ]}
          />
        </div>

        <div className="chart__group__container">
          <Grid>
            <GridItem columnSpan={4}>
              <Chart
                title="Bugs over Time"
                accountId={accountId}
                query="select uniqueCount(issueId) as 'Bugs' from JIRAEvent since 1 month ago where issueType = 'Bug' limit MAX TIMESERIES"
              />
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Checkins over Time"
                accountId={accountId}
                query="SELECT sum(changes) as 'Checkins' from BitbucketEvent since 1 month ago TIMESERIES"
              />
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Bugs to Stories Conversion"
                accountId={accountId}
                query="SELECT filter(uniqueCount(issueKey), where issueType in ('Bug'))/filter(uniqueCount(issueKey), where issueType in ('Story','Task')) * 100 as 'Bugs to Stories %' from JIRAEvent since 1 month ago TIMESERIES"
              />
            </GridItem>
          </Grid>
        </div>
      </>
    );
  }

  render() {
    return this.renderDashboard();
  }
}
