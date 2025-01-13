/* eslint-disable no-undef */
import { render } from './templateRender.js'
import { env } from '../../../env.js'

window.log = function (typeMsg, msg, state) {
  // console.log('-> log, typeMsg =', typeMsg, '  --  msg =', msg)
  state.logs.push({ typeMsg, msg })
  render(state)
}


/**
 * Read configuration file
 * @param {object} state
 */
async function readFromFile(state) {
  const pathToFile = state.basePath + state.saveFileName
  // console.log('-> readFromFile, pathToFile =', pathToFile)

  return await new Promise((resolve) => {
    window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
      fileEntry.file(function (file) {
        const reader = new FileReader()
        reader.onloadend = function () {
          resolve(JSON.parse(this.result))
        }
        reader.readAsText(file)
      }, () => { resolve(null) })
    }, () => { resolve(null) })
  })
}

/**
 * Write configuration file
 * @param {object} state
 * @returns {boolean}
 */
async function writeToFile(state) {
  // console.log('-> writeToFile, saveFileName =', state.saveFileName, '  --  basePath =', state.basePath)
  const rawData = state.configuration
  const data = JSON.stringify(rawData)

  return await new Promise((resolve) => {
    window.resolveLocalFileSystemURL(state.basePath, function (directoryEntry) {
      directoryEntry.getFile(state.saveFileName, { create: true },
        function (fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function () {
              // file write ok
              resolve(true)
            }
            fileWriter.onerror = function (e) {
              // you could hook this up with our global error handler, or pass in an error callback
              console.log('info, write failed: ' + e.toString())
              resolve(false)
            }
            const blob = new Blob([data], { type: 'text/plain' })
            fileWriter.write(blob)
          }, () => { resolve(false) })
        }, () => { resolve(false) })
    }, () => { resolve(false) })
  })
}

async function getInfosConfigXml() {
  const name = await cordova.getAppVersion.getAppName()
  const packageName = await cordova.getAppVersion.getPackageName()
  const versionCode = await cordova.getAppVersion.getVersionCode()
  const versionNumber = await cordova.getAppVersion.getVersionNumber()
  return { name, packageName, versionCode, versionNumber }
}

function generatePassword(length) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let password = ""
  const array = new Uint32Array(length)
  window.crypto.getRandomValues(array)
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length] // % operator returns remainder of division
  }
  return password
}

/**
 * Find specific server in configuration
 * @param {string} urlServer - server to find 
 * @param {object} configuration - app configuration 
 * @returns {undefined|object}
 */
function findDataServerFromConfiguration(urlServer, configuration) {
  if (urlServer === undefined) {
    return undefined
  }
  return configuration.servers.find(item => item.server === urlServer)
}

/**
 * Update configuration file
 * @param {object} retour 
 * @returns {boolean}
 */
async function updateConfigurationFile(options, state) {
  // console.log('-> updateConfigurationFile, configuration =', state.configuration)
  const password = generatePassword(30)

  state.configuration['hostname'] = options.hostname
  state.configuration['uuidDevice'] = device.uuid
  state.configuration['ip'] = state.ip
  state.configuration['pin_code'] = options.pinCode
  state.configuration.client = {
    password,
    username: options.username,
    pin_code: options.pinCode
  }

  const testServerIn = findDataServerFromConfiguration(options.retour.server_url, state.configuration)

  // serveur inéxistant dans le fichier de conf, ajouter le
  if (testServerIn === undefined) {
    const newServer = {
      server: options.retour.server_url,
      // locale: options.retour.locale,
      publicKeyPem: options.retour.server_public_pem,
      locale: options.retour.locale,
      client: state.configuration.client
    }
    state.configuration.servers.push(newServer)
  } else {
    const filterServers = state.configuration.servers.filter(item => item.server !== options.retour.server_url)
    state.configuration.servers = filterServers
    state.configuration.servers.push(newServer)
  }

  state.configuration.current_server = options.retour.server_url
  // console.log('-> avant maj fichier, configuration =', state.configuration)
  return await writeToFile(state)
}

function listenNfcAndShow() {
  nfc.addTagDiscoveredListener((nfcEvent) => {
    let tagId = nfc.bytesToHexString(nfcEvent.tag.id)
    document.querySelector('#rep-tag-id').innerHTML = tagId.toUpperCase()
  })
}

// bluetooth actif ?
export function bluetoothTest(state) {
  let netDevice = new CustomEvent('msg_device', {})

  try {
    bluetoothSerial.isEnabled(
      function () {
        console.log("Bluetooth is enabled")
        // status on
        state.devices.find(device => device.name === 'bluetooth').status = 'on'
        // message send
        document.dispatchEvent(netDevice)
      },
      function () {
        console.log("Bluetooth is *not* enabled")
        // status off
        state.devices.find(device => device.name === 'bluetooth').status = 'off'
        // message send
        document.dispatchEvent(netDevice)
      }
    )
  } catch (error) {
    console.log("bluetoothSerial.enable, ", error)
    log('error', 'bluetooth: ' + error, 'danger')
    // message network off
    detail.status = 'off'
    document.dispatchEvent(netDevice)
  }
}

// network actif ?
export function networkTest(state) {
  let detail = {
    name: 'network',
    status: 'on'
  }
  let netDevice = new CustomEvent('msg_device', { detail })
  // get ip from wifi (actif après 8 secondes) and 3-5G
  networkinterface.getWiFiIPAddress(function (ipInformation) {
    // wifi ok
    state.ip = ipInformation.ip
    // status on
    state.devices.find(device => device.name === 'network').status = 'on'
    // message network on
    document.dispatchEvent(netDevice)
  }, function () {
    // wifi erreur alors get ip from 3-5G
    networkinterface.getCarrierIPAddress(function (ipInformation) {
      // 3-5G OK
      // console.log("IP: " + ipInformation.ip + " subnet:" + ipInformation.subnet)
      state.ip = ipInformation.ip
      // status on
      state.devices.find(device => device.name === 'network').status = 'on'
      // message network on
      document.dispatchEvent(netDevice)
    }, function (erreur) {
      // 3-5G erreur
      log('error', 'network: ' + erreur, 'danger')
      state.ip = '127.0.0.1'
      // status off
      state.devices.find(device => device.name === 'network').status = 'off'
      // message network off
      detail.status = 'off'
      document.dispatchEvent(netDevice)
    })
  })

  /*
  // dev code test
  state.ip = '127.0.0.1'
  state.devices.find(device => device.name === 'network').status = 'off'
  detail.status = 'off'
  document.dispatchEvent(netDevice)
  */
}

// nfc actif ?
export function nfcTest(state) {
  let detail = {
    name: 'nfc',
    status: 'on',
    log: { typeMsg: 'success', msg: 'NFC enabled !' }
  }
  let nfcDevice = new CustomEvent('msg_device', { detail })
  nfc.enabled(() => {
    // message nfc on
    state.devices.find(device => device.name === 'nfc').status = 'on'
    // emit message
    document.dispatchEvent(nfcDevice)
    listenNfcAndShow()
  }, (error) => {
    console.log('ncf.enable =', error)
    state.devices.find(device => device.name === 'nfc').status = 'off'
    detail.status = 'off'
    detail.log = { typeMsg: 'error', msg: 'ncf.enable, ' + error }
    // emit message
    document.dispatchEvent(nfcDevice)
  })

  /*
  // dev code test
  state.devices.find(device => device.name === 'nfc').status = 'off'
  detail.status = 'off'
  document.dispatchEvent(nfcDevice)
  */
}

// attention listenDevices must start before all tests devices
export async function listenDevices(state) {
  // wait devices on
  document.addEventListener('msg_device', async () => {
    let allDevicesOn = true
    state.devices.forEach(device => {
      // détermine allDevicesOn
      if (device.status === 'off') {
        allDevicesOn = false
      }
    })

    // go step 'ALL_DEVICES_ON' 
    if (allDevicesOn) {
      ma.run('ALL_DEVICES_ON')
    } else {
      render(state)
    }
  })
}

export async function getConfigFromFile(state) {
  const configFromFile = await readFromFile(state)
  if (configFromFile !== null) {
    state.configuration = configFromFile
  } else {
    state.configuration = env
  }
  // add info version apk
  const configXmlData = await getInfosConfigXml()
  state.configuration['versionApk'] = configXmlData.versionNumber
  // ma.run('START')
  ma.run('LIST_SERVERS')
}

export function launchRender(state) {
  render(state)
}

export function getPinCode(state) {
  state.pinCode = ''
  render(state)
}

export function checkPinCode(state) {
  // console.log('-> checkPinCode, state =', state);
  // valeur pin code (string)
  const valueElement = document.querySelector('#pin-code').value

  state.errorValuePinCode = ''
  if (valueElement === '') {
    state.errorValuePinCode = 'no pin code !'
  }

  if ((valueElement.length > 6 || valueElement.length < 6) && valueElement !== '') {
    state.errorValuePinCode = 'Il faut 6 chiffres pour le pin code.'
  }

  // maj pinCode
  state.pinCode = parseInt(valueElement)
  if (state.errorValuePinCode === '') {
    ma.run('GET_SERVER_FROM_PIN_CODE')
  } else {
    ma.run('GET_PIN_CODE')
  }
}

export function activeSpinner(state) {
  state.spinner = true
  render(state)
}

export function disableSpinner(state) {
  state.spinner = false
  render(state)
}

export async function getUrlServerFromPinCode(state) {
  // console.log('-> getUrlServerFromPinCode, state =', state)
  try {
    const pinCode = state.pinCode
    const hostname = slugify(device.manufacturer + '-' + device.model + '-' + device.uuid)
    // client/app
    let username
    if (window.crypto.randomUUID) {
      username = slugify(device.manufacturer + '-' + device.model + '-' + device.uuid + '-' + window.crypto.randomUUID())
    } else {
      username = slugify(device.manufacturer + '-' + device.model + '-' + device.uuid + '-' + (window.URL.createObjectURL(new Blob([])).substring(31)))
    }

    log('info', 'hostname = ' + hostname, state)
    log('info', 'username = ' + username, state)

    // curl -X POST https://discovery.filaos.re/pin_code/ -H "Content-Type: application/x-www-form-urlencoded" -d "pin_code=695610" -v

    let data = new URLSearchParams()
    data.append('pin_code', pinCode)
    data.append('hostname', hostname)
    data.append('username', username)
    const response = await fetch(state.configuration.server_pin_code + '/pin_code/', {
      mode: 'cors',
      method: 'POST',
      body: data
    })
    const retour = await response.json()
    disableSpinner(state)
    console.log('-> getUrlServerFromPinCode, retour =', retour)
    if (response.status === 200) {
      const retourUpdate = await updateConfigurationFile({ retour, pinCode, hostname, username }, state)
      // console.log('retourUpdate =', retourUpdate)
      if (retourUpdate === false) {
        log('error', 'Erreur lors de mise à jour de la configuration.', state)
      } else {
        log('info', 'Mise à jour de la configuration.', state)
      }
      log('success', 'Current server = ' + state.configuration.current_server, state)
      ma.run('LIST_SERVERS')
    } else {
      throw new Error('No server from this pinCode')
    }
  } catch (error) {
    // console.log('-> getUrlServerFromPinCode,', error)
    log('error', '-> ' + error, state)
    disableSpinner(state)
    ma.run('GET_PIN_CODE')
  }
  render(state)
}

export async function deleteServer(state) {
  const server = state.params
  // console.log('-> deleteServer, server =', server)
  // change current server and client if url is the current server
  if (state.configuration.current_server === server) {
    state.configuration.current_server = ''
    state.configuration.client = null
    state.configuration.pin_code = ''
  }
  // delete server data from servers list
  const newServers = state.configuration.servers.filter(item => item.server !== server)
  state.configuration.servers = newServers

  // update configuration file
  const result = await writeToFile(state)

  if (result === true) {
    ma.run('LIST_SERVERS')
  } else {
    log('error', '-> Delete server error.', state)
  }
}

/**
 * Update current server and go LaBoutik
 * @param {object} state - application state 
 */
export async function goLaboutik(state) {
  if (window.navigator.onLine) {
    const server = state.params
    activeSpinner(state)
    console.log('-> goLaboutik, server =', server)
    const client = state.configuration.servers.find(item => item.server === server).client
    console.log('-> client =', client)
    // change current server
    state.configuration.current_server = server
    // change client of the new current server
    state.configuration.client = client
    // change le pin code of the new current server
    state.configuration.pin_code = client.pin_code
    // update configuration file
    const result = await writeToFile(state)
    console.log('result =', result)

    if (result === true) {
      window.location = server + state.urlLogin
    } else {
      log('error', '-> Change current server error.', state)
      disableSpinner(state)

    }
  } else {
    ma.run('NO_NETWORK')
  }
}