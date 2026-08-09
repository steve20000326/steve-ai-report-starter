const { ROUTES } = require('../../constants/tools')

module.exports = {
  id: 'college',
  name: 'AI高考志愿规划助手',
  reportType: 'college_choice',
  enabled: false,
  routes: ROUTES.college,
  get prompt() {
    return require('../../prompts/college_choice')
  },
  get schema() {
    return require('../../schemas/collegeSchema')
  },
  get share() {
    return require('../../share/collegeCard')
  }
}
