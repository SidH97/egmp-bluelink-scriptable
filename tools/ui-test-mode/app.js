const STORAGE_KEY = 'bluelink-ui-test-config-v1'

const scenarios = [
  {
    key: 'parked',
    label: 'Parked',
    status: {
      fuelPercent: 58,
      isRunning: false,
      isLocked: true,
      climateOn: false,
      tirePressureLow: false,
      odometerKm: 38412,
      rangeKm: 421,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    key: 'driving',
    label: 'Driving',
    status: {
      fuelPercent: 52,
      isRunning: true,
      isLocked: false,
      climateOn: true,
      tirePressureLow: false,
      odometerKm: 38436,
      rangeKm: 388,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    key: 'lowFuel',
    label: 'Low Fuel',
    status: {
      fuelPercent: 9,
      isRunning: false,
      isLocked: true,
      climateOn: false,
      tirePressureLow: true,
      odometerKm: 38890,
      rangeKm: 56,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    key: 'valet',
    label: 'Valet',
    status: {
      fuelPercent: 47,
      isRunning: false,
      isLocked: false,
      climateOn: false,
      tirePressureLow: false,
      odometerKm: 39010,
      rangeKm: 335,
      lastUpdated: new Date().toISOString(),
    },
  },
]

const actionButtons = [
  { key: 'refresh', label: 'Refresh Status' },
  { key: 'lock', label: 'Lock' },
  { key: 'unlock', label: 'Unlock' },
  { key: 'engineOn', label: 'Start Engine' },
  { key: 'engineOff', label: 'Stop Engine' },
  { key: 'hornLights', label: 'Honk + Lights' },
  { key: 'climateOn', label: 'Start Climate' },
  { key: 'climateOff', label: 'Stop Climate' },
]

const state = {
  selectedScenario: 'parked',
  status: null,
  vehicle: {
    nickName: 'Family SUV',
    modelYear: '2024',
    modelName: 'Sportage',
  },
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
  if (unit === 'mi') return `${(value * 0.621371).toFixed(1)} mi`
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
    ['Fuel Level', `${state.status.fuelPercent}%`],
    ['Estimated Range', asDistance(state.status.rangeKm)],
    ['Engine Running', fmtBool(state.status.isRunning)],
    ['Doors Locked', fmtBool(state.status.isLocked)],
    ['Climate', fmtBool(state.status.climateOn)],
    ['Low Tire Pressure', fmtBool(state.status.tirePressureLow)],
    ['Odometer', asDistance(state.status.odometerKm)],
    ['Last Updated', state.status.lastUpdated || 'N/A'],
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

  const fuel = state.status?.fuelPercent ?? '--'
  const running = Boolean(state.status?.isRunning)
  const climate = Boolean(state.status?.climateOn)
  const locked = Boolean(state.status?.isLocked)
  const tirePressureLow = Boolean(state.status?.tirePressureLow)
  const range = asDistance(state.status?.rangeKm)

  const widgets = [
    {
      title: 'Medium (Home)',
      metric: `${fuel}%`,
      lines: [
        `${state.vehicle?.nickName || 'Vehicle'}`,
        `Fuel: ${fuel}%`,
        `Range: ${range}`,
      ],
      pill: running ? 'Engine On' : 'Parked',
    },
    {
      title: 'Accessory Rectangular',
      metric: running ? 'ON' : 'OFF',
      lines: [
        running ? 'Engine Running' : 'Engine Stopped',
        locked ? 'Locked' : 'Unlocked',
        climate ? 'Climate On' : 'Climate Off',
      ],
      pill: tirePressureLow ? 'Check Tires' : 'Vehicle OK',
    },
    {
      title: 'Accessory Inline',
      metric: `${fuel}%`,
      lines: [`Fuel ${fuel}% • ${running ? 'Running' : 'Idle'}`, `Doors: ${locked ? 'Locked' : 'Unlocked'}`],
      pill: 'Lockscreen',
    },
  ]

  for (const w of widgets) {
    const box = document.createElement('div')
    box.className = 'widget-box'
    box.innerHTML = `
      <h3>${w.title}</h3>
      <div class="widget-metric">${w.metric}</div>
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
  for (const btn of actionControls.querySelectorAll('button')) btn.disabled = !enabled
  for (const btn of scenarioControls.querySelectorAll('button')) btn.disabled = !enabled
  loginButton.disabled = !isConfigured() || state.loggedIn
  logoutButton.disabled = !state.loggedIn
}

function touchStatus() {
  if (state.status) state.status.lastUpdated = new Date().toISOString()
}

function handleAction(action) {
  if (!state.status || !state.loggedIn) return

  switch (action) {
    case 'refresh':
      addEvent('Status refresh simulated using current scenario data')
      break
    case 'lock':
      state.status.isLocked = true
      addEvent('Vehicle locked')
      break
    case 'unlock':
      state.status.isLocked = false
      addEvent('Vehicle unlocked', 'warn')
      break
    case 'engineOn':
      state.status.isRunning = true
      addEvent('Engine started')
      break
    case 'engineOff':
      state.status.isRunning = false
      addEvent('Engine stopped', 'warn')
      break
    case 'hornLights':
      addEvent('Honk and lights triggered')
      break
    case 'climateOn':
      state.status.climateOn = true
      addEvent('Climate started')
      break
    case 'climateOff':
      state.status.climateOn = false
      addEvent('Climate stopped', 'warn')
      break
  }

  touchStatus()
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
  state.selectedScenario = key
  state.status = structuredClone(scenario.status)
  state.vehicle = state.setup?.manufacturer === 'hyundai'
    ? { nickName: 'Family SUV', modelYear: '2024', modelName: 'Tucson' }
    : { nickName: 'Family SUV', modelYear: '2024', modelName: 'Sportage' }
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
    void loadScenario(state.selectedScenario)
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
    if (input && 'value' in input) input.value = String(value)
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
