import AppBar from '@material-ui/core/AppBar';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import React from "react";
import { ClientResponse, processRequest, ServerRequest, ServerResponse } from './optimization';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { render } from '@testing-library/react';


function DrawInputCharts(currentRequest: ServerRequest | null) {
  if(currentRequest === null) {
    return
  }

  var currentOperations = currentRequest.operations.map(operation => {
    return {
      name: operation.name,
      revenueStructure: operation.revenueStructure,
    }
  });

  for (const element of currentOperations) {
    render(<h2>${element.name}</h2>);
    const data = [];
    for (let i = 0; i <= 20; i++) {
      data[i] =
       {
        flowPerDay: element.revenueStructure[i].flowPerDay ,
        dollarsPerDay: element.revenueStructure[i].dollarsPerDay,
       }
    }
    render(
    <LineChart
          width={1000}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data.flowPerDay" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
    )
  }
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    title: {
      flexGrow: 1,
      textAlign: 'left'
    },
    body: {
      padding: theme.spacing(2),
    },
  }),
);

function App() {
  const classes = useStyles();

  const [request, setRequest] = React.useState<null | ServerRequest>(null);
  const [result, setResult] = React.useState<null | ServerResponse>(null);
  const [response, setResponse] = React.useState<null | ClientResponse>(null);

  React.useEffect(() => {
    // const ws = new WebSocket('ws://localhost:9172');
    // eslint-disable-next-line no-restricted-globals
    const ws = new WebSocket(`wss://2021-utd-hackathon.azurewebsites.net`);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({setPitCapacity: 100000}));
    })

    // When the server sends new data, we send how to optimally allocate the water
    ws.addEventListener('message', (message) =>{

      if (message.data.startsWith('Error')) {
        window.alert(message.data);
        throw Error(message.data)
      }
      const data = JSON.parse(message.data);
      if (data.type === "CURRENT_STATE") {
        const request: ServerRequest = JSON.parse(message.data);
        setRequest(request);
        DrawInputCharts(request);
        const response = processRequest(request)
        setResponse(response)
        ws.send(JSON.stringify(response));
      } else if (data.type === "OPTIMATION_RESULT") {
        const response: ServerResponse = JSON.parse(message.data);
        setResult(response);
      }
    });

    // Oh no! Something unexpected happened.
    ws.addEventListener('error', (event) => {
      throw Error(JSON.stringify(event));
    })

    // cleanup function
    return () => {
      ws.close();
    }
  }, [])

  

  return(

    <div>
     <AppBar position="static">
        <Toolbar>
          <Typography variant="h5" className={classes.title}>
            Pipeline Network Optimizer
          </Typography>
        </Toolbar>
      </AppBar>
        <div>1.) Server Sends Current State of the System:</div>
        <textarea rows={10} cols={150} value={JSON.stringify(request, undefined, 2)} />
        <div>2.) Client Sends Solution to the Optimization:</div>
        <textarea rows={10} cols={150} value={JSON.stringify(response, undefined, 2)}/>
        <div>3.) Server Sends Result:</div>
        <textarea rows={10} cols={150} value={JSON.stringify(result, undefined, 2)}/>
      </div>
  );
}

export default App;