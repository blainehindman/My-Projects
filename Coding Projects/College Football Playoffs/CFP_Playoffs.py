import requests
import pandas as pd

# API key and headers
API_KEY = "ooPM1hAjKzJwNeXBEpSo/KicAdjVFIUGxp1UygoZd+qGL8aCVDvs2C+ML79bx8tY"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

# Conference data
POWER_CONFERENCES = ["SEC", "Big Ten", "Big 12", "ACC"]
GROUP_OF_REST = ["American Athletic", "Mountain West", "MAC", "Conference USA", "AAC", "Sun Belt"]
PAC_12 = ["Pac-12"]
FBS_INDEPENDENT = ["FBS Independents"]

ALL_CONFERENCES = POWER_CONFERENCES + GROUP_OF_REST + PAC_12 + FBS_INDEPENDENT

CONFERENCE_POINTS = {
    "SEC": 20,
    "Big Ten": 18,
    "Big 12": 16,
    "ACC": 14,
    "FBS Independents": 0,
    "Pac-12": 13,
    "Mountain West": 13,
    "Sun Belt": 12,
    "MAC": 11,
    "Conference USA": 11,
    "American Athletic": 10
}

# Conference champions, Auto Bid
CONFERENCE_CHAMPS = ["Georgia", "Oregon", "Clemson", "Arizona State", "Boise State"]

# Define maximum points
MAX_RECORD_POINTS = 45  # Maximum points for the Record category
MAX_SOS_POINTS = 30  # Maximum points for SoS category
MAX_OFFENSE_POINTS = 15  # Maximum points for Offense category
MAX_DEFENSE_POINTS = 10  # Maximum points for Defense category
MAX_BEST_WIN = 15 # Maximum points for Best Win category
MAX_LOWEST_LOSS = 10 # Maximum points for Worst Loss category
MAX_FBS_IND_CON_POINTS = 20  # Maximum points for SOS->CON for FBS
CONFERENCE_CHAMP_BONUS = 3  # Maximum points for conference champions

#######################################################
#                                                     #
#                    Get API Data                     #
#                                                     #
#######################################################
# Function to fetch team records
def fetch_team_records(year):
    url = "https://api.collegefootballdata.com/records"
    params = {"year": year}
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()

# Function to fetch team offense overall
def fetch_team_offense(year):
    url = "https://api.collegefootballdata.com/ppa/teams"
    params = {
        "year": year,
        "type": "offense"  # Ensure the API fetches offense-specific data
    }
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    data = response.json()

    # Parse and structure the offense data
    offense_data = []
    for item in data:
        overall = item["offense"]["overall"] if "offense" in item and "overall" in item["offense"] else 0
        offense_data.append({
            "team": item["team"],
            "conference": item.get("conference", ""),
            "overall": float(overall)  # Ensure 'overall' is a float
        })
    return offense_data

# Function to fetch team defense overall
def fetch_team_defense(year):
    url = "https://api.collegefootballdata.com/ppa/teams"
    params = {
        "year": year,
        "type": "defense"  # Ensure the API fetches defense-specific data
    }
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    data = response.json()

    # Parse and structure the defense data
    defense_data = []
    for item in data:
        overall = item["defense"]["overall"] if "defense" in item and "overall" in item["defense"] else 0
        defense_data.append({
            "team": item["team"],
            "conference": item.get("conference", ""),
            "overall": float(overall)  # Ensure 'overall' is a float
        })
    return defense_data

# Function to fetch schedules for all teams
def fetch_team_schedules(year):
    url = "https://api.collegefootballdata.com/games"
    params = {"year": year}
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()


#######################################################
#                                                     #
#                   Calculate Data                    #
#                                                     #
#######################################################
# Function to calculate points based on Record
def calculate_record_points(team):
    wins = team.get("total", {}).get("wins", 0)
    losses = team.get("total", {}).get("losses", 0)
    ties = team.get("total", {}).get("ties", 0)
    games = wins + losses + ties

    # Points calculation for Record
    if games > 0:
        points = (wins / games) * MAX_RECORD_POINTS
    else:
        points = 0
    return points

# Function to calculate points based on Offense
def calculate_offense_points(team, offense_data):
    offense_stats = next((o for o in offense_data if o["team"] == team["team"]), None)
    if offense_stats:
        offense_overall = offense_stats.get("overall", 0)
        # Normalize offense overall to MAX_OFFENSE_POINTS
        max_overall = max(o.get("overall", 1) for o in offense_data)  # Avoid division by zero
        points = (offense_overall / max_overall) * MAX_OFFENSE_POINTS
    else:
        points = 0
    return points

# Function to calculate points based on Defense
def calculate_defense_points(team, defense_data):
    defense_stats = next((d for d in defense_data if d["team"] == team["team"]), None)
    if defense_stats:
        defense_overall = defense_stats.get("overall", 0)
        # Normalize defense overall to MAX_OFFENSE_POINTS (reused for simplicity)
        max_overall = max(d.get("overall", 1) for d in defense_data)  # Avoid division by zero
        points = (defense_overall / max_overall) * MAX_DEFENSE_POINTS

    else:
        points = 0
    return points

# Function to calculate points based on Conference ranking
def calculate_conference_points(conference):
    return CONFERENCE_POINTS.get(conference, 0)  # Default to 0 if the conference is not listed

# Function to compute Strength of Schedule
def calculate_strength_of_schedule(year, team_scores):
    # Convert team scores to a dictionary for quick lookup
    team_scores_dict = {
        team['Team'].split(' (')[0]: team['Total Points']
        for team in team_scores
    }
    
    # Fetch schedules
    schedules = fetch_team_schedules(year)
    
    # Dictionary to store SoS values
    sos_values = {}
    
    for game in schedules:
        home_team = game.get("home_team")
        away_team = game.get("away_team")
        
        # Ensure teams are initialized in the sos_values dictionary
        if home_team not in sos_values:
            sos_values[home_team] = 0
        if away_team not in sos_values:
            sos_values[away_team] = 0
        
        # Add opponent scores
        sos_values[home_team] += team_scores_dict.get(away_team, 0)
        sos_values[away_team] += team_scores_dict.get(home_team, 0)
    
    # Normalize SoS values
    max_sos = max(sos_values.values()) if sos_values else 1  # Avoid division by zero
    for team in sos_values:
        sos_values[team] = (sos_values[team] / max_sos) * MAX_SOS_POINTS

    # Update team scores with SoS and Best Win
    for team in team_scores:
        team_name = team['Team'].split(' (')[0]
        sos_points = sos_values.get(team_name, 0)

        team['SoS Points'] = sos_values.get(team_name, 0)

        # Adjust conference points if the team is in FBS Independents
        if team["Conference"] in FBS_INDEPENDENT:
            team['Conference Points'] = (sos_points / MAX_SOS_POINTS) * MAX_FBS_IND_CON_POINTS
            team['Total Points'] += team['Conference Points']

        team['Total Points'] += team['SoS Points']  # Add SoS to total points

    return team_scores

# Function to calculate points based on Best Win
def calculate_best_win(year, team_scores):
    # Convert team scores to a dictionary for quick lookup
    team_scores_dict = {
        team['Team'].split(' (')[0]: team['Base Non-Result Points']
        for team in team_scores
    }
    
    # Fetch schedules
    schedules = fetch_team_schedules(year)
    
    # Dictionary to store best win values
    best_win_values = {}
    best_win_teams = {}
    
    for game in schedules:
        home_team = game.get("home_team")
        away_team = game.get("away_team")
        home_points = game.get("home_points")
        away_points = game.get("away_points")
        
        if home_points is not None and away_points is not None:
            if home_points > away_points:
                winner, loser = home_team, away_team
            else:
                winner, loser = away_team, home_team
            
            # Calculate the difference in Base Non-Result Points
            if winner not in best_win_values:
                best_win_values[winner] = 0
            if team_scores_dict.get(loser, 0) > best_win_values[winner]:
                best_win_values[winner] = team_scores_dict.get(loser, 0)
                best_win_teams[winner] = loser
    
    # Normalize Best Win values
    max_best_win = max(best_win_values.values()) if best_win_values else 1  # Avoid division by zero
    for team in best_win_values:
        best_win_values[team] = (best_win_values[team] / max_best_win) * MAX_BEST_WIN

    # Update team scores with Best Win points
    for team in team_scores:
        team_name = team['Team'].split(' (')[0]
        team['Best Win Points'] = best_win_values.get(team_name, 0)
        team['Best Win Team'] = best_win_teams.get(team_name, "")
        team['Total Points'] += team['Best Win Points']

    return team_scores

# Function to calculate points based on Lowest Loss
def calculate_lowest_loss(year, team_scores):
    # Convert team scores to a dictionary for quick lookup
    team_scores_dict = {
        team['Team'].split(' (')[0]: team['Base Non-Result Points']
        for team in team_scores
    }
    
    # Fetch schedules
    schedules = fetch_team_schedules(year)
    
    # Dictionary to store lowest loss values
    lowest_loss_values = {}
    lowest_loss_teams = {}
    
    for game in schedules:
        home_team = game.get("home_team")
        away_team = game.get("away_team")
        home_points = game.get("home_points")
        away_points = game.get("away_points")
        
        if home_points is not None and away_points is not None:
            if home_points > away_points:
                winner, loser = home_team, away_team
            else:
                winner, loser = away_team, home_team
            
            # Calculate the lowest Base Non-Result Points for losses
            if loser not in lowest_loss_values:
                lowest_loss_values[loser] = float('inf')  # Initialize with a high value
            
            if team_scores_dict.get(winner, float('inf')) < lowest_loss_values[loser]:
                lowest_loss_values[loser] = team_scores_dict.get(winner, float('inf'))
                lowest_loss_teams[loser] = winner
    
    # Normalize Lowest Loss values (inversely since lower points are better)
    min_lowest_loss = min(lowest_loss_values.values()) if lowest_loss_values else 1  # Avoid division by zero
    for team in lowest_loss_values:
        lowest_loss_values[team] = (min_lowest_loss / lowest_loss_values[team]) * MAX_LOWEST_LOSS

    # Update team scores with Lowest Loss points
    for team in team_scores:
        team_name = team['Team'].split(' (')[0]
        team['Lowest Loss Points'] = lowest_loss_values.get(team_name, 0)
        team['Lowest Loss Team'] = lowest_loss_teams.get(team_name, "")
        team['Total Points'] -= team['Lowest Loss Points']

    return team_scores

# New function to combine hardcoded teams with top teams and resort
def populate_con_champs_and_top_teams(hardcoded_teams, team_scores, num_spots=12):
    # Convert hardcoded teams to DataFrame
    hardcoded_df = pd.DataFrame(
        [team for team in team_scores if team["Team"].split(" (")[0] in hardcoded_teams]
    )
    remaining_spots = num_spots - len(hardcoded_df)
    
    # Select top-scoring teams not in the hardcoded list
    filtered_scores = [team for team in team_scores if team["Team"].split(" (")[0] not in hardcoded_teams]
    remaining_df = pd.DataFrame(filtered_scores).sort_values(by="Total Points", ascending=False).head(remaining_spots)
    
    # Combine hardcoded and remaining teams
    final_teams_df = pd.concat([hardcoded_df, remaining_df], ignore_index=True)
    
    # Resort the combined DataFrame based on total points
    final_teams_df = final_teams_df.sort_values(by="Total Points", ascending=False)
    
    return final_teams_df

def add_points_for_conference_champs(conference_champs, team_scores):
    for team in team_scores:
        team_name = team["Team"].split(" (")[0]  # Extract the team name without record
        if team_name in conference_champs:
            team["Total Points"] += CONFERENCE_CHAMP_BONUS  # Add points
            team["Conference Champ Bonus"] = CONFERENCE_CHAMP_BONUS  # Add an indicator for the bonus
        else:
            team["Conference Champ Bonus"] = 0  # No bonus for non-champs
    return team_scores

# Create and print the tournament bracket
def print_bracket(final_teams_df):
    # Split teams into two groups: top 4 (byes) and the remaining 8
    top_4 = final_teams_df.head(4).reset_index()
    rest_8 = final_teams_df.iloc[4:].reset_index()
    
    print("\nTournament Bracket:")
    print("Top 4 Teams (First-Round Byes):")
    for index, row in top_4.iterrows():
        print(f"{index + 1}. {row['Team']}")

    print("\nFirst Round Matchups:")
    # Seed the remaining 8 teams (highest vs lowest)
    for i in range(4):
        team1 = rest_8.iloc[i]  # Higher seed
        team2 = rest_8.iloc[-(i + 1)]  # Lower seed
        print(f"{team1['Team']} vs {team2['Team']}")

    print("\nQuarterfinal Matchups:")
    # Quarterfinal matches: top 4 vs first-round winners
    for i, row in top_4.iterrows():
        print(f"{row['Team']} vs Winner of Match {i + 1}")


#######################################################
#                                                     #
#                   Rank The Teams                    #
#                                                     #
#######################################################
# Updated rank_teams function
def rank_teams(year):
    records = fetch_team_records(year)
    offense_data = fetch_team_offense(year)
    defense_data = fetch_team_defense(year)
    schedules = fetch_team_schedules(year)  # Fetch schedules for best team beaten calculation
    
    team_scores = []

    for team in records:
        conference = team.get("conference")

        # Calculate points for Record
        record_points = calculate_record_points(team)

        # Calculate points for Offense
        offense_points = calculate_offense_points(team, offense_data)

        # Calculate points for Defense
        defense_points = calculate_defense_points(team, defense_data)

        # Calculate points for Conference
        conference_points = calculate_conference_points(conference)

        total_points = record_points + offense_points - defense_points + conference_points
        
        Base_nonresult_points = total_points

        # Prepare record string
        wins = team.get("total", {}).get("wins", 0)
        losses = team.get("total", {}).get("losses", 0)
        ties = team.get("total", {}).get("ties", 0)
        record_str = f"{wins}-{losses}-{ties}" if ties > 0 else f"{wins}-{losses}"

        team_scores.append({
            "Team": f"{team['team']} ({record_str})",
            "Conference": conference,
            "Record Points": record_points,
            "Offense Points": offense_points,
            "Defense Points": defense_points,
            "Conference Points": conference_points,
            "Total Points": total_points,
            "Base Non-Result Points": Base_nonresult_points
        })

    # Add points for conference champions
    add_points_for_conference_champs(CONFERENCE_CHAMPS, team_scores)
    
    calculate_strength_of_schedule(year, team_scores)
    calculate_best_win(year, team_scores)
    calculate_lowest_loss(year, team_scores)

    # Convert to DataFrame and sort by total points
    df = pd.DataFrame(team_scores)
    df = df.sort_values(by="Total Points", ascending=False).head(50)
    return df

# Main
if __name__ == "__main__":
    year = 2024
    try:
        top_25 = rank_teams(year)
        print("Top 25 Teams Based on Overall Rankings:")
        for rank, row in enumerate(top_25.iterrows(), start=1):
            _, row_data = row  # Unpack the index and row data
            print(
                f"{rank:2}. {row_data['Team']:<30} | "
                f"Conference: {row_data['Conference']:<15} | "
                f"Total: {row_data['Total Points']:.2f} | "
                f"Base Non-Result Points: {row_data['Base Non-Result Points']:.2f} | "
                f"Record: {row_data['Record Points']:.2f} | "
                f"Offense: {row_data['Offense Points']:.2f} | "
                f"Defense: {row_data['Defense Points']:.2f} | "
                f"Conference: {row_data['Conference Points']:.2f} | "
                f"SoS: {row_data.get('SoS Points', 0):.2f} | "
                f"Best Win: {row_data.get('Best Win Points', 0):.2f} ({row_data.get('Best Win Team', '')}) | "
                f"Lowest Loss: {row_data.get('Lowest Loss Points', 0):.2f} ({row_data.get('Lowest Loss Team', '')}) | "
            )
        
        # Populate final list of 12 teams
        final_12_teams = populate_con_champs_and_top_teams(CONFERENCE_CHAMPS, top_25.to_dict("records"))

        # Print the final list of 12 teams
        print("\nFinal 12 Teams:")
        print("Conference champions & Best Power of 5 conference champion get auto bids: " + ", ".join(CONFERENCE_CHAMPS))
        for rank, (index, row) in enumerate(final_12_teams.iterrows(), start=1):
            champ_indicator = " (C)" if row['Team'].split(" (")[0] in CONFERENCE_CHAMPS else ""
            print(
                f"{rank:2}. {row['Team']:<30} | "
                f"Conference: {row['Conference'] + champ_indicator:<15} | "
                f"Total: {row['Total Points']:.2f} | "
                f"Base Non-Result Points: {row['Base Non-Result Points']:.2f} | "
                f"Record: {row['Record Points']:.2f} | "
                f"Offense: {row['Offense Points']:.2f} | "
                f"Defense: {row['Defense Points']:.2f} | "
                f"Conference: {row['Conference Points']:.2f} | "
                f"SoS: {row.get('SoS Points', 0):.2f} | "
                f"Best Win: {row.get('Best Win Points', 0):.2f} ({row.get('Best Win Team', '')}) | "
                f"Lowest Loss: {row.get('Lowest Loss Points', 0):.2f} ({row.get('Lowest Loss Team', '')}) | "
            )
    
        # Call the function to print the bracket
        print_bracket(final_12_teams)
            
    except Exception as e:
        print(f"An error occurred: {e}")
