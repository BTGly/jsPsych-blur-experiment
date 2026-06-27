const ParameterType = window.jsPsychModule?.ParameterType || window.jsPsych?.ParameterType

const info = {
  name: 'hold-response-trial',
  version: '1.0.0',
  parameters: {
    stimulus: { type: ParameterType.IMAGE, default: undefined },
    stimulus_ms: { type: ParameterType.INT, default: 200 },
    fixation_ms: { type: ParameterType.INT, default: 500 },
    show_time: { type: ParameterType.FLOAT, default: 0.5 },
    response_timeout: { type: ParameterType.FLOAT, default: 2.0 },
    max_hold: { type: ParameterType.FLOAT, default: 1.0 },
    phase: { type: ParameterType.STRING, default: '' },
    trial_index: { type: ParameterType.INT, default: 0 },
    block_id: { type: ParameterType.INT, default: 0 },
    trial_in_block: { type: ParameterType.INT, default: 0 },
    difficulty_id: { type: ParameterType.STRING, default: '' },
    difficulty_rank: { type: ParameterType.INT, default: 0 },
    alpha: { type: ParameterType.STRING, default: '0' },
    label_digit: { type: ParameterType.INT, default: 3 },
    label_type: { type: ParameterType.STRING, default: 'normal' },
    sample_type: { type: ParameterType.STRING, default: 'normal' },
    image_path: { type: ParameterType.STRING, default: '' },
    participant: { type: ParameterType.STRING, default: '' },
    date: { type: ParameterType.STRING, default: '' }
  },
  data: {}
}

class HoldResponseTrialPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych
  }

  trial(display_element, trial) {
    let state = {
      keyPressed: null,
      keyReleased: false,
      stimulusOnsetTime: 0,
      responseStartTime: 0,
      decisionRt: null,
      holdDuration: null,
      timeoutId: null,
      holdTimeoutId: null,
      trialEnded: false,
      earlyKeyDown: false,
      responseTimeout: false,
      validResponse: false,
      choiceKey: null,
      choiceDigit: null
    }

    const container = document.createElement('div')
    container.style.cssText = 'width:100vw;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#111;'
    display_element.appendChild(container)

    const stimulusFrame = document.createElement('div')
    stimulusFrame.className = 'stimulus-frame'
    stimulusFrame.style.display = 'none'
    container.appendChild(stimulusFrame)

    const labelLeft = document.createElement('div')
    labelLeft.className = 'choice-label choice-label-left'
    labelLeft.textContent = '3'
    stimulusFrame.appendChild(labelLeft)

    const labelRight = document.createElement('div')
    labelRight.className = 'choice-label choice-label-right'
    labelRight.textContent = '8'
    stimulusFrame.appendChild(labelRight)

    const fixationEl = document.createElement('div')
    fixationEl.className = 'fixation'
    fixationEl.textContent = '+'
    fixationEl.style.cssText = 'position:absolute;font-size:48px;color:#fff;'
    container.appendChild(fixationEl)

    const imgEl = document.createElement('img')
    imgEl.className = 'stimulus-image'
    imgEl.src = trial.stimulus
    imgEl.style.display = 'none'
    stimulusFrame.appendChild(imgEl)

    this._ensureImageReady(imgEl).then(() => {
      if (!state.trialEnded) {
        this._startFixationPhase(container, fixationEl, stimulusFrame, imgEl, state, trial)
      }
    })
  }

  _ensureImageReady(imgEl) {
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      if (imgEl.decode) return imgEl.decode().catch(() => {})
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      imgEl.onload = () => {
        if (imgEl.decode) imgEl.decode().then(resolve).catch(resolve)
        else resolve()
      }
      imgEl.onerror = () => resolve()
    })
  }

  _startFixationPhase(container, fixationEl, stimulusFrame, imgEl, state, trial) {
    const fixationDuration = trial.fixation_ms || Math.round(trial.show_time * 1000)
    let anyKeyDown = false

    const fixKeyDown = (e) => {
      if (e.repeat) return
      if (e.code === 'KeyF' || e.code === 'KeyK') {
        anyKeyDown = true
      }
    }
    const fixKeyUp = (e) => {
      if (e.code === 'KeyF' || e.code === 'KeyK') {
        anyKeyDown = false
      }
    }

    document.addEventListener('keydown', fixKeyDown)
    document.addEventListener('keyup', fixKeyUp)

    setTimeout(() => {
      document.removeEventListener('keydown', fixKeyDown)
      document.removeEventListener('keyup', fixKeyUp)
      state.earlyKeyDown = anyKeyDown
      this._showStimulus(container, fixationEl, stimulusFrame, imgEl, state, trial)
    }, fixationDuration)
  }

  _showStimulus(container, fixationEl, stimulusFrame, imgEl, state, trial) {
    fixationEl.style.display = 'none'
    stimulusFrame.style.display = 'block'
    imgEl.style.display = 'block'

    const stimOnset = performance.now()
    state.stimulusOnsetTime = stimOnset

    state.keyPressed = null
    state.keyReleased = false

    const kdHandler = (e) => {
      if (e.repeat) return
      if (state.trialEnded) return
      if (e.code === 'KeyF' || e.code === 'KeyK') {
        if (state.keyPressed !== null) return
        state.keyPressed = e.code
        state.responseStartTime = performance.now()
        state.decisionRt = (state.responseStartTime - stimOnset) / 1000
        state.choiceKey = e.code
        state.choiceDigit = e.code === 'KeyF' ? 3 : 8
        state.validResponse = true

        clearTimeout(state.timeoutId)

        state.holdTimeoutId = setTimeout(() => {
          state.holdDuration = trial.max_hold
          state.keyReleased = false
          this._endTrial(container, state, trial)
        }, trial.max_hold * 1000)
      }
    }

    const kuHandler = (e) => {
      if (e.repeat) return
      if (state.trialEnded) return
      if (e.code === state.keyPressed && state.keyPressed !== null) {
        state.keyReleased = true
        clearTimeout(state.holdTimeoutId)
        state.holdDuration = (performance.now() - state.responseStartTime) / 1000
        if (state.holdDuration > trial.max_hold) {
          state.holdDuration = trial.max_hold
        }
        this._endTrial(container, state, trial)
      }
    }

    document.addEventListener('keydown', kdHandler)
    document.addEventListener('keyup', kuHandler)

    state.timeoutId = setTimeout(() => {
      if (!state.trialEnded) {
        state.responseTimeout = true
        state.validResponse = false
        document.removeEventListener('keydown', kdHandler)
        document.removeEventListener('keyup', kuHandler)
        this._endTrial(container, state, trial)
      }
    }, trial.response_timeout * 1000)

    setTimeout(() => {
      imgEl.style.display = 'none'
    }, trial.stimulus_ms)

    state.cleanup = () => {
      document.removeEventListener('keydown', kdHandler)
      document.removeEventListener('keyup', kuHandler)
    }
  }

  _endTrial(container, state, trial) {
    if (state.trialEnded) return
    state.trialEnded = true

    clearTimeout(state.timeoutId)
    clearTimeout(state.holdTimeoutId)
    if (state.cleanup) state.cleanup()

    const confidenceHoldS = state.holdDuration !== null
      ? Math.min(state.holdDuration, trial.max_hold)
      : null

    let confidenceBin = null
    if (confidenceHoldS !== null) {
      if (confidenceHoldS < 0.3) confidenceBin = 1
      else if (confidenceHoldS < 1.0) confidenceBin = 2
      else confidenceBin = 3
    }

    const trialData = {
      participant: trial.participant,
      date: trial.date,
      phase: trial.phase,
      trial_index: trial.trial_index,
      block_id: trial.block_id,
      trial_in_block: trial.trial_in_block,
      difficulty_id: trial.difficulty_id,
      difficulty_rank: trial.difficulty_rank,
      alpha: trial.alpha,
      label_digit: trial.label_digit,
      label_type: trial.label_type,
      sample_type: trial.sample_type,
      show_time: trial.show_time,
      fixation_ms: trial.fixation_ms,
      stimulus_ms: trial.stimulus_ms,
      image_path: trial.image_path,
      choice_key: state.choiceKey,
      choice_digit: state.choiceDigit,
      manual_accuracy: state.choiceDigit === null ? null
        : (state.choiceDigit === trial.label_digit ? 1 : 0),
      decision_rt: state.decisionRt,
      hold_duration: state.holdDuration,
      confidence_hold_s: confidenceHoldS,
      confidence_rating_formal: confidenceHoldS,
      confidence_bin_3level: confidenceBin,
      valid_response: state.validResponse,
      response_timeout: state.responseTimeout ? 1 : 0,
      early_key_down_at_start: state.earlyKeyDown ? 1 : 0
    }

    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }

    this.jsPsych.finishTrial(trialData)
  }
}

HoldResponseTrialPlugin.info = info
export default HoldResponseTrialPlugin
