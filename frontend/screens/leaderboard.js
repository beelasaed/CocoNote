document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ranking-list-container');
    
    // Mock Data for Ranks 4 to 10
    const rankings = [
        { rank: 4, name: "Tanvir_ME", dept: "Mechanical", points: "1,850" },
        { rank: 5, name: "Zarin_21", dept: "CSE", points: "1,720" },
        { rank: 6, name: "IUT_Wizard", dept: "EEE", points: "1,600" },
        { rank: 7, name: "Rahat_BTM", dept: "BTM", points: "1,450" },
        { rank: 8, name: "Sifat_Lab", dept: "CEE", points: "1,300" }
    ];

    container.innerHTML = rankings.map(user => `
        <div class="rank-row">
            <span class="rank-number">#${user.rank}</span>
            <span style="font-weight: 600;">${user.name}</span>
            <span class="hide-mobile" style="color: #888;">${user.dept}</span>
            <span class="rank-points">${user.points} 🥥</span>
        </div>
    `).join('');
});