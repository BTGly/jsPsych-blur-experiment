export function loadCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      newline: '\n',
      encoding: 'utf-8-sig',
      complete: (result) => {
        const fatal = result.errors ? result.errors.filter(e => e.type === 'Quotes' || e.type === 'UndetectableDelimiter') : []
        const warnings = result.errors ? result.errors.filter(e => e.type === 'FieldMismatch') : []
        if (warnings.length > 0) {
          console.warn('CSV field mismatch warnings:', url, warnings)
        }
        if (fatal.length > 0) {
          reject(new Error('CSV parse error: ' + fatal[0].message))
          return
        }
        resolve(cleanRows(result.data))
      },
      error: (err) => reject(err)
    })
  })
}

export function loadCSVText(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true, newline: '\n', encoding: 'utf-8-sig' })
  const fatal = result.errors ? result.errors.filter(e => e.type === 'Quotes' || e.type === 'UndetectableDelimiter') : []
  if (fatal.length > 0) {
    throw new Error('CSV parse error: ' + fatal[0].message)
  }
  return cleanRows(result.data)
}

export function generateCSV(data, fields) {
  return Papa.unparse({
    fields: fields,
    data: data
  })
}

function cleanRows(rows) {
  return rows.map(row => {
    const clean = {}
    for (const [key, value] of Object.entries(row)) {
      if (key === '__parsed_extra') continue
      clean[key.trim()] = typeof value === 'string' ? value.trim() : value
    }
    return clean
  })
}
