const images = {
    "Arsenal": "images/arsenal.png",
    "Aston Villa": "images/astonvilla.png",
    "AFC Bournemouth": "images/bournemouth.png",
    "Brentford": "images/brentford.png",
    "Brighton": "images/brighton.png",
    "Burnley": "images/burnley.png",
    "Chelsea": "images/chelsea.png",
    "Crystal Palace": "images/crystalpalace.png",
    "Everton": "images/everton.png",
    "Fulham": "images/fulham.png",
    "Liverpool": "images/liverpool.png",
    "Leeds United": "images/leedsunited.png",
    "Manchester City": "images/mancity.png",
    "Manchester United": "images/manutd.png",
    "Newcastle United": "images/newcastle.png",
    "Nottingham Forest": "images/forest.png",
    "Sunderland" : "images/sunderland.png",
    "Tottenham Hotspur": "images/spurs.png",
    "West Ham United": "images/westham.png",
    "Wolves": "images/wolves.png"
};

const getTeamLogo = (teamName) => {
    return images[teamName] || 'images/placeholder.png';
};

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    window.showSection = (sectionId) => {
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.opacity = '0';
        });
        const activeSection = document.getElementById(sectionId);
        activeSection.classList.add('active');
        setTimeout(() => {
            activeSection.style.opacity = '1';
        }, 10);
        navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`a[href="#${sectionId}"]`).classList.add('active');
    };

    const parseEsdDate = (esd) => {
        const esdStr = String(esd);
        if (esdStr.length !== 14) {
            return new Date();
        }
        const year = esdStr.substring(0, 4);
        const month = esdStr.substring(4, 6) - 1;
        const day = esdStr.substring(6, 8);
        const hour = esdStr.substring(8, 10);
        const minute = esdStr.substring(10, 12);
        const second = esdStr.substring(12, 14);
        return new Date(year, month, day, hour, minute, second);
    };

    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const fetchMatches = async () => {
        const url = 'https://livescore6.p.rapidapi.com/matches/v2/list-by-league?Category=soccer&Ccd=england&Scd=premier-league&Timezone=5.75';
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '9a93c5428amshb127fac77f6dd2cp1c84f6jsnca7748c58c60',
                'x-rapidapi-host': 'livescore6.p.rapidapi.com'
            }
        };

        const fixturesContainer = document.getElementById('fixtures-matches');
        const resultsContainer = document.getElementById('results-matches');
        const fixturesError = document.getElementById('fixtures-error');
        const resultsError = document.getElementById('results-error');

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            const matches = result.Stages?.[0]?.Events || [];

            // Sort all matches ascending to calculate matchweeks
            const allMatches = [...matches].sort((a, b) => parseEsdDate(a.Esd) - parseEsdDate(b.Esd));

            // Assign matchweek based on groups of 10 games
            const matchToWeek = {};
            allMatches.forEach((match, index) => {
                const matchWeek = `Matchweek ${Math.floor(index / 10) + 1}`;
                matchToWeek[match.Eid] = matchWeek; // Use unique event ID to map
            });

            // Separate fixtures and results
            const fixtures = matches.filter(match => match.Eps !== 'FT' && match.Eps !== 'HT');
            const results = matches.filter(match => match.Eps === 'FT' || match.Eps === 'HT');

            fixtures.sort((a, b) => parseEsdDate(a.Esd) - parseEsdDate(b.Esd));
            results.sort((a, b) => parseEsdDate(b.Esd) - parseEsdDate(a.Esd));

            // Function to get number from matchweek string
            const getWeekNumber = (matchWeek) => {
                const match = matchWeek.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            };

            // Fixtures: Group by matchweek and date
            const fixturesByWeek = {};
            fixtures.forEach(match => {
                const date = parseEsdDate(match.Esd);
                const matchWeek = matchToWeek[match.Eid];
                const formattedDate = date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                if (!fixturesByWeek[matchWeek]) {
                    fixturesByWeek[matchWeek] = {};
                }
                if (!fixturesByWeek[matchWeek][formattedDate]) {
                    fixturesByWeek[matchWeek][formattedDate] = [];
                }
                fixturesByWeek[matchWeek][formattedDate].push(match);
            });

            fixturesContainer.innerHTML = '';
            const fixturesWeeks = Object.keys(fixturesByWeek).sort((a, b) => getWeekNumber(a) - getWeekNumber(b));
            for (const matchWeek of fixturesWeeks) {
                const weekGroup = document.createElement('div');
                weekGroup.className = 'week-group';
                weekGroup.innerHTML = `<div class="MW-header">${matchWeek}</div>`;
                const mwGames = document.createElement('div');
                mwGames.className = 'MW-games';
                const dates = Object.keys(fixturesByWeek[matchWeek]).sort((a, b) => new Date(a) - new Date(b));
                for (const date of dates) {
                    const dateGroup = document.createElement('div');
                    dateGroup.className = 'date-group';
                    dateGroup.innerHTML = `<div class="date-header">${date}</div>`;
                    const matchesList = document.createElement('div');
                    fixturesByWeek[matchWeek][date].forEach(match => {
                        const team1Name = match.T1?.[0]?.Nm || 'Unknown';
                        const team2Name = match.T2?.[0]?.Nm || 'Unknown';
                        const team1Logo = getTeamLogo(team1Name);
                        const team2Logo = getTeamLogo(team2Name);
                        const matchTime = formatTime(parseEsdDate(match.Esd));
                        const matchElement = document.createElement('div');
                        matchElement.className = 'match-card';
                        matchElement.innerHTML = `
                            <div class="team T1">
                                <span class="team-name">${team1Name}</span>
                                <img src="${team1Logo}" alt="${team1Name} Logo">
                            </div>
                            <span class="time">${matchTime}</span>
                            <div class="team right T2">
                                <span class="team-name">${team2Name}</span>
                                <img src="${team2Logo}" alt="${team2Name} Logo">
                            </div>
                        `;
                        matchesList.appendChild(matchElement);
                    });
                    dateGroup.appendChild(matchesList);
                    mwGames.appendChild(dateGroup);
                }
                weekGroup.appendChild(mwGames);
                fixturesContainer.appendChild(weekGroup);
            }

            // Results: Group by matchweek and date
            const resultsByWeek = {};
            results.forEach(match => {
                const date = parseEsdDate(match.Esd);
                const matchWeek = matchToWeek[match.Eid];
                const formattedDate = date.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                if (!resultsByWeek[matchWeek]) {
                    resultsByWeek[matchWeek] = {};
                }
                if (!resultsByWeek[matchWeek][formattedDate]) {
                    resultsByWeek[matchWeek][formattedDate] = [];
                }
                resultsByWeek[matchWeek][formattedDate].push(match);
            });

            resultsContainer.innerHTML = '';
            const resultsWeeks = Object.keys(resultsByWeek).sort((a, b) => getWeekNumber(b) - getWeekNumber(a));
            for (const matchWeek of resultsWeeks) {
                const weekGroup = document.createElement('div');
                weekGroup.className = 'week-group';
                weekGroup.innerHTML = `<div class="MW-header">${matchWeek}</div>`;
                const mwGames = document.createElement('div');
                mwGames.className = 'MW-games';
                const dates = Object.keys(resultsByWeek[matchWeek]).sort((a, b) => new Date(b) - new Date(a));
                for (const date of dates) {
                    const dateGroup = document.createElement('div');
                    dateGroup.className = 'date-group';
                    dateGroup.innerHTML = `<div class="date-header">${date}</div>`;
                    const matchesList = document.createElement('div');
                    resultsByWeek[matchWeek][date].forEach(match => {
                        const team1Name = match.T1?.[0]?.Nm || 'Unknown';
                        const team2Name = match.T2?.[0]?.Nm || 'Unknown';
                        const team1Logo = getTeamLogo(team1Name);
                        const team2Logo = getTeamLogo(team2Name);
                        const matchElement = document.createElement('div');
                        matchElement.className = 'match-card';
                        matchElement.innerHTML = `
                            <div class="team T1">
                                <span class="team-name">${team1Name}</span>
                                <img src="${team1Logo}" alt="${team1Name} Logo">
                            </div>
                            <span class="score">${match.Tr1 || 0} - ${match.Tr2 || 0}</span>
                            <div class="team right T2">
                                <span class="team-name">${team2Name}</span>
                                <img src="${team2Logo}" alt="${team2Name} Logo">
                            </div>
                        `;
                        matchesList.appendChild(matchElement);
                });
                dateGroup.appendChild(matchesList);
                mwGames.appendChild(dateGroup);
            }
            weekGroup.appendChild(mwGames);
            resultsContainer.appendChild(weekGroup);
            }
        } catch (error) {
            fixturesError.textContent = `Error: ${error.message}`;
            resultsError.textContent = `Error: ${error.message}`;
            fixturesError.classList.remove('hidden');
            resultsError.classList.remove('hidden');
        }
    };

    const fetchTable = async () => {
        const url = 'https://livescore6.p.rapidapi.com/leagues/v2/get-table?Category=soccer&Ccd=england&Scd=premier-league';
        const options = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '9a93c5428amshb127fac77f6dd2cp1c84f6jsnca7748c58c60',
                'x-rapidapi-host': 'livescore6.p.rapidapi.com'
            }
        };

        const tableContainer = document.getElementById('league-table');
        const tableError = document.getElementById('table-error');

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            const teams = result.LeagueTable?.L?.[0]?.Tables?.[0]?.team || [];

            tableContainer.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th class="posH">Position</th>
                            <th class="tdname">Club</th>
                            <th>GP</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>GD</th>
                            <th class="ptsH">PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teams.map((team, index) => {
                            let rowClass = '';
                            const position = index + 1;
                            if (position <= 5) {
                                rowClass = 'top-6';
                            } else if (position === 5) {
                                rowClass = 'position-7';
                            } else if (position === 6) {
                                rowClass = 'position-8';
                            } else if (position >= teams.length - 2) {
                                rowClass = 'bottom-3';
                            }
                            return `
                                <tr class="${rowClass}">
                                    <td class="position">${position}</td>
                                    <td class="tdname">
                                        <img src="${getTeamLogo(team.Tnm)}" alt="${team.Tnm} Logo">
                                        ${team.Tnm || 'Unknown'}
                                    </td>
                                    <td>${team.pld || 0}</td>
                                    <td>${team.win || 0}</td>
                                    <td>${team.drw || 0}</td>
                                    <td>${team.lst || 0}</td>
                                    <td>${team.gd || 0}</td>
                                    <td class="points">${team.ptsn || 0}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            tableError.textContent = `Error: ${error.message}`;
            tableError.classList.remove('hidden');
        }
    };

    fetchMatches();
    fetchTable();
});