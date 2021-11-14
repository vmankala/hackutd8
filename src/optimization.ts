
export interface Point {
  flowPerDay: number,
  dollarsPerDay: number,
}
interface WaterOperation {
  name: string,
  id: string,
  revenueStructure: Point[],
}

export interface ServerRequest {
  flowRateIn: number;
  operations: WaterOperation[];
  type: "CURRENT_STATE";
};

export interface ServerResponse {
  incrementalRevenue: number,
  revenuePerDay: number,
  flowRateIn: number,
  flowRateToOperations: number,
  type: "OPTIMATION_RESULT",
  currentPitVolume?: number ,
  maximumPitVolume?: number ,
}

export type ClientResponse = {
  operationId: string,
  flowRate: number,
}[];

// Initialize the 2D array for dynamic programming [# partitions][# operations]
function initializeDP(parts: number, ops: number): number[][] {
  let dp: number[][] = [];
  for (let i: number = 0; i < parts + 1; i++) {
    dp.push([]);
    for (let j: number = 0; j < ops; j++) {
      dp[i].push(0);
    }
  }
  return dp;
}

// Calculate the profit at a given point using linear interpolation
function profit(request: ServerRequest, opnum: number, flowamt: number): number {
  // Flowamt must be in range [0, 200000]
  let lowBound: number = Math.floor(flowamt / 10000); // Lower bound for linear interpolation
  let lowProfit: number = request.operations[opnum].revenueStructure[lowBound].dollarsPerDay; // Lower profit point
  let highProfit: number = request.operations[opnum].revenueStructure[lowBound + 1].dollarsPerDay; // Higher profit point
  return lowProfit + (highProfit - lowProfit) * (flowamt / 10000 - lowBound); // Linearly interpolate between points
}

export function processRequest(request: ServerRequest): ClientResponse {
  let parts: number = 20; // Number of partitions on the data for dynamic programming
  let profitDP: number[][] = initializeDP(parts, request.operations.length); // Track max profit
  let allocDP: number[][] = initializeDP(parts, request.operations.length) // Track remaining allocation
  let maxAlloc: number = Math.floor(200000 / (request.flowRateIn / parts)); // Maximum allocation without exceeding 200,000 water
  // DP base cases
  for (let i: number = 0; i < profitDP.length; i++) {
    if (i <= maxAlloc) { // Base case is to use all allocation on first pump
      profitDP[i][0] = request.operations[0].revenueStructure[i].dollarsPerDay;
    } else { // Cannot allocate more than 200,000 water to one pump, use large negative weight
      profitDP[i][0] = -999999999;
    }
    allocDP[i][0] = 0;
  }
  // Recursive cases
  for (let i: number = 0; i < profitDP.length; i++) {
    for (let j: number = 1; j < profitDP[i].length; j++) {
      let alloc = 0; // Track the remaining allocation thus far
      let max = -999999999; // Track the maximum profit thus far
      for (let k: number = 0; k <= i; k++) { // Iterate through combinations of allocation splits (between this operation, and for later)
        let cur = 0;
        if (k <= maxAlloc) { // Add profit gainable at this operation
          cur += profit(request, j, (k / parts) * request.flowRateIn);
        } else { // Cannot allocate more than 200,000 units, use large negative weight
          cur += -999999;
        }
        cur += profitDP[i - k][j - 1]; // Add the profit that can be achieved later with remaining allocation
        if (cur >= max) { // Update profit max and remaining allocation trackers
          max = cur;
          alloc = i - k;
        }
      }
      // Store subproblem results
      allocDP[i][j] = alloc;
      profitDP[i][j] = max;
    }
  }

  // Initialize the client response with zeroes for all operation
  let distr: ClientResponse = request.operations.map(operation => {
    return {
      operationId: operation.id,
      flowRate: 0,
    }
  });

  // Iterate through the allocDP structure and extract operation allocations
  let partsLeft = parts;
  let i: number = parts;
  for (let j: number = allocDP[0].length - 1; j >= 0; j--) {
    distr[j].flowRate = ((partsLeft - allocDP[i][j]) / parts) * request.flowRateIn;
    partsLeft = allocDP[i][j];
    i = allocDP[i][j];
  }

  return distr;
}