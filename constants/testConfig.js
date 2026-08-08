/**
 * 开发测试模式配置
 * 正式环境必须保持 TEST_MODE: false
 */
module.exports = {
  TEST_MODE: false,
  TEST_EVENTS: [
    {
      id: '1',
      label: '帮奶奶收拾碗筷',
      eventText:
        '小宇今天吃完晚饭以后，看见奶奶腿不舒服，主动帮奶奶把碗筷收进厨房。',
      eventTag: '帮助别人'
    },
    {
      id: '2',
      label: '自己重做错题',
      eventText:
        '今天数学只考了76分，他有点难过，但晚上自己重新把三道错题做了一遍。',
      eventTag: '坚持完成'
    },
    {
      id: '3',
      label: '忍住没推妹妹',
      eventText:
        '妹妹把他的积木弄倒了，他本来很生气，后来自己停下来，没有推妹妹。',
      eventTag: '小进步'
    }
  ]
}
