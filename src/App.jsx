import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Drop,
  Sun,
  Thermometer,
} from '@phosphor-icons/react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import harvest from './data/harvest.json'
import styles from './App.module.css'

const YEARS = [2019, 2020, 2021, 2022, 2023]
const REGIONS = ['Region A', 'Region B', 'Region C', 'Region D']
const ACCESS_KEY = 'weather-in-season-approved'
const ACCESS_PASSWORD = 'protogen2026'
const WEATHER = {
  rainfall: { label: 'Rainfall', unit: 'mm', field: 'rainfall_mm', color: '#457b9d', Icon: Drop },
  temperature: { label: 'Temperature', unit: '°C', field: 'avg_temp_c', color: '#b74b39', Icon: Thermometer },
  drought: { label: 'Drought index', unit: '/ 10', field: 'drought_index', color: '#c63d35', Icon: Sun },
}

function formatMonth(year, month) {
  return new Date(year, month - 1).toLocaleDateString('en', { month: 'short', year: '2-digit' })
}

function aggregateMonthly(records) {
  const groups = new Map()
  for (const record of records) {
    const key = `${record.year}-${record.month}`
    const group = groups.get(key) ?? {
      year: record.year,
      month: record.month,
      yield_tonnes: 0,
      rainfall_mm: 0,
      avg_temp_c: 0,
      drought_index: 0,
      regions: 0,
      anomalies: 0,
    }
    group.yield_tonnes += record.yield_tonnes
    group.rainfall_mm += record.rainfall_mm
    group.avg_temp_c += record.avg_temp_c
    group.drought_index += record.drought_index
    group.regions += 1
    group.anomalies += Number(record.anomaly)
    groups.set(key, group)
  }
  return [...groups.values()].map((group) => ({
    ...group,
    rainfall_mm: Number((group.rainfall_mm / group.regions).toFixed(1)),
    avg_temp_c: Number((group.avg_temp_c / group.regions).toFixed(1)),
    drought_index: Number((group.drought_index / group.regions).toFixed(1)),
    label: formatMonth(group.year, group.month),
  }))
}

function aggregateAnnual(records, regions = REGIONS) {
  return YEARS.map((year) => {
    const yearRecords = records.filter((record) => record.year === year)
    const regionSummaries = regions.map((region) => {
      const regionRecords = yearRecords.filter((record) => record.region === region)
      return {
        region,
        yield_tonnes: regionRecords.reduce((sum, record) => sum + record.yield_tonnes, 0),
      }
    })
    return {
      year: String(year),
      yield_tonnes: regionSummaries.reduce((sum, item) => sum + item.yield_tonnes, 0),
      ...Object.fromEntries(regionSummaries.map((item) => [item.region, Number(item.yield_tonnes.toFixed(0))])),
    }
  })
}

function CustomTooltip({ active, payload, label, weather }) {
  if (!active || !payload?.length) return null
  const yieldValue = payload.find((item) => item.dataKey === 'yield_tonnes')?.value
  const weatherValue = payload.find((item) => item.dataKey === weather.field)?.value
  const anomalyCount = payload[0]?.payload?.anomalies ?? 0

  return (
    <div className={styles.tooltip}>
      <strong>{label}</strong>
      <span><i className={styles.yieldKey} />Yield {Number(yieldValue).toLocaleString()} tonnes</span>
      <span><i className={styles.weatherKey} style={{ background: weather.color }} />
        {weather.label} {weatherValue} {weather.unit}</span>
      {anomalyCount > 0 && <em>{anomalyCount} region{anomalyCount === 1 ? '' : 's'} outside baseline</em>}
    </div>
  )
}

function WeatherDot({ cx, cy, fill }) {
  if (cx === undefined || cy === undefined) return null
  return <rect x={cx - 3} y={cy - 3} width={6} height={6} fill={fill} />
}

function App() {
  const [isAuthorized, setIsAuthorized] = useState(() => (
    sessionStorage.getItem(ACCESS_KEY) === 'true'
  ))
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [startYear, setStartYear] = useState(2019)
  const [endYear, setEndYear] = useState(2023)
  const [selectedRegions, setSelectedRegions] = useState(REGIONS)
  const [weatherKey, setWeatherKey] = useState('rainfall')

  function submitPassword(event) {
    event.preventDefault()

    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem(ACCESS_KEY, 'true')
      setIsAuthorized(true)
      return
    }

    setPasswordError('That password is not right. Try again.')
  }

  if (!isAuthorized) {
    return (
      <main className={styles.gateScreen}>
        <section className={styles.gatePanel} aria-labelledby="gate-title">
          <a className={`${styles.wordmark} ${styles.gateWordmark}`} href="#" aria-label="Fieldnotes Climate">
            <span className={styles.wordmarkIcon} aria-hidden="true"><span /><span /><span /></span>
            FIELDNOTES <span>/</span> CLIMATE
          </a>
          <p className={styles.kicker}><span /> PRIVATE FIELDNOTES</p>
          <h1 className={styles.gateTitle} id="gate-title">Weather,<br /><em>in season.</em></h1>
          <form className={styles.gateForm} onSubmit={submitPassword}>
            <label htmlFor="story-password">PASSWORD</label>
            <input
              id="story-password"
              type="password"
              value={password}
              autoComplete="current-password"
              aria-describedby={passwordError ? 'password-error' : undefined}
              onChange={(event) => {
                setPassword(event.target.value)
                setPasswordError('')
              }}
            />
            <button type="submit">Submit</button>
            {passwordError && <p className={styles.gateError} id="password-error" role="alert">{passwordError}</p>}
          </form>
        </section>
        <span className={styles.gateFooter}>A DATA STORY <i /> 2019—2023</span>
      </main>
    )
  }

  const weather = WEATHER[weatherKey]

  const filteredRecords = harvest.filter((record) => (
    record.year >= startYear && record.year <= endYear && selectedRegions.includes(record.region)
  ))
  const monthlySeries = aggregateMonthly(filteredRecords)
  const annualSeries = aggregateAnnual(filteredRecords, selectedRegions)
  const selectedRegionRecords = harvest.filter((record) => selectedRegions.includes(record.region))
  const regionAverage = (region, years) => {
    const values = harvest.filter((record) => record.region === region && years.includes(record.year))
    return values.reduce((sum, record) => sum + record.yield_tonnes, 0)
  }
  const referenceYield = regionAverage('Region C', [2019, 2020, 2021, 2022]) / 4
  const droughtYearYield = regionAverage('Region C', [2023])
  const lossPercent = Math.round((1 - droughtYearYield / referenceYield) * 100)
  const selectedMonths = filteredRecords.length
  const chartDescription = `Monthly combined yield for ${selectedRegions.join(', ')} from ${startYear} to ${endYear}, compared with average ${weather.label.toLowerCase()}.`
  const regionAnnual = REGIONS.map((region) => {
    const values = aggregateAnnual(selectedRegionRecords, [region])
    return { region, values }
  })

  function toggleRegion(region) {
    setSelectedRegions((current) => {
      if (current.includes(region)) {
        return current.length === 1 ? current : current.filter((item) => item !== region)
      }
      return [...current, region]
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <a className={styles.wordmark} href="#top" aria-label="Weather, In Season home">
          <span className={styles.wordmarkIcon} aria-hidden="true"><span /><span /><span /></span>
          FIELDNOTES <span>/</span> CLIMATE
        </a>
        <nav aria-label="Story chapters" className={styles.nav}>
          <a href="#baseline">Baseline</a>
          <a href="#weather">Weather</a>
          <a href="#regions">Regions</a>
          <a href="#takeaway">Takeaway</a>
        </nav>
        <span className={styles.edition}>A DATA STORY <b>NO. 01</b></span>
      </header>

      <main id="top">
        <section className={styles.hero} aria-labelledby="headline">
          <div className={styles.heroCopy}>
            <p className={styles.kicker}><span /> AGRICULTURE, IN A WARMING WORLD</p>
            <h1 id="headline">The weather is changing.<br /><em>The harvest is, too.</em></h1>
            <p className={styles.deck}>
              Five years across four growing regions. A closer look at what happens when the
              seasons stop keeping their promises.
            </p>
            <a className={styles.storyLink} href="#baseline">Follow the season <ArrowRight size={16} weight="bold" /></a>
          </div>
          <aside className={styles.heroStat} aria-label={`Region C's 2023 yield was ${lossPercent}% below its 2019 to 2022 average`}>
            <span className={styles.statLabel}>THE SEASON THAT BROKE THE PATTERN</span>
            <strong>{lossPercent}<small>%</small></strong>
            <p>less yield in Region C in 2023, against its prior four-year average.</p>
            <span className={styles.statFoot}><ArrowDownRight size={17} /> A fictional dataset, grounded in real growing-season dynamics</span>
          </aside>
          <div className={styles.heroFooter}>
            <span>2019—2023 <i /> FOUR REGIONS <i /> 240 MONTHLY OBSERVATIONS</span>
            <a href="#baseline" aria-label="Scroll to the baseline chapter">SCROLL TO EXPLORE <ArrowDownRight size={15} /></a>
          </div>
        </section>

        <section className={styles.chapter} id="baseline" aria-labelledby="baseline-title">
          <div className={styles.chapterHead}>
            <div className={styles.chapterNumber}>01 <span>/ 05</span></div>
            <div>
              <p className={styles.kicker}>BEFORE THE WEATHER TURNS</p>
              <h2 id="baseline-title">First, a measure of normal.</h2>
              <p className={styles.chapterIntro}>The harvest grew in 2020, then weather began to pull the regions apart.</p>
            </div>
          </div>
          <figure className={styles.chartFigure}>
            <figcaption className={styles.chartHeading}>
              <span>Annual harvest <small>combined across four regions</small></span>
              <span className={styles.unitTag}>TONNES / YEAR</span>
            </figcaption>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregateAnnual(harvest)} margin={{ top: 16, right: 12, bottom: 0, left: 4 }}>
                  <CartesianGrid vertical={false} stroke="#e9e4dc" strokeDasharray="2 5" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: '#625e58', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={54} tick={{ fill: '#625e58', fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} tonnes`, 'Harvest']} cursor={{ fill: '#f2eee7' }} />
                  <ReferenceLine y={aggregateAnnual(harvest).reduce((sum, item) => sum + item.yield_tonnes, 0) / 5} stroke="#8f8981" strokeDasharray="4 4" />
                  <Bar dataKey="yield_tonnes" fill="#2d6a4f" radius={[2, 2, 0, 0]} maxBarSize={74} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className={styles.chartSummary}>After a strong 2020, annual yield dipped in the drought years. Each bar totals monthly harvests across Regions A–D.</p>
          </figure>
        </section>

        <section className={`${styles.chapter} ${styles.weatherChapter}`} id="weather" aria-labelledby="weather-title">
          <div className={styles.chapterHead}>
            <div className={styles.chapterNumber}>02 <span>/ 05</span></div>
            <div>
              <p className={styles.kicker}>THE SIGNAL IN THE SEASON</p>
              <h2 id="weather-title">Weather moves in.</h2>
              <p className={styles.chapterIntro}>Follow the monthly yield line alongside one weather measure. The filters reshape every view in this story.</p>
            </div>
          </div>

          <div className={styles.controls} aria-label="Story filters">
            <fieldset className={styles.yearControl}>
              <legend>YEAR RANGE <span>{startYear} — {endYear}</span></legend>
              <label>
                <span>From {startYear}</span>
                <input type="range" min={YEARS[0]} max={endYear} step="1" value={startYear}
                  aria-label="First year in range" onChange={(event) => setStartYear(Number(event.target.value))} />
              </label>
              <label>
                <span>Through {endYear}</span>
                <input type="range" min={startYear} max={YEARS.at(-1)} step="1" value={endYear}
                  aria-label="Last year in range" onChange={(event) => setEndYear(Number(event.target.value))} />
              </label>
            </fieldset>
            <fieldset className={styles.regionControl}>
              <legend>GROWING REGIONS <span>{selectedRegions.length} OF 4</span></legend>
              <div className={styles.regionChoices}>
                {REGIONS.map((region, index) => (
                  <label className={`${styles.regionChoice} ${selectedRegions.includes(region) ? styles.regionSelected : ''}`} key={region}>
                    <input type="checkbox" aria-label={region} checked={selectedRegions.includes(region)} onChange={() => toggleRegion(region)} />
                    <span className={styles.regionMark} style={{ '--region-color': ['#2d6a4f', '#457b9d', '#c63d35', '#b27836'][index] }} />
                    {region.replace('Region ', '')}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className={styles.weatherControl}>
              <legend>WEATHER SERIES</legend>
              <div className={styles.weatherChoices} role="group" aria-label="Weather measure">
                {Object.entries(WEATHER).map(([key, item]) => (
                  <button className={weatherKey === key ? styles.weatherActive : ''} key={key}
                    type="button" aria-pressed={weatherKey === key} onClick={() => setWeatherKey(key)}>
                    <item.Icon size={15} aria-hidden="true" /> {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <figure className={styles.chartFigure}>
            <figcaption className={styles.chartHeading}>
              <span>Yield &amp; {weather.label.toLowerCase()} <small>{selectedRegions.join(', ')}</small></span>
              <span className={styles.unitTag}>{selectedMonths} MONTHLY RECORDS</span>
            </figcaption>
            <div className={styles.legend} aria-label="Chart series">
              <span><i className={styles.yieldKey} />Yield <small>tonnes</small></span>
              <span><i className={styles.weatherKey} style={{ background: weather.color }} />{weather.label} <small>{weather.unit}</small></span>
            </div>
            <div className={styles.chartWrap} key={`${weatherKey}-${startYear}-${endYear}-${selectedRegions.join('')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlySeries} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e9e4dc" strokeDasharray="2 5" />
                  <XAxis dataKey="label" interval={5} tickLine={false} axisLine={false} tick={{ fill: '#625e58', fontSize: 11 }} />
                  <YAxis yAxisId="yield" tickLine={false} axisLine={false} width={51} tick={{ fill: '#625e58', fontSize: 11 }} tickFormatter={(value) => Math.round(value).toLocaleString()} />
                  <YAxis yAxisId="weather" orientation="right" tickLine={false} axisLine={false} width={45} tick={{ fill: '#625e58', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip weather={weather} />} />
                  <Line yAxisId="yield" type="monotone" dataKey="yield_tonnes" name="Yield" stroke="#2d6a4f" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive animationDuration={300} />
                  <Line yAxisId="weather" type="monotone" dataKey={weather.field} name={weather.label} stroke={weather.color} strokeWidth={2} strokeDasharray="5 4" dot={<WeatherDot />} activeDot={{ r: 4 }} isAnimationActive animationDuration={300} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className={styles.chartSummary} role="note">{chartDescription} Hover or focus chart points for exact values; dashed squares mark the weather series.</p>
            <span className={styles.srOnly}>{chartDescription}</span>
          </figure>
        </section>

        <section className={styles.chapter} id="regions" aria-labelledby="regions-title">
          <div className={styles.chapterHead}>
            <div className={styles.chapterNumber}>03 <span>/ 05</span></div>
            <div>
              <p className={styles.kicker}>THE SAME SKY, DIFFERENT GROUND</p>
              <h2 id="regions-title">Where it hurts most.</h2>
              <p className={styles.chapterIntro}>Regional totals reveal two stories at once: how much each place grows, and how sharply its yields swing.</p>
            </div>
          </div>
          <div className={styles.regionChartGrid}>
            <figure className={styles.regionBars}>
              <figcaption className={styles.chartHeading}>
                <span>Average annual harvest <small>{startYear}—{endYear}</small></span>
                <span className={styles.unitTag}>TONNES</span>
              </figcaption>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REGIONS.map((region) => {
                    const regionRecords = filteredRecords.filter((record) => record.region === region)
                    const yearsInRange = endYear - startYear + 1
                    return { region: region.replace('Region ', ''), yield_tonnes: regionRecords.reduce((sum, record) => sum + record.yield_tonnes, 0) / yearsInRange }
                  })} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e9e4dc" strokeDasharray="2 5" />
                    <XAxis dataKey="region" tickLine={false} axisLine={false} tick={{ fill: '#625e58', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} width={46} tick={{ fill: '#625e58', fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })} tonnes`, 'Annual average']} />
                    <Bar dataKey="yield_tonnes" fill="#2d6a4f" radius={[2, 2, 0, 0]} maxBarSize={54} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className={styles.chartSummary}>Annual averages for the selected range. A strong total can still hide a fragile growing season.</p>
            </figure>
            <div className={styles.sparkSection}>
              <h3>Yield by region <span>ANNUAL TOTAL · TONNES</span></h3>
              {regionAnnual.filter(({ region }) => selectedRegions.includes(region)).map(({ region, values }) => (
                <div className={styles.sparkRow} key={region}>
                  <span>{region}</span>
                  <div className={styles.sparkChart}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={values.filter((item) => Number(item.year) >= startYear && Number(item.year) <= endYear)}>
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} tonnes`, region]} labelFormatter={(label) => label} />
                        <Line type="monotone" dataKey={region} stroke={['#2d6a4f', '#457b9d', '#c63d35', '#b27836'][REGIONS.indexOf(region)]} strokeWidth={2} dot={{ r: 2 }} isAnimationActive animationDuration={300} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.sparkValue}>{Math.round(values.find((item) => item.year === String(endYear))?.[region] ?? 0).toLocaleString()}</span>
                </div>
              ))}
              <p className={styles.chartSummary}>A sharp dip marks a season when the weather outpaced a region’s ability to adapt.</p>
            </div>
          </div>
          <div className={styles.insightLine}>
            <span className={styles.insightIcon}><ArrowDownRight size={20} /></span>
            <p><strong>Region C is the most exposed.</strong> Its 2023 harvest fell {lossPercent}% below its 2019–22 average; diversified growing conditions helped other regions hold steadier.</p>
          </div>
        </section>

        <section className={`${styles.chapter} ${styles.takeaway}`} id="takeaway" aria-labelledby="takeaway-title">
          <div className={styles.chapterHead}>
            <div className={styles.chapterNumber}>04 <span>/ 05</span></div>
            <div>
              <p className={styles.kicker}>A CLOSER LOOK, A CLEARER CHOICE</p>
              <h2 id="takeaway-title">Resilience is a regional question.</h2>
              <p className={styles.chapterIntro}>The same dry spell does not land the same way everywhere. Local exposure, crop timing, and water access change the outcome.</p>
            </div>
          </div>
          <div className={styles.takeawayBody}>
            <div className={styles.takeawayStatement}>
              <ArrowUpRight size={22} weight="bold" aria-hidden="true" />
              <p>Invest where the weather has the least room to go wrong.</p>
            </div>
            <div className={styles.takeawayCopy}>
              <p>Our invented five-year record is a prompt, not a forecast. But the pattern is familiar: regional averages can conceal a concentrated risk.</p>
              <p>For field teams, resilience starts with asking which places, seasons, and inputs are most exposed, then directing attention there first.</p>
              <span className={styles.dataNote}>Explore a region or weather measure above to see how the story shifts.</span>
            </div>
          </div>
          <a className={styles.backToTop} href="#top">BACK TO THE OPENING <ArrowRight size={15} /></a>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>FIELDNOTES <i>/</i> CLIMATE</span>
        <span>ILLUSTRATIVE DATA · 2019—2023</span>
        <span>MADE FOR A MORE RESILIENT HARVEST</span>
      </footer>
    </div>
  )
}

export default App