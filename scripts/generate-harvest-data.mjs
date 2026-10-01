import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const years = [2019, 2020, 2021, 2022, 2023]
const seasons = [0.56, 0.55, 0.66, 0.84, 1.04, 1.19, 1.28, 1.25, 1.14, 0.98, 0.78, 0.64]
const rainSeasons = [0.85, 0.82, 0.94, 1.08, 1.18, 1.12, 0.99, 0.91, 0.86, 0.91, 0.89, 0.84]
const temperatureSeasons = [-5, -4, -1, 3, 7, 10, 12, 11, 8, 4, 0, -3]
const regions = [
  { id: 'A', name: 'Region A', baseYield: 260, baseRain: 108, baseTemp: 16, sensitivity: 0.82 },
  { id: 'B', name: 'Region B', baseYield: 228, baseRain: 126, baseTemp: 18, sensitivity: 0.35 },
  { id: 'C', name: 'Region C', baseYield: 244, baseRain: 96, baseTemp: 20, sensitivity: 1.12 },
  { id: 'D', name: 'Region D', baseYield: 276, baseRain: 142, baseTemp: 15, sensitivity: 0.5 },
]
const yieldFactors = {
  2019: { A: 1, B: 1, C: 1, D: 1 },
  2020: { A: 1.12, B: 1.1, C: 1.13, D: 1.11 },
  2021: { A: 0.78, B: 0.91, C: 0.82, D: 0.93 },
  2022: { A: 0.99, B: 1.02, C: 0.98, D: 1.03 },
  2023: { A: 0.88, B: 0.92, C: 0.68, D: 0.86 },
}
const rainfallFactors = { 2019: 1, 2020: 1.12, 2021: 0.62, 2022: 0.98, 2023: 0.68 }

function stableNoise(seed) {
  let value = 2166136261
  for (const character of seed) {
    value = Math.imul(value ^ character.charCodeAt(0), 16777619)
  }
  return (value >>> 0) / 4294967295
}

const records = []

for (const year of years) {
  for (let month = 1; month <= 12; month += 1) {
    for (const region of regions) {
      const noise = stableNoise(`${year}-${month}-${region.id}`)
      const variation = (noise - 0.5) * 0.1
      const trend = 1 + (year - 2019) * 0.012
      const rainfall = region.baseRain
        * rainSeasons[month - 1]
        * rainfallFactors[year]
        * (1 + variation * 2)
      const temperature = region.baseTemp
        + temperatureSeasons[month - 1]
        + (year - 2019) * 0.18
        + variation * 3
      const droughtIndex = Math.max(0, Math.min(10,
        (1 - rainfall / (region.baseRain * rainSeasons[month - 1])) * 5
        + Math.max(0, temperature - 25) * 0.24
        + region.sensitivity * Math.max(0, 1 - rainfallFactors[year]) * 3.1
        + variation * 1.4,
      ))
      const weatherImpact = 1 - Math.max(0, droughtIndex - 2) * region.sensitivity * 0.012
      const expectedYield = region.baseYield * seasons[month - 1] * trend
      const yieldTonnes = expectedYield * yieldFactors[year][region.id] * weatherImpact * (1 + variation)

      records.push({
        year,
        month,
        region: region.name,
        yield_tonnes: Number(yieldTonnes.toFixed(1)),
        rainfall_mm: Number(rainfall.toFixed(1)),
        avg_temp_c: Number(temperature.toFixed(1)),
        drought_index: Number(droughtIndex.toFixed(1)),
        anomaly: Math.abs(yieldTonnes / expectedYield - 1) > 0.2,
      })
    }
  }
}

await mkdir(resolve(root, 'src/data'), { recursive: true })
await writeFile(resolve(root, 'src/data/harvest.json'), `${JSON.stringify(records, null, 2)}\n`)
console.log(`Generated ${records.length} monthly observations across ${regions.length} regions.`)