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


# Define maximum points
MAX_RECORD_POINTS = 45  # Maximum points for the Record category
MAX_SOS_POINTS = 30  # Maximum points for SoS category
MAX_OFFENSE_POINTS = 15  # Maximum points for Offense category
MAX_BESTWIN_POINTS = 10  # Maximum points for Best Win category
MAX_FBS_IND_CON_POINTS = 20  # Maximum points for SOS->CON for FBS

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

# Function to calculate points based on Conference ranking
def calculate_conference_points(conference):
    return CONFERENCE_POINTS.get(conference, 0)  # Default to 0 if the conference is not listed

# Helper function to calculate best win and store the name of the best team beaten
def calculate_best_win(schedules, team_scores_dict):
    best_win_scores = {}
    best_win_teams = {}

    for game in schedules:
        home_points = game.get("home_points")
        away_points = game.get("away_points")

        # Skip games where scores are not available
        if home_points is None or away_points is None:
            continue

        winner = game.get("home_team") if home_points > away_points else game.get("away_team")
        loser = game.get("home_team") if home_points < away_points else game.get("away_team")

        if winner and loser:
            winner_score = team_scores_dict.get(winner, 0)
            loser_score = team_scores_dict.get(loser, 0)

            # Update the best win score and team
            if winner not in best_win_scores or loser_score > best_win_scores[winner]:
                best_win_scores[winner] = loser_score
                best_win_teams[winner] = loser  # Save the name of the best team beaten

    # Normalize best win scores to a scale of 10
    max_best_win = max(best_win_scores.values(), default=1)  # Avoid division by zero
    for team in best_win_scores:
        best_win_scores[team] = (best_win_scores[team] / max_best_win) * MAX_BESTWIN_POINTS

    return best_win_scores, best_win_teams


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

    # Calculate best win scores and best teams beaten
    best_win_scores, best_win_teams = calculate_best_win(schedules, team_scores_dict)

    # Update team scores with SoS and Best Win
    for team in team_scores:
        team_name = team['Team'].split(' (')[0]
        sos_points = sos_values.get(team_name, 0)

        team['SoS Points'] = sos_values.get(team_name, 0)
        team['Best Win Points'] = best_win_scores.get(team_name, 0)
        team['Best Team Beaten'] = best_win_teams.get(team_name, "N/A")  # Default to "N/A" if no wins

        # Adjust conference points if the team is in FBS Independents
        if team["Conference"] in FBS_INDEPENDENT:
            team['Conference Points'] = (sos_points / MAX_SOS_POINTS) * MAX_FBS_IND_CON_POINTS
            team['Total Points'] += team['Conference Points']

        team['Total Points'] += team['SoS Points'] + team['Best Win Points']  # Add SoS and Best Win to total points

    return team_scores


#######################################################
#                                                     #
#                   Rank The Teams                    #
#                                                     #
#######################################################
# Fetch data and calculate rankings
def rank_teams(year):
    records = fetch_team_records(year)
    offense_data = fetch_team_offense(year)
    
    team_scores = []

    for team in records:
        conference = team.get("conference")
        #if conference not in ALL_CONFERENCES:
            #continue  # Skip teams not in the specified conferences

        # Calculate points for Record
        record_points = calculate_record_points(team)

        # Calculate points for Offense
        offense_points = calculate_offense_points(team, offense_data)

        # Calculate points for Conference
        conference_points = calculate_conference_points(conference)

        total_points = record_points + offense_points + conference_points

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
            "Conference Points": conference_points,
            "Total Points": total_points
        })
    
    calculate_strength_of_schedule(year, team_scores)

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
                f"Record: {row_data['Record Points']:.2f} | "
                f"Offense: {row_data['Offense Points']:.2f} | "
                f"Conference: {row_data['Conference Points']:.2f} | "
                f"SoS: {row_data.get('SoS Points', 0):.2f} | "
                f"Best Win: {row_data.get('Best Win Points', 0):.2f} ({row_data.get('Best Team Beaten', 'N/A')})"
            )
    except Exception as e:
        print(f"An error occurred: {e}")

