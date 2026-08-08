const { callCloud, CLOUD_FUNCTIONS } = require('./cloud')

function createReport(type, input, childId) {
  return callCloud(CLOUD_FUNCTIONS.CREATE_REPORT, { type, input, childId })
}

function retryReport(retryReportId) {
  return callCloud(CLOUD_FUNCTIONS.CREATE_REPORT, { retryReportId })
}

function getReport(reportId) {
  return callCloud(CLOUD_FUNCTIONS.GET_REPORT, { reportId })
}

function listReports(options = {}) {
  return callCloud(CLOUD_FUNCTIONS.LIST_REPORTS, options)
}

module.exports = {
  createReport,
  retryReport,
  getReport,
  listReports
}
