# PR Version Update Enforcer

This action checks if the project version has been updated in your pull request. It will check the project version of the head branch against the base branch, and fails the check if the semantic version of the head branch is not higher than the base branch. You can specify a custom label on the PR that skips this version check.

A JSON version file with a top-level property "version" is assumed, e.g. package.json.

## Inputs

`github-token`

- The repository token that is used to request data from Github API. Pass in secrets.GITHUB_TOKEN
- required

`version-filepath`

- Path of the file that contains project version. A JSON version file with a top-level property "version" is assumed
- default: 'package.json'

`skip-label`

- Name of the PR label that is used to skip the version check
- default: 'skip-versioning'

## Outputs

`version`

- If the version update is valid then the new version is available as output

## Usage

```yml
name: PR Version Check

on:
  pull_request:
    branches: [master]
    types: [opened, synchronize, reopened, labeled, unlabeled]

jobs:
  enforce-version-update:
    runs-on: ubuntu-latest
    steps:
      - name: checkout
        uses: actions/checkout@v2

      - uses: clicktherapeutics/github-actions-version-check@0.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
