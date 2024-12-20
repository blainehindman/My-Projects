# Rules for Rankings, Seeding, and Playoffs

## **1. Ranking Process**

The rankings are based on a combination of performance metrics and conference affiliations. Teams earn points in the following categories:

### **A. Categories and Points Allocation**

1. **Record Points (Max: 45):**

   - Calculated as the win percentage multiplied by the maximum record points.
   - Example: A team with 10 wins in a 12-game season gets \((10/12) \times 45\).

2. **Strength of Schedule (SoS) Points (Max: 30):**

   - Determined by summing the total points of opponents faced during the season.
   - Adjusted based on the difficulty of opponents relative to other teams.

3. **Offense Points (Max: 15):**

   - Based on a team's offensive performance relative to other teams.
   - Normalized to ensure comparability across the dataset.

4. **Defense Points (Max: 10):**

   - Similar to offense points but based on defensive performance.

5. **Best Win Points (Max: 15):**

   - Points awarded based on the highest-ranked team defeated by a given team.
   - Normalized across all teams.

6. **Lowest Loss Points (Max: 10):**

   - A penalty based on the lowest-ranked team that a given team lost to.
   - Lower penalties for losses to highly ranked opponents.

7. **Conference Points:**

   - Teams receive additional points based on their conference's strength, with "Power Conferences" ranked higher than others.
   - Example: SEC teams get 20 points, while Sun Belt teams receive 12.

8. **Conference Champion Bonus (Max: 3):**
   - An extra 3 points are awarded to conference champions, ensuring they receive a preference in rankings.

### **B. Calculation of Total Points**

Each team’s total points are computed by summing:

- Record Points
- SoS Points
- Offense Points
- Defense Points (subtracted as a penalty)
- Conference Points
- Best Win Points
- Lowest Loss Points (subtracted as a penalty)
- Conference Champion Bonus (if applicable)

---

## **2. Seeding and Playoff Selection**

### **A. Auto-Bids for Conference Champions**

- Conference champions from all conferences are guaranteed a spot in the final rankings.
- The highest-ranking Power 5 conference champion receives priority.

### **B. Selection of 12 Teams**

1. **Hardcoded Teams:**

   - Conference champions are added to the list of 12 playoff teams.

2. **Remaining Spots:**

   - The remaining spots are filled by the highest-ranked teams not already included.
   - Rankings are recalculated to ensure fairness.

3. **Final Sorting:**
   - The top 12 teams are sorted based on total points, with the highest-ranking teams receiving preference.

---

## **3. Playoff Bracket**

### **A. Top 4 Teams (Byes):**

- The top four teams receive first-round byes.

### **B. First Round (Seeds 5–12):**

- Teams ranked 5–12 compete in the first round.
- Matchups are determined using a seeding system where:
  - Seed 5 plays Seed 12
  - Seed 6 plays Seed 11
  - Seed 7 plays Seed 10
  - Seed 8 plays Seed 9

### **C. Quarterfinals:**

- Winners from the first round face the top 4 seeds in the quarterfinals.

### **D. Advancement:**

- Winners advance to the semifinals, and then to the championship game.

---

## **4. Example Workflow**

1. **Data Retrieval:**

   - Team records, offense, defense, and schedules are fetched from an API.

2. **Point Calculations:**

   - Each category is calculated and combined into a total score.

3. **Ranking and Selection:**

   - Teams are ranked based on total points.
   - The top 12 teams, including conference champions, are selected.

4. **Bracket Formation:**
   - Teams are placed into a playoff bracket, with matchups based on seedings.

---

This system ensures fairness by incorporating both objective performance metrics and subjective conference strengths. It balances rewarding top-performing teams while ensuring representation for conference champions.
