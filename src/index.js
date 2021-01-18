const core = require('@actions/core');
const github = require('@actions/github');

const semverDiff = require('semver-diff');

let octokit;

async function run() {
  try {
    // validate event type
    if (github.context.eventName !== 'pull_request') {
      throw new Error(`Unexpected event type ${github.context.eventName}. Only 'pull_request' is allowed`);
    }

    const githubToken = core.getInput('github-token');
    const versionFilepath = core.getInput('version-filepath');
    const skipLabel = core.getInput('skip-label');

    octokit = github.getOctokit(githubToken);

    const pullRequest = github.context.payload.pull_request;

    // do not enforce version update if a skip versioning lebel is specified for the PR
    const labels = pullRequest.labels.map(l => l.name);
    if (labels.includes(skipLabel)) {
      console.log('A skip label is specified. Skipping versioning check...');
      return;
    }

    const [ baseVersion, headVersion ] = await Promise.all([
      getProjectVersion(pullRequest.base, versionFilepath),
      getProjectVersion(pullRequest.head, versionFilepath)
    ]);

    if (semverDiff(baseVersion, headVersion)) {
      console.log(`Project version updated: ${baseVersion} (old) -> ${headVersion} (new)`);
      core.setOutput('version', headVersion);
    } else {
      throw new Error(`Project version not updated: ${baseVersion} (old) -> ${headVersion} (new)`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getProjectVersion(branch, versionFilepath) {
  const [ owner, repo ] = branch.repo.full_name.split('/');
  const versionFileContent = await getFileContent(owner, repo, versionFilepath, branch.ref);
  const version = parseVersion(versionFileContent);
  return version;
}

async function getFileContent(owner, repo, path, ref) {
  try {
    const res = await octokit.repos.getContent({ owner, repo, path, ref, headers: { 'Accept': 'application/vnd.github.v3.raw' } });
    return res.data;
  } catch (error) {
    throw new Error(`Cannot resolve file ${path} in target branch ${ref} of repo ${owner}/${repo}: ${error.message}`);
  }
}

function parseVersion(content) {
  try {
    return JSON.parse(content).version;
  } catch (error) {
    throw new Error(`Failed parsing project version: ${error.message}`);
  }
}

run();
