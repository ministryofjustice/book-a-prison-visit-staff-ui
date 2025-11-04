export default {
  '*.{ts,js,mjs,css}': ['prettier --write', 'eslint --fix --max-warnings 0'],
  '*.json': ['prettier --write'],
}
