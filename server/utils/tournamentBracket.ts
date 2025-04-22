import { InsertMatch, Tournament, Team } from "@shared/schema";

export async function generateTournamentBrackets(
  tournament: Tournament,
  teams: Team[]
): Promise<InsertMatch[]> {
  if (tournament.format === "knockout") {
    return generateKnockoutBrackets(tournament, teams);
  } else if (tournament.format === "round-robin") {
    return generateRoundRobinMatches(tournament, teams);
  } else if (tournament.format === "group") {
    return generateGroupMatches(tournament, teams);
  }
  
  // Default to knockout if format is not recognized
  return generateKnockoutBrackets(tournament, teams);
}

function generateKnockoutBrackets(
  tournament: Tournament,
  teams: Team[]
): InsertMatch[] {
  const matches: InsertMatch[] = [];
  
  // Shuffle teams to randomize the bracket
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // Calculate the number of rounds needed
  // For a full bracket, we need 2^n teams (8, 16, 32, etc.)
  const numTeams = shuffledTeams.length;
  const numRounds = Math.ceil(Math.log2(numTeams));
  
  // Calculate number of first round matches
  // In a perfect bracket (8, 16, 32 teams), all teams play in round 1
  // For imperfect brackets, some teams get byes
  const numFirstRoundMatches = Math.pow(2, numRounds - 1);
  const numByes = Math.pow(2, numRounds) - numTeams;
  
  // Generate first round matches
  for (let i = 0; i < numFirstRoundMatches; i++) {
    // For matches with byes, we'll leave one team undefined
    // Teams with higher seeds (lower index) get the byes
    const team1Index = i * 2;
    const team2Index = i * 2 + 1;
    
    const team1 = team1Index < numTeams ? shuffledTeams[team1Index].id : undefined;
    const team2 = team2Index < numTeams ? shuffledTeams[team2Index].id : undefined;
    
    // If we have a bye, the other team automatically advances
    const winnerId = team1 && !team2 ? team1 : (team2 && !team1 ? team2 : undefined);
    const status = winnerId ? "completed" : "scheduled";
    
    matches.push({
      tournamentId: tournament.id,
      round: 1,
      matchNumber: i + 1,
      team1Id: team1,
      team2Id: team2,
      team1Score: undefined,
      team2Score: undefined,
      winnerId,
      status,
      location: tournament.format === "knockout" ? `${tournament.sportType} Arena` : undefined,
      startTime: undefined
    });
  }
  
  // Generate placeholder matches for subsequent rounds
  for (let round = 2; round <= numRounds; round++) {
    const numMatchesInRound = Math.pow(2, numRounds - round);
    
    for (let i = 0; i < numMatchesInRound; i++) {
      // Match numbers are consecutive within each round
      matches.push({
        tournamentId: tournament.id,
        round,
        matchNumber: i + 1,
        team1Id: undefined,
        team2Id: undefined,
        team1Score: undefined,
        team2Score: undefined,
        winnerId: undefined,
        status: "scheduled",
        location: tournament.format === "knockout" ? `${tournament.sportType} Arena` : undefined,
        startTime: undefined
      });
    }
  }
  
  // Now handle the automatic advancement for byes from first round
  for (let i = 0; i < numFirstRoundMatches; i++) {
    const match = matches[i];
    if (match.winnerId) {
      // This match has a bye, so update the next round's match
      const nextRound = 2;
      const nextMatchNumber = Math.ceil((i + 1) / 2);
      const nextMatchIndex = numFirstRoundMatches + nextMatchNumber - 1;
      
      if (nextMatchIndex < matches.length) {
        const nextMatch = matches[nextMatchIndex];
        
        // For odd-numbered matches, winners go to team1 of next match
        // For even-numbered matches, winners go to team2 of next match
        if (match.matchNumber % 2 === 1) {
          nextMatch.team1Id = match.winnerId;
        } else {
          nextMatch.team2Id = match.winnerId;
        }
      }
    }
  }
  
  return matches;
}

function generateRoundRobinMatches(
  tournament: Tournament,
  teams: Team[]
): InsertMatch[] {
  const matches: InsertMatch[] = [];
  const numTeams = teams.length;
  
  // In a round-robin tournament, each team plays against every other team once
  // Total number of matches = (n * (n-1)) / 2 where n is the number of teams
  
  let matchNumber = 1;
  
  // Calculate approximate match duration based on sport type
  let matchDurationHours = 2; // Default duration
  if (tournament.sportType.toLowerCase().includes("football") || 
      tournament.sportType.toLowerCase().includes("soccer")) {
    matchDurationHours = 2; // 90 minutes + buffer
  } else if (tournament.sportType.toLowerCase().includes("basketball")) {
    matchDurationHours = 2; // 48 minutes + buffer
  } else if (tournament.sportType.toLowerCase().includes("volleyball")) {
    matchDurationHours = 1.5; // Best of 5 sets
  } else if (tournament.sportType.toLowerCase().includes("table tennis") ||
             tournament.sportType.toLowerCase().includes("ping pong")) {
    matchDurationHours = 1; // Best of 5 or 7 games
  }
  
  // Create a match for each pair of teams
  for (let i = 0; i < numTeams; i++) {
    for (let j = i + 1; j < numTeams; j++) {
      // Calculate a starting time for this match
      // We'll space them out based on the tournament start date
      // This is just a placeholder and admin can adjust it later
      const startTime = new Date(tournament.startDate);
      startTime.setHours(startTime.getHours() + (matchNumber - 1) * matchDurationHours);
      
      matches.push({
        tournamentId: tournament.id,
        round: 1, // Round-robin typically has just one round
        matchNumber,
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        team1Score: undefined,
        team2Score: undefined,
        winnerId: undefined,
        status: "scheduled",
        location: tournament.format === "knockout" ? `${tournament.sportType} Arena` : undefined,
        startTime
      });
      
      matchNumber++;
    }
  }
  
  return matches;
}

function generateGroupMatches(
  tournament: Tournament,
  teams: Team[]
): InsertMatch[] {
  const matches: InsertMatch[] = [];
  const numTeams = teams.length;
  
  // For group stage, we'll divide teams into groups of 4 (or as even as possible)
  const idealGroupSize = 4;
  const numGroups = Math.ceil(numTeams / idealGroupSize);
  
  // Shuffle teams for random group assignment
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  
  // Split teams into groups
  const groups: Team[][] = [];
  for (let i = 0; i < numGroups; i++) {
    groups.push([]);
  }
  
  // Distribute teams across groups
  for (let i = 0; i < numTeams; i++) {
    const groupIndex = i % numGroups;
    groups[groupIndex].push(shuffledTeams[i]);
  }
  
  let matchNumber = 1;
  
  // Generate round-robin matches within each group
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const groupTeams = groups[groupIndex];
    const groupName = String.fromCharCode(65 + groupIndex); // A, B, C, etc.
    
    // Create matches for each pair of teams in this group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        // Calculate a starting time for this match
        const startTime = new Date(tournament.startDate);
        startTime.setHours(startTime.getHours() + matchNumber - 1);
        
        matches.push({
          tournamentId: tournament.id,
          round: 1, // Group stage is round 1
          matchNumber,
          team1Id: groupTeams[i].id,
          team2Id: groupTeams[j].id,
          team1Score: undefined,
          team2Score: undefined,
          winnerId: undefined,
          status: "scheduled",
          location: `Group ${groupName}`,
          startTime
        });
        
        matchNumber++;
      }
    }
  }
  
  // After group stage, we'll create placeholder matches for knockout rounds
  // Typically top 2 teams from each group advance
  const numAdvancingTeams = numGroups * 2; // 2 teams per group
  
  // Calculate knockout rounds similar to knockout bracket generation
  const numRounds = Math.ceil(Math.log2(numAdvancingTeams));
  
  // Generate placeholder matches for knockout rounds
  for (let round = 2; round <= numRounds + 1; round++) { // +1 because round 1 is group stage
    const numMatchesInRound = Math.pow(2, numRounds - (round - 1));
    
    for (let i = 0; i < numMatchesInRound; i++) {
      // Match numbers are consecutive across all rounds
      matches.push({
        tournamentId: tournament.id,
        round,
        matchNumber: matchNumber++,
        team1Id: undefined,
        team2Id: undefined,
        team1Score: undefined,
        team2Score: undefined,
        winnerId: undefined,
        status: "scheduled",
        location: round === numRounds + 1 ? "Final" : 
                 round === numRounds ? "Semi-Final" : 
                 round === numRounds - 1 ? "Quarter-Final" : 
                 "Knockout Stage",
        startTime: undefined
      });
    }
  }
  
  return matches;
}
