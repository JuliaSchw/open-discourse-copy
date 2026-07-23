<!-- markdownlint-disable MD033 -->
<p align="center">
  <a href="https://opendiscourse.de/">
    <img
      alt="Open Discourse"
      src="https://opendiscourse.de/images/github/open-discourse_full_black_transparent.png"
      width="400"
    />
  </a>
</p>

# Table of Content

- [Project Status](#project-status)
- [Project Info](#project-info)
- [Repository Structure](#repository-structure)
- [Docker Setup](#docker-setup)
- [Local Setup](#local-setup)
  - [Start the Database](#start-the-database)
    - [Database: Normal Start](#database-normal-start)
    - [Database: Initial Start / Reset](#database-initial-start--reset)
  - [Generate Data](#generate-data)
  - [DIP API Import (Current Workflow)](#dip-api-import-current-workflow)
  - [Start the Full Text Search](#start-the-full-text-search)
  - [Search Behavior and Limits](#search-behavior-and-limits)
    - [Run Frontend with Docker](#run-frontend-with-docker)
    - [Run Frontend locally](#run-frontend-locally)
- [Further Documentation](#further-documentation)
- [Notes](#notes)

## Project Status

**Note:** This repository is currently **not under active development**. We hope to resume development in the future if we can secure funding through the following platforms:

- [GitHub Sponsors](https://github.com/sponsors/open-discourse)
- [Patreon](https://www.patreon.com/opendiscourse)
- Grants or institutional funding

We sincerely appreciate any financial support which will help us continue improving this project.

### Contributing

While we are not actively developing at the moment, contributions from the open-source community are incredibly valuable and encouraged. If you have ideas, bug fixes, or improvements, please feel free create an issue or open a pull request!

Thank you for your support and contributions! Together, we can keep this project moving forward.

## Project Info

The platform is our contribution to democratizing access to political debates and issues.

Open Discourse is a non-profit project of the employees of Limebit GmbH. The idea emerged from the skills and motivations of the employees, in break conversations and from the common ideas of democracy.

We hope that through our preliminary work, data-based journalism, science and civil society will benefit and that the facilitated access to data will encourage to analyze the political history of the Bundestag based on the language used by politicians.

We are happy for every financial support via: https://www.patreon.com/opendiscourse/ or https://github.com/sponsors/open-discourse

## Repository Structure

This Repo is structured in three different parts.

- [database](./database):
  - Docker-Container for the Postgres Database
  - Contains Scripts that update the Database
- [frontend](./frontend):
  - Frontend for the Full Text Search
- [proxy](./proxy):
  - Docker-Container for the Proxy, which protects the database
- [python](./python):
  - Includes every python script in different subsections, sorted by execution order

## Docker Setup

For a quick setup using Docker, please read the [DOCKER_SETUP](./DOCKER_SETUP.md)

## Local Setup

Required software:
[python3](https://www.python.org/downloads/),
[yarn](https://yarnpkg.com/),
[docker-compose](https://docs.docker.com/compose/),
[node version 12](https://nodejs.org/dist/latest-v12.x/docs/api/) - ideally installed via node version manager (nvm)

- run `yarn` in following directories:
  - `database`
  - `frontend`
- run `sh setup.sh` in the `python` directory
- run `docker-compose build` in the `root` folder

### Start the Database

These steps will guide you through starting the Database

#### Database: Normal Start

You can easily start the Database via docker-compose.

```Shell
// run from repository root
docker-compose up -d database
```

#### Database: Initial Start / Reset

For the initial start of the Database, you will also need to upload the schema.

```Shell
// run from database folder
yarn run db:update:local
```

### Generate Data

Generate the OpenDiscourse-Database from the ground up. The Database has to be started for this script to finish.

This script is just a pipeline executing all scripts in `src`. You can also manually run every script seperatly. For Documentation on this, please visit the [README in src](./python/src/README.md)

```Shell
// run from python folder
sh build.sh
```

> Note: The project can also use the DIP API from the German Bundestag as a data source. A valid API key is required for this. The public key provided in the documentation is only intended as a temporary example and may need to be replaced or renewed regularly, so the key should be checked and updated from time to time.

### DIP API Import (Current Workflow)

The current import script for plenary protocol texts is:

- `python/src/od_lib/07_database/04_import_dip_speeches.py`

The script uses cursor-based pagination against the endpoint `plenarprotokoll-text`, so it can iterate through the complete available result set instead of repeating the first page.

Run the import from repository root:

```Shell
./python/.venv/bin/python python/src/od_lib/07_database/04_import_dip_speeches.py \
  --start-date 1949-01-01 \
  --page-size 10 \
  --max-documents 6000 \
  --reset
```

Recommended environment variables:

- `DIP_API_KEY` (required)
- `DATABASE_URL` (optional; defaults to local postgres)

Notes:

- `--reset` clears `open_discourse.speeches` before re-importing.
- Long runs print progress (`fetched_documents`, `inserted_rows`) for better observability.
- Import time depends on API speed and machine load.
- The current historical DIP import run has been stopped for now and is not being continued automatically; the last imported state remains in the database until a new run is started.

### Start the Full Text Search

_Note:_ All of the previous steps have to be completed at least once for the Full Text Search to work properly.

If you want to setup the Full Text Search, follow these steps:

- run `yarn` in following directories:
  - `frontend`
  - `proxy`

Choose one of the following ways to start the Frontend:

#### Run Frontend with Docker

- run `docker-compose up -d` in the `root` folder

#### Run Frontend locally

- run `docker-compose up -d database proxy`in the `root` folder
- run `yarn dev` in the `frontend` folder

### Search Behavior and Limits

The full-text search is executed in PostgreSQL (`open_discourse.search_speeches`) across the full indexed dataset.

To keep API responses stable and avoid memory issues with very large speech texts, the proxy currently returns a capped result set:

- default/browse mode (no query): 200 rows
- active search/filter mode: 200 rows

With the current frontend table page size (`10`), this yields up to `20` pages per request.

If you need to navigate _all_ matching results in the UI, the recommended next step is server-side pagination (`page`, `pageSize`, `totalCount`) instead of returning unbounded payloads.

## Further Documentation

- Documentation of the database can be found in the [README in database](./database/README.md)
- Documentation of the frontend can be found in the [README in frontend](./frontend/README.md)
- Documentation of the proxy can be found in the [README in proxy](./proxy/README.md)
- Documentation of the python service can be found in the [README in python](./python/README.md)
- Documentation of every python-script can be found in the [README in python/src](./python/src/README.md)

## Notes

- We use [Python 3.7.4](https://www.python.org/downloads/release/python-374/) [d](https://bit.ly/2KE5DFm)uring development of the project
- The graphql endpoint was deprecated and removed by version 1.1.0
