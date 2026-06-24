import { startAnalysis } from '../src/lib/api/analysis-service';
import { getAnalysisProgress } from '../src/lib/api/progress-service';
import { getAnalysisReport } from '../src/lib/api/report-service';

const companies = ['Tesla', 'Apple', 'Nvidia', 'Microsoft'];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 Starting Backend E2E Validation...\n');

  for (const company of companies) {
    console.log(`================================`);
    console.log(`📡 Kicking off analysis for ${company}...`);
    const startTime = Date.now();
    
    try {
      const { analysisId } = await startAnalysis(company);
      
      let isDone = false;
      let progressData: any = null;

      // Poll until complete
      while (!isDone) {
        await sleep(5000);
        progressData = await getAnalysisProgress(analysisId);
        
        if (!progressData) continue;
        
        console.log(`[${company}] Progress: ${progressData.progress}% | Current Node: ${progressData.currentNode}`);
        
        if (progressData.status === 'COMPLETED' || progressData.status === 'FAILED' || progressData.status === 'NEEDS_REVIEW') {
          isDone = true;
        }
      }

      const endTime = Date.now();
      const executionTimeMs = endTime - startTime;

      console.log(`\n✅ Finished ${company} in ${(executionTimeMs / 1000).toFixed(2)} seconds`);
      console.log(`Status: ${progressData.status}`);
      console.log(`Fallback Used: ${progressData.fallbackUsed}`);
      console.log(`Retry Count: ${progressData.retryCount}`);
      console.log(`Failed Nodes: ${progressData.failedNodes.join(', ') || 'None'}`);

      if (progressData.status === 'COMPLETED' || progressData.status === 'NEEDS_REVIEW') {
        const report = await getAnalysisReport(analysisId);
        console.log(`\nVerdict: ${report?.recommendation}`);
        console.log(`Confidence Score: ${report?.confidenceScore}/100`);
      }
      
    } catch (e: any) {
      console.error(`❌ Failed to run ${company}:`, e.message);
    }
    
    console.log(`================================\n`);
    await sleep(2000); // Breathe before next company
  }

  console.log('🎉 All tests completed.');
}

runTest().catch(console.error);
