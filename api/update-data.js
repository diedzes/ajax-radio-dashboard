// Vercel serverless function to update dashboard data
// This can be called via cron job or webhook

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;

export default async function handler(req, res) {
  // Optional: Add authentication
  const authToken = req.headers.authorization;
  const expectedToken = process.env.UPDATE_TOKEN;
  
  if (expectedToken && authToken !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const projectRoot = path.join(process.cwd(), '..');
    
    console.log('Starting data update...');
    
    // Step 1: Fetch Google Sheet data
    console.log('Fetching Google Sheet data...');
    const { stdout: fetchOutput } = await execAsync(
      'python3 fetch_google_sheet.py',
      { cwd: projectRoot }
    );
    console.log('Google Sheet fetch complete');
    
    // Step 2: Merge data
    console.log('Merging data...');
    const { stdout: mergeOutput } = await execAsync(
      'python3 merge_data.py',
      { cwd: projectRoot }
    );
    console.log('Data merge complete');
    
    // Step 3: Analyze data
    console.log('Analyzing data...');
    const { stdout: analyzeOutput } = await execAsync(
      'python3 analyze_matchdays.py',
      { cwd: projectRoot }
    );
    console.log('Analysis complete');
    
    // Step 4: Build dashboard (optional - only if you want to rebuild)
    // Uncomment if needed:
    // console.log('Building dashboard...');
    // await execAsync('npm run build', { cwd: path.join(projectRoot, 'dashboard') });
    
    return res.status(200).json({ 
      success: true,
      message: 'Data updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating data:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
