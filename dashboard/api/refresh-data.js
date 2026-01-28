export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const workflow = process.env.GITHUB_WORKFLOW || 'update-data.yml'
  const ref = process.env.GITHUB_REF || 'main'

  if (!token || !owner || !repo) {
    return res.status(500).json({
      message: 'Missing GitHub configuration. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO.'
    })
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({ ref })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({
        message: 'Failed to dispatch GitHub workflow',
        details: errorText
      })
    }

    return res.status(200).json({
      message: 'Update started. It can take a few minutes to deploy.'
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
