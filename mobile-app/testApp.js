const fs = require('node:fs')
const libxml = require("libxmljs2")

const content = fs.readFileSync('./config.xml', {encoding: 'utf-8'})
console.log('content =', content)
let xmlConfig = libxml.parseXmlString(content).parent().childNodes()
console.log('xmlConfig =', xmlConfig[1].toString())