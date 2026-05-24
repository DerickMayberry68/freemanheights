/**
 * Holiday utilities for calculating US national holidays, core Christian holidays,
 * and Southern Baptist Convention observances.
 */

/**
 * Calculate Easter Sunday for a given year using Meeus/Jones/Butcher algorithm
 * @param {number} year
 * @returns {Date}
 */
function calculateEaster(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month, day)
}

/**
 * Get the nth occurrence of a weekday in a month
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 * @param {number} weekday - 0-indexed (0 = Sunday)
 * @param {number} n - which occurrence (1 = first, -1 = last)
 * @returns {Date}
 */
function getNthWeekdayOfMonth(year, month, weekday, n) {
  if (n > 0) {
    // First, second, third, etc.
    const firstDay = new Date(year, month, 1)
    const firstWeekday = firstDay.getDay()
    const offset = (weekday - firstWeekday + 7) % 7
    const day = 1 + offset + (n - 1) * 7
    return new Date(year, month, day)
  } else {
    // Last occurrence
    const lastDay = new Date(year, month + 1, 0)
    const lastWeekday = lastDay.getDay()
    const offset = (lastWeekday - weekday + 7) % 7
    const day = lastDay.getDate() - offset
    return new Date(year, month, day)
  }
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function makeDate(year, month, day) {
  return new Date(year, month - 1, day)
}

const SBC_OBSERVANCES_BY_YEAR = {
  2026: [
    ['January Bible Study Week', 1, 4, 1, 11],
    ['Sanctity of Life Sunday', 1, 18],
    ['George Liele Church Planting, Evangelism, and Missions Sunday', 2, 1],
    ['Focus on WMU Sunday', 2, 15],
    ['Racial Reconciliation Sunday', 2, 22],
    ['Week of Prayer for North American Missions and Annie Armstrong Easter Offering', 3, 1, 3, 8],
    ['Church Planting Emphasis Day', 3, 22],
    ['Baptism Sunday', 4, 12],
    ['SBC Seminary Sunday', 5, 3],
    ['National Day of Prayer', 5, 7],
    ["Children's Ministry Sunday", 5, 17],
    ['Disaster Relief Sunday', 5, 31],
    ['Crossover Orlando', 6, 6],
    ['WMU Missions Celebration', 6, 7, 6, 8],
    ['SBC Annual Meeting (Orlando, FL)', 6, 9, 6, 10],
    ['Mission:Dignity Sunday', 6, 28],
    ['Religious Liberty Sunday', 7, 5],
    ['Send Relief Sunday', 8, 2],
    ['SBC Serve Sunday', 8, 9],
    ['Global Hunger Sunday', 8, 23],
    ["Children's Missions Day", 9, 19],
    ['Caring Well Sunday', 9, 27],
    ['CP Sunday', 10, 4],
    ['Day of Prayer for Associational Missions', 10, 18],
    ['Student Baptism Sunday', 10, 25],
    ['Day of Prayer for Persecuted Church', 11, 1],
    ['Orphans & Widows Sunday', 11, 8],
    ['Week of Prayer for International Missions and Lottie Moon Christmas Offering', 11, 29, 12, 6],
  ],
  2027: [
    ['January Bible Study Week', 1, 3, 1, 10],
    ['Sanctity of Life Sunday', 1, 17],
    ['George Liele Church Planting, Evangelism, and Missions Sunday', 2, 7],
    ['Focus on WMU Sunday', 2, 21],
    ['Racial Reconciliation Sunday', 2, 28],
    ['Week of Prayer for North American Missions and Annie Armstrong Easter Offering', 3, 7, 3, 14],
    ['Church Planting Emphasis Day', 3, 14],
    ['Baptism Sunday', 4, 4],
    ['SBC Seminary Sunday', 5, 2],
    ['National Day of Prayer', 5, 6],
    ["Children's Ministry Sunday", 5, 16],
    ['Disaster Relief Sunday', 5, 30],
    ['Crossover Indianapolis', 6, 12],
    ['WMU Missions Celebration', 6, 13, 6, 14],
    ['SBC Annual Meeting (Indianapolis, IN)', 6, 15, 6, 16],
    ['Mission:Dignity Sunday', 6, 27],
    ['Religious Liberty Sunday', 7, 4],
    ['Disability Ministry Sunday', 7, 11],
    ['Send Relief Sunday', 8, 1],
    ['SBC Serve Sunday', 8, 8],
    ['Global Hunger Sunday', 8, 22],
    ["Children's Missions Day", 9, 18],
    ['Caring Well Sunday', 9, 26],
    ['CP Sunday', 10, 3],
    ['Day of Prayer for Associational Missions', 10, 17],
    ['Student Baptism Sunday', 10, 24],
    ['Day of Prayer for the Persecuted Church', 11, 7],
    ['Orphans & Widows Sunday', 11, 14],
    ['Week of Prayer for International Missions and Lottie Moon Christmas Offering', 11, 28, 12, 5],
  ],
  2028: [
    ['January Bible Study Week', 1, 2, 1, 9],
    ['Sanctity of Life Sunday', 1, 23],
    ['George Liele Church Planting, Evangelism, and Missions Sunday', 2, 6],
    ['Focus on WMU Sunday', 2, 20],
    ['Racial Reconciliation Sunday', 2, 27],
    ['Week of Prayer for North American Missions and Annie Armstrong Easter Offering', 3, 5, 3, 12],
    ['Church Planting Emphasis Day', 3, 19],
    ['Baptism Sunday', 4, 23],
    ['National Day of Prayer', 5, 4],
    ['SBC Seminary Sunday', 5, 7],
    ["Children's Ministry Sunday", 5, 21],
    ['Disaster Relief Sunday', 6, 4],
    ['Crossover St. Louis', 6, 10],
    ['WMU Missions Celebration', 6, 11, 6, 12],
    ['SBC Annual Meeting (St. Louis, MO)', 6, 13, 6, 14],
    ['Mission:Dignity Sunday', 6, 25],
    ['Religious Liberty Sunday', 7, 2],
    ['Disability Ministry Sunday', 7, 9],
    ['Send Relief Sunday', 8, 6],
    ['SBC Serve Sunday', 8, 13],
    ['Global Hunger Sunday', 8, 27],
    ["Children's Missions Day", 9, 16],
    ['Caring Well Sunday', 9, 24],
    ['CP Sunday', 10, 1],
    ['Day of Prayer for Associational Missions', 10, 22],
    ['Student Baptism Sunday', 10, 29],
    ['Day of Prayer for Persecuted Church', 11, 5],
    ['Orphans & Widows Sunday', 11, 12],
    ['Week of Prayer for International Missions and Lottie Moon Christmas Offering', 12, 3, 12, 10],
  ],
}

function getSbcObservancesForYear(year) {
  return (SBC_OBSERVANCES_BY_YEAR[year] || []).map(([name, startMonth, startDay, endMonth, endDay]) => {
    const date = makeDate(year, startMonth, startDay)
    const endDate = endMonth && endDay ? makeDate(year, endMonth, endDay) : date
    return { name, date, endDate, type: 'sbc' }
  })
}

/**
 * Get all holidays for a given year
 * @param {number} year
 * @returns {Array<{name: string, date: Date, endDate?: Date, type: 'national' | 'christian' | 'sbc'}>}
 */
export function getHolidaysForYear(year) {
  const holidays = []

  // US National Holidays
  holidays.push({ name: "New Year's Day", date: new Date(year, 0, 1), type: 'national' })
  holidays.push({
    name: "Martin Luther King Jr. Day",
    date: getNthWeekdayOfMonth(year, 0, 1, 3), // 3rd Monday in January
    type: 'national'
  })
  holidays.push({
    name: "Presidents' Day",
    date: getNthWeekdayOfMonth(year, 1, 1, 3), // 3rd Monday in February
    type: 'national'
  })
  holidays.push({
    name: "Memorial Day",
    date: getNthWeekdayOfMonth(year, 4, 1, -1), // Last Monday in May
    type: 'national'
  })
  holidays.push({ name: "Independence Day", date: new Date(year, 6, 4), type: 'national' })
  holidays.push({
    name: "Labor Day",
    date: getNthWeekdayOfMonth(year, 8, 1, 1), // 1st Monday in September
    type: 'national'
  })
  holidays.push({
    name: "Columbus Day",
    date: getNthWeekdayOfMonth(year, 9, 1, 2), // 2nd Monday in October
    type: 'national'
  })
  holidays.push({ name: "Veterans Day", date: new Date(year, 10, 11), type: 'national' })
  holidays.push({
    name: "Thanksgiving",
    date: getNthWeekdayOfMonth(year, 10, 4, 4), // 4th Thursday in November
    type: 'national'
  })
  holidays.push({ name: "Christmas Day", date: new Date(year, 11, 25), type: 'national' })

  // Core Christian holidays commonly recognized in Baptist churches
  const easter = calculateEaster(year)

  // Palm Sunday (7 days before Easter)
  const palmSunday = new Date(easter)
  palmSunday.setDate(easter.getDate() - 7)
  holidays.push({ name: "Palm Sunday", date: palmSunday, type: 'christian' })

  // Good Friday (2 days before Easter)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  holidays.push({ name: "Good Friday", date: goodFriday, type: 'christian' })

  // Easter Sunday
  holidays.push({ name: "Easter Sunday", date: easter, type: 'christian' })

  // Christmas Eve
  holidays.push({ name: "Christmas Eve", date: new Date(year, 11, 24), type: 'christian' })

  // New Year's Eve
  holidays.push({ name: "New Year's Eve", date: new Date(year, 11, 31), type: 'national' })

  holidays.push(...getSbcObservancesForYear(year))

  return holidays
}

/**
 * Get holidays for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<{name: string, date: Date, endDate?: Date, type: 'national' | 'christian' | 'sbc'}>}
 */
export function getHolidaysInRange(startDate, endDate) {
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  const holidays = []
  for (let year = startYear; year <= endYear; year++) {
    holidays.push(...getHolidaysForYear(year))
  }

  return holidays.filter(h => h.date <= endDate && (h.endDate || h.date) >= startDate)
}
