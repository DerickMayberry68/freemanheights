/**
 * Holiday utilities for calculating US national holidays and Christian holidays
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

/**
 * Get all holidays for a given year
 * @param {number} year
 * @returns {Array<{name: string, date: Date, type: 'national' | 'christian'}>}
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

  // Christian Holidays
  const easter = calculateEaster(year)

  // Ash Wednesday (46 days before Easter)
  const ashWednesday = new Date(easter)
  ashWednesday.setDate(easter.getDate() - 46)
  holidays.push({ name: "Ash Wednesday", date: ashWednesday, type: 'christian' })

  // Palm Sunday (7 days before Easter)
  const palmSunday = new Date(easter)
  palmSunday.setDate(easter.getDate() - 7)
  holidays.push({ name: "Palm Sunday", date: palmSunday, type: 'christian' })

  // Maundy Thursday (3 days before Easter)
  const maundyThursday = new Date(easter)
  maundyThursday.setDate(easter.getDate() - 3)
  holidays.push({ name: "Maundy Thursday", date: maundyThursday, type: 'christian' })

  // Good Friday (2 days before Easter)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  holidays.push({ name: "Good Friday", date: goodFriday, type: 'christian' })

  // Easter Sunday
  holidays.push({ name: "Easter Sunday", date: easter, type: 'christian' })

  // Ascension Day (39 days after Easter)
  const ascension = new Date(easter)
  ascension.setDate(easter.getDate() + 39)
  holidays.push({ name: "Ascension Day", date: ascension, type: 'christian' })

  // Pentecost Sunday (49 days after Easter)
  const pentecost = new Date(easter)
  pentecost.setDate(easter.getDate() + 49)
  holidays.push({ name: "Pentecost Sunday", date: pentecost, type: 'christian' })

  // Trinity Sunday (56 days after Easter)
  const trinitySunday = new Date(easter)
  trinitySunday.setDate(easter.getDate() + 56)
  holidays.push({ name: "Trinity Sunday", date: trinitySunday, type: 'christian' })

  // Fixed Christian Holidays
  holidays.push({ name: "Epiphany", date: new Date(year, 0, 6), type: 'christian' })
  holidays.push({
    name: "All Saints' Day",
    date: new Date(year, 10, 1),
    type: 'christian'
  })

  // Advent Sundays (4 Sundays before Christmas)
  const christmas = new Date(year, 11, 25)
  const christmasDay = christmas.getDay()
  const daysToFirstAdvent = christmasDay === 0 ? 28 : (christmasDay + 21)
  const firstAdvent = new Date(year, 11, 25 - daysToFirstAdvent)
  holidays.push({ name: "First Sunday of Advent", date: firstAdvent, type: 'christian' })

  // Christmas Eve
  holidays.push({ name: "Christmas Eve", date: new Date(year, 11, 24), type: 'christian' })

  // New Year's Eve
  holidays.push({ name: "New Year's Eve", date: new Date(year, 11, 31), type: 'national' })

  return holidays
}

/**
 * Get holidays for a date range
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<{name: string, date: Date, type: 'national' | 'christian'}>}
 */
export function getHolidaysInRange(startDate, endDate) {
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  const holidays = []
  for (let year = startYear; year <= endYear; year++) {
    holidays.push(...getHolidaysForYear(year))
  }

  return holidays.filter(h => h.date >= startDate && h.date <= endDate)
}
