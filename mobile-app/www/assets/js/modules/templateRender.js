/* eslint-disable no-undef */
const bgColors = {
  danger: '#FF0000',
  success: '#00FF00',
  normal: '#000000',
  info: '#0000FF',
  error: '#ffa600',
}

function showSpinner(state) {
  if (state.spinner === true) {
    return `<div class="spinner-container BF-col">
      <div class="spinner"></div>
    </div>`
  } else {
    return ""
  }
}

// show device off in step 'INIT'
function showDevicesOff(state) {
  // error
  if (state.currentStep === "INIT") {
    let mainContent = `<div class="BF-col devices-off">
      <div class="BF-ligne">`
    let needReload = false
    state.devices.forEach((device) => {
      // network off
      if (device.name === "network" && device.status === "off") {
        mainContent += `<div id="alert-network" class="devices-off-item BF-col">
          <div class="message-icon">
            <div class="BF-ligne">- No connection.</div>
            <div class="BF-ligne">Activate wifi, 4G or 5G network.</div>
            <div class="BF-ligne">and restart the application.</div>
          </div>
          <span>
            <img src="http://localhost/assets/images/no-network.svg" />
          </span>
        </div>`
      }

      // nfc off
      if (device.name === "nfc" && device.status === "off") {
        mainContent += `<div  id="alert-nfc" class="devices-off-item BF-col" onclick="nfc.showSettings()">
          <div class="message-icon">
            <div class="BF-ligne">NFC disabled, </div>
            <div class="BF-ligne">click to go settings,</div>
            <div class="BF-ligne">and restart the application.</div>
          </div>
          <span>
          <img src="http://localhost/assets/images/no-nfc.svg" />
          </span>
        </div>`
      }

       // bluetooth off
       if (device.name === "bluetooth" && device.status === "off") {
        mainContent += `<div id="alert-network" class="devices-off-item BF-col">
          <div class="message-icon">
            <div class="BF-ligne">- No bluetooth.</div>
            <div class="BF-ligne">Activate bluetooth.</div>
            <div class="BF-ligne">and restart the application.</div>
          </div>
          <span>
            <img src="http://localhost/assets/images/no_bluetooth.svg" />
          </span>
        </div>`
      }
    })
    mainContent += "</div></div>"
    return mainContent
  } else {
    return ""
  }
}

// dev
function mockServersList(nb) {
  let servers = []
  for (let i = 0; i < nb; i++) {
    servers.push({ server: `https://server${i}.test.tibillet.re/` })
  }
  return servers
}

function showListServer(state) {
  if (state.currentStep === "LIST_SERVERS") {
    let content = `<div class="BF-col h100">
      <div class="servers-list-content">`
    // dev --- state.configuration.servers = mockServersList(10)

    state.configuration.servers.forEach(item => {
      const url = new URL(item.server)
      content += `<div class="BF-ligne servers-list-item">
        <div class="bt bt-delete-server" onclick="ma.run('CONFIRM_DELETE_SERVER', '${item.server}')">Delete</div> 
        <div class="bt bt-go-server" onclick="ma.run('GO_SERVER','${item.server}')">${url.hostname}</div>
      </div>`
    })
    // no servers
    if (state.configuration.servers.length < 1) {
      content += '<div class="BF-col h100 tibillet-font-size2 c-white">No place</div>'
    }
    // bt "Add place"
    content += `</div>
      <div class="BF-ligne servers-list-footer">
        <button class="action bgc-success c-white" type="button" onclick="ma.run('GET_PIN_CODE')">
          Add a place
        </button>
      </div>
    </div>`
    return content
  } else {
    return ''
  }
}

// bt "Return"
function showBtReturn(state) {
  if (state.configuration.servers.length >= 1) {
    return `<button class="action bgc-info" type="button" onclick="ma.run('LIST_SERVERS')">
    Return
  </button>`
  } else {
    return ''
  }
}

// enter code pin off in step 'GET_PIN_CODE'
function getPinCode(state) {
  if (state.currentStep === "GET_PIN_CODE") {
    return `<div class="BF-col h100">
      <div id="field-pin" class="ligne BF-col">
        <div class="label" for="pin">PIN code :</div>
        <input type="number" id="pin-code" class="entree" value="${state.pinCode}"/>
      </div >
      <div id="retour-pin-code" class="info-danger">${state.errorValuePinCode}</div>
      <div class="ligne BF-ligne" style="margin-top: 3rem;">
        ${showBtReturn(state)}
        <button class="action bgc-success c-white" type="button" onclick="ma.run('CHECK_PIN_CODE')">
          validate
        </button>
      </div>
    </div>`
  } else {
    return ""
  }
}

function showInfos(state) {
  return `<!-- <div class="log-msg" style="color:var(--info-color);"> current step = ${state.currentStep}</div> -->
  <div class="log-msg" style="color:var(--info-color);">version = ${state.configuration.versionApk}</div>
  <div class="log-msg" style="color:var(--info-color);">tagId = <span id="rep-tag-id"></span></div>
  <div class="log-msg" style="color:var(--info-color);">ip = ${state.ip}</div>
  <div class="log-msg" style="color:var(--info-color);"> manufacturer = ${device.manufacturer}</div>
  <div class="log-msg" style="color:var(--info-color);">model = ${device.model}</div>
  <div class="log-msg" style="color:var(--info-color);">android = ${device.version}</div>
  <div class="log-msg bar-bottom" style="color:var(--info-color);">uuid = ${device.uuid}</div>`
}

window.showLOgs = function (state) {
  // console.log('-> showLOgs, state.logs =', state.logs)
  let content = ""
  for (let i = state.logs.length - 1; i >= 0; i--) {
    // repère le premier log
    let rep = ''
    if (i === (state.logs.length - 1)) {
      rep =' id="first-log" '
    }
    const item = state.logs[i]
    content += `<div ${rep} class="log-msg" style="color:var(--${item.typeMsg}-color);">${item.msg}</div>`
  }
  return content
}

function confirmDeleteServer(state) {
  if (state.currentStep === "CONFIRM_DELETE_SERVER") {
    const url = new URL(state.params)
    return `<div id="modal-confirm" class="BF-col">
      <div>
        <div id="modal-confirm-infos" class="BF-col">
          <div class="tibillet-font-size2 c-white">Delete</div>
          <div class="tibillet-font-size2 c-white">${url.hostname}</div>
        </div>
        <div class="ligne BF-ligne mt-2r">
          <button class="action bgc-info" type="button" onclick="ma.run('LIST_SERVERS')">
            Cancel
          </button>
          <button class="action bgc-success c-white" type="button" onclick="ma.run('DELETE_SERVER', '${state.params}')">
            validate
          </button>
        </div>
      </div>
    </div>`
  } else {
    return ""
  }
}

function networkIsOn() {
  if (window.navigator.onLine === true) {
    ma.run('LIST_SERVERS')
  } else {
    // 5 secondes
    setTimeout(networkIsOn, 5000)
  }
}

function showNoNetwork(state) {
  if (state.currentStep === "NO_NETWORK") {
    state.spinner = false
    networkIsOn()
    return `<div id="network-offline">
       <svg xmlns="http://www.w3.org/2000/svg" width="100px" height="100px" style="color:#FF0000;" viewBox="0 0 24 24">
           <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
               <path d="M6.528 6.536a6 6 0 0 0 7.942 7.933m2.247-1.76A6 6 0 0 0 8.29 4.284"/>
               <path d="M12 3q2 .5 2 6q0 .506-.017.968m-.55 3.473Q12.934 14.766 12 15m0-12q-1.405.351-1.822 3.167m-.16 3.838Q10.192 14.549 12 15M6 9h3m4 0h5M3 20h7m4 0h7m-11 0a2 2 0 1 0 4 0a2 2 0 0 0-4 0m2-5v3M3 3l18 18"/>
           </g>
       </svg>
       <p class="c-white">no connection.</p>
       <p class="c-white">Check your network.</p>
   </div>`
  } else {
    return ''
  }
}

export const render = function (state) {
  // console.log('id =', state.idApp);
  // console.log('state =', state)
  const template = `<section id="app-header" class="BF-col">
    <!-- show spinner -->
    ${showSpinner(state)}
    <img src="http://localhost/assets/images/icon-complet-blanc.svg" style="margin-top: 20px;" />
    <div class="tibillet-font tibillet-font-size2">LaBoutik</div>
  </section>
  <section id="app-main">
    <!-- devices off --> 
    ${showDevicesOff(state)}
    <!-- servers list -->
    ${showListServer(state)}
    <!-- enter pin code --> 
    ${getPinCode(state)}
  </section>
  <section id="app-infos-container">
    <div id="logs-led"></div>
    <div id="app-infos-container-scroll">
      <!-- infos devices -->
      <div id="app-infos-devices">
      ${showInfos(state)}
      </div>
      <!-- infos logs -->
      <div id="app-infos-logs">
        ${showLOgs(state)}
      </div>
    </div>
  </section>
  <!-- confirm delete server -->
  ${confirmDeleteServer(state)}
  ${showNoNetwork(state)}`
  document.querySelector(state.idApp).innerHTML = template
  // logs led
  const lastLog = (state.logs.length) - 1
  if (lastLog >= 0) {
    // led/témoin
    document.querySelector('#logs-led').style.background = bgColors[state.logs[lastLog].typeMsg]
    // scroll premier log
    document.querySelector('#first-log').scrollIntoView()
  }
}
