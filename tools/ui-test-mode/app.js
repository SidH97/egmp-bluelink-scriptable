const STORAGE_KEY = 'bluelink-ui-test-config-v1'

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
  setup: null,
  loggedIn: false,
}

const scenarioControls = document.getElementById('scenario-controls')
const actionControls = document.getElementById('action-buttons')
const summary = document.getElementById('summary')
const events = document.getElementById('events')
const setupForm = document.getElementById('setup-form')
const setupStatus = document.getElementById('setup-status')
const loginButton = document.getElementById('login-button')
const logoutButton = document.getElementById('logout-button')
const sessionStatus = document.getElementById('session-status')
const resetSetupButton = document.getElementById('reset-setup')
const widgetPreview = document.getElementById('widget-preview')

function fmtBool(value) {
  return value ? 'Yes' : 'No'
}

function asDistance(value) {
  if (typeof value !== 'number') return 'N/A'
  const unit = state.setup?.distanceUnit === 'mi' ? 'mi' : 'km'
  if (unit === 'mi') {
    return `${(value * 0.621371).toFixed(1)} mi`
  }
  return `${value.toLocaleString()} km`
}

function addEvent(msg, cls = 'ok') {
  state.events.unshift({ msg, cls, when: new Date().toLocaleTimeString() })
  state.events = state.events.slice(0, 10)
  renderEvents()
}

function saveSetup(setup) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(setup))
}

function loadSetup() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSetup() {
  localStorage.removeItem(STORAGE_KEY)
}

function isConfigured() {
  return Boolean(state.setup?.username && state.setup?.password && state.setup?.pin)
}

function updateSessionStatus() {
  if (!isConfigured()) {
    sessionStatus.textContent = 'Not configured. Complete setup first.'
    return
  }
  sessionStatus.textContent = state.loggedIn
    ? `Logged in as ${state.setup.username} (${state.setup.manufacturer}/${state.setup.region})`
    : 'Configured but logged out.'
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
    ['Range', asDistance(state.status.evStatus?.drvDistance?.[0]?.rangeByFuel?.totalAvailableRange?.value)],
    ['Odometer', asDistance(state.status.odometer?.value)],
    ['Last Updated', state.status.dateTime || 'N/A'],
  ]
}

function renderSummary() {
  summary.innerHTML = ''
  const rows = !state.loggedIn ? [['Status', 'Login required to view app data']] : summaryRows()

  for (const [label, value] of rows) {
    const dt = document.createElement('dt')
    dt.textContent = label
    const dd = document.createElement('dd')
    dd.textContent = value
    summary.appendChild(dt)
    summary.appendChild(dd)
  }
}

function renderWidgets() {
  widgetPreview.innerHTML = ''

  const soc = state.status?.evStatus?.batteryStatus ?? '--'
  const charging = Boolean(state.status?.evStatus?.batteryCharge)
  const climate = Boolean(state.status?.airCtrlOn)
  const locked = Boolean(state.status?.doorLock)
  const range = asDistance(state.status?.evStatus?.drvDistance?.[0]?.rangeByFuel?.totalAvailableRange?.value)
  const lockText = locked ? 'Locked' : 'Unlocked'

  const widgets = [
    {
      title: 'Medium (Home)',
      lines: [
        `${state.vehicle?.nickName || 'Vehicle'}`,
        `Battery: ${soc}%`,
        `Range: ${range}`,
      ],
      pill: charging ? 'Charging' : 'Idle',
    },
    {
      title: 'Accessory Rectangular',
      lines: [`${soc}%`, `${lockText}`, climate ? 'Climate On' : 'Climate Off'],
      pill: climate ? 'Cabin Conditioning' : 'Ready',
    },
    {
      title: 'Accessory Inline',
      lines: [`${soc}% • ${charging ? '⚡ Charging' : 'Not Charging'}`, `Doors: ${lockText}`],
      pill: 'Lockscreen',
    },
  ]

  for (const w of widgets) {
    const box = document.createElement('div')
    box.className = 'widget-box'
    box.innerHTML = `
      <h3>${w.title}</h3>
      <div class="widget-metric">${soc}%</div>
      <div>${w.lines[0] || ''}</div>
      <div>${w.lines[1] || ''}</div>
      <div>${w.lines[2] || ''}</div>
      <span class="widget-pill">${w.pill}</span>
    `
    widgetPreview.appendChild(box)
  }
}

function updateControlState() {
  const enabled = state.loggedIn
  for (const btn of actionControls.querySelectorAll('button')) {
    btn.disabled = !enabled
  }
  for (const btn of scenarioControls.querySelectorAll('button')) {
    btn.disabled = !enabled
  }
  loginButton.disabled = !isConfigured() || state.loggedIn
  logoutButton.disabled = !state.loggedIn
}

function handleAction(action) {
  if (!state.status || !state.loggedIn) return

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
  renderWidgets()
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
  renderWidgets()

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

function wireSetup() {
  setupForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const fd = new FormData(setupForm)
    const setup = Object.fromEntries(fd.entries())
    state.setup = setup
    state.loggedIn = false
    saveSetup(setup)
    setupStatus.textContent = `Setup saved for ${setup.manufacturer}/${setup.region}`
    addEvent('Setup saved', 'ok')
    updateSessionStatus()
    updateControlState()
    renderSummary()
    renderWidgets()
  })

  resetSetupButton.addEventListener('click', () => {
    clearSetup()
    setupForm.reset()
    state.setup = null
    state.loggedIn = false
    setupStatus.textContent = 'Setup cleared.'
    addEvent('Setup reset', 'warn')
    updateSessionStatus()
    updateControlState()
    renderSummary()
    renderWidgets()
  })
}

function wireSession() {
  loginButton.addEventListener('click', async () => {
    if (!isConfigured()) {
      addEvent('Cannot login before setup', 'error')
      return
    }
    loginButton.disabled = true
    sessionStatus.textContent = 'Logging in...'
    await new Promise((resolve) => setTimeout(resolve, 550))
    state.loggedIn = true
    addEvent('Login successful')
    updateSessionStatus()
    updateControlState()
    renderSummary()
    renderWidgets()
  })

  logoutButton.addEventListener('click', () => {
    state.loggedIn = false
    addEvent('Logged out', 'warn')
    updateSessionStatus()
    updateControlState()
    renderSummary()
    renderWidgets()
  })
}

function bootstrapSetupFromStorage() {
  const existing = loadSetup()
  if (!existing) {
    setupStatus.textContent = 'No setup saved yet.'
    return
  }

  state.setup = existing
  for (const [key, value] of Object.entries(existing)) {
    const input = setupForm.elements.namedItem(key)
    if (input && 'value' in input) {
      input.value = String(value)
    }
  }
  setupStatus.textContent = `Loaded saved setup for ${existing.manufacturer}/${existing.region}`
}

renderScenarioButtons()
renderActionButtons()
wireSetup()
wireSession()
bootstrapSetupFromStorage()
updateSessionStatus()
updateControlState()
void loadScenario(state.selectedScenario)
renderSummary()
renderWidgets()
