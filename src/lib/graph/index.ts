import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { ResearchGraphAnnotation } from './state';
import { 
  tickerResolverNode, 
  managerNode, 
  financialNode, 
  companyResearchNode, 
  riskNode,
  dataJoinNode,
  scoringNode, 
  evidenceCollectorNode, 
  bullNode, 
  bearNode, 
  judgeNode, 
  reportGeneratorNode,
  reviewStateNode
} from './nodes';
import { 
  routeAfterTickerResolver, 
  routeAfterDataCollection, 
  routeAfterJudge 
} from './router';

// In-memory checkpointer for resuming and persistence
const checkpointer = new MemorySaver();

const workflow = new StateGraph(ResearchGraphAnnotation)
  .addNode('tickerResolver', tickerResolverNode)
  .addNode('manager', managerNode)
  .addNode('financial', financialNode)
  .addNode('companyResearch', companyResearchNode)
  .addNode('risk', riskNode)
  .addNode('dataJoin', dataJoinNode)
  .addNode('scoring', scoringNode)
  .addNode('evidenceCollector', evidenceCollectorNode)
  .addNode('bull', bullNode)
  .addNode('bear', bearNode)
  .addNode('judge', judgeNode)
  .addNode('reportGenerator', reportGeneratorNode)
  .addNode('reviewState', reviewStateNode);

// 1. Initial Flow
workflow.addEdge(START, 'tickerResolver');

workflow.addConditionalEdges('tickerResolver', routeAfterTickerResolver, {
  manager: 'manager',
  [END]: END,
});

// 2. Parallel Execution (Data Extraction)
workflow.addEdge('manager', 'financial');
workflow.addEdge('manager', 'companyResearch');
workflow.addEdge('manager', 'risk');

// 3. Fan-in Data Extraction
workflow.addEdge('financial', 'dataJoin');
workflow.addEdge('companyResearch', 'dataJoin');
workflow.addEdge('risk', 'dataJoin');

workflow.addConditionalEdges('dataJoin', routeAfterDataCollection, {
  scoring: 'scoring',
  [END]: END,
});

// 4. Sequential Core
workflow.addEdge('scoring', 'evidenceCollector');

// 5. Parallel Execution (Debate)
workflow.addEdge('evidenceCollector', 'bull');
workflow.addEdge('evidenceCollector', 'bear');

// 6. Fan-in Debate
workflow.addEdge('bull', 'judge');
workflow.addEdge('bear', 'judge');

// 7. Final Routing
workflow.addConditionalEdges('judge', routeAfterJudge, {
  reviewState: 'reviewState',
  reportGenerator: 'reportGenerator'
});

workflow.addEdge('reviewState', END);
workflow.addEdge('reportGenerator', END);

// Compile Graph with checkpointing
export const researchGraph = workflow.compile({ checkpointer });
