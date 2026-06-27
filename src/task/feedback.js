function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function textHtml(text, className = 'instruction-text') {
  return `<div class="${className}">${escapeHtml(text)}</div>`
}

export function practiceFeedbackTimeline(jsPsych, state, totalPracticeN) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '',
    choices: ['Enter'],
    response_ends_trial: true,
    on_start: (trial) => {
      const lastData = jsPsych.data.get().filter({ phase: 'practice' }).values().slice(-1)[0]
      const result = buildPracticeFeedback(lastData, state.points, totalPracticeN)
      state.points = result.totalPoints
      trial.stimulus = textHtml(result.text, 'feedback-text')
      trial.data = {
        phase: 'practice_feedback',
        practice_points_earned: result.pointsEarned,
        practice_current_total: state.points,
        practice_confidence_percent: result.confidencePercent,
        practice_BDM_random_X: result.randomX,
        practice_win: result.isWin,
        practice_timeout_feedback: result.timeout ? 1 : 0
      }
    }
  }
}

function buildPracticeFeedback(lastData, currentPoints, totalPracticeN) {
  if (!lastData || lastData.response_timeout === 1 || !lastData.valid_response) {
    return {
      text: '⏰ 超时未作答\n------------------------------\n你需要在 2 秒内按下 F 或 K。\n\nF = 判断为 3\nK = 判断为 8\n\n本题得分：0 / 1 分\n当前练习得分：' + currentPoints + ' / ' + totalPracticeN + ' 分\n\n请根据第一感觉快速作答。\n按 Enter 继续。',
      totalPoints: currentPoints,
      pointsEarned: 0,
      confidencePercent: null,
      randomX: null,
      isWin: 0,
      timeout: true
    }
  }

  const userChoice = lastData.choice_digit
  const answer = lastData.label_digit
  const taskResult = lastData.manual_accuracy === 1 ? 1 : 0
  const ansFeedback = taskResult === 1
    ? `✅ 回答正确（你选了 ${userChoice}，答案是 ${answer}）`
    : `❌ 回答错误（你选了 ${userChoice}，答案是 ${answer}）`

  const maxHold = 1.0
  const hold = Math.max(0, Math.min(lastData.confidence_hold_s ?? 0, maxHold))
  const confidencePercent = Math.max(0, Math.min(Math.round((hold / maxHold) * 100), 100))
  const randomX = Math.floor(Math.random() * 101)

  let logicMsg
  let calibrationMsg
  let isWin

  if (confidencePercent >= randomX) {
    const compareStr = `自信(${confidencePercent}%) ≥ 幸运(${randomX}%) → 【按答题结算】`
    if (taskResult === 1) {
      isWin = 1
      logicMsg = `${compareStr}\n挑战成功！(+1分)`
      calibrationMsg = '评价：【判断精准】自信与实力匹配。'
    } else {
      isWin = 0
      logicMsg = `${compareStr}\n挑战失败！(0分)`
      calibrationMsg = '评价：【过度自信】\n不确定时请缩短按住时间。'
    }
  } else {
    const compareStr = `自信(${confidencePercent}%) < 幸运(${randomX}%) → 【按抽奖结算】`
    const lotteryRoll = Math.floor(Math.random() * 100) + 1
    if (lotteryRoll <= randomX) {
      isWin = 1
      logicMsg = `${compareStr}\n抽奖赢了！(+1分)`
    } else {
      isWin = 0
      logicMsg = `${compareStr}\n抽奖没中... (0分)`
    }
    calibrationMsg = taskResult === 1
      ? '评价：【过度谦虚】\n其实你做对了，按住更久本来可能更稳。'
      : '评价：【明智避险】\n做错了但低自信转入抽奖，策略正确。'
  }

  const pointsEarned = isWin ? 1 : 0
  const totalPoints = currentPoints + pointsEarned
  const text = `${ansFeedback}
------------------------------
你的按住时长：${hold.toFixed(2)} 秒
换算自信度：${confidencePercent}%
------------------------------
${logicMsg}
------------------------------
${calibrationMsg}
------------------------------
本题得分：${pointsEarned} / 1 分
当前练习得分：${totalPoints} / ${totalPracticeN} 分

(按回车 Enter 继续)`

  return {
    text,
    totalPoints,
    pointsEarned,
    confidencePercent,
    randomX,
    isWin,
    timeout: false
  }
}

export function practiceEndTimeline(state, totalPracticeN, runPretest) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
      const title = totalPracticeN <= 0 ? '热身练习已跳过' : '练习阶段结束！'
      const scoreText = totalPracticeN <= 0
        ? '本次未进行练习。'
        : `你的练习得分：${state.points} / ${totalPracticeN} 分`
      const nextStageText = runPretest ? '预实验' : '正式实验'
      return textHtml(`${title}\n\n${scoreText}\n\n接下来将进入：${nextStageText}\n\n请按 Enter 继续。`)
    },
    choices: ['Enter'],
    response_ends_trial: true
  }
}

export function pretestBlockFeedbackTimeline(blockDone, totalBlocks) {
  const text = blockDone >= totalBlocks
    ? `预实验第 ${blockDone} / ${totalBlocks} 组已完成。\n\n预实验已完成。\n\n接下来程序将根据你的预实验结果生成正式实验。\n\n请按 Enter 继续。`
    : `预实验第 ${blockDone} / ${totalBlocks} 组已完成。\n\n请短暂休息。\n\n准备好后按 Enter 继续下一组。`
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: textHtml(text),
    choices: ['Enter'],
    response_ends_trial: true
  }
}

export function formalBlockIntroTimeline(blockId, totalBlocks = 11, trialsPerBlock = 100) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: textHtml(`正式实验第 ${blockId} / ${totalBlocks} 轮\n\n本轮共有 ${trialsPerBlock} 张图片。\n\n请根据第一感觉作答。\n准备好后按 Enter 开始。`),
    choices: ['Enter'],
    response_ends_trial: true
  }
}

export function blockFeedbackTimeline(jsPsych, blockId, totalBlocks = 11, trialsPerBlock = 100) {
  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
      const rows = jsPsych.data.get().filter({ phase: 'formal', block_id: blockId }).values()
      const points = rows.filter(row => row.manual_accuracy === 1).length
      return textHtml(`本轮结束\n\n当前进度：已完成第 ${blockId} / ${totalBlocks} 轮\n\n本轮得分：${points} / ${trialsPerBlock} 分\n\n你可以稍作休息。\n如果休息好了，请按 Enter 继续。\n\n`, 'block-feedback')
    },
    choices: ['Enter'],
    response_ends_trial: true
  }
}
