const { ROUTES } = require('../../constants/tools')

module.exports = {
  id: 'memory',
  name: 'AI老照片故事',
  reportType: 'old_photo_story',
  routes: ROUTES.memory,
  get prompt() {
    return require('../../prompts/old_photo_story')
  },
  get schema() {
    return require('../../schemas/memorySchema')
  },
  get share() {
    return require('../../share/memoryCard')
  }
}
