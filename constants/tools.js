/**
 * 工具大厅静态配置（Tab 页专用，避免加载 Canvas 等重模块）
 */

const TOOLS = [
  {
    id: 'college',
    name: 'AI高考志愿规划助手',
    desc: '高考成绩分析 · 专业方向推荐 · 志愿建议报告',
    route: '/pages/college/index/index'
  },
  {
    id: 'growth',
    name: 'AI儿童成长档案',
    desc: '记录孩子成长表现 · 生成成长报告',
    route: '/pages/growth/index/index'
  },
  {
    id: 'memory',
    name: 'AI老照片故事',
    desc: '照片 + 记忆 · 生成家庭故事',
    route: '/pages/memory/index/index'
  }
]

const ROUTES = {
  home: '/pages/home/home',
  record: '/pages/record/record',
  mine: '/pages/mine/mine',
  growth: {
    index: '/pages/growth/index/index',
    create: '/pages/growth/create/create',
    report: '/pages/growth/report/report',
    timeline: '/pages/growth/timeline/timeline',
    childAdd: '/pages/growth/child-add/child-add'
  },
  memory: {
    index: '/pages/memory/index/index',
    create: '/pages/memory/create/create',
    story: '/pages/memory/story/story',
    history: '/pages/memory/history/history'
  },
  college: {
    index: '/pages/college/index/index'
  }
}

module.exports = {
  TOOLS,
  ROUTES
}
