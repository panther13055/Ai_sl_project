# HomePulse presentation and viva guide

## Four-member presentation split

| Member | Sections | Demo / explanation |
|---|---|---|
| 1 | Problem and objectives | Why occupancy-aware energy control matters |
| 2 | PEAS, agent type, architecture | How inputs become decisions |
| 3 | Utility function, working, inputs/outputs | Run the dashboard scenarios |
| 4 | Evaluation, applications, advantages/limitations | Explain test results and future work |

Replace the four member-name lines in the report and presentation notes with your actual details before submission. Everyone should understand the complete sensing–decision–action loop.

## Short opening

“Our project is HomePulse, a Smart Home Energy Agent. It reads simulated occupancy, temperature and daylight for three rooms. It compares possible appliance combinations and selects the best feasible plan according to comfort, energy use and an hourly spending limit. We demonstrate a utility-based agent using an offline browser simulation.”

Hinglish: “Humara agent ghar ke teen rooms ki conditions check karta hai. Phir different appliance combinations compare karke comfort aur energy use ke hisaab se budget ke andar best option choose karta hai.”

## Five-minute live demonstration

1. Open `index.html`. Show the simulated sensor label and default settings.
2. Explain occupied rooms and the reason panel. Toggle Living room to vacant. Its light, fan and AC must all be off.
3. Select Hot afternoon. Increase/decrease spending limit and compare the feasible-plan count.
4. Select Tight spending limit. Explain why lower-power devices may replace AC. A light can also remain off if the score and cap require it.
5. Set the budget to zero. Explain the infeasible-limit warning and the protected 150 W base load.
6. Select Comfortable daylight. Show all controllable devices off.
7. Click +5 min. Session energy becomes 0.0125 kWh and session cost becomes ₹0.10 at ₹8/kWh. The display rounds energy to 0.013 kWh.
8. Download CSV and explain how recorded intervals support evaluation. No percentage savings claim is made.

## Important viva questions

**1. What problem does your agent solve?**

English: It chooses lighting and cooling actions using room conditions while respecting an hourly spending limit whenever feasible.

Hinglish: Room ki need ke hisaab se devices chalata hai aur possible ho toh spending limit ke andar rehta hai.

**2. Which type of intelligent agent is this?**

English: A utility-based agent with an internal state and a simple predictive temperature model.

Hinglish: Agent har possible plan ko score deta hai aur highest-scoring affordable plan choose karta hai.

**3. Where is AI used?**

English: AI is represented by perception, state tracking, action-space search and utility-based decision-making. A trained neural network is not required for this classical agent model.

Hinglish: AI part plans compare karke autonomous decision lena hai. Humne trained ML model use nahi kiya.

**4. Why is this more than a simple reflex agent?**

English: It compares whole-home combinations using predicted comfort, power and switching cost, instead of using only one condition-action rule.

**5. What is PEAS?**

English: Performance measure, Environment, Actuators and Sensors. Here they describe success criteria, the simulated home, device commands and input readings.

**6. What is the utility function?**

English: Utility equals minus eight times discomfort, minus the mode's energy weight times power in kW, minus half the number of cooling changes. The largest score wins.

Hinglish: Discomfort, energy use aur baar-baar switching ki penalty hoti hai. Kam penalty wala plan better hai.

**7. Why can utility be negative?**

English: It is a penalty-based ranking. A score of −10 is better than −30. It is not an accuracy percentage.

**8. What happens when the limit is too low?**

English: If no plan fits, all controllable devices turn off, the essential load stays on, and the agent reports that the limit is infeasible.

**9. Is the tariff real?**

English: No. ₹8/kWh is an editable demonstration value, not a claim about any provider's tariff.

**10. Is this machine learning? Does it learn over time?**

English: No. Its weights and model are fixed. Recording state/history does not mean it learns. Learning could be added in a future version.

**11. Does a fan cool the room air in your model?**

English: No. It lowers the perceived-temperature term by 1.5°C. AC lowers simulated air temperature. Both values are illustrative.

**12. What is the difference between W and kWh?**

English: Watts measure the current rate of power use. Kilowatt-hours measure energy accumulated over time. A 150 W load running for five minutes uses 0.0125 kWh.

**13. What technologies did you use?**

English: HTML for structure, CSS for styling, JavaScript for the agent and interface, and Node's built-in test runner for logic checks. The demo works offline without installation.

**14. What kind of environment is it?**

English: The implemented simulation exposes its modeled state and uses deterministic transitions. It is sequential, with continuous numeric readings and discrete actions. A real home is partially observable and uncertain.

**15. What are the main limitations?**

English: Simulated readings, fixed power values, simplified temperature dynamics and short-horizon optimization. It does not control hardware or prove real-world savings.

**16. Why might Eco and Comfort select the same plan?**

English: The energy weights differ, but both modes can still rank the same feasible plan highest for a given state. Different settings do not guarantee different actions every time.

**17. What is the time complexity?**

English: With up to six actions per room and n rooms, exhaustive evaluation takes O(n × 6^n). For three rooms, there are at most 216 plans, so direct enumeration is manageable.

**18. What could you add later?**

English: Real sensor integration, validated thermal models, forecast-based planning, occupancy uncertainty handling and user overrides. These are future extensions.
