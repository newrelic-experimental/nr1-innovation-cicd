import React from 'react';
import PropTypes from 'prop-types';
import { Card,Statistic, Divider,Label,Table,Popup } from 'semantic-ui-react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  BlockText,
  Button,
  NrqlQuery, NerdGraphQuery,
  LineChart,BarChart,TableChart,PieChart,BillboardChart,
  Spinner,
} from 'nr1';
const gqlQuery = require('./query');

export default class ProjectKanbanDashboard extends React.Component {

  static propTypes = {
    // filterChange: PropTypes.func,
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array
  }

  constructor(props){
    super(props);
    this.state = {
      loading: false,
    }
  }

  componentDidMount(){
    this.setState({
      loading: true
    },
    () => {
      this.setState({loading: false});
    });
  }


  renderDashboard(){
    const { projectName, accountId, issueTypeSelected,codeRepoSelected } = this.props;
    const {loading} = this.state;

    var timeSpan = 90;
    var codeProjectKeys = [];
    var codeRepoNames = [];

    for(let repo of codeRepoSelected) {
      var temp = repo.split(".");
      codeProjectKeys.push(temp[0]);
      codeRepoNames.push(temp[1]);
    }

    return (
      <>
            {issueTypeSelected.map(value => {
              return <Label key={value}>{value}</Label> 
            })}
            <Label>{timeSpan} Days</Label>
            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={3}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Total Critical Issues</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT uniqueCount(issueKey) FROM JIRAEvent since 3 months ago limit MAX facet priority where (priority like 'P1%' OR priority like 'P2%') and projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={7}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Non Critical Issues</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT uniqueCount(issueKey) FROM JIRAEvent since 3 months ago limit MAX facet priority where (priority not like 'P1%' and priority not like 'P2%') and projectName = '" + projectName + "'" }>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <PieChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={2}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Throughput</BlockText>
              <NrqlQuery accountId={accountId} query= {"SELECT average(timeOpen) / 24 as 'In Days' FROM JIRAEvent since 3 months ago limit max where (issueStatusName in ('Complete', 'Done') OR issueStatus in ('Complete', 'Done') ) and projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BillboardChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
            </Grid>

            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Application wise Issues</BlockText>
              <NrqlQuery accountId={accountId} query= {"select uniqueCount(issueKey) from JIRAEvent since 3 months ago facet application where and projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Label wise Issues</BlockText>
              <NrqlQuery accountId={accountId} query= {"select uniqueCount(issueKey) from JIRAEvent since 3 months ago facet label1, label2 where projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BarChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
              <GridItem columnSpan={4}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Average Time to 1st Response</BlockText>
              <NrqlQuery accountId={accountId} query= {"select average (firstResponse) as 'Average time to 1st Response' from ( SELECT filter(earliest(timeOpen)/24, where issueStatus= 'New') as 'New', filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') - filter(earliest(timeOpen)/24, where issueStatus = 'New') as 'firstResponse' from JIRAEvent limit max facet projectName, issueKey) since 3 months ago where projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <BillboardChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>
            </Grid>
            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>
  
              <GridItem columnSpan={12}>
              <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Average Cycle Time</BlockText>
              <NrqlQuery accountId={accountId} query= {"select average (Prioritized_Backlog) as 'Backlog to Priority Backlog', average (Done) as 'Triage / Analysis to Done' from (SELECT filter(earliest(timeOpen)/24, where issueStatusName = 'Backlog') as 'Backlog', filter(earliest(timeOpen)/24, where issueStatusName in ('Prioritized Backlog', 'Triage / Analysis')) - filter(earliest(timeOpen)/24, where issueStatusName = 'Backlog') as 'Prioritized_Backlog', filter(earliest(timeOpen)/24, where issueStatusName in ('Triage / Analysis')) as 'Triage_Analysis', filter(earliest(timeOpen)/24, where issueStatusName in ('Complete','Done')) - filter(earliest(timeOpen)/24, where issueStatusName in ('Triage / Analysis')) as 'Done' from JIRAEvent where issueStatusName IS NOT NULL limit max facet projectName, issueKey) where Backlog IS NOT NULL since 3 month ago limit max where projectName = '" + projectName + "'"}>
                  {({ data }) => {
                      if (data) {
                          //data.forEach(({metadata}) => metadata.color = '#F00BA5');
                      }

                  return <TableChart fullWidth data={data} />;
                  }}
              </NrqlQuery>
              </GridItem>

            </Grid>
            </>
    )
}

  render() {
    return (
      this.renderDashboard()
    )
  }

}