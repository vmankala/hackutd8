import Head from 'next/head';
import { Box, Container, Grid } from '@mui/material';
import { Profit } from '../components/dashboard/profit';
import { PitVolume } from '../components/dashboard/pit-volume';
import { TotalFlow } from '../components/dashboard/total-flow';
import { Status } from '../components/dashboard/status';
import { DashboardLayout } from '../components/dashboard-layout';
import React from "react";
import {
  ClientResponse,
  processRequest,
  ServerRequest,
  ServerResponse,
} from "../optimization";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
} from "recharts";

function lazyGetColor(str: string): string {
  var hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var colour = '#';
  for (let i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xff;
    colour += ('00' + value.toString(16)).substr(-2);
  }
  return colour;
}
function DrawInputCharts({
  currentRequest,
}: {
  currentRequest: ServerRequest | null;
}) {
  if (currentRequest === null) {
    return null;
  }

  return (
    <LineChart
      width={1000}
      height={500}
      data={[0,200000]}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="flowPerDay" type="number" />
      <YAxis dataKey="dollarsPerDay"  type="number"/>
      <Tooltip />
      <Legend />
      {currentRequest.operations.map(({ name, revenueStructure}) => (
        <Line
          type="monotone"
          name={name}
          data={revenueStructure}
          dataKey="dollarsPerDay"
          stroke={lazyGetColor(name)}
          key={name}
        />
      ))}
    </LineChart>
  );
}

function DrawOutputCharts({
  currentResult,
}: {
  currentResult: ServerResponse | null;
}
) {
  if (currentResult === null) {
    return null;
  }

  const data = [
    {
      name: 'Incremental Rev',
      value: currentResult.incrementalRevenue,
    },
    {
      name: 'Revenue Per Day',
      value: currentResult.revenuePerDay,
    },
    {
      name: 'Flow rate-in',
      value: currentResult.flowRateIn,
    },
    {
      name: 'Flow rate-out',
      value: currentResult.flowRateToOperations,
    },
  ]
  return (
    <BarChart
          width={1000}
          height={500}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="name" fill="#8884d8" />
    <Bar dataKey="value" fill="#82ca9d" />
  </BarChart>
  );
}

function Dashboard() {
  const [request, setRequest] = React.useState<null | ServerRequest>(null);
  const [result, setResult] = React.useState<null | ServerResponse>(null);
  const [response, setResponse] = React.useState<null | ClientResponse>(null);

  React.useEffect(() => {
    // const ws = new WebSocket('ws://localhost:9172');
    // eslint-disable-next-line no-restricted-globals
    const ws = new WebSocket(`wss://2021-utd-hackathon.azurewebsites.net`);

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ setPitCapacity: 10000000 }));
    });

    // When the server sends new data, we send how to optimally allocate the water
    ws.addEventListener("message", (message) => {
      if (message.data.startsWith("Error")) {
        window.alert(message.data);
        throw Error(message.data);
      }
      const data = JSON.parse(message.data);
      if (data.type === "CURRENT_STATE") {
        const request: ServerRequest = JSON.parse(message.data);
        setRequest(request);
        const response = processRequest(request);
        setResponse(response);
        ws.send(JSON.stringify(response));
      } else if (data.type === "OPTIMATION_RESULT") {
        const response: ServerResponse = JSON.parse(message.data);
        setResult(response);
      }
    });

    // Oh no! Something unexpected happened.
    ws.addEventListener("error", (event) => {
      throw Error(JSON.stringify(event));
    });

    // cleanup function
    return () => {
      ws.close();
    };
  }, []);
  return (
    <>
      <Head>
        <title>
          Flow Network Optimization
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth={false}>
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              xl={1}
              lg={1}
              sm={3}
              xs={6}
            >
            </Grid>
            <Grid
              item
              lg={3}
              sm={6}
              xl={3}
              xs={12}
            >
              <Profit num={result?.revenuePerDay} />
            </Grid>
            <Grid
              item
              xl={3}
              lg={3}
              sm={6}
              xs={12}
            >
              <TotalFlow num={request?.flowRateIn} />
            </Grid>
            <Grid
              item
              xl={3}
              lg={3}
              sm={6}
              xs={12}
            >
              <PitVolume num={0} />
            </Grid>
            <br/>
            <DrawInputCharts currentRequest={request} />
            <DrawOutputCharts currentResult={result} />
          </Grid>
        </Container>
      </Box>
    </>
  );
};

Dashboard.getLayout = (page: any) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Dashboard;
