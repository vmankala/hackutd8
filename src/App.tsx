import AppBar from "@material-ui/core/AppBar";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import React from "react";
import {
  ClientResponse,
  processRequest,
  ServerRequest,
  ServerResponse,
} from "./optimization";
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
} from "recharts";
import { render } from "@testing-library/react";

function DrawInputCharts({
  currentResponse,
}: {
  currentResponse: ServerRequest | null;
}) {
  if (currentResponse === null) {
    return null;
  }
  console.log({currentResponse})
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
      {currentResponse.operations.map(({ name, revenueStructure}) => (
        <Line
          type="monotone"
          name={name}
          data={revenueStructure}
          dataKey="dollarsPerDay"
          stroke="#name.hashcode()"
        />
      ))}
    </LineChart>
  );
  // return (
  //   <>
  //   {currentOperations.map(ele => {
  //     const data = ele.revenueStructure;
  //     return  (<><h2>{ele.name}</h2><LineChart
  //     width={1000}
  //     height={500}
  //     data={data}
  //     margin={{
  //       top: 5,
  //       right: 30,
  //       left: 20,
  //       bottom: 5,
  //     }}
  //   >
  //     <CartesianGrid strokeDasharray="3 3" />
  //     <XAxis dataKey="flowPerDay" />
  //     <YAxis dataKey="dollarsPerDay"/>
  //     <Tooltip />
  //     <Legend />
  //     <Line type="monotone" dataKey="dollarsPerDay" stroke="#8884d8" activeDot={{ r: 8 }} />
  //   </LineChart></>
  //     )
  //   }
  //   )
  // }
  // </>
  // )
}

function DrawOutputCharts({
  currentResponse,
}: {
  currentResponse: ServerResponse | null;
}) {
  if (currentResponse === null) {
    return null;
  }

  return null;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    title: {
      flexGrow: 1,
      textAlign: "left",
    },
    body: {
      padding: theme.spacing(2),
    },
  })
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
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h5" className={classes.title}>
            Pipeline Network Optimizer
          </Typography>
        </Toolbar>
      </AppBar>

      <DrawInputCharts currentResponse={request} />
    </div>
  );
}

export default App;
