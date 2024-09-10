// let basePath = cordova.file.externalRootDirectory + "Documents/"
/** @typedef {import("./module").env} env */
import { env } from '../../env.js'
import {
  nfcTest, networkTest, listenDevices, getConfigFromFile, launchApp, launchRender,
  checkPinCode, getUrlServerFromPinCode, activeSpinner, goLaboutik
} from './actions.js'

const state = {
  idApp: '#app',
  currentStep: 'IDLE',
  saveFileName: 'configLaboutik.json',
  urlLogin: 'wv/login_hardware',
  logs: [],
  ip: null,
  basePath: null,
  configuration: {},
  spinner: false,
  pinCode: null,
  errorValuePinCode: '',
  devices: [
    { name: 'network', status: 'off', permission: 'INTERNET' },
    { name: 'nfc', status: 'off', permission: 'NFC' }
  ]
}

const machine = {
  INIT: {
    fromStep: 'IDLE',
    actions: ['networkTest', 'nfcTest', 'listenDevices']
  },
  ALL_DEVICES_ON: {
    fromStep: 'INIT',
    actions: 'getConfigFromFile',
  },
  START: {
    fromStep: 'ALL_DEVICES_ON',
    actions: 'launchApp'
  },
  GET_PIN_CODE: {
    fromStep: ['START', 'CHECK_PIN_CODE', 'GET_SERVER_FROM_PIN_CODE'],
    actions: 'launchRender'
  },
  CHECK_PIN_CODE: {
    fromStep: 'GET_PIN_CODE',
    actions: 'checkPinCode'
  },
  GET_SERVER_FROM_PIN_CODE: {
    fromStep: 'CHECK_PIN_CODE',
    actions: ['activeSpinner', 'getUrlServerFromPinCode']
  },
  GO_SERVER: {
    fromStep: ['START', 'GET_SERVER_FROM_PIN_CODE'],
    actions: 'goLaboutik'
  },
  actions: {
    networkTest,
    nfcTest,
    listenDevices,
    getConfigFromFile,
    launchApp,
    launchRender,
    checkPinCode,
    activeSpinner,
    getUrlServerFromPinCode,
    goLaboutik
  }
}

// manage steps
class ManageSteps {
  constructor() {
    this.state = state
    this.steps = machine
  }

  getStep() {
    return this.state.currentStep
  }

  setStep(step) {
    this.state.currentStep = step
  }

  // run
  async run(step) {
    // console.log('-> run, step =', step)
    const currentStep = this.state.currentStep
    const stepToManage = this.steps[step]
    // console.log('currentStep =', currentStep)
    // console.log('stepToManage =', JSON.stringify(stepToManage, null, 2))
    // console.log('type stepToMage.fromStep =', typeof (stepToManage.fromStep))
    let origineStep = false

    // provenant de plusieurs états
    if (typeof (stepToManage.fromStep) === 'object') {
      if (stepToManage.fromStep.includes(currentStep)) origineStep = true
    } else {
      // provenant d'un seul état
      if (currentStep === stepToManage.fromStep) origineStep = true
    }

    // console.log('origineStep =', origineStep);

    // lance les actions si transition bonne
    if (origineStep) {
      // maj étape
      this.setStep(step)
      // plusieurs actions
      if (typeof (stepToManage.actions) === 'object') {
        stepToManage.actions.forEach(action => {
          this.steps.actions[action](this.state)
        });
      } else {
        // une seule action
        this.steps.actions[stepToManage.actions](this.state)
      }
    } else {
      console.log('-> Etape(s) impossible(s) !');
    }
  }
}


/**
 * wait cordova (devices activation)
 */
document.addEventListener('deviceready', async () => {
  // Persistent and private data storage within the application's sandbox using internal memory
  state.basePath = cordova.file.dataDirectory

  /*
  log('info', 'pin code server = ' + env.server_pin_code)
  log('info', 'manufacturer = ' + device.manufacturer)
  log('info', 'model = ' + device.model)
  log('info', 'android = ' + device.version)
  log('info', 'uuid = ' + device.uuid)

  // console.log('-> avant initApp, configuration =', configuration)
  const configFromFile = await readFromFile()

  if (configFromFile !== null) {
    state.configuration = configFromFile
  }

  // wait devices on
  document.addEventListener('msg_device', async (evt) => {
    try {
      // { name: 'network', status: 'off', method: 'networkTest' },
      let searchDevice = state.devicesStatus.find(device => device.name === evt.detail.name)
      searchDevice.status = evt.detail.status
    } catch (err) {
      console.log('-> msg_device, error :', err)
    }
    let allDevicesOn = true
    state.devicesStatus.forEach(device => {
      if (device.status === 'off') {
        allDevicesOn = false
      }
    })

    // console.log('allDevicesOn =', allDevicesOn)
    if (allDevicesOn === true) {
      if (state.configuration.current_server === '') {
        // entrer code pin
        state.step = 'enterCodePin'
      } else {
        // lancer application / modifier server / reset serveur courant
        state.step = 'start'
      }
    }
    render(state)
  })

  // tests device activation
  for (const key in state.devicesStatus) {
    const method = state.devicesStatus[key].method
    state.methods[method]()
  }
  */
  window.ma = new ManageSteps()
  ma.run('INIT')
}, false)
