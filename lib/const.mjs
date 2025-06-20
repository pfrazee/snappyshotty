import path from 'node:path'

export const DATA_DIR = process.env.DATA_DIR || '.'
export const REPOS_JSON = path.join(DATA_DIR, '.repos.json')
export const REPOS_DIR = path.join(DATA_DIR, '.repos')
export const CSVS_DIR = path.join(DATA_DIR, '.csv')
export const TASKS_DIR = path.join(DATA_DIR, '.tasks')
export const RELAY1_WEST = 'https://relay1.us-west.bsky.network'
