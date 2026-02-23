const scenarios = [
  { key: 'default', label: 'Default Status', file: '/data/vehicleStatus.json' },
  { key: 'charging', label: 'Charging', file: '/data/vehicleStatusCharging.json' },
  { key: 'conditioning', label: 'Conditioning', file: '/data/vehicleStatusConditioning.json' },
  { key: 'stale', label: 'Cached/Not Forced', file: '/data/vehicleStatusNotForced.json' },
]

const actionButtons = [
  { key: 'refresh', label: 'Refresh Status' },
  { key: 'lock', label: 'Lock' },
  { key: 'unlock', label: 'Unlock' },
  { key: 'climateOn', label: 'Start Climate' },
  { key: 'climateOff', label: 'Stop Climate' },
  { key: 'startCharge', label: 'Start Charge' },
  { key: 'stopCharge', label: 'Stop Charge' },
]

const state = {
  selectedScenario: 'default',
  status: null,
  vehicle: null,
  events: [],
}

const scenarioControls = document.getElementById('scenario-controls')
const actionControls = document.getElementById('action-buttons')
const summary = document.getElementById('summary')
const events = document.getElementById('events')

function fmtBool(value) {
  return value ? 'Yes' : 'No'
}

function asKms(value) {
  if (typeof value !== 'number') return 'N/A'
  return `${value.toLocaleString()} km`
}

function addEvent(msg, cls = 'ok') {
  state.events.unshift({ msg, cls, when: new Date().toLocaleTimeString() })
  state.events = state.events.slice(0, 8)
  renderEvents()
}

function renderEvents() {
  events.innerHTML = ''
  for (const event of state.events) {
    const li = document.createElement('li')
    li.className = event.cls
    li.textContent = `${event.when} — ${event.msg}`
    events.appendChild(li)
  }
}

function summaryRows() {
  if (!state.status) return []

  return [
    ['Vehicle', state.vehicle?.nickName || 'Unknown'],
    ['Model', `${state.vehicle?.modelYear || ''} ${state.vehicle?.modelName || ''}`.trim()],
    ['Battery SOC', `${state.status.evStatus?.batteryStatus || 'N/A'}%`],
    ['Charging', fmtBool(Boolean(state.status.evStatus?.batteryCharge))],
    ['Plugged In', fmtBool(Boolean(state.status.evStatus?.batteryPlugin))],
    ['Climate', fmtBool(Boolean(state.status.airCtrlOn))],
    ['Door Locked', fmtBool(Boolean(state.status.doorLock))],
    ['Range', asKms(state.status.evStatus?.drvDistance?.[0]?.rangeByFuel?.totalAvailableRange?.value)],
    ['Odometer', asKms(state.status.odometer?.value)],
    ['Last Updated', state.status.dateTime || 'N/A'],
  ]
}

function renderSummary() {
  summary.innerHTML = ''
  for (const [label, value] of summaryRows()) {
    const dt = document.createElement('dt')
    dt.textContent = label
    const dd = document.createElement('dd')
    dd.textContent = value
    summary.appendChild(dt)
    summary.appendChild(dd)
  }
}

function handleAction(action) {
  if (!state.status) return

  switch (action) {
    case 'refresh':
      addEvent('Status refresh simulated using current scenario data')
      break
    case 'lock':
      state.status.doorLock = true
      addEvent('Vehicle locked')
      break
    case 'unlock':
      state.status.doorLock = false
      addEvent('Vehicle unlocked', 'warn')
      break
    case 'climateOn':
      state.status.airCtrlOn = true
      addEvent('Climate started')
      break
    case 'climateOff':
      state.status.airCtrlOn = false
      addEvent('Climate stopped')
      break
    case 'startCharge':
      state.status.evStatus = state.status.evStatus || {}
      state.status.evStatus.batteryCharge = true
      addEvent('Charging started')
      break
    case 'stopCharge':
      state.status.evStatus = state.status.evStatus || {}
      state.status.evStatus.batteryCharge = false
      addEvent('Charging stopped', 'warn')
      break
  }

  renderSummary()
}

function renderActionButtons() {
  for (const action of actionButtons) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = action.label
    button.addEventListener('click', () => handleAction(action.key))
    actionControls.appendChild(button)
  }
}

async function loadScenario(key) {
  const scenario = scenarios.find((item) => item.key === key)
  if (!scenario) return

  const [vehicleList, statusPayload] = await Promise.all([
    fetch('/data/listVehicles.json').then((res) => res.json()),
    fetch(scenario.file).then((res) => res.json()),
  ])

  state.selectedScenario = key
  state.vehicle = vehicleList.resMsg?.vehicles?.[0] || null
  state.status = structuredClone(statusPayload.resMsg?.vehicleStatus || {})
  addEvent(`Scenario loaded: ${scenario.label}`)
  renderSummary()

  for (const button of scenarioControls.querySelectorAll('button')) {
    button.classList.toggle('active', button.dataset.scenario === key)
  }
}

function renderScenarioButtons() {
  for (const scenario of scenarios) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = scenario.label
    button.dataset.scenario = scenario.key
    button.addEventListener('click', () => loadScenario(scenario.key))
    scenarioControls.appendChild(button)
  }
}

renderScenarioButtons()
renderActionButtons()
void loadScenario(state.selectedScenario)
