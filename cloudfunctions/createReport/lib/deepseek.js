/**
 * DeepSeek API 调用
 * 模型优先级：TEXT_MODEL > DEEPSEEK_MODEL > 默认 deepseek-v4-flash
 */

const https = require('https')

const DEFAULT_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_TEXT_MODEL = 'deepseek-v4-flash'

function getTextModel() {
  return process.env.TEXT_MODEL || process.env.DEEPSEEK_MODEL || DEFAULT_TEXT_MODEL
}

function callDeepSeek(options) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('未配置 DEEPSEEK_API_KEY 环境变量'))
  }

  const apiUrl = process.env.DEEPSEEK_API_URL || DEFAULT_API_URL
  const model = getTextModel()
  const url = new URL(apiUrl)

  const payload = JSON.stringify({
    model: model,
    messages: options.messages,
    response_format: { type: 'json_object' },
    temperature: options.temperature !== undefined ? options.temperature : 0.7
  })

  const requestOptions = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
      'Content-Length': Buffer.byteLength(payload)
    }
  }

  return new Promise(function (resolve, reject) {
    const req = https.request(requestOptions, function (res) {
      let body = ''

      res.on('data', function (chunk) {
        body += chunk
      })

      res.on('end', function () {
        try {
          const parsed = JSON.parse(body)

          if (res.statusCode !== 200) {
            const errMsg =
              (parsed.error && parsed.error.message) ||
              ('DeepSeek API 错误: HTTP ' + res.statusCode)
            return reject(new Error(errMsg))
          }

          const content =
            parsed.choices && parsed.choices[0] && parsed.choices[0].message
              ? parsed.choices[0].message.content
              : ''

          if (!content) {
            return reject(new Error('DeepSeek API 返回内容为空'))
          }

          resolve(content)
        } catch (err) {
          reject(new Error('DeepSeek API 响应解析失败: ' + err.message))
        }
      })
    })

    req.setTimeout(55000, function () {
      req.destroy()
      reject(new Error('DeepSeek API 请求超时，请稍后重试'))
    })

    req.on('error', function (err) {
      reject(new Error('DeepSeek API 请求失败: ' + err.message))
    })

    req.write(payload)
    req.end()
  })
}

module.exports = {
  callDeepSeek,
  getTextModel
}
