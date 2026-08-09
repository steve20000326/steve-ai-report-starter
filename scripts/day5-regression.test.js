/**
 * Day5 回归测试
 * node scripts/day5-regression.test.js
 */

const assert = require('assert')
const { validateOldPhotoStoryOutput, validateChildGrowthOutput } = require('../cloudfunctions/common/jsonParser')
const { adaptPhotoStory } = require('../utils/photoAdapter')

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

console.log('\n=== Day5 Regression Tests ===\n')

test('old_photo_story 输出校验', () => {
  const out = validateOldPhotoStoryOutput({
    title: '第一辆自行车',
    subtitle: '1983 · 夏天',
    opening: '那天下午，阳光很好。',
    story: 'a'.repeat(400),
    memoryDetails: ['爸爸买了自行车'],
    closing: '许多年后，我还记得。',
    shareExcerpt: '1983年夏天，爸爸推回家第一辆自行车。',
    factNote: '本故事仅基于用户提供的记忆整理。'
  })
  assert.ok(out.story.length >= 400)
})

test('photoAdapter 读取 content', () => {
  const view = adaptPhotoStory({
    type: 'old_photo_story',
    title: '标题',
    input: { photoFileId: 'cloud://x', approxYear: '1983' },
    content: {
      subtitle: '副标题',
      story: '正文',
      opening: '开篇',
      closing: '收束'
    }
  })
  assert.strictEqual(view.title, '标题')
  assert.strictEqual(view.story, '正文')
})

test('child_growth 解析未破坏', () => {
  const out = validateChildGrowthOutput({
    title: '成长',
    factSummary: '事实',
    growthObservation: '观察',
    keywords: ['a'],
    parentResponse: '具体回应话术',
    nextSuggestion: '期待',
    summary: '摘要'
  })
  assert.ok(out.factSummary)
})

test('deepseek 使用 TEXT_MODEL 环境变量', () => {
  const fs = require('fs')
  const src = fs.readFileSync(require('path').join(__dirname, '../cloudfunctions/common/deepseek.js'), 'utf8')
  assert.ok(src.indexOf('TEXT_MODEL') !== -1)
  assert.ok(src.indexOf('deepseek-v4-flash') !== -1)
  assert.ok(src.indexOf("process.env.TEXT_MODEL") !== -1)
})

test('createReport 支持 old_photo_story 分支', () => {
  const fs = require('fs')
  const src = fs.readFileSync(require('path').join(__dirname, '../cloudfunctions/createReport/index.js'), 'utf8')
  assert.ok(src.indexOf("reportType === 'old_photo_story'") !== -1)
  assert.ok(src.indexOf('buildPhotoStoryInput') !== -1)
})

test('feedback 支持 photo 评分', () => {
  const fs = require('fs')
  const src = fs.readFileSync(require('path').join(__dirname, '../cloudfunctions/submitFeedback/index.js'), 'utf8')
  assert.ok(src.indexOf('very_similar') !== -1)
})

console.log('\n--- Results ---')
console.log('Passed:', passed, 'Failed:', failed)
if (failed) process.exit(1)
console.log('\nALL DAY5 TESTS PASSED\n')
