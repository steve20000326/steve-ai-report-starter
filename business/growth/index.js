const { ROUTES } = require('../../constants/tools')

module.exports = {
  id: 'growth',
  name: 'AI儿童成长档案',
  reportType: 'child_growth',
  routes: ROUTES.growth,
  get prompt() {
    return require('../../prompts/child_growth')
  },
  get schema() {
    return require('../../schemas/growthSchema')
  },
  get share() {
    return require('../../share/growthCard')
  }
}
