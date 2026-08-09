/**
 * Day5.5 回归测试 — 多产品架构
 * node scripts/day5.5-regression.test.js
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log('  ✓', name)
  } catch (e) {
    failed++
    console.error('  ✗', name, '-', e.message)
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

console.log('\n=== Day5.5 Regression Tests ===\n')

test('app.json TabBar 为 工具/记录/我的', () => {
  const app = JSON.parse(read('app.json'))
  assert.strictEqual(app.tabBar.list[0].text, '工具')
  assert.strictEqual(app.tabBar.list[0].pagePath, 'pages/home/home')
  assert.strictEqual(app.tabBar.list[1].text, '记录')
  assert.strictEqual(app.tabBar.list[2].text, '我的')
})

test('home 页面存在', () => {
  assert.ok(fs.existsSync(path.join(root, 'pages/home/home.js')))
})

test('business 三模块存在', () => {
  assert.ok(fs.existsSync(path.join(root, 'business/growth/index.js')))
  assert.ok(fs.existsSync(path.join(root, 'business/college/index.js')))
  assert.ok(fs.existsSync(path.join(root, 'business/memory/index.js')))
})

test('prompts 三文件存在', () => {
  assert.ok(fs.existsSync(path.join(root, 'prompts/child_growth.js')))
  assert.ok(fs.existsSync(path.join(root, 'prompts/college_choice.js')))
  assert.ok(fs.existsSync(path.join(root, 'prompts/old_photo_story.js')))
})

test('schemas 三文件存在', () => {
  assert.ok(fs.existsSync(path.join(root, 'schemas/growthSchema.js')))
  assert.ok(fs.existsSync(path.join(root, 'schemas/collegeSchema.js')))
  assert.ok(fs.existsSync(path.join(root, 'schemas/memorySchema.js')))
})

test('share 三卡片存在', () => {
  assert.ok(fs.existsSync(path.join(root, 'share/growthCard.js')))
  assert.ok(fs.existsSync(path.join(root, 'share/collegeCard.js')))
  assert.ok(fs.existsSync(path.join(root, 'share/memoryCard.js')))
})

test('growth 页面路由已迁移', () => {
  assert.ok(fs.existsSync(path.join(root, 'pages/growth/create/create.js')))
  const src = read('pages/growth/create/create.js')
  assert.ok(src.indexOf('/pages/growth/report/report') !== -1)
})

test('memory 页面路由已迁移', () => {
  assert.ok(fs.existsSync(path.join(root, 'pages/memory/create/create.js')))
  const src = read('pages/memory/create/create.js')
  assert.ok(src.indexOf('/pages/memory/story/story') !== -1)
})

test('college 占位页存在', () => {
  const src = read('pages/college/index/index.js')
  assert.ok(src.indexOf('功能开发中') === -1)
  assert.ok(fs.existsSync(path.join(root, 'pages/college/index/index.wxml')))
  assert.ok(read('pages/college/index/index.wxml').indexOf('功能开发中') !== -1)
})

test('createReport 写入 product 字段', () => {
  const src = read('cloudfunctions/createReport/index.js')
  assert.ok(src.indexOf('product: resolveProduct(reportType)') !== -1)
})

test('products 映射正确', () => {
  const { getProduct, PRODUCTS } = require('../constants/products')
  assert.strictEqual(getProduct('child_growth'), PRODUCTS.GROWTH)
  assert.strictEqual(getProduct('old_photo_story'), PRODUCTS.MEMORY)
})

test('Tab 页不依赖 business 重模块', () => {
  const homeSrc = read('pages/home/home.js')
  const mineSrc = read('pages/mine/mine.js')
  const recordSrc = read('pages/record/record.js')
  assert.ok(homeSrc.indexOf("require('../../business/") === -1)
  assert.ok(mineSrc.indexOf("require('../../business/") === -1)
  assert.ok(recordSrc.indexOf("require('../../business/") === -1)
  assert.ok(fs.existsSync(path.join(root, 'constants/tools.js')))
})

test('旧路径保留 redirect 兼容', () => {
  const src = read('pages/index/index.js')
  assert.ok(src.indexOf('/pages/growth/index/index') !== -1)
})

console.log('\n结果:', passed, 'passed,', failed, 'failed\n')
process.exit(failed > 0 ? 1 : 0)
