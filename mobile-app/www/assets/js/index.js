// let basePath = cordova.file.externalRootDirectory + "Documents/"
/** @typedef {import("./module").env} env */
import { env } from '../../env.js'

let ip, basePath, saveFileName = 'configLaboutik.json', urlLogin = 'wv/login_hardware'
let configuration = env
let devicesStatus = [
  { name: 'network', status: 'off', method: 'networkTest' },
  { name: 'nfc', status: 'off', method: 'nfcTest' }
]
let pinCodeLimit = 6, proprioLimit = 3, step = 0


window.testPrint = function () {
  cordova.plugins.printer.print('<b>Hello Cordova!</b>')
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

async function readFromFile() {
  const pathToFile = basePath + saveFileName
  // console.log('-> readFromFile, pathToFile =', pathToFile)

  const promiseReadFromFile = new Promise((resolve) => {
    window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
      fileEntry.file(function (file) {
        const reader = new FileReader()
        reader.onloadend = function (e) {
          resolve(JSON.parse(this.result))
        }
        reader.readAsText(file)
      }, () => { resolve(null) })
    }, () => { resolve(null) })
  })

  return await promiseReadFromFile
}

/**
 * Write configuration file
 * @param {object} rawData 
 * @returns {boolean}
 */
async function writeToFile(rawData) {
  // console.log('-> writeToFile, saveFileName =', saveFileName, '  --  basePath =', basePath)
  const data = JSON.stringify(rawData)

  const promiseWiteToFile = new Promise((resolve) => {
    window.resolveLocalFileSystemURL(basePath, function (directoryEntry) {
      directoryEntry.getFile(saveFileName, { create: true },
        function (fileEntry) {
          fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function (e) {
              // console.log('info , write of file "' + saveFileName + '" completed.')
              resolve(true)
            }
            fileWriter.onerror = function (e) {
              // you could hook this up with our global error handler, or pass in an error callback
              console.log('info, write failed: ' + e.toString())
            }
            const blob = new Blob([data], { type: 'text/plain' })
            fileWriter.write(blob)
          }, () => { resolve(false) })
        }, () => { resolve(false) })
    }, () => { resolve(false) })
  })
  return await promiseWiteToFile
}

window.showStep1 = function () {
  // console.log('-> showStep1, configuration.current_server =', configuration.current_server)
  // effache interface step2
  document.querySelector('#step-2').style.display = 'none'
  // affiche interface step1
  document.querySelector('#step-1').style.display = 'flex'
  // efface message
  document.querySelector('#retour-pin-code').innerText = ''
  // fichier de configuration présent
  if (configuration.current_server !== '') {
    // affichage du bouton annuler de l'interface #step-1 pour une future utilisation
    document.querySelector('#step1-bt-annuler').style.display = 'flex'
  }
}

window.showStep2 = function () {
  // effache interface step1
  document.querySelector('#step-1').style.display = 'none'
  // affiche interface step2
  document.querySelector('#step-2').style.display = 'flex'
  // affiche le serveur en cours
  document.querySelector('#info-server').innerText = configuration.current_server

}

window.hideModalConfirm = function () {
  document.querySelector('#modal-confirm').style.display = 'none'
}

window.confirmReset = function () {
  document.querySelector('#modal-confirm-infos').innerHTML = `<div>Confirmer la suppression</div>
  <div>de la configuration</div>
  <div>du serveur ${configuration.current_server}.</div>`
  document.querySelector('#modal-confirm-valider').setAttribute('onclick', 'reset(); hideModalConfirm()')
  document.querySelector('#modal-confirm').style.display = 'flex'
}

// supprime la configuration du serveur courant
window.reset = async function () {
  // supprime le serveur courrant
  const newServers = configuration.servers.filter(item => item.server !== configuration.current_server)
  configuration.servers = newServers
  configuration.client = null
  configuration.current_server = ''
  const retour = await writeToFile(configuration)
  if (retour === true) {
    afficherMessage(`Reset: serveur supprimé.`)
  } else {
    afficherMessage(`Erreur, lors du reset.`, 'danger')
  }
  showStep1()
}

/**
 * Launches the app
 */
window.startApp = async function () {
  // console.log('-> startApp, configuration =', configuration)
  window.location = configuration.current_server + urlLogin
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
async function updateConfigurationFile(options) {
  // console.log('-> updateConfigurationFile, configuration =', configuration)

  const configXmlData = await getInfosConfigXml()
  const versionNumber = configXmlData.versionNumber

  configuration['hostname'] = options.hostname
  configuration['uuidDevice'] = device.uuid
  configuration['ip'] = ip
  configuration['pin_code'] = options.pinCode
  configuration['version'] = versionNumber
  configuration.client = {
    password: generatePassword(30),
    username: options.username
  }

  const testServerIn = findDataServerFromConfiguration(options.retour.server_url, configuration)
  const newServer = {
    server: options.retour.server_url,
    // locale: options.retour.locale,
    publicKeyPem: options.retour.server_public_pem
  }

  // serveur inéxistant dans le fichier de conf, ajouter le
  if (testServerIn === undefined) {
    configuration.servers.push(newServer)
  } else {
    const filterServers = configuration.servers.filter(item => item.server !== options.retour.server_url)
    configuration.servers = filterServers
    configuration.servers.push(newServer)
  }

  configuration.current_server = options.retour.server_url
  return await writeToFile(configuration)
}

/**
 * get pin code from "server pinCode"
 */
window.getUrlServerFromPinCode = async function () {
  // console.log('-> getUrlServerFromPinCode.')
  const valueElement = document.querySelector('#pinCode').value
  if (valueElement !== '') {
    const pinCode = parseInt(valueElement)
    const hostname = slugify(device.manufacturer + '-' + device.model + '-' + device.uuid)
    // client/app
    let username
    if (window.crypto.randomUUID) {
      username = slugify(device.manufacturer + '-' + device.model + '-' + device.uuid + '-' + window.crypto.randomUUID())
    } else {
      username = slugify(device.manufacturer + '-' + device.model + '-' + device.uuid + '-' + (window.URL.createObjectURL(new Blob([])).substring(31)))
    }

    // console.log('pinCode =', pinCode)
    // curl -X POST https://discovery.filaos.re/pin_code/ -H "Content-Type: application/x-www-form-urlencoded" -d "pin_code=695610" -v
    try {
      let data = new URLSearchParams()
      data.append('pin_code', pinCode)
      data.append('hostname', hostname)
      data.append('username', username)
      const response = await fetch(configuration.server_pin_code + '/pin_code/', {
        mode: 'cors',
        method: 'POST',
        body: data
      })
      const retour = await response.json()
      // console.log('-> getUrlServerFromPinCode, retour =', retour)
      if (response.status === 200) {
        const retourUpdate = await updateConfigurationFile({ retour, pinCode, hostname, username })
        // console.log('retourUpdate =', retourUpdate)
        if (retourUpdate === false) {
          afficherMessage('Erreur lors de mise à jour de la configuration.', 'danger')
        } else {
          afficherMessage('Mise à jour de la configuration.')
        }

        showStep2()
        // info
        document.querySelector('#info-server').innerText = configuration.current_server
      } else {
        throw new Error('No server from this pinCode')
      }
    } catch (err) {
      console.log('-> getUrlServerFromPinCode, error :', err)
      afficherMessage(err.message, 'danger')
      document.querySelector('#retour-pin-code').innerText = err.message
    }
  } else {
    document.querySelector('#retour-pin-code').innerText = "No pinCode"
  }
}

/**
 * insert/affiche des messages dans l'élément #app-log
 * 
 * @param {string} message - votre message
 * @param {string} typeMessage - '' ou 'danger', modifie la couleur du message
 */
function afficherMessage(message, typeMessage) {
  let styleMessage = `style="color:#000;"`
  if (typeMessage === 'danger') {
    styleMessage = `style="color:#F00;"`
  }
  document.querySelector('#app-log').innerHTML += `<div ${styleMessage}>${message}</div>`
}

/**
 * Informe de l'activation du nfc (test blocant)
 */
window.nfcTest = function () {
  nfc.enabled(() => {
    afficherMessage('NFC activé !')
    // message nfc on
    const nfcDevice = new CustomEvent('msg_device', {
      detail: {
        name: 'nfc',
        status: 'on'
      }
    })
    // emit message
    document.dispatchEvent(nfcDevice)

  }, (err) => {
    console.log('ncf.enable,', err)
    // insérez l'icon pas de nfc + message
    let frag = `
      <div  id="alert-nfc" class="ligne-alerte BF-col">
        <div class="message-icon">
          <div class="BF-ligne">- NFC désactivé, </div>
          <div class="BF-ligne">Vous devez l'activer et relancer l'application !</div>
        </div>
        <span>
          <svg version="1.1" width="134.39999" height="106.56" viewBox="0 0 84.480003 49.919998">
            <path
               style="fill:#ff0000;stroke-width:0.31197804"
               d="m 67.026441,48.808099 c -3.217794,-1.01314 -6.155593,-3.158105 -7.581157,-5.535201 -0.607787,-1.013467 -1.021555,-1.046548 -2.83539,-0.226691 -2.370349,1.071401 -3.997787,0.84986 -7.980097,-1.086329 -3.963681,-1.927132 -4.863684,-2.708172 -5.089504,-4.416767 -0.125397,-0.948767 0.01378,-1.449635 0.66844,-2.40563 l 0.826809,-1.207378 -1.736865,-1.542038 c -1.623677,-1.441547 -1.736861,-1.633894 -1.736861,-2.95162 0,-1.001904 -0.113009,-1.365216 -0.390731,-1.256176 -0.214902,0.08437 -7.618927,4.517288 -16.45339,9.850916 -8.834463,5.333631 -16.0958889,9.658262 -16.1365049,9.610298 -0.248585,-0.293577 -1.119431,-2.182796 -1.036009,-2.247527 0.05566,-0.04319 6.9936869,-4.186466 15.4178449,-9.207286 8.424158,-5.020818 15.561442,-9.293316 15.860629,-9.494438 0.449738,-0.302325 -0.173019,-0.509422 -3.594724,-1.195417 -2.276286,-0.456358 -5.259614,-0.972416 -6.629616,-1.146797 -4.835209,-0.615447 -6.105843,-1.313262 -6.104281,-3.352386 7.5e-4,-0.975683 1.066569,-6.537564 2.499678,-13.0443102 0.21258,-0.9651823 0.677924,-1.9348008 1.158123,-2.4131372 0.694208,-0.6915167 1.072449,-0.7996377 2.797379,-0.7996377 1.097045,0 3.293308,0.2729735 4.880585,0.6066079 1.587274,0.3336345 5.136564,0.9740365 7.887309,1.4231161 7.747887,1.2648998 10.545524,1.9367185 11.174903,2.6835203 0.357538,0.4242401 0.547024,1.1764228 0.547024,2.1714468 v 1.522367 l 3.985455,-8.72e-4 3.985455,-8.71e-4 9.374393,-5.5998918 9.374393,-5.5998912 0.773244,0.7702445 c 0.487629,0.4857383 0.66198,0.8755068 0.472025,1.0552217 -0.16567,0.1567376 -4.102093,2.5756775 -8.747608,5.3754223 l -8.446389,5.0904415 1.905654,1.868235 c 1.745989,1.711708 3.624598,4.397797 10.888454,15.568627 6.788252,10.439412 7.094588,11.053725 5.512141,11.053725 -0.715713,0 -1.025916,-0.412033 -4.922869,-6.538823 C 71.900212,27.236794 66.504534,19.280158 65.148451,17.83602 62.717296,15.246994 62.50952,15.242536 58.460742,17.692507 l -3.478568,2.104928 3.370679,1.950497 c 1.853872,1.072772 3.565514,2.068768 3.80365,2.213323 0.544197,0.330343 0.18364,1.641252 -0.451413,1.641252 -0.244854,0 -2.227829,-1.004177 -4.406607,-2.231503 -2.178778,-1.227327 -4.114074,-2.22988 -4.300662,-2.227895 -0.524586,0.0056 -6.779034,3.901825 -6.679238,4.160872 0.04856,0.12606 1.916916,1.730319 4.151897,3.56502 6.789534,5.573547 7.217156,6.049087 9.242461,10.278211 0.984157,2.055059 2.173773,4.189122 2.643588,4.742363 1.102014,1.297704 2.97309,2.379748 5.260416,3.042116 1.612137,0.466841 1.80111,0.604751 1.641376,1.197828 -0.09928,0.368631 -0.182437,0.77533 -0.184784,0.903771 -0.0057,0.310657 -0.527553,0.253249 -2.047096,-0.225191 z M 55.880018,41.14255 c 1.06491,-0.358234 1.936203,-0.713028 1.936203,-0.788433 0,-0.07541 -0.211895,-0.642271 -0.470878,-1.259701 l -0.470878,-1.122598 -2.038793,0.208072 c -2.549256,0.260164 -3.860383,-0.08994 -6.224533,-1.662125 -1.967612,-1.308484 -2.445951,-1.288018 -2.983753,0.127656 -0.323981,0.852831 0.122468,1.606461 1.335781,2.254879 2.103848,1.124332 6.027984,2.863466 6.494319,2.878206 0.267479,0.0085 1.357618,-0.277725 2.422532,-0.635956 z m -0.480674,-5.245877 c 0.132054,-0.119331 -0.360267,-0.693804 -1.094047,-1.276606 -0.733777,-0.582805 -1.82646,-1.501142 -2.428186,-2.040751 -2.791244,-2.503101 -6.282477,-5.108574 -6.845289,-5.108574 -0.687177,0 -1.594498,1.08881 -1.594498,1.913441 0,0.840468 5.748133,5.391007 8.222128,6.509093 1.258432,0.568728 3.112434,0.570412 3.739892,0.0034 z M 39.754385,22.606164 c -1.251967,-1.130432 -2.482769,-2.45304 -2.735116,-2.939129 -1.514488,-2.917343 0.875822,-6.573679 4.342727,-6.642847 1.040863,-0.02076 2.026881,0.381034 5.042517,2.054817 2.641303,1.466013 3.811817,1.968195 3.962483,1.700012 0.416025,-0.740507 1.245337,-5.887865 0.98889,-6.137791 C 51.212756,10.501738 47.860398,9.8226095 43.906201,9.1320515 39.952005,8.4414932 35.009543,7.5290764 32.922953,7.1044583 27.99558,6.1017444 27.493794,6.2190216 26.965092,8.4969228 25.725495,13.837697 24.369657,20.295454 24.369657,20.858789 c 0,0.541708 0.303409,0.715951 1.797362,1.032199 2.708302,0.573309 14.523561,2.693629 15.238505,2.734643 0.43684,0.02506 -0.06055,-0.583292 -1.651139,-2.019467 z m 7.570474,-0.972415 c 1.64413,-0.984032 2.989329,-1.862435 2.989329,-1.952005 0,-0.396251 -7.775267,-4.43857 -8.81543,-4.583095 -0.985936,-0.13699 -1.298055,-0.02037 -2.109947,0.788375 -0.984219,0.980402 -1.18096,1.858893 -0.64127,2.863402 0.368384,0.685664 4.895042,4.672473 5.305166,4.672473 0.155551,0 1.628022,-0.805117 3.272152,-1.78915 z m 8.303269,-5.022691 2.65697,-1.594028 -2.709216,-5.91e-4 -2.709212,-5.98e-4 -0.338489,1.572188 c -0.186166,0.864704 -0.338485,1.650342 -0.338485,1.745863 0,0.278872 0.618396,-0.03098 3.438432,-1.722834 z M 6.8775011,36.778586 C 4.8181151,34.056172 4.2398641,33.047558 3.0121401,30.036441 -0.11447485,22.368099 0.67084515,12.959847 5.0298781,5.8636091 c 1.288487,-2.0975768 3.780956,-5.16827782 4.196249,-5.16974302 0.380444,-0.00134 2.3275569,1.92752222 2.3275569,2.30574312 0,0.1393351 -0.53672,0.9033114 -1.192711,1.6977255 -3.7535049,4.5455414 -5.5040239,9.5586983 -5.4514169,15.6118393 0.04626,5.323327 1.469716,9.545999 4.70085,13.945074 0.8109199,1.10404 1.6116429,2.196961 1.7793839,2.428712 0.222088,0.306842 0.01426,0.720152 -0.764635,1.520653 -0.588289,0.604608 -1.2425299,1.099286 -1.4538689,1.099286 -0.211339,0 -1.243542,-1.13594 -2.293785,-2.524313 z M 11.066275,33.62035 C 7.9081841,29.462535 6.4186911,25.096678 6.4186911,19.997801 c 0,-3.743724 0.546953,-6.183778 2.12878,-9.496862 1.157049,-2.4234035 3.7876859,-6.0717646 4.3780219,-6.0717646 0.403596,0 2.379208,1.8944235 2.379208,2.2814344 0,0.1253262 -0.559733,0.9332342 -1.24385,1.7953516 -2.340142,2.9490206 -4.0700899,7.8335056 -4.0700899,11.4918406 0,3.658335 1.7299479,8.54282 4.0700899,11.491841 0.684117,0.862117 1.24385,1.68424 1.24385,1.826939 0,0.381114 -2.002519,2.249847 -2.410917,2.249847 -0.192145,0 -1.014523,-0.875735 -1.827509,-1.946078 z m 4.100819,-3.269412 c -3.481508,-4.761469 -4.440228,-10.42873 -2.656477,-15.703179 0.721814,-2.134365 3.143018,-6.084696 3.908788,-6.3774098 0.470557,-0.17987 2.636312,1.5726477 2.636312,2.1332898 0,0.136179 -0.480405,0.874521 -1.067566,1.640762 -1.799055,2.34775 -2.488209,4.550587 -2.488209,7.9534 0,3.402814 0.689154,5.605651 2.488209,7.953401 0.587161,0.76624 1.067566,1.504583 1.067566,1.640761 0,0.384522 -2.016112,2.237995 -2.434375,2.237995 -0.205047,0 -0.859459,-0.665559 -1.454248,-1.47902 z m 3.937544,-3.587799 c -1.425033,-2.063183 -1.963301,-3.606587 -2.142254,-6.142593 -0.130534,-1.849858 -0.03435,-2.702145 0.462712,-4.100108 0.713674,-2.007173 2.404725,-4.618323 2.99095,-4.618323 0.215898,0 0.873869,0.494678 1.462159,1.099285 0.911381,0.93666 1.011965,1.178493 0.679914,1.634706 -2.514316,3.454482 -2.514316,7.268908 0,10.72339 0.332051,0.456213 0.231467,0.698046 -0.679914,1.634706 -0.58829,0.604607 -1.246261,1.099285 -1.462159,1.099285 -0.215897,0 -0.806031,-0.598657 -1.311408,-1.330348 z"
               id="path3779"/>
          </svg>
        </span>
      </div>
    `
    document.querySelector('#affichage-alertes').insertAdjacentHTML('beforeend', frag)
  })
}

/**
 * Informe de l'activation du réseau (test blocant)
 */
window.networkTest = function () {
  const networkFragmentHtml = `
  <div id="alert-network" class="ligne-alerte BF-col">
    <div class="message-icon">
      <div class="BF-ligne">- Aucune connexion, Vous devez activer</div>
      <div class="BF-ligne">le réseau wifi ou 4G ou 5G et relancer</div>
      <div class="BF-ligne">l'application !</div>
    </div>
    <span>
      <svg version="1.1" width="134.39999" height="106.56" viewBox="0 0 134.39999 106.56">
        <path
          style="fill:#000000;stroke-width:0.31109622"
          d="m 65.191166,104.50235 c -3.075887,-0.63711 -5.844121,-2.88469 -7.206717,-5.851279 -0.978467,-2.13028 -1.092359,-5.646817 -0.248068,-7.659308 1.952009,-4.652888 6.667254,-7.270066 11.419265,-6.338214 4.88189,0.957319 8.16601,4.933889 8.1863,9.912386 0.0165,4.040796 -1.97262,7.285175 -5.50714,8.982615 -2.1185,1.01741 -4.60978,1.37507 -6.64364,0.9538 z M 19.50128,87.776901 c -0.819865,-0.481169 -1.609841,-1.002904 -1.755502,-1.15941 -0.22593,-0.242746 38.546606,-30.186573 41.921326,-32.375617 0.611893,-0.396914 1.035666,-0.798277 0.941714,-0.891923 -0.292943,-0.291984 -4.26424,0.562534 -7.543013,1.62306 -6.053071,1.957876 -12.159053,5.502306 -16.667429,9.675186 l -1.42024,1.314553 -3.877046,-3.891186 -3.877045,-3.891186 2.082114,-1.944127 c 6.959286,-6.498081 16.804182,-11.38814 27.425959,-13.622754 2.783985,-0.585695 4.256266,-0.678816 11.083308,-0.701019 l 7.87285,-0.02559 3.24428,-2.468732 c 1.78435,-1.357802 3.14935,-2.5659 3.03333,-2.684663 -0.54936,-0.56231 -7.75486,-1.547021 -12.51936,-1.710906 -7.797333,-0.268209 -14.242089,0.636594 -21.812352,3.062313 -8.469437,2.713839 -17.734266,8.153065 -23.919903,14.04297 l -1.328539,1.265011 -3.88666,-3.864675 -3.886659,-3.864677 1.164333,-1.202663 c 0.640383,-0.661463 2.566556,-2.333906 4.280383,-3.716539 19.83705,-16.003566 45.843287,-20.93705 69.859517,-13.252618 1.57544,0.504091 2.99495,0.916529 3.15448,0.916529 0.38347,0 5.97788,-4.321112 5.97788,-4.617307 0,-0.288128 -5.36816,-2.277779 -8.97096,-3.32499 -3.31978,-0.964949 -8.61625,-2.105997 -12.37399,-2.665799 -3.76252,-0.560515 -17.115006,-0.560515 -20.877534,0 C 39.646587,20.359489 25.382181,26.957668 12.549,38.281263 l -2.8340555,2.500676 -3.865453,-3.881542 -3.865454,-3.881542 2.181235,-2.032408 C 25.015644,11.558716 54.440721,2.7214373 82.502316,7.4593623 c 8.5331,1.44073 18.316164,4.5635917 25.296384,8.0748867 l 1.42697,0.717817 9.32341,-7.1186597 c 5.12786,-3.9152634 9.42791,-7.0851841 9.55566,-7.0442686 0.36911,0.1182229 3.01656,2.2319787 3.01072,2.4038035 -0.003,0.085412 -2.12822,1.7625881 -4.72293,3.7270591 -12.75104,9.6538827 -13.17364,10.0074107 -12.52024,10.4737217 0.33064,0.23597 2.28384,1.514751 4.34043,2.841735 4.03943,2.606375 8.6799,6.215244 12.1526,9.45099 l 2.18123,2.032408 -3.87301,3.88909 -3.873,3.889092 -2.15399,-1.923814 c -3.34477,-2.987356 -6.33485,-5.335717 -9.73112,-7.642659 -3.53803,-2.403241 -8.59592,-5.307035 -9.24391,-5.307035 -0.45145,0 -5.869974,3.985019 -5.867554,4.31526 6.2e-4,0.103548 1.57826,0.985411 3.505564,1.959694 5.94071,3.00314 13.88995,8.59101 17.44431,12.26238 l 1.16433,1.202663 -3.88665,3.864677 -3.88666,3.864675 -1.32854,-1.26502 c -5.05854,-4.816692 -13.026204,-9.902683 -19.622284,-12.525477 -3.9706,-1.578828 -3.76495,-1.605334 -7.01881,0.904651 -1.57514,1.215046 -2.94192,2.334999 -3.03727,2.488787 -0.0954,0.153787 1.05612,0.650256 2.55883,1.103262 7.65533,2.307763 16.07575,7.059894 21.550644,12.162284 l 2.05911,1.919013 -3.87704,3.891186 -3.877054,3.891186 -1.42024,-1.314553 C 90.969876,58.018856 80.773346,53.589669 70.848746,52.796759 l -2.49284,-0.199161 -4.918471,3.786424 c -2.705162,2.082532 -4.878607,3.820422 -4.829878,3.861975 0.04873,0.04155 1.140262,-0.111159 2.425633,-0.339367 3.171597,-0.563084 9.290586,-0.543507 12.657086,0.04049 3.27781,0.568615 8.32265,2.199321 11.07833,3.580989 2.71455,1.361041 7.00019,4.327969 8.59008,5.946864 l 1.32079,1.344893 -3.88648,3.864491 -3.88647,3.864491 -1.17358,-1.13352 c -3.29816,-3.18558 -9.6143,-6.031208 -15.04,-6.776011 -7.563365,-1.038247 -16.585508,1.762219 -21.894566,6.796052 l -1.172834,1.112034 -2.878031,-2.832525 -2.878034,-2.832524 -10.282966,7.888174 c -5.655631,4.338495 -10.353077,7.886612 -10.438768,7.884701 -0.08569,-0.0019 -0.826602,-0.397155 -1.646467,-0.878328 z"
          id="path3907"
          inkscape:connector-curvature="0" />
        <path
          style="fill:#ff0000;stroke-width:0.13058823"
          d="m 20.645292,88.34982 c -0.628435,-0.329439 -2.330605,-1.376557 -2.57117,-1.581698 -0.201547,-0.171868 -0.150836,-0.24675 0.587647,-0.86775 4.596176,-3.86498 36.13768,-28.171709 40.653636,-31.328779 1.265669,-0.884821 1.481292,-1.106828 1.227402,-1.26374 -0.343119,-0.212059 -3.489701,0.413383 -6.306927,1.253617 -6.8304,2.037161 -12.939545,5.521296 -18.385189,10.485343 l -0.856954,0.781167 -3.822025,-3.823674 -3.822027,-3.823673 1.348981,-1.276727 C 35.626712,50.346928 44.640202,45.5959 54.859409,43.114526 58.996487,42.109983 60.98416,41.957443 70.072938,41.946994 l 5.680588,-0.0065 2.22,-1.701729 c 2.574684,-1.97361 3.982941,-3.195791 3.982941,-3.456666 0,-0.367001 -2.620882,-0.894673 -6.740305,-1.357049 C 64.758286,34.251199 56.133865,35.134265 46.730016,38.341755 38.406911,41.18062 30.032864,46.159677 23.780752,51.986968 l -1.426112,1.329212 -3.830257,-3.824738 -3.830256,-3.824737 1.34323,-1.309414 c 2.422696,-2.361705 6.277327,-5.411118 9.76617,-7.726058 10.32997,-6.854207 21.393759,-10.848387 33.952941,-12.257479 4.135631,-0.464001 11.742166,-0.393537 16.192941,0.150006 5.133832,0.62696 8.120031,1.300132 15.595516,3.515663 l 1.557283,0.461537 0.728011,-0.48017 c 1.101529,-0.726529 3.809423,-2.828245 4.599045,-3.56952 0.673976,-0.632713 0.690233,-0.663954 0.444578,-0.854381 -0.373684,-0.289675 -3.302289,-1.410019 -6.143846,-2.35034 -5.392688,-1.784537 -12.956973,-3.400932 -17.433529,-3.725329 -2.599506,-0.188376 -13.436562,-0.190305 -16.021893,-0.0028 -3.121528,0.226331 -7.132552,0.934679 -11.57061,2.043375 -9.205246,2.299611 -17.619182,6.002099 -25.491613,11.217384 -3.654921,2.421292 -6.408273,4.55884 -10.490574,8.144293 L 9.719439,40.682058 5.9106011,36.863691 2.1017631,33.045323 3.4729396,31.735567 C 22.928956,13.151046 50.517019,3.8618383 77.451173,6.8262725 87.216877,7.9011082 98.412767,11.079017 106.86122,15.174198 l 2.37828,1.152814 5.65289,-4.316327 c 6.00385,-4.5842946 9.29282,-7.0580567 11.71012,-8.8076213 l 1.48664,-1.0759779 0.53748,0.3745717 c 0.86906,0.6056508 2.30042,1.8290467 2.30042,1.9661936 0,0.1706911 -2.11314,1.8360024 -8.03117,6.3291419 -5.73931,4.357445 -8.55046,6.58212 -8.93489,7.070854 -0.14937,0.189891 -0.27158,0.445796 -0.27158,0.568677 0,0.148114 1.19715,1.010584 3.55177,2.558813 3.66812,2.411893 7.07551,4.895094 9.57061,6.97477 1.58412,1.320363 4.44893,3.892436 5.15626,4.629365 l 0.45335,0.472324 -3.80581,3.805817 -3.80582,3.805815 -0.58732,-0.51189 c -5.33715,-4.651711 -7.14865,-6.117014 -10.20657,-8.256014 -3.77032,-2.637315 -9.58979,-6.032936 -10.33934,-6.032936 -0.26791,0 -1.4301,0.765894 -3.37243,2.222446 -2.485364,1.863782 -2.655337,2.023152 -2.415878,2.265187 0.107735,0.108894 1.476141,0.877023 3.040908,1.706951 3.33485,1.768763 5.38191,2.985459 8.25497,4.906452 3.89411,2.60368 7.29498,5.299806 9.49942,7.53091 l 1.14177,1.155579 -3.82489,3.82325 -3.8249,3.82325 -1.23452,-1.148347 c -5.61118,-5.219498 -12.663357,-9.726131 -19.778052,-12.638993 -3.232391,-1.323389 -3.778651,-1.36562 -5.214036,-0.403089 -1.034556,0.693746 -4.209884,3.194162 -4.625929,3.642694 l -0.307023,0.330998 0.426105,0.220346 c 0.234358,0.121191 1.606578,0.618904 3.049377,1.106028 8.208985,2.77155 15.534288,7.041426 21.211048,12.363797 l 1.48072,1.388281 -3.82432,3.82597 -3.824321,3.825969 -0.921106,-0.844679 C 94.21181,60.949156 89.35592,57.936009 83.719408,55.743625 79.447001,54.081826 75.455618,53.164488 70.553127,52.717627 l -2.196872,-0.200244 -3.091952,2.377015 c -4.413776,3.3932 -6.683129,5.204579 -6.683129,5.334419 0,0.118309 0.277938,0.09057 2.089411,-0.2085 3.056336,-0.504601 9.018766,-0.570766 12.152721,-0.13486 3.600135,0.500749 9.634245,2.445698 12.588851,4.057712 2.842228,1.5507 6.474356,4.164315 8.164884,5.875304 l 0.977633,0.989466 -3.803771,3.80377 -3.80377,3.803772 -1.27256,-1.133002 C 83.40476,75.261589 80.748,73.692623 77.354213,72.368835 75.261536,71.552562 72.205828,70.758569 70.312917,70.539229 68.365954,70.313626 64.556622,70.438624 62.694703,70.789209 56.889944,71.882202 52.5314,73.981466 48.464822,77.642934 l -0.850354,0.765642 -2.8229,-2.757113 c -1.552595,-1.516411 -2.872493,-2.757112 -2.933107,-2.757112 -0.06061,0 -2.023596,1.468251 -4.362184,3.26278 -10.231213,7.850979 -16.048608,12.25655 -16.297664,12.342383 -0.08886,0.03062 -0.33785,-0.03674 -0.553321,-0.149694 z"
          id="path3928"
          inkscape:connector-curvature="0" />
        <path
          style="fill:#ff0000;stroke-width:0.13058823"
          d="m 65.413856,104.49284 c -3.729173,-0.67208 -7.197868,-4.04966 -7.936455,-7.727984 -0.251972,-1.25488 -0.258245,-3.572168 -0.01248,-4.60874 0.799021,-3.370005 3.858602,-6.410835 7.384484,-7.339227 1.299536,-0.342178 3.690573,-0.307669 5.027647,0.07256 3.082236,0.876514 5.52405,3.032729 6.682587,5.900975 0.727959,1.802245 0.891447,4.650821 0.378172,6.589218 -0.70699,2.669978 -2.736783,5.021598 -5.361665,6.211778 -1.786518,0.81005 -4.481696,1.2043 -6.162294,0.90142 z"
          id="path3930"
          inkscape:connector-curvature="0" />
      </svg>
    </span>
  </div>
  `
  // get ip from wifi (actif après 8 secondes) and 3-5G
  networkinterface.getWiFiIPAddress(function (ipInformation) {
    // wifi ok
    // console.log("IP: " + ipInformation.ip + " subnet:" + ipInformation.subnet)
    ip = ipInformation.ip
    // affiche l'ip
    afficherMessage('Ip (wifi) = ' + ip)
    // message network on
    const netDevice = new CustomEvent('msg_device', {
      detail: {
        name: 'network',
        status: 'on'
      }
    })
    document.dispatchEvent(netDevice)
  }, function (erreur) {
    // wifi erreur
    // get ip from 3-5G
    networkinterface.getCarrierIPAddress(function (ipInformation) {
      // 3-5G OK
      // console.log("IP: " + ipInformation.ip + " subnet:" + ipInformation.subnet)
      ip = ipInformation.ip
      // affiche l'ip
      afficherMessage('Ip (3-5G) = ' + ip)
      // message network on
      const netDevice = new CustomEvent('msg_device', {
        detail: {
          name: 'network',
          status: 'on'
        }
      })
      document.dispatchEvent(netDevice)
    }, function (erreur) {
      // 3-5G erreur
      afficherMessage('network: ' + erreur, 'danger')
      ip = '127.0.0.1'
      // pas de réseau 4g, 5g
      document.querySelector('#affichage-alertes').insertAdjacentHTML('beforeend', networkFragmentHtml)
    })
  })
}

/**
 * application initialization
 */
function initApp() {
  // wait devices on
  document.addEventListener('msg_device', async (evt) => {
    try {
      // { name: 'network', status: 'off', method: 'networkTest' },
      let searchDevice = devicesStatus.find(device => device.name === evt.detail.name)
      searchDevice.status = evt.detail.status
    } catch (err) {
      console.log('-> msg_device, error :', err)
    }
    let allDevicesOn = true
    devicesStatus.forEach(device => {
      if (device.status === 'off') {
        allDevicesOn = false
      }
    })

    // console.log('allDevicesOn =', allDevicesOn)
    if (allDevicesOn === true) {
      // efface le conteneur des alertes
      document.querySelector('#affichage-alertes').style.display = 'none'

      // affiche le conteneur d'informations
      document.querySelector('#app-log').style.display = 'block'

      // affiche l' interface principale
      document.querySelector('#entree-des-donnees').style.display = 'flex'

      if (configuration.current_server === '') {
        // entrer code pin
        showStep1()
      } else {
        // lancer application / modifier server / reset serveur courant
        showStep2()
      }
    }
  })

  // tests device activation
  devicesStatus.forEach(item => {
    window[item.method.toString()]()
  })
}

/**
 * wait cordova (devices activation)
 */
document.addEventListener('deviceready', async () => {
  // Persistent and private data storage within the application's sandbox using internal memory
  basePath = cordova.file.dataDirectory
  // console.log('basePath =', basePath)

  afficherMessage('pin code server = ' + env.server_pin_code)
  afficherMessage('manufacturer = ' + device.manufacturer)
  afficherMessage('model = ' + device.model)
  afficherMessage('version = ' + device.version)
  afficherMessage('uuid = ' + device.uuid)

  // console.log('-> avant initApp, configuration =', configuration)
  const configFromFile = await readFromFile()

  if (configFromFile !== null) {
    configuration = configFromFile
  }

  initApp()

}, false)
