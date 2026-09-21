# HomePulse — Smart Home Energy Agent

A complete offline educational prototype for the Artificial Intelligence self-learning activity. Domain: Smart Home. Team size: four.

## Run the demo

1. Clone or download this repository.
2. Open `index.html` in Chrome, Edge or Firefox.
3. Choose a scenario, change room occupancy or sliders, and click **+5 min** or **Run simulation**.

No installation, API key, paid service, account or internet connection is required. Refreshing resets the session. The Run button advances five simulated minutes every 1.5 seconds. Pause stops this timer. Slider and occupancy changes immediately update the selected plan without consuming simulated energy.

## Demonstrate in class

1. Start with **Evening at home**. Explain sensors, selected appliances and the reason panel.
2. Click a room's **Occupied** button. Its controllable devices switch off.
3. Load **Hot afternoon**. Show cooling choices and available plans.
4. Load **Tight spending limit**. Show the spending constraint and the lower-cost plan.
5. Move the spending limit to zero. Explain why the agent reports a conflict while keeping the illustrative essential load on.
6. Load **Comfortable daylight**. Bright, comfortable rooms need no controllable devices.
7. Click **+5 min**, inspect session kWh and cost, and download the CSV.

Scenarios reset the session, including accumulated energy, cost and history.

## Agent design

The implementation is a **utility-based agent with an internal state and a simple predictive model**. It exhaustively compares a small set of appliance combinations. It does not train a machine-learning model or call an LLM.

Three rooms each contain a light, a fan and an AC. A fan and AC cannot run together in one room. An unoccupied room has only the all-off option. Cooling is disabled at or below target + 0.5°C. Occupied dim rooms can choose light on or off; the off option receives a discomfort penalty. Adequate daylight disables artificial lighting.

At most six options per room give at most 6³ = 216 home plans. The score is:

`utility = -8 * discomfort - energyWeight * power_kW - 0.5 * coolingSwitches`

For each occupied room, discomfort is squared error between predicted perceived temperature and target, plus 6 if daylight is below 300 lux and the light is off. Energy weights are Comfort = 0.5, Balanced = 4, Eco = 15. Weights are illustrative design choices, not learned or calibrated values. Higher utility wins, even when all scores are negative. Ties favor lower power; remaining ties use enumeration order, with no fairness policy.

The agent rejects plans where `power_kW * tariff` exceeds the **hourly spending limit**. This is not a daily or monthly budget. If no plan fits, it selects minimum power, keeps the essential load on, and reports the conflict. The essential load is a fixed educational assumption, not a real electrical protection mechanism.

## Simulation and units

| Setting | Value / interpretation |
|---|---|
| Simulation step | 5 minutes |
| Essential load | Constant 150 W |
| Light | 12 W |
| Fan | 65 W |
| AC | Constant 1,200 W |
| Daylight threshold | 300 lux |
| Default tariff | Illustrative ₹8/kWh, editable |
| Default spending limit | ₹22/hour |
| Default target | 24°C |

`nextAirTemperature = clamp(current + 0.04 * (outdoor-current) - ACcooling, 10, 45)`

ACcooling is 1.8°C when AC runs and zero otherwise. A fan reduces perceived temperature by 1.5°C in the score but does not directly reduce the simulated air temperature. These equations and values are a deliberately simplified teaching model, not an HVAC model validated against buildings.

`intervalEnergy_kWh = power_W / 1000 * 5 / 60`

`intervalCost_INR = intervalEnergy_kWh * tariff_INR_per_kWh`

Session totals sum completed intervals. A tariff change applies to future intervals only. The dashboard's selected power describes the **next** plan; the history chart records the **previously applied** plans. CSV contains all completed intervals, while the chart shows the most recent 24.

## Files

- `index.html`: dashboard layout
- `style.css`: responsive styling
- `engine.js`: validation, candidate generation, utility evaluation and state transitions
- `app.js`: controls, rendering, timer, scenarios and CSV export
- `tests/engine.test.js`: core behavior and numerical checks
- `VIVA_AND_DEMO.md`: classroom demonstration and viva guide
- `build.js` and `vercel.json`: static deployment configuration
- `favicon.svg`: local app icon

## Tests

With Node.js installed, run `node --test tests/engine.test.js` or `npm test`. Running the demo itself does not require Node or Python.

## GitHub and deployment

Repository: https://github.com/panther13055/Ai_sl_project

Import this repository into Vercel. The included `vercel.json` uses the Other/no-framework preset, runs `npm run build`, and publishes `dist`. No environment variables or third-party dependencies are required. Use the repository root as the project root.

To reproduce the deployment build locally, run `npm run build`. Only the five public app assets are copied to `dist`; tests and documentation remain in the source repository. Importing the GitHub repository into Vercel enables automatic deployments when commits reach the connected production branch.

## Limits and future work

All sensor values are simulated. There are no electrical connections, real sensors, backend, trained ML model, user accounts, heating controls or measured energy savings. The model ignores AC compressor cycling, humidity, room insulation and time-varying equipment power. It uses one-step utility maximization, so it does not guarantee optimal daily energy consumption. Real deployment would require calibrated dynamics, device-specific safety rules, occupancy uncertainty handling, secure integration, override controls and rigorous field testing. Reinforcement learning or demand forecasting would be future extensions, not present capabilities.

## Academic reference

Russell and Norvig, *Artificial Intelligence: A Modern Approach*, Chapter 2, “Intelligent Agents.” Official contents: https://aima.cs.berkeley.edu/contents.html . This project implements its own illustrative utility function and simulation.
