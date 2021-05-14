import React from 'react';
import PropTypes from 'prop-types';
import { Grid, GridItem, Badge } from 'nr1';
import Chart from './chart';
const gqlQuery = require('../query');

export default class KanbanDashboard extends React.Component {
  static propTypes = {
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array,
  };

  renderDashboard() {
    const {
      projectName,
      accountId,
      issueTypeSelected,
      codeRepoSelected,
    } = this.props;

    const timespan = 90;
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
            );
          })}
          <Badge className="issuetype__badge" type={Badge.TYPE.INFO}>
            {timespan} Days
          </Badge>
        </div>

        <div className="chart__group__container">
          <Grid>
            <GridItem columnSpan={5}>
              <Chart
                title="Total Critical Issues"
                accountId={accountId}
                query={`SELECT uniqueCount(issueKey) FROM JIRAEvent since ${timespan} days ago limit MAX facet priority where (priority like 'P1%' OR priority like 'P2%') and projectName = '${projectName}'`}
                type="bar"
              />
            </GridItem>
            <GridItem columnSpan={5}>
              <Chart
                title="Non Critical Issues"
                accountId={accountId}
                query={`SELECT uniqueCount(issueKey) FROM JIRAEvent since ${timespan} days ago limit MAX facet priority where (priority like 'P1%' OR priority not like 'P2%') and projectName = '${projectName}'`}
                type="pie"
              />
            </GridItem>
            <GridItem columnSpan={2}>
              <Chart
                title="Throughput"
                accountId={accountId}
                query={`SELECT average(timeOpen) / 24 as 'In Days' FROM JIRAEvent since ${timespan} days ago limit max where (issueStatusName in ('Complete', 'Done') OR issueStatus in ('Complete', 'Done') ) and projectName = '${projectName}'`}
                type="billboard"
              />
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Application wise Issues"
                accountId={accountId}
                query={`select uniqueCount(issueKey) from JIRAEvent since ${timespan} days ago facet application where projectName = '${projectName}'`}
                type="bar"
              />
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Label wise Issues"
                accountId={accountId}
                query={`select uniqueCount(issueKey) from JIRAEvent since ${timespan} days ago facet label1, label2 where projectName = '${projectName}'`}
                type="bar"
              />
            </GridItem>
            <GridItem columnSpan={4}>
              <Chart
                title="Average Time to 1st Response"
                accountId={accountId}
                query={`select average (firstResponse) as 'Average time to 1st Response' from ( SELECT filter(earliest(timeOpen)/24, where issueStatus= 'New') as 'New', filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') - filter(earliest(timeOpen)/24, where issueStatus = 'New') as 'firstResponse' from JIRAEvent limit max facet projectName, issueKey) since ${timespan} days ago where projectName = '${projectName}'`}
                type="billboard"
              />
            </GridItem>
            <GridItem columnSpan={12}>
              <Chart
                title="Average Cycle Time"
                accountId={accountId}
                query={`select average (Prioritized_Backlog) as 'Backlog to Priority Backlog', average (Done) as 'Triage / Analysis to Done' from (SELECT filter(earliest(timeOpen)/24, where issueStatusName = 'Backlog') as 'Backlog', filter(earliest(timeOpen)/24, where issueStatusName in ('Prioritized Backlog', 'Triage / Analysis')) - filter(earliest(timeOpen)/24, where issueStatusName = 'Backlog') as 'Prioritized_Backlog', filter(earliest(timeOpen)/24, where issueStatusName in ('Triage / Analysis')) as 'Triage_Analysis', filter(earliest(timeOpen)/24, where issueStatusName in ('Complete','Done')) - filter(earliest(timeOpen)/24, where issueStatusName in ('Triage / Analysis')) as 'Done' from JIRAEvent where issueStatusName IS NOT NULL limit max facet projectName, issueKey) where Backlog IS NOT NULL since ${timespan} days ago limit max where projectName = '${projectName}'`}
                type="table"
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
