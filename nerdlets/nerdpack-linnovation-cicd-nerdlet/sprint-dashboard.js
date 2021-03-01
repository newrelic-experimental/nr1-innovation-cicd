import React from 'react';
import PropTypes from 'prop-types';
import { Card,Statistic, Divider,Modal,Header,Icon,Button,Label,Table,Popup } from 'semantic-ui-react';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  NrqlQuery,NerdGraphQuery,
  LineChart,
  BillboardChart,
  Spinner,
  BarChart,
  BlockText,
  TableChart
} from 'nr1';
const gqlQuery = require('./query');
// const https = require('https');

export default class SprintDashboard extends React.Component {

  static propTypes = {
    // filterChange: PropTypes.func,
    projectName: PropTypes.string,
    accountId: PropTypes.number,
    sprintName: PropTypes.string,
    issueTypeSelected: PropTypes.array,
    codeRepoSelected: PropTypes.array
  }

  constructor(props){
    super(props);
    this.state = {
      issueKey: null,
      issueModalOpen: false,
      insightsModalOpen: false,
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
      loading: false

    };
    this._onClose = this._onClose.bind(this);
    this._postToInsights = this._postToInsights.bind(this);
    this._onInsightsModelClose = this._onInsightsModelClose.bind(this);
  }

  _postToInsights () {

      this.setState({ insightsModalOpen: true });

  }
  _onInsightsModelClose () {
    this.setState({ insightsModalOpen: false });
  }

  async openModel ( issueKey ) {
    
    const {accountId} = this.props;
    const issueDetailsNRQL = "SELECT * From JIRAEvent since 3 months ago where issueKey ='" + issueKey +"'";
    var issueDetails = [];

    let results = await NrqlQuery.query({accountId: accountId,query: issueDetailsNRQL});

    for( var detail in results.data.chart[0].data) {
          issueDetails.push({
            issueKey: results.data.chart[0].data[detail].issueKey,
            timestamp: (new Date(results.data.chart[0].data[detail].timestamp)).toString(), 
            displayName: results.data.chart[0].data[detail].displayName, 
            issueDescription: results.data.chart[0].data[detail].issueDescription,
            issueSummary: results.data.chart[0].data[detail].issueSummary,
            issueStatus: results.data.chart[0].data[detail].issueStatus,
            issueStatusName: results.data.chart[0].data[detail].issueStatusName,
            priority: results.data.chart[0].data[detail].priority,
            projectName: results.data.chart[0].data[detail].projectName,
            projectKey: results.data.chart[0].data[detail].projectKey,
            sprintName: results.data.chart[0].data[detail].sprintName,
            storyPoints: results.data.chart[0].data[detail].storyPoints,
            daysOpen: (Math.round(results.data.chart[0].data[detail].timeOpen) / 24).toFixed(2)
           });
    }

    var issueDetailsData = [
      {
        metadata: {
          id: 'Issues-details',
          name: 'Issues Details',
          viz: 'main',
          columns: ['displayName','issueStatusName','priority', 'sprintName', 'storyPoints', 'daysOpen', 'timestamp']
        },
        data: issueDetails
      }];

    this.setState({issueKey, issueModalOpen: true, issueDetailsData});

  }
  _onClose() {
       this.setState({ issueModalOpen: false });
  }

async componentDidMount(){
      this.setState({loading: true});
      await this.getTransientSprintData();
      this.setState({loading: false});
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
        loading: true
      }, async () => {
        await this.getTransientSprintData();
        this.setState({
          loading: false
        });
      }
    )
  }
  // ### SK - 1-27-21 #### THE FOLLOWING CONDITION IS ALWAYS "TRUE" HERE - THEREFORE THE ELSE STMT NEVER GETS EXECUTED #######
  //   if (this.props.issueTypeSelected.length == prevProps.issueTypeSelected.length
  //     && this.props.issueTypeSelected.every(function(u, i) {
  //         return u === prevProps.issueTypeSelected[i];
  //     })
  //   ) {

  //   } else {
  //     await this.getTransientSprintData();
  //     this.setState({loading: false});
  //   }

}

async getTransientSprintData() {

    const { projectName, accountId, sprintName, issueTypeSelected, codeRepoSelected } = this.props;
    const sprintDatesNRQL = "From JIRAEvent select latest(sprintStartDate), latest(sprintEndDate) limit 1 where sprintStartDate is not null since 1 month ago where sprintName = '" + sprintName + "'";
    let results = await NrqlQuery.query({accountId: accountId,query: sprintDatesNRQL});
    var inSprintIssueList  = [];
    var sprintStartIssueList = [];
    var postSprintIssueList = [];
    var deletedIssueList = [];
    var releaseList = [];
    var inSprintStoryCount = 0;
    var sprintStartStoryCount = 0;
    var postSprintStoryCount = 0;
    var releaseCount = 0;
    var cycleTimes = {};
    var sprintStartEstimated = true;

    var sprintStartDate = results.data.chart[0].data[0].sprintStartDate;
    var sprintEndDate = results.data.chart[1].data[0].sprintEndDate;


    let sprintStartCountResultsAPI = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.sprintStartCountAPI(sprintName))});
    sprintStartCountResultsAPI = (((((sprintStartCountResultsAPI || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};

    let sprintStartCountResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.sprintStartCount(sprintName, issueTypeSelected))});
    sprintStartCountResults = (((((sprintStartCountResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};
    let inSprintCountResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.inSprintCount(sprintName, issueTypeSelected))});
    inSprintCountResults = (((((inSprintCountResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};
    let deletedIssuesResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.deletedIssues(projectName))});
    deletedIssuesResults = (((((deletedIssuesResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};
    for (let result of deletedIssuesResults) {
      deletedIssueList.push(result.issueKey);
    }

    if(sprintStartCountResultsAPI === undefined || sprintStartCountResultsAPI.length == 0 || !Object.keys(sprintStartCountResultsAPI).length) {
        for(let result of sprintStartCountResults) {      
            sprintStartIssueList.push({
              issueKey: result.issueKey, 
              ... ((result["latest.storyPoints"] == undefined || !result["latest.storyPoints"]) ? {storyPoints: 0} : {storyPoints: result["latest.storyPoints"]}),
            });
            sprintStartStoryCount += result["latest.storyPoints"];
      }
      sprintStartEstimated = true;
    } else {
      for(let result of sprintStartCountResultsAPI) {      
            sprintStartIssueList.push({
              issueKey: result.issueKey, 
              storyPoints: result["latest.storyPoints"]
            });
            sprintStartStoryCount += result["latest.storyPoints"];
      }
      sprintStartEstimated = false;
    }
    for(let result of inSprintCountResults) {
        inSprintIssueList.push({
          issueKey: result.issueKey, 
          storyPoints: result["latest.storyPoints"]
        });
        inSprintStoryCount += result["latest.storyPoints"];
    }

    let postSprintCountResults = await NerdGraphQuery.query({query: gqlQuery.runQuery(accountId, gqlQuery.postSprintCount(sprintName, issueTypeSelected,inSprintIssueList))});
    postSprintCountResults = (((((postSprintCountResults || {}).data || {}).actor || {}).account || {}).nrql || {}).results || {};

    for(let result of postSprintCountResults) {
      if (deletedIssueList.indexOf(result.issueKey) < 0) {
        postSprintIssueList.push({
          issueKey: result.issueKey, 
          storyPoints: result["latest.storyPoints"],
          issueType: result["latest.issueType"]
        });
        postSprintStoryCount += result["latest.storyPoints"];
      }
    }

    if(sprintStartDate && sprintEndDate) {

      const releaseNRQL = "select latest(duedate) from JIRAEvent since 3 months ago limit max facet issueKey where issueKey is not null and issueType = 'Release' and projectName = '" + projectName + "'";
      let releaseQueryResults = await NrqlQuery.query({accountId: accountId,query: releaseNRQL});
      const releaseResults = ((releaseQueryResults || {}).data || {}).chart || {};
      var dateSprintStartDate = new Date(sprintStartDate);
      var dateSprintEndDate = new Date(sprintEndDate);
      var roundsprintStartDate = new Date(dateSprintStartDate.getFullYear()+"-"+(dateSprintStartDate.getMonth() + 1)+"-"+dateSprintStartDate.getDate() + " GMT+00:00").getTime();
      var roundsprintEndDate = new Date(dateSprintEndDate.getFullYear()+"-"+(dateSprintEndDate.getMonth() + 1)+"-"+dateSprintEndDate.getDate()).getTime() + 86399000;
      
      if(releaseResults && releaseResults.length > 0) {
        for(let result of releaseResults) {
          var releaseDate = new Date(result.data[0].duedate).getTime();

          if( releaseDate >= roundsprintStartDate && releaseDate <= sprintEndDate) {
            releaseCount ++;
            releaseList.push({
              issueKey: result.metadata.name
            });
          }
        }
      }
    }

      const changeRateNRQL = "SELECT  filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') as 'InProgress', filter(earliest(timeOpen)/24,  where issueStatus in ('Complete','Done')) - filter(earliest(timeOpen)/24, where issueStatus = 'In Progress') as 'Done', filter(earliest(timeOpen)/24, where issueStatus in ('Complete','Done')) as 'Total'  from JIRAEvent since 1 month ago limit max facet issueKey where issueKey in (" + inSprintIssueList.map(function(issue){ return "'" + issue.issueKey + "'"}).join(",") + " )";
      let results4 = await NrqlQuery.query({accountId: accountId,query: changeRateNRQL});

      var inProgressAverage = 0 ,inProgressCount = 0, doneAverage = 0, doneCount = 0, totalAverage = 0, totalCount = 0;

      for(let result of results4.data.chart) {
 
        if(result.data[0].InProgress) {
          inProgressAverage += result.data[0].InProgress;
          inProgressCount++;
        }
        if(result.data[0].Done) {
          doneAverage += result.data[0].Done;
          doneCount++;
        }
        if(result.data[0].Total) {
          totalAverage += result.data[0].Total;
          totalCount++;
        }
      }

      cycleTimes = {
        inProgress: inProgressAverage/inProgressCount,
        done:doneAverage/doneCount,
        total: totalAverage/totalCount
      };
      this.setState({sprintStartEstimated,releaseList, sprintStartDate, sprintEndDate, postSprintStoryCount, postSprintIssueList, inSprintStoryCount, inSprintIssueList, sprintStartStoryCount , sprintStartIssueList, releaseCount, cycleTimes});

}

  renderSprintDashboard(){
    const { projectName, accountId, sprintName, issueTypeSelected } = this.props;
    const {issueKey, issueModalOpen,insightsModalOpen, releaseList, issueDetailsData, postSprintStoryCount, postSprintIssueList, inSprintStoryCount, sprintStartStoryCount,sprintStartIssueList, releaseCount, inSprintIssueList, sprintStartDate, sprintEndDate, cycleTimes,loading, sprintStartEstimated } = this.state;
    var storyPointsData,issuesInSprintData,completedIssuesInSprintData,issuePointsData,issuesCommitedAtStartData,issuesPreSprintData = [], changeRateData = [];

    var sprintStoryPoints = 0;
    var sprintStoryPointsCompleted = 0;
    var sprintStoryPointsStarted = 0;
   
    var sprintIssues = 0;
    var sprintIssuesCompleted = 0;
    var sprintIssuesStarted = 0;

    var averageTimeToComplete = 0;
    var totalTimetoComplete = 0;
    
    var sprintIssueList = [];
    var sprintIssueCompletedList = [];
    var releaseData = [];


        completedIssuesInSprintData = [
          {
            metadata: {
              id: 'Issues-in-sprint',
              name: 'Completed Issues In Sprint',
              viz: 'main',
              columns: ['issueKey','storyPoints','issueType']
            },
            data: postSprintIssueList
          }];

        issuesInSprintData = [
          {
            metadata: {
              id: 'Issues-in-sprint',
              name: 'Issues In Sprint',
              viz: 'main',
              columns: ['issueKey','storyPoints']
            },
            data: inSprintIssueList
          }];

          issuesPreSprintData = [
          {
            metadata: {
              id: 'Issues-in-sprint',
              name: 'Issues Commited before Sprint',
              viz: 'main',
              columns: ['issueKey','storyPoints']
            },
            data: sprintStartIssueList
          }];

        releaseData = [
        {
                   metadata: {
                       id: 'releaseCount',
                       name: 'Releases',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: releaseCount }
                   ],
        }];

        changeRateData = [
               {
                   metadata: {
                       id: 'changeRateInProgress',
                       name: 'Created -> In Progress',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: (cycleTimes.inProgress ? cycleTimes.inProgress : 0) } // Current value.
                   ],
               },
               {
                   metadata: {
                       id: 'changeRateDone',
                       name: 'In Progress -> Done',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: (cycleTimes.done ? cycleTimes.done : 0) } // Current value.
                   ],
               },
               {
                   metadata: {
                       id: 'changeRateTotal',
                       name: 'Created - > Done',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: (cycleTimes.total ? cycleTimes.total : 0) } // Current value.
                   ],
               }

               ];

        issuePointsData = [
               {
                   metadata: {
                       id: 'sprintIssuesStarted',
                       name: sprintStartEstimated ? 'At Start Estimated' : 'At Start',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: (sprintStartIssueList ? sprintStartIssueList.length : 0) } // Current value.
                   ],
               },
               {
                   metadata: {
                       id: 'sprintIssues',
                       name: 'Committed',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: (inSprintIssueList ? inSprintIssueList.length : 0) } // Current value.
                   ],
               },
               {
                   metadata: {
                       id: 'sprintIssuesCompleted',
                       name: 'Completed',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: postSprintIssueList ? postSprintIssueList.length : 0 } // Current value.
                   ],
               }

               ];

      storyPointsData = [
               {
                   metadata: {
                       id: 'sprintStoryPointsStarted',
                       name: sprintStartEstimated ? 'At Start Estimated' : 'At Start',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: sprintStartStoryCount ? sprintStartStoryCount : 0 } // Current value.
                   ],
               },
               {
                   metadata: {
                       id: 'sprintStoryPoints',
                       name: 'Commited',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: inSprintStoryCount } // Current value.
                   ],
               },
               {
                   metadata: {
                       id: 'sprintStoryPointsCompleted',
                       name: 'Completed',
                       viz: 'main',
                       units_data: {
                           y: ''
                       }
                   },
                   data: [
                       { y: postSprintStoryCount } // Current value.
                   ],
               }

               ];

    return (
       <>
         {/*  <Stack horizontalType={Stack.HORIZONTAL_TYPE.RIGHT} gapType={Stack.GAP_TYPE.SMALL} fullWidth>

             <StackItem >
                <Button onClick={() => this._postToInsights()} icon labelPosition='left' color='teal'>
                  <Icon name='sync' />
                    Add to Insights
                </Button>
              </StackItem>
            </Stack> */}

            {issueTypeSelected.map(value => {
              return <Label key={value}>{value}</Label> 
            })}
            <Divider />

            <Stack gapType={Stack.GAP_TYPE.EXTRA_LARGE} fullWidth>
            <StackItem>
                <Card.Group itemsPerRow={5}>
                  <Card>
                    <Card.Content textAlign="center">
                      <Card.Header>Sprint</Card.Header>
                      <Card.Meta>Start and End Dates</Card.Meta>
                      <Card.Description>
                        <NrqlQuery accountId={accountId} query= {"From JIRAEvent select latest(sprintStartDate), latest(sprintEndDate) limit 1 where sprintStartDate is not null since 1 month ago where sprintName = '" + sprintName + "'" }>
                            {({ data }) => {
                                return <BillboardChart data={data} />;
                            }}
                        </NrqlQuery>
                      </Card.Description>
                    </Card.Content>
                  </Card>

                  <Card>
                  <Card.Content textAlign="center">
                    <Card.Header>Story Points</Card.Header>
                    <Card.Meta>Before and During Sprint</Card.Meta>
                    <Card.Description textAlign="center">
                        {loading ? <Spinner /> : <BillboardChart data={storyPointsData} fullWidth  />}
                      </Card.Description>
                    </Card.Content>
                  </Card>

                  <Card>
                  <Card.Content textAlign="center">
                    <Card.Header>Issues</Card.Header>
                    <Card.Meta>Before and During Sprint</Card.Meta>
                      {loading ? <Spinner /> : <BillboardChart data={issuePointsData} /> }
                    </Card.Content>
                  </Card>

                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Change Rates</Card.Header>
                    <Card.Meta>In Days</Card.Meta>
                        {loading ? <Spinner /> : <BillboardChart data={changeRateData} /> }
                    </Card.Content>
                  </Card>
                  <Popup trigger={
                  <Card>
                    <Card.Content textAlign="center">
                    <Card.Header>Total Releases</Card.Header>
                    <Card.Meta>Release Statistics</Card.Meta>
                    <Card.Description>
                      {loading ? <Spinner /> : <BillboardChart data={releaseData} /> }
                    </Card.Description>
                    </Card.Content>
                  </Card>} >
                  <Popup.Header>Release List</Popup.Header>
                  <Popup.Content>
                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell colSpan='3'>Release List</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {releaseList.map((issue, index) => (
                          <Table.Row key={index}>
                            <Table.Cell>{issue.issueKey}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </Popup.Content>
                  </Popup>  
                </Card.Group>
                </StackItem>

            </Stack>

            <Divider />

            <Grid spacingType={[Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE,Grid.SPACING_TYPE.EXTRA_LARGE]}>

              <GridItem columnSpan={4}>
                <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Issues committed before Sprint Start</BlockText>              
                <TableChart data={issuesPreSprintData} fullWidth onClickTable={(dataEl, row, chart) => {this.openModel(row.issueKey)}} />
              </GridItem>
              <GridItem columnSpan={4}>
                <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Issues that were in this Sprint</BlockText>              
                <TableChart data={issuesInSprintData} fullWidth onClickTable={(dataEl, row, chart) => {this.openModel(row.issueKey)}} />
              </GridItem>
              <GridItem columnSpan={4}>
                <BlockText type={BlockText.SPACING_TYPE.PARAGRAPH}>Issues Completed</BlockText>
                <TableChart data={completedIssuesInSprintData} fullWidth onClickTable={(dataEl, row, chart) => {this.openModel(row.issueKey)}} />
              </GridItem>

            </Grid>


            <Modal size='large' open={this.state.issueModalOpen} onClose={this._onClose} closeIcon = {true}>
              <Modal.Header>{issueKey}</Modal.Header>
              <Modal.Content>
                <Header>{issueDetailsData ? issueDetailsData[0].data[0].issueSummary : ""}</Header>
                  <BlockText type={BlockText.TYPE.NORMAL}>Current Status: {issueDetailsData ? issueDetailsData[0].data[0].issueStatus : ""}</BlockText>
                  <BlockText type={BlockText.TYPE.NORMAL}>Days Open: {issueDetailsData ? issueDetailsData[0].data[0].daysOpen : ""}</BlockText>
               </Modal.Content>
                <Modal.Content>
                <TableChart data={issueDetailsData} fullWidth />
                <p align='left'> <Button color='teal' onClick={() => this._onClose()}>Close</Button> </p>
                </Modal.Content>
            </Modal>

              <Modal open={this.state.insightsModalOpen} onClose={this._onInsightsModelClose} closeIcon={true} basic size='small'>
                <Header icon='archive' content='Post to Insights?' />
                <Modal.Content>
                  <p>
                    Insights Event
                  </p>
                </Modal.Content>
                <Modal.Actions>
                  <Button basic color='red' inverted onClick={this._onInsightsModelClose}>
                    <Icon name='remove' /> No
                  </Button>
                  <Button color='green' inverted>
                    <Icon name='checkmark' /> Yes
                  </Button>
                </Modal.Actions>
              </Modal>

            </>
    )
}

  render() {
    return (
      this.renderSprintDashboard()
    )
  }

}